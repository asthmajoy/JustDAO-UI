// src/components/layout/MainLayout.jsx
import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { WalletContext } from '../../context/WalletContext';
import { RoleContext } from '../../context/RoleContext';

// This layout will wrap all authenticated pages
const MainLayout = ({ requiresAuth = false, requiredRoles = [] }) => {
  const { account, isCorrectNetwork } = useContext(WalletContext);
  const { hasRequiredRole } = useContext(RoleContext);
  
  // If page requires authentication, redirect to login if not logged in
  if (requiresAuth && !account) {
    return <Navigate to="/" replace />;
  }
  
  // If specific roles are required, check if user has them
  if (account && requiredRoles.length > 0 && !hasRequiredRole(requiredRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        
        <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {/* Show warning if wrong network */}
          {account && !isCorrectNetwork && (
            <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    You are connected to the wrong network. Please switch to Sepolia testnet to interact with the contracts.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Main content */}
          <Outlet />
        </main>
      </div>
      
      {/* Toast notifications */}
      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
};

export default MainLayout;