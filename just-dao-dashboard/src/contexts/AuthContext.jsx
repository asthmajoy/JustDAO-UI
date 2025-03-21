import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from './Web3Context';
import { ROLES } from '../utils/constants';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const { isConnected, account, contracts } = useWeb3();
  const [user, setUser] = useState({
    address: '',
    roles: ['user'],
    balance: 0,
    votingPower: 0,
    delegate: '',
    lockedTokens: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserData() {
      if (isConnected && account && contracts.token && contracts.governance) {
        try {
          setLoading(true);
          
          // Get token balance
          const balance = await contracts.token.balanceOf(account);
          
          // Get current snapshot ID
          const snapshotId = await contracts.token.getCurrentSnapshotId();
          
          // Get voting power
          const votingPower = await contracts.token.getEffectiveVotingPower(account, snapshotId);
          
          // Get delegation info
          const delegate = await contracts.token.getDelegate(account);
          const lockedTokens = await contracts.token.getLockedTokens(account);
          
          // Check roles
          const roles = ['user'];
          
          // Check for admin role
          const isAdmin = await contracts.governance.hasRole(
            ethers.utils.keccak256(ethers.utils.toUtf8Bytes(ROLES.ADMIN_ROLE)), 
            account
          );
          if (isAdmin) roles.push('admin');
          
          // Check for analytics role
          const isAnalytics = await contracts.governance.hasRole(
            ethers.utils.keccak256(ethers.utils.toUtf8Bytes(ROLES.ANALYTICS_ROLE)), 
            account
          );
          if (isAnalytics) roles.push('analytics');
          
          // Update user state
          setUser({
            address: account,
            roles,
            balance: ethers.utils.formatEther(balance),
            votingPower: ethers.utils.formatEther(votingPower),
            delegate,
            lockedTokens: ethers.utils.formatEther(lockedTokens)
          });
          
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setLoading(false);
        }
      }
    }
    
    fetchUserData();
  }, [isConnected, account, contracts]);

  const hasRole = (role) => {
    return user.roles.includes(role);
  };

  const value = {
    user,
    loading,
    hasRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}