import React, { useState, useRef } from 'react';
import { Upload, Loader2, Sparkles, AlertCircle, Image as ImageIcon, Briefcase } from 'lucide-react';
import { JobData, MASTER_PROFILE } from '../types';

interface ImageScraperPanelProps {
  onJobsScraped: (jobs: JobData[]) => void;
}

export function ImageScraperPanel({ onJobsScraped }: ImageScraperPanelProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScraping, setIsScraping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Harap upload file gambar yang valid (JPG, PNG).');
        return;
      }
      setSelectedFile(file);
      setError(null);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScrape = async () => {
    if (!selectedFile || !previewUrl) return;
    
    setIsScraping(true);
    setError(null);
    onJobsScraped([]); 

    try {
      const response = await fetch('/api/scrape-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageBase64: previewUrl, // This includes data:image/png;base64,...
          mimeType: selectedFile.type
        }),
      });
      
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      
      if (data.jobs && data.jobs.length > 0) {
        onJobsScraped(data.jobs);
      } else {
        setError('Tidak ada lowongan yang ditemukan di gambar tersebut.');
      }
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to process image');
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col shrink-0 animate-in fade-in zoom-in-95 duration-200">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-blue-600" />
          Ekstrak dari Gambar
        </h2>
        <p className="text-sm text-slate-500 mt-1">Upload foto lowongan kerja (brosur, screenshot) untuk mengekstrak data menggunakan AI.</p>
      </div>

      <div className="p-6 space-y-6">
        
        {/* Upload Area */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
            previewUrl ? 'border-blue-300 bg-blue-50/50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
          }`}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*" 
            className="hidden" 
          />
          
          {previewUrl ? (
            <div className="flex flex-col items-center">
              <img src={previewUrl} alt="Preview" className="h-32 object-contain rounded-lg mb-3 border border-slate-200 shadow-sm bg-white" />
              <p className="text-sm font-medium text-slate-700">{selectedFile?.name}</p>
              <p className="text-xs text-slate-500 mt-1">Klik untuk mengganti gambar</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-700">Pilih gambar atau screenshot</p>
              <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 10MB</p>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <button 
          onClick={handleScrape}
          disabled={isScraping || !selectedFile}
          className="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-xl text-sm px-5 py-3 text-center disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
        >
          {isScraping ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Menganalisis Gambar...</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Ekstrak Data Pekerjaan</>
          )}
        </button>

      </div>
    </div>
  );
}
