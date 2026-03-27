export function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div className={`${className} relative bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-premium transform hover:scale-105 transition-transform duration-300`}>
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="white" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="w-1/2 h-1/2"
      >
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm border border-orange-100">
        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
      </div>
    </div>
  );
}
