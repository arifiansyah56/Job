export interface JobData {
  title: string;
  company: string;
  link: string;
  description: string;
}

export interface ApplicationDraft {
  coverLetter: string;
  resumeSummary: string;
}

export interface ApplicationRecord {
  id: string;
  jobTitle: string;
  company: string;
  dateApplied: string;
  status: 'Draft' | 'Applied' | 'Interview' | 'Rejected' | 'Offer';
}

export interface DashboardMetrics {
  totalApplied: number;
  totalInterviews: number;
  conversionRate: number; // percentage
}

export const MASTER_PROFILE = {
  name: "Muhammad Arifiansyah",
  education: "Sarjana Terapan (D4) Teknik Sipil ITS",
  experience: "5+ tahun sebagai Project Control, Supervisor, dan QC",
  skills: [
    "Manajemen Konstruksi",
    "Jadwal Proyek (MS Project, Primavera P6, Kurva S)",
    "BIM (Revit, Tekla)",
    "SAP2000",
    "ETABS",
    "BoQ"
  ]
};
