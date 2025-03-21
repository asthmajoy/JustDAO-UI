// src/pages/Unauthorized.jsx
import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldOffIcon, 
  AlertTriangleIcon, 
  HomeIcon,
  ArrowLeftIcon
} from 'lucide-react';

import { WalletContext } from '../context/WalletContext';
import { RoleContext } from '../context/RoleContext';

const Unauthorized = () => {
  const { account } = useContext(WalletContext);
  const { getUserRolesList } = useContext(RoleContext);
  const navigate = useNavigate();
  
  // Get user roles if account is connected
  const userRoles = account ? getUserRolesList() : [];
  
  const goBack = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-100">
            <ShieldOffIcon className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Access Denied
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-start mb-4">
            <div className="flex-shrink-0">
              <AlertTriangleIcon className="h-6 w-6 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Authorization Required
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  This page requires specific role permissions that your account doesn't have.
                </p>
              </div>
            </div>
          </div>
          
          {account && (
            <div className="mt-4 border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Your Current Roles:</h4>
              {userRoles.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {userRoles.map((role, index) => (
                    <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {role}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">You don't have any special roles assigned.</p>
              )}
            </div>
          )}
          
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={goBack}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Go Back
            </button>
            
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <HomeIcon className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;