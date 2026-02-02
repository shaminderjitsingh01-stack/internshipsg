'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShareButtonProps {
  title?: string;
  url?: string;
}

export default function ShareButton({ title = '', url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const getShareUrl = () => {
    if (typeof window === 'undefined') return '';
    return url || window.location.href;
  };

  const getShareTitle = () => {
    if (typeof window === 'undefined') return title;
    return title || document.title;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopied(true);
      setShowToast(true);
      setTimeout(() => {
        setCopied(false);
        setShowToast(false);
      }, 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = getShareUrl();
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setShowToast(true);
      setTimeout(() => {
        setCopied(false);
        setShowToast(false);
      }, 2000);
    }
  };

  const handleLinkedIn = () => {
    const shareUrl = encodeURIComponent(getShareUrl());
    const shareTitle = encodeURIComponent(getShareTitle());
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
      '_blank',
      'width=600,height=600'
    );
  };

  const handleTwitter = () => {
    const shareUrl = encodeURIComponent(getShareUrl());
    const shareTitle = encodeURIComponent(getShareTitle());
    window.open(
      `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`,
      '_blank',
      'width=600,height=400'
    );
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-center gap-3">
        {/* Copy Link Button */}
        <motion.button
          type="button"
          onClick={handleCopy}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="group relative flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-800/50 border border-zinc-700 hover:border-transparent transition-all duration-300 overflow-hidden"
        >
          {/* Gradient border on hover */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute inset-[1px] rounded-xl bg-zinc-800/90 transition-all duration-300" />

          <div className="relative z-10">
            {copied ? (
              <motion.svg
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-5 h-5 text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </motion.svg>
            ) : (
              <svg className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            )}
          </div>
        </motion.button>

        {/* LinkedIn Button */}
        <motion.button
          type="button"
          onClick={handleLinkedIn}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="group relative flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-800/50 border border-zinc-700 hover:border-transparent transition-all duration-300 overflow-hidden"
        >
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute inset-[1px] rounded-xl bg-zinc-800/90 group-hover:bg-blue-600/90 transition-all duration-300" />

          <svg className="relative z-10 w-5 h-5 text-zinc-400 group-hover:text-white transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
          </svg>
        </motion.button>

        {/* Twitter/X Button */}
        <motion.button
          type="button"
          onClick={handleTwitter}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="group relative flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-800/50 border border-zinc-700 hover:border-transparent transition-all duration-300 overflow-hidden"
        >
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-zinc-600 to-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute inset-[1px] rounded-xl bg-zinc-800/90 group-hover:bg-zinc-700/90 transition-all duration-300" />

          <svg className="relative z-10 w-5 h-5 text-zinc-400 group-hover:text-white transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </motion.button>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute -bottom-14 left-1/2 -translate-x-1/2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg backdrop-blur-sm whitespace-nowrap"
          >
            <span className="text-sm font-medium text-emerald-400">Link copied to clipboard!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
