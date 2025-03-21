// src/pages/TokenManagement.jsx
import React, { useContext } from 'react';
import { WalletContext } from '../context/WalletContext';
import TokenBalance from '../components/token/TokenBalance';
import DelegationManager from '../components/token/DelegationManager';
import TransferTokens from '../components/token/TransferTokens';
import TokenSnapshot from '../components/token/TokenSnapshot';
import WalletConnect from '../components/common/WalletConnect';
import NetworkStatus from '../components/common/NetworkStatus';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TokenManagement = () => {
  const { account } = useContext(WalletContext);

  if (!account) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Token Management</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <WalletConnect />
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">About JUST Tokens</h2>
            <p className="text-gray-600 mb-4">
              JUST tokens are the governance token of the Just DAO. They allow holders to:
            </p>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li>Vote on governance proposals</li>
              <li>Delegate voting power to other addresses</li>
              <li>Create proposals (if you meet the threshold requirements)</li>
              <li>Participate in the decision-making process of the DAO</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Token Management</h1>
      
      {/* Network Status */}
      <div className="mb-6">
        <NetworkStatus />
      </div>
      
      <div className="space-y-6">
        {/* Token Balance Card */}
        <TokenBalance />
        
        {/* Tabs for Token Operations */}
        <Tabs defaultValue="transfer">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="transfer">Transfer Tokens</TabsTrigger>
            <TabsTrigger value="delegation">Delegation</TabsTrigger>
            <TabsTrigger value="snapshots">Snapshots</TabsTrigger>
          </TabsList>
          
          <TabsContent value="transfer" className="mt-4">
            <TransferTokens />
          </TabsContent>
          
          <TabsContent value="delegation" className="mt-4">
            <DelegationManager />
          </TabsContent>
          
          <TabsContent value="snapshots" className="mt-4">
            <TokenSnapshot />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TokenManagement;