// src/components/common/StatusBadge.jsx
import React from 'react';
import { 
  CheckIcon, 
  XIcon, 
  AlertCircleIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ThumbsUpIcon,
  TimerIcon
} from 'lucide-react';
import { PROPOSAL_STATES, THREAT_LEVELS } from '../../config/constants';

// Get color classes for proposal states
const getProposalStateClasses = (state) => {
  switch (state) {
    case 0: // Active
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        icon: <ClockIcon size={16} className="text-blue-600" />,
        label: PROPOSAL_STATES[0]
      };
    case 1: // Canceled
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        icon: <XCircleIcon size={16} className="text-gray-600" />,
        label: PROPOSAL_STATES[1]
      };
    case 2: // Defeated
      return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: <XIcon size={16} className="text-red-600" />,
        label: PROPOSAL_STATES[2]
      };
    case 3: // Succeeded
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: <ThumbsUpIcon size={16} className="text-green-600" />,
        label: PROPOSAL_STATES[3]
      };
    case 4: // Queued
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: <TimerIcon size={16} className="text-yellow-600" />,
        label: PROPOSAL_STATES[4]
      };
    case 5: // Executed
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: <CheckIcon size={16} className="text-green-600" />,
        label: PROPOSAL_STATES[5]
      };
    case 6: // Expired
      return {
        bg: 'bg-purple-100',
        text: 'text-purple-800',
        icon: <AlertCircleIcon size={16} className="text-purple-600" />,
        label: PROPOSAL_STATES[6]
      };
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        icon: <AlertCircleIcon size={16} className="text-gray-600" />,
        label: 'Unknown'
      };
  }
};

// Get color classes for threat levels
const getThreatLevelClasses = (level) => {
  switch (level) {
    case 0: // Low
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: <CheckCircleIcon size={16} className="text-green-600" />,
        label: THREAT_LEVELS[0]
      };
    case 1: // Medium
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: <AlertCircleIcon size={16} className="text-yellow-600" />,
        label: THREAT_LEVELS[1]
      };
    case 2: // High
      return {
        bg: 'bg-orange-100',
        text: 'text-orange-800',
        icon: <AlertCircleIcon size={16} className="text-orange-600" />,
        label: THREAT_LEVELS[2]
      };
    case 3: // Critical
      return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: <AlertCircleIcon size={16} className="text-red-600" />,
        label: THREAT_LEVELS[3]
      };
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        icon: <AlertCircleIcon size={16} className="text-gray-600" />,
        label: 'Unknown'
      };
  }
};

// Status badge for proposal states
export const ProposalStateBadge = ({ state }) => {
  const { bg, text, icon, label } = getProposalStateClasses(state);
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      <span className="mr-1">{icon}</span>
      {label}
    </span>
  );
};

// Status badge for threat levels
export const ThreatLevelBadge = ({ level }) => {
  const { bg, text, icon, label } = getThreatLevelClasses(level);
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      <span className="mr-1">{icon}</span>
      {label}
    </span>
  );
};

// Generic status badge
const StatusBadge = ({ status, variant, icon, customClasses }) => {
  // Predefined variants
  const variants = {
    success: 'bg-green-100 text-green-800',
    danger: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-blue-100 text-blue-800',
    default: 'bg-gray-100 text-gray-800'
  };
  
  // Default variant
  const variantClass = variants[variant] || variants.default;
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${customClasses || variantClass}`}>
      {icon && <span className="mr-1">{icon}</span>}
      {status}
    </span>
  );
};

export default StatusBadge;