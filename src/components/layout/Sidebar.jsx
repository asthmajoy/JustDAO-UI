// src/components/layout/Sidebar.jsx
import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  HomeIcon, 
  CoinsIcon, 
  VoteIcon, 
  ClockIcon, 
  HelpCircleIcon, 
  BarChartIcon 
} from 'lucide-react';
import { RoleContext } from '../../context/RoleContext';

const Sidebar = () => {
  const { isAdmin, isGuardian, isProposer, isExecutor, isAnalytics, hasRequiredRole } = useContext(RoleContext);

  // Define navigation items with role requirements
  const navItems = [
    { 
      name: 'Dashboard', 
      path: '/', 
      icon: <HomeIcon size={20} />, 
      roles: [] // Everyone can access
    },
    { 
      name: 'Token Management', 
      path: '/token', 
      icon: <CoinsIcon size={20} />, 
      roles: [] // Everyone can access
    },
    { 
      name: 'Governance', 
      path: '/governance', 
      icon: <VoteIcon size={20} />, 
      roles: [] // Everyone can access, but some features will be restricted
    },
    { 
      name: 'Timelock', 
      path: '/timelock', 
      icon: <ClockIcon size={20} />, 
      roles: ['admin', 'proposer', 'executor', 'guardian'] 
    },
    { 
      name: 'DAO Helper', 
      path: '/dao-helper', 
      icon: <HelpCircleIcon size={20} />, 
      roles: [] // Everyone can access
    },
    { 
      name: 'Analytics', 
      path: '/analytics', 
      icon: <BarChartIcon size={20} />, 
      roles: ['admin', 'analytics'] 
    }
  ];

  const activeClassName = "bg-indigo-800 text-white";
  const inactiveClassName = "text-gray-300 hover:bg-indigo-700 hover:text-white";

  return (
    <div className="h-full flex flex-col w-64 bg-indigo-900 text-white">
      <div className="p-5 border-b border-indigo-800">
        <h1 className="text-xl font-bold">Just DAO Governance</h1>
      </div>
      
      <div className="flex-grow overflow-y-auto">
        <nav className="mt-5 px-2">
          <ul className="space-y-2">
            {navItems.map((item) => (
              // Check if user has required role to display nav item
              (!item.roles.length || hasRequiredRole(item.roles)) && (
                <li key={item.name}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => 
                      `flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                        isActive ? activeClassName : inactiveClassName
                      }`
                    }
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.name}
                  </NavLink>
                </li>
              )
            ))}
          </ul>
        </nav>
      </div>
      
      {/* Role display at bottom of sidebar */}
      <div className="p-4 border-t border-indigo-800 text-xs">
        <p className="text-gray-400 mb-1">Your Roles:</p>
        <div className="flex flex-wrap gap-1 mt-1">
          {isAdmin && <span className="px-2 py-1 bg-red-600 rounded-md text-white">Admin</span>}
          {isGuardian && <span className="px-2 py-1 bg-yellow-600 rounded-md text-white">Guardian</span>}
          {isProposer && <span className="px-2 py-1 bg-green-600 rounded-md text-white">Proposer</span>}
          {isExecutor && <span className="px-2 py-1 bg-blue-600 rounded-md text-white">Executor</span>}
          {isAnalytics && <span className="px-2 py-1 bg-purple-600 rounded-md text-white">Analytics</span>}
          
          {!isAdmin && !isGuardian && !isProposer && !isExecutor && !isAnalytics && (
            <span className="px-2 py-1 bg-gray-600 rounded-md text-white">Voter</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;