export default function RobotLogo({ className = "" }: { className?: string }) {
  return (
    <svg 
      className={className}
      viewBox="0 0 100 100" 
      xmlns="http://www.w3.org/2000/svg"
      style={{
        fill: '#4b5563', // Tailwind gray-700
        stroke: '#1f2937', // Tailwind gray-900
        strokeWidth: 2,
      }}
    >
      {/* Head */}
      <rect x="20" y="20" width="60" height="40" rx="8" ry="8" />
      
      {/* Antenna */}
      <line x1="50" y1="10" x2="50" y2="20" />
      <circle cx="50" cy="8" r="3" />

      {/* Eyes */}
      <circle style={{ fill: '#f59e0b' }} cx="35" cy="40" r="5" /> {/* Tailwind amber-500 */}
      <circle style={{ fill: '#f59e0b' }} cx="65" cy="40" r="5" />

      {/* Mouth */}
      <rect x="35" y="55" width="30" height="5" rx="2" />

      {/* Body */}
      <rect x="30" y="65" width="40" height="20" rx="4" />
    </svg>
  );
} 