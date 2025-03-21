// src/components/common/WalletConnect.jsx
import React, { useContext } from 'react';
import { WalletContext } from '../../context/WalletContext';
import { ContractsContext } from '../../context/ContractsContext';
import { ethers } from 'ethers';

const WalletConnect = () => {
  const { 
    account, 
    connectWallet, 
    disconnectWallet, 
    isConnecting, 
    error, 
    formatAddress,
    isCorrectNetwork,
    switchNetwork
  } = useContext(WalletContext);
  
  const { tokenContract } = useContext(ContractsContext);
  const [balance, setBalance] = React.useState('0');
  
  // Fetch token balance when account or contract changes
  React.useEffect(() => {
    const getBalance = async () => {
      if (account && tokenContract) {
        try {
          const balance = await tokenContract.balanceOf(account);
          setBalance(ethers.formatEther(balance));
        } catch (err) {
          console.error("Error fetching balance:", err);
          setBalance('Error');
        }
      } else {
        setBalance('0');
      }
    };
    
    getBalance();
    
    // Set up polling for balance updates
    const interval = setInterval(getBalance, 15000); // Check every 15 seconds
    
    return () => clearInterval(interval);
  }, [account, tokenContract]);

  if (!account) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Connect Your Wallet</h2>
        <p className="text-gray-600 mb-4">
          Please connect your Ethereum wallet to interact with the DAO governance system.
        </p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Wallet Connected</h2>
        <button
          onClick={disconnectWallet}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Disconnect
        </button>
      </div>
      
      <div className="border-t border-gray-200 pt-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Address:</span>
          <span className="font-mono text-sm bg-gray-100 p-1 rounded">
            {formatAddress(account)}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Token Balance:</span>
          <span className="font-mono text-sm">{parseFloat(balance).toFixed(4)} JUST</span>
        </div>
        
        {!isCorrectNetwork && (
          <div className="mt-4 p-3 bg-yellow-100 text-yellow-700 rounded-md">
            <p className="text-sm font-medium">You are on the wrong network.</p>
            <button
              onClick={switchNetwork}
              className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Switch to Sepolia Testnet
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletConnect;