"use client";

import { useState, useRef, useEffect } from "react";

// Bookmarklet code - sends job text to API and opens import page
// Uses www.internship.sg to avoid redirect issues with CORS
// Falls back to clipboard if CSP blocks the request (e.g., government sites)
const BOOKMARKLET_CODE = `javascript:(function(){var s=['[class*="job-description"]','[class*="jobDescription"]','[class*="job-details"]','[class*="jobDetails"]','[id*="job-description"]','[id*="jobDescription"]','.description__text','.job-description','#job-details','[data-testid*="description"]','article','main'].map(function(q){return document.querySelector(q)}).find(function(e){return e&&e.innerText&&e.innerText.length>200});var t=s?s.innerText:null;if(!t||t.length<100){t=document.body.innerText;}if(!t||t.length<100){alert('Could not find job description.');return;}t=t.substring(0,25000);fetch('https://www.internship.sg/api/import-job',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:t})}).then(r=>r.json()).then(d=>{if(d.id){window.open('https://www.internship.sg/job-interview?import='+d.id,'_blank');}else{throw new Error();}}).catch(()=>{navigator.clipboard.writeText(t).then(()=>{alert('Job description copied to clipboard! Go to internship.sg and use the Paste tab.');}).catch(()=>{alert('Please manually copy the job description and paste at internship.sg/job-interview');});});})();`;

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
  const [inputMode, setInputMode] = useState<"bookmarklet" | "paste" | "upload">("bookmarklet");
  const [pastedText, setPastedText] = useState(initialPastedText || "");
  const [showImportBanner, setShowImportBanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bookmarkletRef = useRef<HTMLAnchorElement>(null);

  // Set bookmarklet href after render to bypass React's javascript: URL blocking
  useEffect(() => {
    if (bookmarkletRef.current && inputMode === "bookmarklet") {
      bookmarkletRef.current.setAttribute('href', BOOKMARKLET_CODE);
    }
  }, [inputMode]);

  // Sync pasted text when initialPastedText changes (from bookmarklet import)
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);
    setError("");

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
    } finally {
      setLoading(false);
    }
  };

  const handlePasteSubmit = async () => {
    if (!pastedText.trim() || pastedText.trim().length < 100) {
      setError("Please paste a complete job description (minimum 100 characters)");
      return;
    }

    setLoading(true);
    setError("");

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
          onClick={() => { setInputMode("bookmarklet"); setError(""); }}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors relative ${
            inputMode === "bookmarklet"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span className="flex items-center justify-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <span className="hidden sm:inline">One-Click </span>Import
          </span>
          <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[9px] px-1 rounded">Best</span>
        </button>
        <button
          onClick={() => { setInputMode("paste"); setError(""); }}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            inputMode === "paste"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Paste
        </button>
        <button
          onClick={() => { setInputMode("upload"); setError(""); }}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            inputMode === "upload"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Upload
        </button>
      </div>

      {/* One-Click Import / Bookmarklet */}
      {inputMode === "bookmarklet" && (
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
            <h4 className="font-semibold text-blue-900 mb-2">
              Import from Any Job Board
            </h4>
            <p className="text-sm text-blue-800 mb-4">
              Use this bookmarklet to instantly import job descriptions from LinkedIn, Workable, Indeed, or any job board - no copy-paste needed!
            </p>

            {/* Bookmarklet Button */}
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex items-center gap-3">
                <a
                  ref={bookmarkletRef}
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  draggable="true"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium text-sm shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all cursor-grab active:cursor-grabbing"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  Import to Internship.sg
                </a>
                <span className="text-xs text-blue-600">← Drag to bookmarks bar</span>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-2 mb-4">
              <p className="text-xs font-medium text-blue-900">How to set up (one-time):</p>
              <ol className="text-xs text-blue-800 space-y-1.5 list-decimal list-inside">
                <li>Show your bookmarks bar (Ctrl+Shift+B on Chrome)</li>
                <li>Drag the blue button above to your bookmarks bar</li>
                <li>Done! Now visit any job posting and click the bookmarklet</li>
              </ol>
            </div>

            {/* Manual Copy Option */}
            <div className="pt-3 border-t border-blue-200">
              <p className="text-xs text-blue-700 mb-2">If dragging doesn&apos;t work, copy the code manually:</p>
              <div className="relative">
                <code className="block p-2 bg-white/70 rounded text-[10px] text-blue-900 font-mono break-all border border-blue-200 max-h-16 overflow-y-auto">
                  {BOOKMARKLET_CODE}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(BOOKMARKLET_CODE);
                    alert('Bookmarklet code copied! Create a new bookmark and paste this as the URL.');
                  }}
                  className="absolute top-1 right-1 p-1.5 bg-blue-100 hover:bg-blue-200 rounded text-blue-700 transition-colors"
                  title="Copy code"
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
            {['LinkedIn', 'Workable', 'Indeed', 'Glassdoor', 'JobStreet', 'Any job site'].map((site) => (
              <span key={site} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                {site}
              </span>
            ))}
          </div>

          {/* Mobile Note */}
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800">
              <strong>📱 On mobile?</strong> Bookmarklets don&apos;t work on mobile browsers. Use the <button onClick={() => setInputMode("paste")} className="underline font-semibold hover:text-amber-900">Paste tab</button> instead — copy the job description from the job posting and paste it here.
            </p>
          </div>
        </div>
      )}

      {/* Paste Text */}
      {inputMode === "paste" && (
        <div className="space-y-3">
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

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
