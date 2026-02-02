'use client';

export default function BuildBanner() {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-[#dc2626] text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
        </span>
        Being Built
      </div>
    </div>
  );
}
