// src/components/layout/Navbar.jsx
import React, { useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { WalletContext } from '../../context/WalletContext';
import { NETWORKS, EXPECTED_NETWORK_ID } from '../../config/constants';
import { AlertTriangleIcon } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const { 
    account, 
    isConnecting, 
    connectWallet, 
    disconnectWallet, 
    formatAddress,
    network,
    isCorrectNetwork,
    switchNetwork
  } = useContext(WalletContext);

  // Generate page title based on current route
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard';
      case '/token':
        return 'Token Management';
      case '/governance':
        return 'Governance';
      case '/timelock':
        return 'Timelock Management';
      case '/dao-helper':
        return 'DAO Helper';
      case '/analytics':
        return 'Analytics';
      default:
        if (location.pathname.startsWith('/governance/proposal/')) {
          return 'Proposal Details';
        }
        return 'Just DAO Governance';
    }
  };

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-800">{getPageTitle()}</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Network Status */}
            {account && network && (
              <div className={`px-3 py-1 rounded-full text-sm ${
                isCorrectNetwork 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {isCorrectNetwork ? (
                  <span>Connected to {NETWORKS[EXPECTED_NETWORK_ID]?.name || 'Unknown Network'}</span>
                ) : (
                  <div className="flex items-center">
                    <AlertTriangleIcon size={16} className="mr-1" />
                    <span>Wrong Network</span>
                    <button 
                      onClick={switchNetwork}
                      className="ml-2 underline font-medium"
                    >
                      Switch
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Wallet Connection Button */}
            {!account ? (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                  {formatAddress(account)}
                </span>
                <button
                  onClick={disconnectWallet}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;