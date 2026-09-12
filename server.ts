import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Helper function to format url
  const formatUrl = (url: string) => {
    let parsedUrl = url;
    if (!parsedUrl.startsWith('http://') && !parsedUrl.startsWith('https://')) {
      parsedUrl = `https://${url}`;
    }
    return parsedUrl;
  };

  // Helper function to call Gemini with retry and fallback
  const generateContentWithRetry = async (prompt: string, schema: any, initialModel = 'gemini-3.8-flash', maxRetries = 2) => {
    let lastError;
    const modelsToTry = [initialModel, 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    
    for (const model of modelsToTry) {
      if (model.includes('pro')) continue; // skip quota-heavy pro model
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const geminiResponse = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: schema,
            },
          });
          return geminiResponse;
        } catch (error: any) {
          lastError = error;
          console.log(`[Attempt ${attempt}] Model ${model} failed with:`, error.message);
          // If it's not a 503/429, don't retry the same model
          if (!error.message?.includes('503') && !error.message?.includes('429')) {
            break; 
          }
          // Wait before retry
          await new Promise(r => setTimeout(r, 1000 * attempt));
        }
      }
    }
    throw lastError;
  };

  // API Route: Scrape Job URL
  app.post('/api/scrape', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }

      const formattedUrl = formatUrl(url);

      // Fetch HTML
      const response = await fetch(formattedUrl);
      const html = await response.text();
      
      const baseUrl = new URL(url).origin;
      const $ = cheerio.load(html);
      
      // Extract links so Gemini knows the URLs of the jobs
      $('a').each((_, el) => {
        const $el = $(el);
        let href = $el.attr('href');
        if (href && !href.startsWith('javascript')) {
          if (href.startsWith('/')) href = baseUrl + href;
          $el.append(` [Link: ${href}] `);
        }
      });
      
      $('script, style, nav, footer, iframe, img').remove();
      const cleanText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 30000);

      const geminiResponse = await generateContentWithRetry(
        `Extract a list of all job openings found in the following webpage text. For each job, provide the title, company name, description/requirements, and the application link if available.\n\nText:\n${cleanText}`,
        {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: 'The job title' },
              company: { type: Type.STRING, description: 'The company name' },
              description: { type: Type.STRING, description: 'The detailed job description, duties, and requirements' },
              link: { type: Type.STRING, description: 'The URL link to apply or view the job' }
            },
            required: ['title', 'company', 'description']
          }
        },
        'gemini-3.8-flash'
      );

      const extracted = JSON.parse(geminiResponse.text || '[]');
      const jobs = (Array.isArray(extracted) ? extracted : [extracted]).map(j => ({
        title: j.title || 'Unknown Title',
        company: j.company || 'Unknown Company',
        description: j.description || 'No description extracted.',
        link: j.link && j.link !== 'null' ? j.link : url
      }));
      
      res.json({ jobs });
    } catch (error: any) {
      console.error('Scraping error:', error);
      res.status(500).json({ error: error.message || 'Failed to scrape job data' });
    }
  });

  // API Route: Scrape Image
  app.post('/api/scrape-image', async (req, res) => {
    try {
      const { imageBase64, mimeType } = req.body;
      if (!imageBase64 || !mimeType) {
        return res.status(400).json({ error: 'Image data is required' });
      }

      // Clean the base64 string if it contains data uri prefix
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      const prompt = 'Extract the job title, company name, and full job description from this image of a job posting. If there are multiple jobs, extract the most prominent one or summarize them all in one entry.';

      let lastError;
      const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
      let geminiResponse;

      for (const model of modelsToTry) {
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            geminiResponse = await ai.models.generateContent({
              model,
              contents: [
                {
                  inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                  }
                },
                prompt
              ],
              config: {
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: 'The job title' },
                    company: { type: Type.STRING, description: 'The company name' },
                    description: { type: Type.STRING, description: 'The detailed job description, duties, and requirements' },
                  },
                  required: ['title', 'company', 'description'],
                }
              }
            });
            break; 
          } catch (err: any) {
             lastError = err;
             console.log(`[Image Attempt ${attempt}] Model ${model} failed with:`, err.message);
             if (!err.message?.includes('503') && !err.message?.includes('429')) {
               break; 
             }
             await new Promise(r => setTimeout(r, 1000 * attempt));
          }
        }
        if (geminiResponse) break;
      }

      if (!geminiResponse) throw lastError;

      const extracted = JSON.parse(geminiResponse.text || '{}');
      const job = {
        title: extracted.title || 'Unknown Title',
        company: extracted.company || 'Unknown Company',
        description: extracted.description || 'No description extracted from image.',
        link: 'Uploaded Image'
      };

      res.json({ jobs: [job] });
    } catch (error: any) {
      console.error('Image Scraping error:', error);
      res.status(500).json({ error: error.message || 'Failed to extract data from image' });
    }
  });

  // API Route: Match & Generate Drafts
  app.post('/api/match', async (req, res) => {
    try {
      const { jobDescription, profile } = req.body;
      
      if (!jobDescription || !profile) {
        return res.status(400).json({ error: 'Job description and profile are required' });
      }

      const prompt = `You are an expert career coach and ATS resume optimizer.
Given the following Job Description and Candidate Profile, generate a tailored Cover Letter and a short ATS-optimized Resume Summary.

CRITICAL RULES:
1. Use the Google XYZ formula for accomplishments: "Accomplished [X] as measured by [Y], by doing [Z]".
2. STRICTLY PROHIBITED: Do not invent, hallucinate, or fabricate ANY fictitious percentage numbers, metrics, or durations. Only use facts provided in the Candidate Profile. If no specific metric exists, focus on qualitative impact without numbers.
3. The tone must be professional, confident, and suitable for the Indonesian/Global construction & engineering industry.

Candidate Profile:
${JSON.stringify(profile, null, 2)}

Job Description:
${jobDescription}`;

      // Extract Job Data using Gemini
      const geminiResponse = await generateContentWithRetry(
        prompt,
        {
          type: Type.OBJECT,
          properties: {
            coverLetter: { type: Type.STRING, description: 'The tailored cover letter' },
            resumeSummary: { type: Type.STRING, description: 'The ATS-optimized resume summary' },
          },
          required: ['coverLetter', 'resumeSummary'],
        },
        'gemini-3.8-flash' // force flash
      );

      const generated = JSON.parse(geminiResponse.text || '{}');
      res.json(generated);
    } catch (error: any) {
      console.error('Match error:', error);
      res.status(500).json({ error: error.message || 'Failed to generate drafts' });
    }
  });

  // Vite Middleware for Dev
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.join(__dirname, '..', 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
