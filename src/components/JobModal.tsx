import React, { useState, useRef } from 'react';
import { X, ExternalLink, Sparkles, Loader2, Send, Briefcase, Mail, FileText, Paperclip, AlertCircle } from 'lucide-react';
import { JobData, ApplicationDraft, MASTER_PROFILE } from '../types';
import { saveApplicationToSheets } from '../lib/googleSheets';

interface JobModalProps {
  job: JobData;
  onClose: () => void;
  onApplySuccess: () => void;
}

export function JobModal({ job, onClose, onApplySuccess }: JobModalProps) {
  const [draft, setDraft] = useState<ApplicationDraft | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // File attachments state (visual only)
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editable fields
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeSummary, setResumeSummary] = useState('');
  const [hrEmail, setHrEmail] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const matchRes = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          jobDescription: job.description,
          profile: MASTER_PROFILE
        }),
      });

      if (!matchRes.ok) throw new Error(await matchRes.text());
      
      const draftData: ApplicationDraft = await matchRes.json();
      setDraft(draftData);
      setCoverLetter(draftData.coverLetter);
      setResumeSummary(draftData.resumeSummary);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal menghasilkan draf lamaran.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = async () => {
    setIsSending(true);
    try {
      await saveApplicationToSheets(
        job.title,
        job.company,
        job.link || 'N/A',
        hrEmail || 'N/A',
        'Applied'
      );
      
      // Build Gmail compose URL
      const subject = encodeURIComponent(`Application for ${job.title} - ${MASTER_PROFILE.name}`);
      const body = encodeURIComponent(coverLetter);
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${hrEmail}&su=${subject}&body=${body}`;
      
      // Open Gmail in new tab
      window.open(gmailUrl, '_blank');
      
      onApplySuccess();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan ke Google Sheets.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-5xl h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{job.title}</h2>
              <p className="text-sm font-medium text-slate-600 mt-0.5">{job.company}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body - 2 Columns */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Left Column: Job Details */}
          <div className="w-full md:w-1/2 p-6 overflow-y-auto border-r border-slate-100 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Detail Pekerjaan</h3>
              {job.link && job.link !== 'null' && (
                <a 
                  href={job.link} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Buka Link Pendaftaran <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
            <div className="prose prose-sm prose-slate max-w-none whitespace-pre-wrap">
              {job.description}
            </div>
          </div>

          {/* Right Column: AI Generation & Review */}
          <div className="w-full md:w-1/2 flex flex-col bg-slate-50">
            {!draft ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Buat Lamaran Otomatis</h3>
                <p className="text-sm text-slate-500 mb-8 max-w-sm">
                  Sistem AI akan mencocokkan profil Anda dengan persyaratan pekerjaan ini dan membuat Resume ATS serta Draft Email (Cover Letter) menggunakan metode Google XYZ.
                </p>
                
                {error && (
                  <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 w-full max-w-md">
                    {error}
                  </div>
                )}

                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full max-w-sm text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-xl text-sm px-5 py-3.5 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isGenerating ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Menganalisis Profil & Lowongan...</>
                  ) : (
                    <><Sparkles className="w-5 h-5" /> Buat Resume & Email (AI)</>
                  )}
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  
                  {/* Email Target */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      Email Tujuan HRD (Opsional)
                    </label>
                    <input 
                      type="email"
                      value={hrEmail}
                      onChange={(e) => setHrEmail(e.target.value)}
                      placeholder="hrd@company.com"
                      className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 shadow-sm"
                    />
                  </div>

                  {/* Resume Content */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      Poin Resume ATS (Google XYZ)
                    </label>
                    <textarea 
                      value={resumeSummary}
                      onChange={(e) => setResumeSummary(e.target.value)}
                      rows={5}
                      className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-4 shadow-sm leading-relaxed resize-y"
                    />
                  </div>

                  {/* Email Draft */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      Draft Email (Cover Letter)
                    </label>
                    <textarea 
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      rows={12}
                      className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-4 shadow-sm leading-relaxed resize-y font-sans"
                    />
                  </div>

                  {/* Attachments Section */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <Paperclip className="w-4 h-4 text-slate-400" />
                         Lampiran (CV / Portofolio)
                      </div>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        + Tambah File
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                        multiple
                      />
                    </label>
                    
                    {attachments.length > 0 && (
                      <div className="space-y-2">
                        {attachments.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white border border-slate-200 p-2.5 rounded-lg shadow-sm">
                            <span className="text-sm font-medium text-slate-700 truncate">{file.name}</span>
                            <button onClick={() => removeAttachment(idx)} className="text-slate-400 hover:text-red-500 p-1">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-100">
                       <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                       <p>Keamanan browser memblokir lampiran otomatis via link. Anda <strong>harus melampirkan ulang</strong> file-file di atas secara manual di dalam jendela Gmail yang terbuka nanti.</p>
                    </div>
                  </div>

                </div>
                
                {/* Footer Actions */}
                <div className="p-6 bg-white border-t border-slate-100 shrink-0">
                  <button 
                    onClick={handleSend}
                    disabled={isSending || !coverLetter}
                    className="w-full text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 font-medium rounded-xl text-sm px-5 py-3.5 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {isSending ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Membuka Gmail...</>
                    ) : (
                      <><Send className="w-5 h-5" /> Buka di Gmail (Kirim) & Simpan Tracker</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
