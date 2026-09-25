import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          Reliable ATS Resume & Job Description Matcher
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 max-w-3xl mx-auto leading-tight sm:leading-snug">
          Match your resume against any job description with precision
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Extract text reliably from PDFs and Word documents, calculate an accurate ATS match score, and uncover key missing keywords to improve your interview chances.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors shadow-xs flex items-center justify-center gap-2"
          >
            <span>Launch Resume Matcher</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>

          <Link
            href="/login"
            className="w-full sm:w-auto px-6 py-3 rounded-md bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm border border-slate-300 transition-colors shadow-xs"
          >
            Sign In / Register
          </Link>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <div className="border-t border-slate-200 pt-12">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 text-center mb-8">
            Built for accuracy, clarity, and simplicity
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-lg bg-white border border-slate-200 shadow-xs">
              <div className="w-10 h-10 rounded-md bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">Deep Text Parsing</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Extracts complete text from multi-page PDFs, complex Word tables, and plain text files with automatic null-byte sanitation.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-lg bg-white border border-slate-200 shadow-xs">
              <div className="w-10 h-10 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">Hybrid ATS Scoring</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Combines dense vector semantic embeddings with exact keyword TF-IDF frequency analysis to reflect modern hiring systems.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-lg bg-white border border-slate-200 shadow-xs">
              <div className="w-10 h-10 rounded-md bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">Actionable Suggestions</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Provides explicit missing keywords, identifies strengths, and gives section-by-section rewrite suggestions you can copy directly.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
