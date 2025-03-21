// src/components/dashboard/QuickActions.jsx
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusIcon, 
  VoteIcon, 
  CoinsIcon, 
  UserIcon,
  ArrowRightIcon,
  ClockIcon
} from 'lucide-react';

import { RoleContext } from '../../context/RoleContext';
import { WalletContext } from '../../context/WalletContext';
import { ContractsContext } from '../../context/ContractsContext';

import DashboardCard from '../common/DashboardCard';

const QuickActions = () => {
  const { isProposer, isAdmin, isExecutor, isAnalytics, hasRequiredRole } = useContext(RoleContext);
  const { isCorrectNetwork } = useContext(WalletContext);
  const { tokenContract } = useContext(ContractsContext);

  // Define action links based on user roles
  const getActionLinks = () => {
    const links = [
      {
        title: "View Your Tokens",
        description: "Check your token balance and delegation status",
        icon: <CoinsIcon size={20} />,
        link: "/token",
        roles: []
      },
      {
        title: "Recent Proposals",
        description: "Browse and vote on active proposals",
        icon: <VoteIcon size={20} />,
        link: "/governance",
        roles: []
      }
    ];
    
    // Only show proposal creation if user has proposer role or is admin
    if (isProposer || isAdmin) {
      links.push({
        title: "Create Proposal",
        description: "Submit a new governance proposal",
        icon: <PlusIcon size={20} />,
        link: "/governance/create",
        roles: ["proposer", "admin"]
      });
    }
    
    // Show timelock actions for executors
    if (isExecutor || isAdmin) {
      links.push({
        title: "Timelock Management",
        description: "Queue and execute timelock transactions",
        icon: <ClockIcon size={20} />,
        link: "/timelock",
        roles: ["executor", "admin"]
      });
    }
    
    // Show analytics for analytics role
    if (isAnalytics || isAdmin) {
      links.push({
        title: "Analytics Dashboard",
        description: "View detailed DAO metrics and analytics",
        icon: <BarChartIcon size={20} />,
        link: "/analytics",
        roles: ["analytics", "admin"]
      });
    }
    
    return links;
  };

  const actionLinks = getActionLinks();

  return (
    <DashboardCard
      title="Quick Actions"
      icon={<LightningBoltIcon size={24} />}
    >
      {!isCorrectNetwork && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
          <p className="text-sm text-amber-700">
            Please connect to the correct network to use these features.
          </p>
        </div>
      )}
      
      <div className="space-y-3">
        {actionLinks.map((action, index) => (
          <Link 
            key={index}
            to={action.link}
            className="block p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors duration-150"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center">
                  {action.icon}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{action.title}</h4>
                  <p className="text-xs text-gray-500">{action.description}</p>
                </div>
              </div>
              <ArrowRightIcon size={16} className="text-gray-400" />
            </div>
          </Link>
        ))}
      </div>
    </DashboardCard>
  );
};

// Lightning Bolt Icon since it's not available in lucide-react directly
const LightningBoltIcon = ({ size, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
  </svg>
);

export default QuickActions;