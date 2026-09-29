import api from './api';

export interface ResumeData {
  id: number;
  original_filename: string;
  raw_text?: string;
  word_count?: number;
  preview?: string;
  uploaded_at: string;
}

export interface JobDescriptionData {
  id: number;
  title: string;
  company: string;
  raw_text: string;
  word_count?: number;
  created_at: string;
}

export interface SuggestionItem {
  section: string;
  issue: string;
  fix: string;
  recommendations?: string[];
}

export interface ProjectIdea {
  title: string;
  rationale: string;
  features: string[];
  technologies: string[];
  resume_value: string;
}

export interface MatchSuggestions {
  overall_summary?: string;
  missing_keywords?: string[];
  matched_strengths?: string[];
  project_ideas?: ProjectIdea[];
  suggestions?: SuggestionItem[];
}

export interface MatchResultData {
  id: number;
  resume: number;
  job_description: number;
  resume_name?: string;
  job_title?: string;
  score: number;
  method: string;
  suggestions: MatchSuggestions;
  created_at: string;
}

export async function uploadResume(file: File): Promise<ResumeData> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/resumes/upload/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function createJobDescription(
  title: string,
  company: string,
  rawText: string
): Promise<JobDescriptionData> {
  const res = await api.post('/job-descriptions/', {
    title: title.trim(),
    company: company.trim(),
    raw_text: rawText.trim(),
  });
  return res.data;
}

export async function createMatch(
  resumeId: number,
  jdId: number,
  method: 'hybrid' | 'embedding' | 'tfidf' = 'hybrid'
): Promise<MatchResultData> {
  const res = await api.post('/match/', {
    resume_id: resumeId,
    job_description_id: jdId,
    method,
  });
  return res.data;
}

export async function getRecentResumes(): Promise<ResumeData[]> {
  const res = await api.get('/resumes/');
  return res.data;
}

export async function getRecentMatches(): Promise<MatchResultData[]> {
  const res = await api.get('/matches/');
  return res.data;
}