import React from 'react';
import { JobData } from '../types';
import { Briefcase, ChevronRight, Link2 } from 'lucide-react';

interface JobListProps {
  jobs: JobData[];
  onSelect: (job: JobData) => void;
}

export function JobList({ jobs, onSelect }: JobListProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          Daftar Lowongan ({jobs.length})
        </h2>
      </div>

      <div className="overflow-y-auto max-h-[600px] divide-y divide-slate-100">
        {jobs.map((job, idx) => {
          return (
            <div 
              key={idx} 
              className="p-5 transition-colors hover:bg-blue-50/50 cursor-pointer group"
              onClick={() => onSelect(job)}
            >
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl shrink-0 bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-slate-900 truncate group-hover:text-blue-700">{job.title}</h3>
                  <p className="text-sm font-medium text-slate-600 mt-1 truncate">{job.company}</p>
                  
                  <div className="mt-4 flex gap-2">
                    <span className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors bg-white border border-slate-200 text-slate-700 group-hover:border-blue-300 group-hover:text-blue-700 shadow-sm">
                      Lihat Detail & Lamar <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                    {job.link && job.link !== 'null' && (
                       <span className="text-xs font-medium px-2 py-1.5 rounded-lg flex items-center gap-1.5 bg-white border border-slate-200 text-slate-500">
                         <Link2 className="w-3.5 h-3.5" />
                       </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
