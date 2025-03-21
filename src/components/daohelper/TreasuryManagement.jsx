// src/components/daohelper/TreasuryManagement.jsx
import React, { useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';
import { 
  BriefcaseIcon, 
  CoinsIcon, 
  WalletIcon,
  ArrowUpRightIcon,
  SendIcon
} from 'lucide-react';

import { WalletContext } from '../../context/WalletContext';
import { ContractsContext } from '../../context/ContractsContext';
import { RoleContext } from '../../context/RoleContext';
import { NotificationContext } from '../../context/NotificationContext';

import DashboardCard from '../common/DashboardCard';
import { LoadingState, TransactionPending } from '../common/LoadingSpinner';

const TreasuryManagement = () => {
  const { account, provider } = useContext(WalletContext);
  const { governanceContract, tokenContract } = useContext(ContractsContext);
  const { isAdmin } = useContext(RoleContext);
  const { getExplorerLink } = useContext(NotificationContext);
  
  const [loading, setLoading] = useState(true);
  const [treasuryAssets, setTreasuryAssets] = useState({
    ethBalance: null,
    tokenBalance: null,
    otherTokens: []
  });
  
  const [recentTransactions, setRecentTransactions] = useState([]);

  // Fetch treasury data
  useEffect(() => {
    const fetchTreasuryData = async () => {
      if (!governanceContract || !tokenContract || !provider) return;
      
      try {
        setLoading(true);
        
        // Get governance contract ETH balance
        const ethBalance = await provider.getBalance(governanceContract.address);
        
        // Get governance contract token balance
        const tokenBalance = await tokenContract.balanceOf(governanceContract.address);
        
        // For demo purposes, we'll add some sample data for other tokens
        // In a real app, you'd scan for ERC20 tokens or use a subgraph
        const otherTokens = [
          {
            symbol: 'DAI',
            name: 'Dai Stablecoin',
            balance: ethers.parseEther('10000'),
            address: '0x6B175474E89094C44Da98b954EedeAC495271d0F'
          },
          {
            symbol: 'USDC',
            name: 'USD Coin',
            balance: ethers.parseUnits('15000', 6),
            address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
          }
        ];
        
        // Set treasury assets
        setTreasuryAssets({
          ethBalance,
          tokenBalance,
          otherTokens
        });
        
        // Create sample recent transactions for demo
        // In a real app, you'd fetch these from events or a subgraph
        const sampleTransactions = [
          {
            hash: ethers.keccak256(ethers.toUtf8Bytes("tx1")),
            type: 'Withdrawal',
            amount: ethers.parseEther('1.5'),
            token: 'ETH',
            timestamp: Date.now() - 86400000, // 1 day ago
            recipient: '0x1234567890123456789012345678901234567890'
          },
          {
            hash: ethers.keccak256(ethers.toUtf8Bytes("tx2")),
            type: 'TokenTransfer',
            amount: ethers.parseEther('1000'),
            token: 'JUST',
            timestamp: Date.now() - 172800000, // 2 days ago
            recipient: '0x2345678901234567890123456789012345678901'
          },
          {
            hash: ethers.keccak256(ethers.toUtf8Bytes("tx3")),
            type: 'ExternalERC20Transfer',
            amount: ethers.parseUnits('5000', 6),
            token: 'USDC',
            timestamp: Date.now() - 345600000, // 4 days ago
            recipient: '0x3456789012345678901234567890123456789012'
          }
        ];
        
        setRecentTransactions(sampleTransactions);
      } catch (error) {
        console.error("Error fetching treasury data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTreasuryData();
  }, [governanceContract, tokenContract, provider]);

  // Format amount for display
  const formatAmount = (amount, decimals = 18) => {
    const formatted = ethers.formatUnits(amount, decimals);
    return parseFloat(formatted).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  // Format address for display
  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Get time elapsed since a timestamp
  const getTimeElapsed = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    // Convert to appropriate time unit
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return <LoadingState text="Loading treasury data..." />;
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Treasury Management</h2>
      
      {/* Treasury Balance Overview */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <DashboardCard
          title="ETH Balance"
          value={treasuryAssets.ethBalance ? `${formatAmount(treasuryAssets.ethBalance)} ETH` : "Loading..."}
          icon={<CoinsIcon size={20} />}
        />
        
        <DashboardCard
          title="JUST Token Balance"
          value={treasuryAssets.tokenBalance ? `${formatAmount(treasuryAssets.tokenBalance)} JUST` : "Loading..."}
          icon={<CoinsIcon size={20} />}
        />
        
        <DashboardCard
          title="Total Assets"
          value={treasuryAssets.ethBalance ? `${treasuryAssets.otherTokens.length + 2} Tokens` : "Loading..."}
          icon={<BriefcaseIcon size={20} />}
        />
      </div>
      
      {/* All Treasury Assets */}
      <div className="mb-6">
        <DashboardCard
          title="Treasury Assets"
          icon={<BriefcaseIcon size={24} />}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Token
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  {isAdmin && (
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* ETH */}
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <CoinsIcon size={16} />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          Ethereum (ETH)
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatAmount(treasuryAssets.ethBalance)} ETH</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-mono">
                      {formatAddress(governanceContract.address)}
                    </div>
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        className="text-indigo-600 hover:text-indigo-900"
                        onClick={() => {/* Would open withdrawal proposal form */}}
                      >
                        Propose Withdrawal
                      </button>
                    </td>
                  )}
                </tr>
                
                {/* JUST Token */}
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <CoinsIcon size={16} className="text-indigo-500" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          Just Token (JUST)
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatAmount(treasuryAssets.tokenBalance)} JUST</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-mono">
                      {formatAddress(tokenContract.address)}
                    </div>
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        className="text-indigo-600 hover:text-indigo-900"
                        onClick={() => {/* Would open transfer proposal form */}}
                      >
                        Propose Transfer
                      </button>
                    </td>
                  )}
                </tr>
                
                {/* Other Tokens */}
                {treasuryAssets.otherTokens.map((token, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <CoinsIcon size={16} className="text-blue-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {token.name} ({token.symbol})
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {token.symbol === 'USDC' 
                          ? formatAmount(token.balance, 6) 
                          : formatAmount(token.balance)} {token.symbol}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-mono">
                        {formatAddress(token.address)}
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          className="text-indigo-600 hover:text-indigo-900"
                          onClick={() => {/* Would open transfer proposal form */}}
                        >
                          Propose Transfer
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardCard>
      </div>
      
      {/* Recent Treasury Transactions */}
      <div className="mb-6">
        <DashboardCard
          title="Recent Treasury Transactions"
          icon={<SendIcon size={24} />}
        >
          {recentTransactions.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500">No recent transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asset
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recipient
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      View
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentTransactions.map((tx, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{tx.type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{tx.token}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {tx.token === 'USDC' 
                            ? formatAmount(tx.amount, 6) 
                            : formatAmount(tx.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-900">{formatAddress(tx.recipient)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{getTimeElapsed(tx.timestamp)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <a
                          href={getExplorerLink('tx', tx.hash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-900 flex items-center"
                        >
                          View
                          <ArrowUpRightIcon size={14} className="ml-1" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DashboardCard>
      </div>
    </div>
  );
};

export default TreasuryManagement;