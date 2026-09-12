import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { LogOut, LayoutDashboard, Settings, FileText, CheckCircle2, TrendingUp, Briefcase } from 'lucide-react';
import { DashboardMetrics, JobData, MASTER_PROFILE } from '../types';
import { initSpreadsheet, getSpreadsheetLink } from '../lib/googleSheets';
import { ScraperPanel } from './ScraperPanel';
import { ImageScraperPanel } from './ImageScraperPanel';
import { JobList } from './JobList';
import { JobModal } from './JobModal';

export function Dashboard({ user, onLogout }: { user: User | null; onLogout: () => void }) {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalApplied: 0,
    totalInterviews: 0,
    conversionRate: 0,
  });

  const [scrapedJobs, setScrapedJobs] = useState<JobData[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobData | null>(null);
  const [activeTab, setActiveTab] = useState<'link' | 'image'>('link');

  useEffect(() => {
    // Initialize google sheets on load
    initSpreadsheet().catch(console.error);
    
    // In a real app we'd fetch metrics from Google Sheets
    // For this prototype, we'll use local state to track new metrics
    const savedMetrics = localStorage.getItem('app_metrics');
    if (savedMetrics) {
      setMetrics(JSON.parse(savedMetrics));
    }
  }, []);

  const handleApplySuccess = () => {
    const newMetrics = {
      ...metrics,
      totalApplied: metrics.totalApplied + 1,
    };
    // Re-calculate conversion rate based on dummy totalInterviews if any
    newMetrics.conversionRate = newMetrics.totalApplied > 0 
      ? Math.round((newMetrics.totalInterviews / newMetrics.totalApplied) * 100) 
      : 0;
      
    setMetrics(newMetrics);
    localStorage.setItem('app_metrics', JSON.stringify(newMetrics));
    
    // Close modal
    setSelectedJob(null);
  };

  const sheetsLink = getSpreadsheetLink();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row relative">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3 text-white font-semibold text-lg">
            <Briefcase className="w-6 h-6 text-blue-400" />
            <span>Job Auto-Apply</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 bg-slate-800 text-white rounded-lg font-medium transition-colors">
            <LayoutDashboard className="w-5 h-5 text-blue-400" />
            Dashboard
          </button>
          <a 
            href={sheetsLink || '#'} 
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <FileText className="w-5 h-5" />
            Google Sheets DB
          </a>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <img src={user?.photoURL || ''} alt="User" className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700" />
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user?.displayName}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Overview</h1>
              <p className="text-slate-500 mt-1">Manage your job applications and automate ATS formatting.</p>
            </div>
            
            <div className="flex items-center gap-3 bg-white px-4 py-2 border border-slate-200 rounded-full shadow-sm text-sm font-medium text-slate-700">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Connected to Google Workspace
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Total Lamaran Terkirim</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{metrics.totalApplied}</p>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Panggilan Wawancara</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{metrics.totalInterviews}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Conversion Rate</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{metrics.conversionRate}%</p>
              </div>
            </div>
          </div>

          {/* Core Panels */}
          <div className="space-y-6">
            <div className="flex bg-white rounded-xl border border-slate-200 p-1 w-full max-w-sm">
               <button
                 onClick={() => setActiveTab('link')}
                 className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'link' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
               >
                 Via URL Link
               </button>
               <button
                 onClick={() => setActiveTab('image')}
                 className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'image' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
               >
                 Via Gambar / Screenshot
               </button>
            </div>

            {activeTab === 'link' ? (
              <ScraperPanel onJobsScraped={setScrapedJobs} />
            ) : (
              <ImageScraperPanel onJobsScraped={setScrapedJobs} />
            )}
            
            {scrapedJobs.length > 0 && (
              <JobList 
                jobs={scrapedJobs} 
                onSelect={setSelectedJob} 
              />
            )}
          </div>

        </div>
      </main>
      
      {/* Job Details Modal */}
      {selectedJob && (
        <JobModal 
          job={selectedJob} 
          onClose={() => setSelectedJob(null)} 
          onApplySuccess={handleApplySuccess} 
        />
      )}
    </div>
  );
}
