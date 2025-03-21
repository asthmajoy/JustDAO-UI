import React from 'react';
import JustDAODashboard from './components/JustDAODashboard';
import { useWeb3 } from './contexts/Web3Context';
import { useAuth } from './contexts/AuthContext';

function App() {
  const { isConnected, connectWallet } = useWeb3();
  const { user } = useAuth();

  return (
    <div className="App">
      {!isConnected ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full p-6">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-indigo-600">JustDAO</h1>
              <p className="mt-2 text-gray-600">Connect your wallet to access the DAO dashboard</p>
            </div>
            <button
              onClick={connectWallet}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition duration-150"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      ) : (
        <JustDAODashboard />
      )}
    </div>
  );
}

export default App;