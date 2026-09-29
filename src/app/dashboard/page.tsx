'use client';

import { useState } from 'react';
import { useAuthGuard } from '@/lib/useAuthGuard';
import {
  uploadResume,
  createJobDescription,
  createMatch,
  ResumeData,
  MatchResultData
} from '@/lib/resumeApi';
import { getApiErrorMessage } from '@/lib/errorMessage';

const SAMPLE_JD_TITLE = 'Full Stack Software Engineer';
const SAMPLE_JD_COMPANY = 'TechCorp Inc.';
const SAMPLE_JD_TEXT = `We are looking for a Full Stack Software Engineer to build and maintain scalable web applications. 

Key Responsibilities:
- Design and implement responsive user interfaces using React, Next.js, and TypeScript.
- Build robust backend APIs and services using Python (Django or FastAPI) and Node.js.
- Work with relational databases like PostgreSQL, optimize complex SQL queries, and implement Redis caching.
- Write clean, maintainable, and thoroughly tested code with automated CI/CD pipelines.
- Collaborate with product designers and engineering team members in an agile environment.

Requirements:
- 3+ years of software development experience with React, TypeScript, and Python.
- Proven experience with Docker, RESTful APIs, and cloud deployments (GCP or Render).
- Solid understanding of database indexing, Git version control, and system architecture.
- Strong communication and analytical problem-solving skills.`;

function groupSuggestions(items: MatchResultData['suggestions']['suggestions'] = []) {
  const grouped = new Map<string, { section: string; issue: string; fix: string }>();
  for (const item of items) {
    const normalized = item.section.trim().toLowerCase().replace(/\s+/g, ' ');
    const key = normalized.includes('project')
      ? normalized
      : normalized.includes('skill') || normalized.includes('keyword') || normalized.includes('technology')
        ? 'technical skills'
        : normalized.includes('summary') || normalized.includes('objective')
          ? 'professional summary'
          : normalized.includes('experience') || normalized.includes('employment') || normalized.includes('career')
            ? 'work experience'
            : normalized.includes('education')
              ? 'education'
              : normalized.includes('certif')
                ? 'certifications'
                : normalized;
    const current = grouped.get(key);
    if (!current) {
      grouped.set(key, {
        section: key.includes('project') ? item.section : key.replace(/\b\w/g, (letter) => letter.toUpperCase()),
        issue: item.issue,
        fix: item.fix,
      });
    } else {
      current.issue += ` ${item.issue}`;
      current.fix += ` ${item.fix}`;
    }
  }
  return Array.from(grouped.values());
}

