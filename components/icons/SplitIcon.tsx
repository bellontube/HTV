
import React from 'react';

export const SplitIcon: React.FC<{ className?: string }> = ({ className = "h-6 w-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121M12 12L4 4m8 8l5 5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12H12m0 0h7.5" />
    </svg>
);
