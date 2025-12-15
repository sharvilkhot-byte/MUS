
import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <img
        src="https://lh3.googleusercontent.com/d/1DjGsygk4GbxiqfDHqBnFCoqgWSfRDk89"
        alt="myuxscore logo"
        className="h-10 w-auto"
      />
    </div>
  );
};
