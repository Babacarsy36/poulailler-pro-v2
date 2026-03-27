import { useState } from "react";

export function Logo({ className = "w-10 h-10" }: { className?: string }) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className={`${className} rounded-full bg-yellow-400 flex items-center justify-center font-black text-white text-[10px] shadow-sm border-2 border-white`}>
        BABS
      </div>
    );
  }

  return (
    <img 
      src="/logo.png" 
      alt="Babs Farmer" 
      onError={() => setError(true)}
      className={`${className} rounded-full border-2 border-yellow-400 shadow-sm object-cover`}
    />
  );
}
