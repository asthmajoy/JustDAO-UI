// src/components/common/NetworkStatus.jsx
import React, { useContext } from 'react';
import { WalletContext } from '../../context/WalletContext';
import { NETWORKS, EXPECTED_NETWORK_ID } from '../../config/constants';
import { AlertTriangleIcon, CheckCircleIcon, WifiIcon, GlobeIcon } from 'lucide-react';

const NetworkStatus = () => {
  const { network, isCorrectNetwork, switchNetwork } = useContext(WalletContext);

  if (!network) {
    return (
      <div className="bg-gray-100 p-4 rounded-lg shadow-sm flex items-center space-x-3">
        <WifiIcon size={20} className="text-gray-500" />
        <div>
          <p className="text-gray-700">Not connected to any network</p>
        </div>
      </div>
    );
  }

  // Determine network name
  const networkName = NETWORKS[Number(network.chainId)]?.name || `Unknown Network (Chain ID: ${network.chainId})`;
  
  // Determine if we're on a testnet
  const isTestnet = networkName.toLowerCase().includes('test') || 
                    networkName.toLowerCase().includes('sepolia') ||
                    networkName.toLowerCase().includes('goerli') ||
                    networkName.toLowerCase().includes('rinkeby');

  return (
    <div className={`p-4 rounded-lg shadow-sm flex items-center justify-between ${
      isCorrectNetwork ? 'bg-green-50' : 'bg-red-50'
    }`}>
      <div className="flex items-center space-x-3">
        {isCorrectNetwork ? (
          <CheckCircleIcon size={20} className="text-green-500" />
        ) : (
          <AlertTriangleIcon size={20} className="text-red-500" />
        )}
        
        <div>
          <p className={`font-medium ${isCorrectNetwork ? 'text-green-800' : 'text-red-800'}`}>
            {isCorrectNetwork ? 'Connected to correct network' : 'Wrong network detected'}
          </p>
          <p className="text-sm text-gray-600 flex items-center">
            <GlobeIcon size={14} className="mr-1" />
            {networkName}
            {isTestnet && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                Testnet
              </span>
            )}
          </p>
        </div>
      </div>
      
      {!isCorrectNetwork && (
        <button
          onClick={switchNetwork}
          className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Switch to {NETWORKS[EXPECTED_NETWORK_ID]?.name}
        </button>
      )}
    </div>
  );
};

export default NetworkStatus;