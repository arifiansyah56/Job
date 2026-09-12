import React, { useState } from 'react';
import { Search, Loader2, Sparkles, AlertCircle, Briefcase } from 'lucide-react';
import { JobData, MASTER_PROFILE } from '../types';

interface ScraperPanelProps {
  onJobsScraped: (jobs: JobData[]) => void;
}

export function ScraperPanel({ onJobsScraped }: ScraperPanelProps) {
  const [url, setUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScrape = async () => {
    if (!url) return;
    setIsScraping(true);
    setError(null);
    onJobsScraped([]); // Clear previous

    try {
      const scrapeRes = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      
      if (!scrapeRes.ok) throw new Error(await scrapeRes.text());
      const data = await scrapeRes.json();
      
      if (data.jobs && data.jobs.length > 0) {
        onJobsScraped(data.jobs);
      } else {
        setError('Tidak ada lowongan yang ditemukan di URL tersebut.');
      }
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to scrape jobs');
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col shrink-0">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Search className="w-5 h-5 text-blue-600" />
          Portal Karir Scraper
        </h2>
        <p className="text-sm text-slate-500 mt-1">Masukkan link halaman pencarian lowongan untuk mengekstrak semua pekerjaan yang tersedia.</p>
      </div>

      <div className="p-6 space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-700 block">URL Portal Karir Target (cth: LinkedIn, JobStreet)</label>
          <div className="flex gap-3">
            <input 
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://linkedin.com/jobs/search?..."
              className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3"
            />
          </div>
          <button 
            onClick={handleScrape}
            disabled={isScraping || !url}
            className="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-xl text-sm px-5 py-3 text-center disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            {isScraping ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Scraping Data Lowongan...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Cari Lowongan & Ekstrak Data</>
            )}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-start gap-3 border border-red-100 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Master Profile Aktif</h3>
          <div className="space-y-1 flex items-start gap-3">
             <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0 mt-1">
               <Briefcase className="w-4 h-4" />
             </div>
             <div>
                <p className="text-sm font-semibold text-slate-900">{MASTER_PROFILE.name}</p>
                <p className="text-sm text-slate-600">{MASTER_PROFILE.education}</p>
                <p className="text-sm text-slate-600 truncate">{MASTER_PROFILE.experience}</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
