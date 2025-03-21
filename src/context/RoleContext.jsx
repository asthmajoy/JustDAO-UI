// src/context/RoleContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { ContractsContext } from './ContractsContext';
import { WalletContext } from './WalletContext';
import { ROLES } from '../config/constants';

// Create context
export const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
  const { account } = useContext(WalletContext);
  const { tokenContract, governanceContract, timelockContract, daoHelperContract, analyticsHelperContract } = useContext(ContractsContext);
  
  // User roles state
  const [userRoles, setUserRoles] = useState({
    isAdmin: false,
    isGuardian: false,
    isProposer: false,
    isExecutor: false,
    isAnalytics: false,
    isGovernance: false,
    isMinter: false
  });
  
  // Check all roles for the connected account
  useEffect(() => {
    const checkRoles = async () => {
      if (!account || !governanceContract || !tokenContract || !timelockContract) return;
      
      try {
        // Check governance roles
        const isAdmin = await governanceContract.hasRole(ROLES.ADMIN_ROLE, account);
        const isGuardian = await governanceContract.hasRole(ROLES.GUARDIAN_ROLE, account);
        
        // Check token roles
        const isGovernance = await tokenContract.hasRole(ROLES.GOVERNANCE_ROLE, account);
        const isMinter = await tokenContract.hasRole(ROLES.MINTER_ROLE, account);
        
        // Check timelock roles
        const isProposer = await timelockContract.hasRole(ROLES.PROPOSER_ROLE, account);
        const isExecutor = await timelockContract.hasRole(ROLES.EXECUTOR_ROLE, account);
        
        // Check analytics role if available
        let isAnalytics = false;
        if (analyticsHelperContract) {
          isAnalytics = await analyticsHelperContract.hasRole(ROLES.ANALYTICS_ROLE, account);
        }
        
        setUserRoles({
          isAdmin,
          isGuardian,
          isProposer,
          isExecutor,
          isAnalytics,
          isGovernance,
          isMinter
        });
      } catch (error) {
        console.error("Error checking roles:", error);
      }
    };
    
    checkRoles();
  }, [account, governanceContract, tokenContract, timelockContract, analyticsHelperContract]);
  
  // Function to check if user has any role
  const hasAnyRole = () => {
    return Object.values(userRoles).some(hasRole => hasRole);
  };
  
  // Function to check specifically if user has one of the required roles
  const hasRequiredRole = (requiredRoles) => {
    if (!requiredRoles || requiredRoles.length === 0) return true;
    
    return requiredRoles.some(role => {
      switch (role) {
        case 'admin': return userRoles.isAdmin;
        case 'guardian': return userRoles.isGuardian;
        case 'proposer': return userRoles.isProposer;
        case 'executor': return userRoles.isExecutor;
        case 'analytics': return userRoles.isAnalytics;
        case 'governance': return userRoles.isGovernance;
        case 'minter': return userRoles.isMinter;
        default: return false;
      }
    });
  };
  
  // Get an array of all roles the user has
  const getUserRolesList = () => {
    const roles = [];
    if (userRoles.isAdmin) roles.push('Admin');
    if (userRoles.isGuardian) roles.push('Guardian');
    if (userRoles.isProposer) roles.push('Proposer');
    if (userRoles.isExecutor) roles.push('Executor');
    if (userRoles.isAnalytics) roles.push('Analytics');
    if (userRoles.isGovernance) roles.push('Governance');
    if (userRoles.isMinter) roles.push('Minter');
    return roles;
  };
  
  // Value to be provided by the context
  const value = {
    ...userRoles,
    hasAnyRole,
    hasRequiredRole,
    getUserRolesList
  };
  
  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};

export default RoleProvider;