export default function DashboardPage() {
  const isCheckingAuth = useAuthGuard();

  // State
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [jdId, setJdId] = useState<number | null>(null);
  const [jdTitle, setJdTitle] = useState('');
  const [jdCompany, setJdCompany] = useState('');
  const [jdText, setJdText] = useState('');
  const [matchMethod, setMatchMethod] = useState<'hybrid' | 'embedding' | 'tfidf'>('hybrid');
  
  const [matchResult, setMatchResult] = useState<MatchResultData | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'info' | 'success' | 'error' } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingJd, setIsSavingJd] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [showResumePreview, setShowResumePreview] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Resume Upload Handler
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setStatusMessage({ text: `Parsing "${file.name}"...`, type: 'info' });

    try {
      const data = await uploadResume(file);
      setResumeData(data);
      const wordCount = data.word_count ? ` (${data.word_count} words extracted)` : '';
      setStatusMessage({
        text: `Successfully parsed "${data.original_filename}"${wordCount}.`,
        type: 'success',
      });
    } catch (err: unknown) {
      const errorMsg = getApiErrorMessage(
        err,
        'Failed to parse resume. Please check file format and text readability.'
      );
      setStatusMessage({ text: errorMsg, type: 'error' });
    } finally {
      setIsUploading(false);
    }
  }

  // Job Description Save Handler
  async function handleJdSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!jdText.trim()) {
      setStatusMessage({ text: 'Please enter job description text.', type: 'error' });
      return;
    }

    setIsSavingJd(true);
    setStatusMessage({ text: 'Saving job description...', type: 'info' });

    try {
      const data = await createJobDescription(jdTitle, jdCompany, jdText);
      setJdId(data.id);
      setStatusMessage({
        text: 'Job description saved and ready for matching.',
        type: 'success',
      });
    } catch (err: unknown) {
      const errorMsg = getApiErrorMessage(err, 'Failed to save job description.');
      setStatusMessage({ text: errorMsg, type: 'error' });
    } finally {
      setIsSavingJd(false);
    }
  }

  // Populate Sample JD
  function loadSampleJd() {
    setJdTitle(SAMPLE_JD_TITLE);
    setJdCompany(SAMPLE_JD_COMPANY);
    setJdText(SAMPLE_JD_TEXT);
    setStatusMessage({ text: 'Loaded sample Full Stack Engineer job description.', type: 'info' });
  }

  // Match Calculation Handler with specific method support
  async function runMatchWithMethod(selectedMethod: 'hybrid' | 'embedding' | 'tfidf') {
    if (!resumeData?.id) {
      setStatusMessage({ text: 'Please upload and parse a resume first.', type: 'error' });
      return;
    }

    let activeJdId = jdId;

    // Auto-save JD if user typed text but didn't click save button
    if (!activeJdId) {
      if (!jdText.trim()) {
        setStatusMessage({ text: 'Please provide a job description first.', type: 'error' });
        return;
      }
      setIsMatching(true);
      setStatusMessage({ text: 'Saving job description...', type: 'info' });
      try {
        const jd = await createJobDescription(jdTitle, jdCompany, jdText);
        setJdId(jd.id);
        activeJdId = jd.id;
      } catch {
        setIsMatching(false);
        setStatusMessage({ text: 'Could not save job description before matching.', type: 'error' });
        return;
      }
    }

    setIsMatching(true);
    const methodNames = {
      hybrid: 'Smart Hybrid',
      embedding: 'Semantic AI',
      tfidf: 'Exact Keywords (TF-IDF)'
    };
    setStatusMessage({
      text: `Calculating ${methodNames[selectedMethod]} score and generating model-specific suggestions...`,
      type: 'info'
    });

    try {
      const data = await createMatch(resumeData.id, activeJdId, selectedMethod);
      setMatchResult(data);
      setStatusMessage({
        text: `Analysis complete: Updated score and suggestions using ${methodNames[selectedMethod]}.`,
        type: 'success'
      });
    } catch (err: unknown) {
      const errorMsg = getApiErrorMessage(
        err,
        'Matching process failed. Please ensure both resume and JD contain valid text.'
      );
      setStatusMessage({ text: errorMsg, type: 'error' });
    } finally {
      setIsMatching(false);
    }
  }

  function handleMethodChange(newMethod: 'hybrid' | 'embedding' | 'tfidf') {
    setMatchMethod(newMethod);
    // If a match is already generated, automatically re-run with the new model so both score & suggestions update!
    if (matchResult && resumeData?.id && (jdId || jdText.trim())) {
      runMatchWithMethod(newMethod);
    }
  }

  function handleMatch() {
    runMatchWithMethod(matchMethod);
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center text-sm text-slate-500">
        Restoring your session...
      </div>
    );
  }

  // Copy Suggestion to Clipboard
  function handleCopySuggestion(text: string, index: number) {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  // Model Info Helper
  function getMethodInfo(method: string) {
    const m = (method || '').toLowerCase();
    if (m.includes('tfidf')) {
      return {
        name: 'Exact Keywords (TF-IDF)',
        focus: 'Evaluated through Keyword Density & ATS Term Matching. Suggestions prioritize missing technical tools, acronyms, and vocabulary placement.',
        pill: 'bg-purple-50 text-purple-800 border-purple-200',
      };
    }
    if (m.includes('embedding')) {
      return {
        name: 'Semantic AI (Dense Vector)',
        focus: 'Evaluated through Semantic AI & Conceptual Fit. Suggestions prioritize role scope, seniority framing, and experience depth beyond exact keywords.',
        pill: 'bg-blue-50 text-blue-800 border-blue-200',
      };
    }
    return {
      name: 'Smart Hybrid Model',
      focus: 'Evaluated through Balanced Dual-Layer Analysis (65% Semantic + 35% Keywords). Suggestions address both hard keyword gaps and narrative impact.',
      pill: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    };
  }

  // Score Tone Helpers
  function getScoreBadge(score: number) {
    if (score >= 75) {
      return {
        label: 'Strong Match',
        bg: 'bg-emerald-50',
        text: 'text-emerald-800',
        border: 'border-emerald-200',
        bar: 'bg-emerald-600',
      };
    }
    if (score >= 50) {
      return {
        label: 'Moderate Match',
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200',
        bar: 'bg-amber-600',
      };
    }
    return {
      label: 'Needs Tailoring',
      bg: 'bg-rose-50',
      text: 'text-rose-800',
      border: 'border-rose-200',
      bar: 'bg-rose-600',
    };
  }

  const displayedSuggestions = groupSuggestions(matchResult?.suggestions?.suggestions);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Banner / Breadcrumb */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Resume & JD Matcher</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Upload candidate documents, input job criteria, and run in-depth ATS relevance scoring.
          </p>
        </div>

        {/* Global Alert Notification */}
        {statusMessage && (
          <div
            className={`px-3 py-2 rounded-md text-xs font-medium border flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : statusMessage.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-600'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-600'
                  : 'bg-blue-600'
              }`}
            />
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>

      {/* Main Grid: Inputs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Step 1: Resume Upload Section */}
        <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <h2 className="text-base font-semibold text-slate-900">Resume File</h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">PDF • DOCX • TXT</span>
            </div>

            {/* Upload Area */}
            {!resumeData ? (
              <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/20 text-center">
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <div className="w-10 h-10 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-600 mb-3 shadow-xs">
                  {isUploading ? (
                    <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  )}
                </div>
                <p className="text-sm font-medium text-slate-800">
                  {isUploading ? 'Extracting text...' : 'Click to select or drop resume'}
                </p>
                <p className="text-xs text-slate-500 mt-1">Maximum file size: 10 MB</p>
              </label>
            ) : (
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                      DOC
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 truncate max-w-xs sm:max-w-sm">
                        {resumeData.original_filename}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                          Parsed Successfully
                        </span>
                        {resumeData.word_count ? (
                          <span className="text-xs text-slate-500">
                            {resumeData.word_count} words
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <label className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer underline shrink-0">
                    Replace
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Collapsible Extracted Text Preview */}
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowResumePreview(!showResumePreview)}
                    className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
                  >
                    <span>{showResumePreview ? 'Hide' : 'View'} Extracted Resume Text</span>
                    <svg
                      className={`w-3.5 h-3.5 transition-transform ${showResumePreview ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showResumePreview && (
                    <div className="mt-2 p-3 bg-white border border-slate-200 rounded text-xs text-slate-700 font-mono max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                      {resumeData.raw_text || resumeData.preview || 'No text content available.'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Clean text parsing engine</span>
            <span>Zero text corruption</span>
          </div>
        </section>

        {/* Step 2: Job Description Section */}
        <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <h2 className="text-base font-semibold text-slate-900">Job Description</h2>
              </div>
              <button
                type="button"
                onClick={loadSampleJd}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded bg-blue-50 border border-blue-200 transition-colors"
              >
                Insert Sample JD
              </button>
            </div>

            <form onSubmit={handleJdSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Job Title <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Frontend Engineer"
                    value={jdTitle}
                    onChange={(e) => setJdTitle(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Company <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Stripe, Acme Corp"
                    value={jdCompany}
                    onChange={(e) => setJdCompany(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-900 bg-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-700">
                    Job Description Text <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {jdText.split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
                <textarea
                  placeholder="Paste the full job description requirements and responsibilities here..."
                  value={jdText}
                  onChange={(e) => {
                    setJdText(e.target.value);
                    setJdId(null);
                  }}
                  className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-900 bg-white h-32 resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                {jdId ? (
                  <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Job Description Saved
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Saved automatically on match</span>
                )}

                <button
                  type="submit"
                  disabled={isSavingJd || !jdText.trim()}
                  className="text-xs font-medium text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-40"
                >
                  {isSavingJd ? 'Saving...' : 'Save Description'}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Paste key requirements</span>
            <span>Clean plain-text parsing</span>
          </div>
        </section>
      </div>

      {/* Matching Options & Action Bar */}
      <section className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Method Selection */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Scoring Model:
            </span>
            <div className="inline-flex rounded-md border border-slate-200 p-1 bg-slate-50 text-xs">
              <button
                type="button"
                onClick={() => handleMethodChange('hybrid')}
                className={`px-3 py-1.5 rounded font-medium transition-colors ${
                  matchMethod === 'hybrid'
                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Smart Hybrid (65% Semantic + 35% Keywords)
              </button>
              <button
                type="button"
                onClick={() => handleMethodChange('embedding')}
                className={`px-3 py-1.5 rounded font-medium transition-colors ${
                  matchMethod === 'embedding'
                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semantic AI
              </button>
              <button
                type="button"
                onClick={() => handleMethodChange('tfidf')}
                className={`px-3 py-1.5 rounded font-medium transition-colors ${
                  matchMethod === 'tfidf'
                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Exact Keywords (TF-IDF)
              </button>
            </div>
          </div>

          {/* Run Button */}
          <button
            onClick={handleMatch}
            disabled={!resumeData || !jdText.trim() || isMatching}
            className="px-6 py-2.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xs cursor-pointer shrink-0"
          >
            {isMatching ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Analyzing Match & Gaps...</span>
              </>
            ) : (
              <>
                <span>Calculate Match Score</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </div>
      </section>

      {/* Results View */}
      {matchResult && (
        <section className="bg-white rounded-lg border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          {/* Result Header & Score Gauge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Match Report
                </span>
                <span className={`text-xs px-2 py-0.5 rounded font-medium border ${getMethodInfo(matchResult.method).pill}`}>
                  {getMethodInfo(matchResult.method).name}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                ATS Relevance & Gap Analysis
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                {getMethodInfo(matchResult.method).focus}
              </p>
            </div>

            {/* Score Badge */}
            {(() => {
              const badge = getScoreBadge(matchResult.score);
              return (
                <div className={`px-5 py-3 rounded-lg border ${badge.bg} ${badge.border} flex items-center gap-4`}>
                  <div className="text-right">
                    <span className="text-xs font-medium text-slate-600 block">Overall Score</span>
                    <span className={`text-xs font-semibold ${badge.text}`}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="border-l border-slate-300/80 pl-4">
                    <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                      {matchResult.score}%
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Score Progress Bar */}
          <div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div
                className={`h-full transition-all duration-500 ${getScoreBadge(matchResult.score).bar}`}
                style={{ width: `${Math.min(100, Math.max(0, matchResult.score))}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 mt-1.5 font-mono">
              <span>0% Low Match</span>
              <span>50% Moderate</span>
              <span>75%+ ATS Target</span>
              <span>100% Ideal Fit</span>
            </div>
          </div>

          {/* Executive Summary */}
          {matchResult.suggestions?.overall_summary && (
            <div className="p-4 rounded-md bg-blue-50 border border-blue-200 text-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-1 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Assessment Summary
              </h3>
              <p className="text-sm leading-relaxed text-blue-950 font-normal">
                {matchResult.suggestions.overall_summary}
              </p>
            </div>
          )}

          {/* Two-Column Grid: Missing Keywords vs Matched Strengths */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Missing Keywords */}
            <div className="p-4 rounded-md border border-slate-200 bg-slate-50/50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-800 mb-3 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Missing Keywords from JD
              </h3>

              {matchResult.suggestions?.missing_keywords && matchResult.suggestions.missing_keywords.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {matchResult.suggestions.missing_keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="text-xs px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 border border-rose-200 font-medium"
                    >
                      + {kw}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  No major missing keywords detected. Great coverage!
                </p>
              )}
            </div>

            {/* Matched Strengths */}
            <div className="p-4 rounded-md border border-slate-200 bg-slate-50/50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-3 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Matched Proficiencies
              </h3>

              {matchResult.suggestions?.matched_strengths && matchResult.suggestions.matched_strengths.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {matchResult.suggestions.matched_strengths.map((str, i) => (
                    <span
                      key={i}
                      className="text-xs px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium"
                    >
                      ✓ {str}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  General qualification match detected.
                </p>
              )}
            </div>
          </div>

          {/* Portfolio Project Ideas */}
          {matchResult.suggestions?.project_ideas && matchResult.suggestions.project_ideas.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-violet-800">
                    Project Ideas to Close Gaps
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    New portfolio features tailored to the {getMethodInfo(matchResult.method).name} evaluation.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {matchResult.suggestions.project_ideas.map((project, i) => (
                  <article key={`${project.title}-${i}`} className="p-4 rounded-lg border border-violet-200 bg-violet-50/40">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h4 className="text-sm font-bold text-violet-950">{project.title}</h4>
                      <button
                        type="button"
                        onClick={() => handleCopySuggestion(
                          `${project.title}\n\n${project.rationale}\n\nFeatures: ${project.features.join(', ')}\nTechnologies: ${project.technologies.join(', ')}\nResume value: ${project.resume_value}`,
                          1000 + i
                        )}
                        className="text-xs text-violet-700 hover:text-violet-900 font-medium shrink-0"
                      >
                        {copiedIndex === 1000 + i ? 'Copied!' : 'Copy Idea'}
                      </button>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed mb-3">{project.rationale}</p>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="font-semibold text-slate-800">Features: </span>
                        <span className="text-slate-600">{project.features.join(' • ')}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800">Technologies: </span>
                        <span className="text-slate-600">{project.technologies.join(', ')}</span>
                      </div>
                      <div className="p-2.5 rounded bg-white border border-violet-200 text-slate-700">
                        <span className="font-semibold text-violet-900">Resume value: </span>
                        {project.resume_value}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* Section Rewrite Recommendations */}
          {displayedSuggestions.length > 0 && (
            <div className="pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                Tailored Optimization Recommendations ({displayedSuggestions.length})
              </h3>

              <div className="space-y-3">
                {displayedSuggestions.map((s, i) => (
                  <div key={i} className="p-4 rounded-lg border border-slate-200 bg-white shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-900 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                        {s.section}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopySuggestion(s.fix, i)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                      >
                        {copiedIndex === i ? (
                          <span className="text-emerald-700 font-semibold">Copied!</span>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span>Copy Rewrite</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 mb-2">
                      <strong className="text-slate-800">Identified Gap:</strong> {s.issue}
                    </p>

                    <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-xs text-slate-900 leading-relaxed font-sans">
                      <span className="font-semibold text-emerald-800 mr-1.5">Recommended Fix:</span>
                      {s.fix}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}