export function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div className={`${className} relative bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 overflow-hidden shrink-0`}>
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="white" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="w-3/5 h-3/5 drop-shadow-sm"
      >
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
        <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
      </div>
    </div>
  );
}
