import React from 'react';

interface TrophyIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export const TrophyIcon: React.FC<TrophyIconProps> = ({ className, ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M8 21h8"></path>
      <path d="M12 17v4"></path>
      <path d="M8 2H4v4c0 3.5 2 6 6 6h.5"></path>
      <path d="M16 2h4v4c0 3.5-2 6-6 6h-.5"></path>
      <path d="M12 2v8"></path>
      <path d="M12 2v8"></path>
      <path d="M12 2c-1.5 0-3 .5-3 2-2 0-4 .5-4 2"></path>
      <path d="M12 2c1.5 0 3 .5 3 2 2 0 4 .5 4 2"></path>
    </svg>
  );
};