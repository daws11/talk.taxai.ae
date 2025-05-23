import React from 'react';

interface SubtitleDisplayProps {
  text: string;
  isActive: boolean;
}

const SubtitleDisplay: React.FC<SubtitleDisplayProps> = ({ text, isActive }) => {
  if (!isActive) return null;

  return (
    <div className="w-full max-w-2xl mx-auto mt-4 p-4 rounded-lg bg-gray-900/50 backdrop-blur-sm">
      <div className="text-center">
        <p className="text-lg text-white font-medium">
          {text || 'Listening...'}
        </p>
      </div>
    </div>
  );
};

export default SubtitleDisplay; 