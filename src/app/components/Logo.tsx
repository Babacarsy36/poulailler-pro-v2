export function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Chicken body */}
      <ellipse cx="50" cy="60" rx="25" ry="30" fill="#F59E0B" />
      
      {/* Chicken head */}
      <circle cx="50" cy="35" r="15" fill="#F59E0B" />
      
      {/* Eye */}
      <circle cx="52" cy="32" r="3" fill="#1F2937" />
      
      {/* Beak */}
      <path d="M 60 35 L 70 35 L 60 38 Z" fill="#EF4444" />
      
      {/* Comb */}
      <path
        d="M 45 22 Q 47 18, 49 22 Q 51 18, 53 22 Q 55 18, 57 22"
        stroke="#EF4444"
        strokeWidth="2"
        fill="#EF4444"
      />
      
      {/* Wing */}
      <ellipse cx="60" cy="55" rx="8" ry="15" fill="#D97706" />
      
      {/* Legs */}
      <line x1="45" y1="85" x2="45" y2="92" stroke="#F59E0B" strokeWidth="2" />
      <line x1="55" y1="85" x2="55" y2="92" stroke="#F59E0B" strokeWidth="2" />
      
      {/* Feet */}
      <path d="M 42 92 L 48 92" stroke="#F59E0B" strokeWidth="2" />
      <path d="M 52 92 L 58 92" stroke="#F59E0B" strokeWidth="2" />
    </svg>
  );
}
