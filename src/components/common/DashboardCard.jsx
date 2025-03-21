// src/components/common/DashboardCard.jsx
import React from 'react';
import { ArrowRightIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';

const DashboardCard = ({ 
  title, 
  value, 
  description, 
  icon,
  footer,
  loading = false,
  error = null,
  link = null,
  linkText = 'View Details',
  className = '',
  children
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm overflow-hidden ${className}`}>
      {/* Card Header */}
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <div className="flex items-center">
          {icon && (
            <div className="flex-shrink-0 mr-3 text-indigo-500">
              {icon}
            </div>
          )}
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        </div>
      </div>
      
      {/* Card Content */}
      <div className="px-4 py-5 sm:p-6">
        {loading ? (
          <div className="flex justify-center py-4">
            <LoadingSpinner size="md" text="Loading..." />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-800 rounded-md">
            <p className="text-sm font-medium">Error: {error}</p>
          </div>
        ) : (
          <>
            {value && (
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {value}
              </div>
            )}
            
            {description && (
              <p className="mt-1 text-sm text-gray-500">
                {description}
              </p>
            )}
            
            {children}
          </>
        )}
      </div>
      
      {/* Card Footer */}
      {(footer || link) && (
        <div className="px-4 py-4 sm:px-6 bg-gray-50 border-t border-gray-200">
          {footer ? (
            footer
          ) : link ? (
            <Link 
              to={link} 
              className="flex items-center text-sm text-indigo-600 hover:text-indigo-500"
            >
              {linkText}
              <ArrowRightIcon size={16} className="ml-1" />
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
};

// Variant for statistics display
export const StatCard = ({ title, value, change, loading, error, icon }) => {
  // Determine if change is positive, negative, or neutral
  const getChangeColor = () => {
    if (!change || change === 0) return 'text-gray-500';
    return change > 0 ? 'text-green-500' : 'text-red-500';
  };

  // Format change with + or - sign
  const formatChange = () => {
    if (!change || change === 0) return '0%';
    const sign = change > 0 ? '+' : '';
    return `${sign}${change}%`;
  };

  return (
    <DashboardCard
      title={title}
      loading={loading}
      error={error}
      icon={icon}
    >
      <div className="flex items-baseline">
        <div className="text-3xl font-bold text-gray-900">
          {value}
        </div>
        
        {change !== undefined && (
          <div className={`ml-2 text-sm font-medium ${getChangeColor()}`}>
            {formatChange()}
          </div>
        )}
      </div>
    </DashboardCard>
  );
};

export default DashboardCard;