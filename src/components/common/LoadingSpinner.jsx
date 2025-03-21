// src/components/common/LoadingSpinner.jsx
import React from 'react';

const LoadingSpinner = ({ size = 'md', text = 'Loading...', center = false, light = false }) => {
  // Size classes
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
    xl: 'h-16 w-16 border-4'
  };
  
  // Color classes
  const colorClasses = light ? 'border-white border-t-transparent' : 'border-indigo-500 border-t-transparent';
  
  return (
    <div className={`${center ? 'flex flex-col items-center justify-center' : ''}`}>
      <div 
        className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses}`}
        role="status"
        aria-label="loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
      {text && (
        <p className={`mt-2 text-sm ${light ? 'text-white' : 'text-gray-700'}`}>{text}</p>
      )}
    </div>
  );
};

// Component to display when content is loading
export const LoadingState = ({ text = 'Loading data...', fullHeight = false }) => (
  <div className={`w-full flex items-center justify-center ${fullHeight ? 'h-full min-h-[300px]' : 'py-12'}`}>
    <LoadingSpinner size="md" text={text} center={true} />
  </div>
);

// Component to display when transaction is pending
export const TransactionPending = ({ text = 'Transaction pending...' }) => (
  <div className="bg-indigo-100 p-4 rounded-lg shadow-sm text-center">
    <LoadingSpinner size="md" text={text} center={true} />
    <p className="mt-2 text-sm text-indigo-700">Please wait for confirmation in your wallet</p>
  </div>
);

export default LoadingSpinner;