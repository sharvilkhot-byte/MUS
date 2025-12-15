import React from 'react';

interface MiniScoreRingProps {
  score: number; // Score out of 10
  size?: number;
  strokeWidth?: number;
}

export const MiniScoreRing: React.FC<MiniScoreRingProps> = ({
  score,
  size = 60,
  strokeWidth = 6,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * Math.PI;
  const cappedScore = Math.max(0, Math.min(10, score));
  const offset = circumference - (cappedScore / 10) * circumference;

  const getScoreColor = (s: number) => {
    if (s >= 9) return '#16a34a'; // green-600
    if (s >= 7) return '#ca8a04'; // yellow-600
    if (s >= 5) return '#f97316'; // orange-500
    return '#dc2626'; // red-600
  };
  
  const color = getScoreColor(cappedScore);
  const scoreText = Math.round(score);

  return (
    <div className="relative" style={{ width: size, height: size / 2 + 4 }}>
      <svg
        width={size}
        height={size / 2 + strokeWidth / 2}
        viewBox={`0 0 ${size} ${size / 2 + strokeWidth / 2}`}
        className="absolute top-0 left-0"
      >
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke="#e5e7eb" // gray-200
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.5s ease-out',
          }}
        />
      </svg>
      <div
        className="absolute w-full text-center flex items-baseline justify-center"
        style={{ color, top: '40%', transform: 'translateY(-50%)' }}
      >
        <span className="font-bold text-base leading-none">{scoreText}</span>
        <span className="text-xs font-semibold leading-none">/10</span>
      </div>
    </div>
  );
};
