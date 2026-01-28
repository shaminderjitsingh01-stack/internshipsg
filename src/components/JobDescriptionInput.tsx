"use client";

import { useState, useRef, useEffect } from "react";

interface JobDescription {
  title: string;
  company: string;
  description: string;
  requirements: {
    nonNegotiable: string[];
    goodToHave: string[];
  };
  source: "url" | "upload" | "paste";
  sourceUrl?: string;
}

interface Props {
  onJobDescriptionReady: (jobDescription: JobDescription) => void;
  isLoading?: boolean;
  initialPastedText?: string;
}

export default function JobDescriptionInput({ onJobDescriptionReady, isLoading, initialPastedText }: Props) {
  const [inputMode, setInputMode] = useState<"url" | "upload" | "paste">("paste"); // Default to paste since it's most reliable
  const [url, setUrl] = useState("");
  const [pastedText, setPastedText] = useState(initialPastedText || "");
  const [showBookmarklet, setShowBookmarklet] = useState(false);
  const [showImportBanner, setShowImportBanner] = useState(false);

  // Sync pasted text when initialPastedText changes (from bookmarklet)
  useEffect(() => {
    if (initialPastedText && initialPastedText.length > 0) {
      setPastedText(initialPastedText);
      setInputMode("paste");
      setShowImportBanner(true);
      // Auto-hide banner after 5 seconds
      const timer = setTimeout(() => setShowImportBanner(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [initialPastedText]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState<"blocked" | "generic" | "">("");
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUrlSubmit = async () => {
    if (!url.trim()) {
      setError("Please enter a job posting URL");
      setErrorType("generic");
      return;
    }

    setLoading(true);
    setError("");
    setErrorType("");

    // Check if URL is from a blocked domain
    const blockedDomains = ["linkedin.com", "indeed.com", "glassdoor.com"];
    const urlLower = url.toLowerCase();
    const isBlockedDomain = blockedDomains.some(domain => urlLower.includes(domain));

    if (isBlockedDomain) {
      const platform = urlLower.includes("linkedin") ? "LinkedIn" :
                       urlLower.includes("indeed") ? "Indeed" : "Glassdoor";
      setError(`${platform} requires login to view job postings. Please copy the job description from the page and paste it below.`);
      setErrorType("blocked");
      setLoading(false);
      setInputMode("paste"); // Auto-switch to paste mode
      return;
    }

    try {
      const res = await fetch("/api/parse-job-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        const errorMsg = data.error || "Failed to fetch job description";
        // Check if error mentions login/blocked
        if (errorMsg.toLowerCase().includes("login") || errorMsg.toLowerCase().includes("paste")) {
          setErrorType("blocked");
          setInputMode("paste"); // Auto-switch to paste mode
        } else {
          setErrorType("generic");
        }
        throw new Error(errorMsg);
      }

      const data = await res.json();
      onJobDescriptionReady({
        ...data.jobDescription,
        source: "url",
        sourceUrl: url.trim(),
      });
    } catch (err: any) {
      setError(err.message || "Failed to parse job URL");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);
    setError("");
    setErrorType("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/parse-job-document", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to parse document");
      }

      const data = await res.json();
      onJobDescriptionReady({
        ...data.jobDescription,
        source: "upload",
      });
    } catch (err: any) {
      setError(err.message || "Failed to parse document");
      setErrorType("generic");
    } finally {
      setLoading(false);
    }
  };

  const handlePasteSubmit = async () => {
    if (!pastedText.trim() || pastedText.trim().length < 100) {
      setError("Please paste a complete job description (minimum 100 characters)");
      setErrorType("generic");
      return;
    }

    setLoading(true);
    setError("");
    setErrorType("");

    try {
      const res = await fetch("/api/parse-job-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pastedText.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to parse job description");
      }

      const data = await res.json();
      onJobDescriptionReady({
        ...data.jobDescription,
        source: "paste",
      });
    } catch (err: any) {
      setError(err.message || "Failed to parse job description");
      setErrorType("generic");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">Job-Specific Interview Prep</h3>
          <p className="text-sm text-slate-500">Practice for a specific role with tailored questions</p>
        </div>
      </div>

      {/* Import Success Banner */}
      {showImportBanner && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">Job description imported!</p>
            <p className="text-xs text-green-600">Review below and click &quot;Analyze & Continue&quot; when ready</p>
          </div>
          <button
            onClick={() => setShowImportBanner(false)}
            className="p-1 text-green-500 hover:text-green-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Input Mode Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg mb-4">
        <button
          onClick={() => { setInputMode("paste"); setError(""); setErrorType(""); }}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors relative ${
            inputMode === "paste"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Paste
          <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[9px] px-1 rounded">Best</span>
        </button>
        <button
          onClick={() => { setInputMode("url"); setError(""); setErrorType(""); }}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            inputMode === "url"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span className="hidden sm:inline">Job </span>URL
        </button>
        <button
          onClick={() => { setInputMode("upload"); setError(""); setErrorType(""); }}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            inputMode === "upload"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Upload
        </button>
      </div>

      {/* URL Input */}
      {inputMode === "url" && (
        <div className="space-y-3">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-3">
            <p className="text-xs text-amber-700">
              <strong>Note:</strong> LinkedIn, Indeed & Glassdoor require login and block direct access.
              For these sites, use the <strong>Paste</strong> tab instead.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Job Posting URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://careers.company.com/jobs/..."
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <p className="mt-1 text-xs text-slate-500">
              Works with company career pages, JobStreet, MyCareersFuture
            </p>
          </div>
          <button
            onClick={handleUrlSubmit}
            disabled={loading || isLoading || !url.trim()}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Fetching Job Details..." : "Load Job Description"}
          </button>
        </div>
      )}

      {/* File Upload */}
      {inputMode === "upload" && (
        <div className="space-y-3">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <svg className="w-10 h-10 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {fileName ? (
              <p className="text-sm text-blue-600 font-medium">{fileName}</p>
            ) : (
              <>
                <p className="text-sm text-slate-600 font-medium">Click to upload job description</p>
                <p className="text-xs text-slate-500 mt-1">PDF, DOC, DOCX, or TXT</p>
              </>
            )}
          </div>
          {loading && (
            <div className="text-center py-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-slate-500 mt-2">Processing document...</p>
            </div>
          )}
        </div>
      )}

      {/* Paste Text */}
      {inputMode === "paste" && (
        <div className="space-y-3">
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-3">
            <p className="text-xs text-green-700">
              <strong>Recommended:</strong> Copy the full job description from LinkedIn, Indeed, or any job site and paste it here.
              This method works with all job boards.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Paste Job Description
            </label>
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Open the job posting → Select all text (Ctrl+A) → Copy (Ctrl+C) → Paste here (Ctrl+V)

Include: Job title, company name, responsibilities, requirements, qualifications..."
              className="w-full min-h-[200px] px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-y"
            />
            <p className="mt-1 text-xs text-slate-500">
              {pastedText.length} characters {pastedText.length < 100 && "(minimum 100)"}
            </p>
          </div>
          <button
            onClick={handlePasteSubmit}
            disabled={loading || isLoading || pastedText.length < 100}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Analyzing Job Description..." : "Analyze & Continue"}
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
          {errorType === "blocked" && (
            <div className="mt-3 pt-3 border-t border-red-100">
              <p className="text-xs text-red-500 mb-2">
                <strong>Quick tip:</strong> Open the job posting in your browser, select all text (Ctrl+A), copy it (Ctrl+C), then paste below.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Supported Platforms */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-xs text-slate-500 text-center">
          <strong>Best method:</strong> Copy & paste job description from any job board
        </p>
        <p className="text-xs text-slate-400 text-center mt-1">
          URL parsing works with: JobStreet, MyCareersFuture, company career pages
        </p>
      </div>

      {/* Bookmarklet Section */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <button
          onClick={() => setShowBookmarklet(!showBookmarklet)}
          className="w-full flex items-center justify-between text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <span className="font-medium">One-Click Import Bookmarklet</span>
          </span>
          <svg className={`w-4 h-4 transition-transform ${showBookmarklet ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showBookmarklet && (
          <div className="mt-4 space-y-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded">NEW</span>
                Import from Any Job Board
              </h4>
              <p className="text-sm text-blue-800 mb-4">
                Use this bookmarklet to instantly import job descriptions from LinkedIn, Workable, Indeed, or any job board - no copy-paste needed!
              </p>

              {/* Bookmarklet Button */}
              <div className="flex items-center gap-3 mb-4">
                <a
                  href={`javascript:(function(){var t=document.body.innerText||document.body.textContent;if(!t||t.length<100){alert('Could not find job description on this page.');return;}fetch('https://internship.sg/api/import-job',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:t.substring(0,25000)})}).then(r=>r.json()).then(d=>{if(d.id){window.open('https://internship.sg/job-interview?import='+d.id,'_blank');}else{alert('Failed to import. Please copy manually.');}}).catch(()=>alert('Error importing. Please copy manually.'));})();`}
                  onClick={(e) => e.preventDefault()}
                  draggable="true"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium text-sm shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all cursor-grab active:cursor-grabbing"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  📋 Import to Internship.sg
                </a>
                <span className="text-xs text-blue-600">← Drag this to your bookmarks bar</span>
              </div>

              {/* Instructions */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-blue-900">How to set up:</p>
                <ol className="text-xs text-blue-800 space-y-1.5 list-decimal list-inside">
                  <li>Show your bookmarks bar (Ctrl+Shift+B on Chrome)</li>
                  <li>Drag the blue button above to your bookmarks bar</li>
                  <li>Done! Now visit any job posting and click the bookmarklet</li>
                </ol>
              </div>

              {/* Manual Copy Option */}
              <div className="mt-4 pt-3 border-t border-blue-200">
                <p className="text-xs text-blue-700 mb-2">Or copy the bookmarklet code manually:</p>
                <div className="relative">
                  <code className="block p-2 bg-white/70 rounded text-[10px] text-blue-900 font-mono break-all border border-blue-200">
                    {`javascript:(function(){var t=document.body.innerText||document.body.textContent;if(!t||t.length<100){alert('No job description found');return;}fetch('https://internship.sg/api/import-job',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:t.substring(0,25000)})}).then(r=>r.json()).then(d=>{if(d.id){window.open('https://internship.sg/job-interview?import='+d.id,'_blank');}else{alert('Failed');}}).catch(()=>alert('Error'));})();`}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`javascript:(function(){var t=document.body.innerText||document.body.textContent;if(!t||t.length<100){alert('No job description found');return;}fetch('https://internship.sg/api/import-job',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:t.substring(0,25000)})}).then(r=>r.json()).then(d=>{if(d.id){window.open('https://internship.sg/job-interview?import='+d.id,'_blank');}else{alert('Failed');}}).catch(()=>alert('Error'));})();`);
                      alert('Bookmarklet code copied! Create a new bookmark and paste this as the URL.');
                    }}
                    className="absolute top-1 right-1 p-1.5 bg-blue-100 hover:bg-blue-200 rounded text-blue-700 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Works With List */}
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="text-xs text-slate-400">Works with:</span>
              {['LinkedIn', 'Workable', 'Indeed', 'Glassdoor', 'JobStreet', 'All job boards'].map((site) => (
                <span key={site} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                  {site}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
