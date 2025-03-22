import React, { useState, useEffect } from 'react';
import { formatAddress } from '../utils/formatters';
import Loader from './Loader';

const DelegationTab = ({ user, delegation }) => {
  const [delegateAddress, setDelegateAddress] = useState('');
  const { delegationInfo, loading, delegate, resetDelegation, getDelegationDepthWarning } = delegation;

  const handleDelegate = async () => {
    if (!delegateAddress) return;
    
    // Prevent self-delegation via the form - should use reset instead
    if (delegateAddress.toLowerCase() === user.address.toLowerCase()) {
      return handleResetDelegation();
    }
    
    try {
      // Check for potential delegation depth issues
      const warning = await getDelegationDepthWarning(user.address, delegateAddress);
      
      if (warning.warningLevel === 3) {
        alert("This delegation would exceed the maximum delegation depth limit or create a cycle");
        return;
      } else if (warning.warningLevel > 0) {
        const proceed = window.confirm(warning.message + ". Do you want to proceed?");
        if (!proceed) return;
      }
      
      await delegate(delegateAddress);
      setDelegateAddress('');
    } catch (error) {
      console.error("Error delegating:", error);
      alert("Error delegating. See console for details.");
    }
  };

  const handleResetDelegation = async () => {
    try {
      await resetDelegation();
      setDelegateAddress('');
    } catch (error) {
      console.error("Error resetting delegation:", error);
      alert("Error resetting delegation. See console for details.");
    }
  };

  // Determine if the user has delegated away their voting power
  const hasDelegatedAway = delegationInfo.currentDelegate && 
                          delegationInfo.currentDelegate !== user.address && 
                          delegationInfo.currentDelegate !== '0x0000000000000000000000000000000000000000';

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Delegation</h2>
        <p className="text-gray-500">Manage your voting power delegation</p>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader size="large" text="Loading delegation data..." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Your delegation status */}
          <div className="bg-white p-6 rounded-lg shadow md:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Your Delegation Status</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Current Delegate</p>
                <p className="font-medium">
                  {hasDelegatedAway ? 
                    formatAddress(delegationInfo.currentDelegate) : 
                    'Self (not delegated)'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Locked Tokens</p>
                <p className="font-medium">{hasDelegatedAway ? user.balance : "0"} JUST</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Your Balance</p>
                <p className="font-medium">{user.balance} JUST</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Your Voting Power</p>
                <p className="font-medium">{hasDelegatedAway ? "0.0" : user.votingPower} JUST</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delegate To</label>
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    className="flex-1 rounded-md border border-gray-300 p-2" 
                    placeholder="Enter delegate address" 
                    value={delegateAddress}
                    onChange={(e) => setDelegateAddress(e.target.value)}
                  />
                  <button 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
                    onClick={handleDelegate}
                    disabled={!user.balance || parseFloat(user.balance) === 0}
                  >
                    Delegate
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Delegating locks your tokens but allows you to maintain ownership while transferring voting power.
                </p>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                {hasDelegatedAway && (
                  <button 
                    className="w-full bg-red-100 text-red-700 hover:bg-red-200 py-2 rounded-md"
                    onClick={handleResetDelegation}
                  >
                    Reset Delegation (Self-Delegate)
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Delegated to you */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delegated to You</h3>
            
            <div className="text-center py-4">
              <p className="text-3xl font-bold text-indigo-600">{delegationInfo.delegatedToYou}</p>
              <p className="text-sm text-gray-500">JUST tokens</p>
            </div>
            
            <p className="text-sm text-gray-700 mb-4">
              You have {delegationInfo.delegatedToYou} JUST tokens delegated to your address from other token holders.
            </p>
            
            {delegationInfo.delegators && delegationInfo.delegators.length > 0 ? (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Your Delegators:</h4>
                {delegationInfo.delegators.map((delegator, idx) => (
                  <div key={idx} className="text-sm flex justify-between items-center border-t pt-2">
                    <span>{formatAddress(delegator.address)}</span>
                    <span className="font-medium">{delegator.balance} JUST</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No delegators yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


export default DelegationTab;