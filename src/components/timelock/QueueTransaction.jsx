// src/components/timelock/QueueTransaction.jsx
import React, { useState, useContext, useEffect } from 'react';
import { ethers } from 'ethers';
import { 
  ClockIcon, 
  AlertTriangleIcon, 
  InfoIcon,
  ShieldIcon,
  CheckIcon,
  ArrowRightIcon
} from 'lucide-react';
import { WalletContext } from '../../context/WalletContext';
import { ContractsContext } from '../../context/ContractsContext';
import { RoleContext } from '../../context/RoleContext';
import { NotificationContext } from '../../context/NotificationContext';
import DashboardCard from '../common/DashboardCard';
import { TransactionPending } from '../common/LoadingSpinner';
import { THREAT_LEVELS } from '../../config/constants';

const QueueTransaction = ({ onComplete, timelockParams }) => {
  const { account } = useContext(WalletContext);
  const { timelockContract, getContract, daoHelperContract } = useContext(ContractsContext);
  const { isProposer, isAdmin } = useContext(RoleContext);
  const { addPendingTransaction, notifySuccess, notifyError, notifyWarning } = useContext(NotificationContext);
  
  // Form state
  const [target, setTarget] = useState('');
  const [value, setValue] = useState('');
  const [callData, setCallData] = useState('');
  const [customDelay, setCustomDelay] = useState('');
  const [useCustomDelay, setUseCustomDelay] = useState(false);
  const [description, setDescription] = useState('');
  
  // UI state
  const [pending, setPending] = useState(false);
  const [threatLevel, setThreatLevel] = useState(null);
  const [threatDelay, setThreatDelay] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [validatedCalldata, setValidatedCalldata] = useState(null);
  const [functionInfo, setFunctionInfo] = useState(null);
  
  // Analyze transaction risk when target or calldata changes
  useEffect(() => {
    const analyzeRisk = async () => {
      if (!daoHelperContract || !target || !ethers.isAddress(target) || !callData) return;
      
      try {
        // Reset previous analysis
        setThreatLevel(null);
        setThreatDelay(null);
        setFunctionInfo(null);
        
        // Call the DAO helper to analyze the transaction
        const [level, delay, funcSig] = await daoHelperContract.analyzeTransaction(target, callData);
        
        // Update the UI with the analysis results
        setThreatLevel(Number(level));
        setThreatDelay(Number(delay));
        
        // If we have a function signature, try to decode it for display
        if (funcSig && funcSig !== '0x') {
          try {
            // Extract the function name and parameters from the signature
            // This is a simplified approach - in production you might want a more robust parser
            const funcName = funcSig.split('(')[0];
            setFunctionInfo({
              name: funcName,
              signature: funcSig
            });
          } catch (error) {
            console.error("Error parsing function signature:", error);
          }
        }
      } catch (error) {
        console.error("Error analyzing transaction:", error);
        // If analysis fails, set to highest threat level as a precaution
        setThreatLevel(3); // Critical
        setThreatDelay(timelockParams?.maxDelay || 604800); // Default to max delay (7 days)
      }
    };
    
    analyzeRisk();
  }, [target, callData, daoHelperContract, timelockParams]);
  
  // Validate form inputs
  const validateForm = () => {
    const errors = {};
    
    if (!target) {
      errors.target = "Target address is required";
    } else if (!ethers.isAddress(target)) {
      errors.target = "Invalid Ethereum address";
    }
    
    if (!callData || callData === '0x') {
      errors.callData = "Call data is required";
    } else {
      try {
        // Validate that calldata is valid hex
        if (!callData.startsWith('0x') || !/^0x[0-9a-fA-F]*$/.test(callData)) {
          errors.callData = "Invalid hex format for calldata";
        }
      } catch (error) {
        errors.callData = "Invalid calldata";
      }
    }
    
    if (value) {
      try {
        ethers.parseEther(value);
      } catch (error) {
        errors.value = "Invalid ETH value";
      }
    }
    
    if (useCustomDelay) {
      if (!customDelay) {
        errors.customDelay = "Custom delay is required";
      } else {
        const delay = parseInt(customDelay);
        if (isNaN(delay) || delay < 0) {
          errors.customDelay = "Delay must be a positive number";
        } else if (timelockParams && (delay < timelockParams.minDelay || delay > timelockParams.maxDelay)) {
          errors.customDelay = `Delay must be between ${timelockParams.minDelay} and ${timelockParams.maxDelay} seconds`;
        }
      }
    }
    
    if (!description.trim()) {
      errors.description = "Description is required";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Format seconds to human-readable time
  const formatDelay = (seconds) => {
    if (!seconds) return "N/A";
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    
    return parts.join(', ');
  };
  
  // Handle queue transaction submission
  const handleQueueTransaction = async () => {
    if (!validateForm()) {
      notifyWarning("Please fix the form errors before submitting");
      return;
    }
    
    try {
      setPending(true);
      
      // Get contract with signer
      const timelockContractWithSigner = getContract('timelock', true);
      
      // Prepare parameters
      const valueWei = value ? ethers.parseEther(value) : 0;
      const delay = useCustomDelay ? parseInt(customDelay) : 
                  threatDelay || timelockParams?.minDelay || 0;
      
      // Queue the transaction
      const tx = await timelockContractWithSigner.queueTransaction(
        target,
        valueWei,
        callData,
        delay,
        description
      );
      
      // Track the transaction
      await addPendingTransaction(tx, "Queue timelock transaction");
      
      // Show success message
      notifySuccess("Transaction queued successfully!");
      
      // Call completion callback if provided
      if (onComplete) {
        onComplete();
      }
      
      // Reset form
      setTarget('');
      setValue('');
      setCallData('');
      setCustomDelay('');
      setUseCustomDelay(false);
      setDescription('');
      setThreatLevel(null);
      setThreatDelay(null);
      setFunctionInfo(null);
    } catch (error) {
      console.error("Error queueing transaction:", error);
      
      if (error.message.includes("caller is not a proposer")) {
        notifyError("You don't have permission to queue transactions");
      } else {
        notifyError(`Failed to queue transaction: ${error.message}`);
      }
    } finally {
      setPending(false);
    }
  };
  
  // Render the threat level icon and text
  const renderThreatLevel = () => {
    if (threatLevel === null) return null;
    
    let bgColor, textColor, icon, message;
    
    switch (threatLevel) {
      case 0: // Low
        bgColor = "bg-green-50";
        textColor = "text-green-800";
        icon = <ShieldIcon size={20} className="text-green-500 mr-2" />;
        message = "Low risk transaction";
        break;
      case 1: // Medium
        bgColor = "bg-yellow-50";
        textColor = "text-yellow-800";
        icon = <AlertTriangleIcon size={20} className="text-yellow-500 mr-2" />;
        message = "Medium risk transaction - review details carefully";
        break;
      case 2: // High
        bgColor = "bg-orange-50";
        textColor = "text-orange-800";
        icon = <AlertTriangleIcon size={20} className="text-orange-500 mr-2" />;
        message = "High risk transaction - review details carefully";
        break;
      case 3: // Critical
        bgColor = "bg-red-50";
        textColor = "text-red-800";
        icon = <AlertTriangleIcon size={20} className="text-red-500 mr-2" />;
        message = "Critical risk transaction - proceed with extreme caution";
        break;
      default:
        bgColor = "bg-gray-50";
        textColor = "text-gray-800";
        icon = <InfoIcon size={20} className="text-gray-500 mr-2" />;
        message = "Unknown risk level";
    }
    
    return (
      <div className={`flex items-start p-4 ${bgColor} ${textColor} rounded-md`}>
        <div className="flex-shrink-0">
          {icon}
        </div>
        <div>
          <h4 className="font-medium">{THREAT_LEVELS[threatLevel]} Risk Level</h4>
          <p className="mt-1 text-sm">{message}</p>
          {threatDelay && (
            <p className="mt-1 text-sm">
              Recommended delay: <span className="font-medium">{formatDelay(threatDelay)}</span>
            </p>
          )}
        </div>
      </div>
    );
  };
  
  // Render function information if available
  const renderFunctionInfo = () => {
    if (!functionInfo) return null;
    
    return (
      <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-md">
        <h4 className="font-medium flex items-center">
          <InfoIcon size={16} className="mr-2" />
          Function Information
        </h4>
        <p className="mt-1 text-sm">
          <span className="font-medium">Name:</span> {functionInfo.name}
        </p>
        <p className="mt-1 text-sm">
          <span className="font-medium">Signature:</span> {functionInfo.signature}
        </p>
      </div>
    );
  };
  
  // Check if user has permission to queue transactions
  const hasQueuePermission = isProposer || isAdmin;
  
  // Show permission warning if needed
  if (!hasQueuePermission) {
    return (
      <DashboardCard
        title="Queue Transaction"
        icon={<ClockIcon size={20} />}
      >
        <div className="mt-4 p-4 bg-red-50 text-red-800 rounded-md flex items-start">
          <AlertTriangleIcon size={20} className="mr-2 flex-shrink-0" />
          <div>
            <p className="font-medium">Permission Denied</p>
            <p className="mt-1 text-sm">
              You don't have the required permissions to queue transactions. 
              Only addresses with the Proposer or Admin role can queue transactions.
            </p>
          </div>
        </div>
      </DashboardCard>
    );
  }
  
  return (
    <DashboardCard
      title="Queue Transaction"
      icon={<ClockIcon size={20} />}
      description="Submit a transaction to the timelock for delayed execution"
    >
      {pending ? (
        <TransactionPending text="Queueing transaction..." />
      ) : (
        <div className="mt-4 space-y-4">
          {/* Target Address */}
          <div>
            <label htmlFor="target" className="block text-sm font-medium text-gray-700 mb-1">
              Target Contract Address
            </label>
            <input
              id="target"
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className={`w-full px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                formErrors.target ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="0x..."
            />
            {formErrors.target && (
              <p className="mt-1 text-sm text-red-600">{formErrors.target}</p>
            )}
          </div>
          
          {/* Call Data */}
          <div>
            <label htmlFor="callData" className="block text-sm font-medium text-gray-700 mb-1">
              Call Data (Hex)
            </label>
            <textarea
              id="callData"
              value={callData}
              onChange={(e) => setCallData(e.target.value)}
              rows={3}
              className={`w-full px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm ${
                formErrors.callData ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="0x..."
            />
            {formErrors.callData && (
              <p className="mt-1 text-sm text-red-600">{formErrors.callData}</p>
            )}
          </div>
          
          {/* Value in ETH */}
          <div>
            <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">
              Value (ETH, optional)
            </label>
            <input
              id="value"
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className={`w-full px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                formErrors.value ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="0.0"
            />
            {formErrors.value && (
              <p className="mt-1 text-sm text-red-600">{formErrors.value}</p>
            )}
          </div>
          
          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                formErrors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Brief description of this transaction"
            />
            {formErrors.description && (
              <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>
            )}
          </div>
          
          {/* Delay Time */}
          <div>
            <div className="flex items-center mb-2">
              <input
                id="useCustomDelay"
                type="checkbox"
                checked={useCustomDelay}
                onChange={(e) => setUseCustomDelay(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="useCustomDelay" className="ml-2 block text-sm font-medium text-gray-700">
                Use custom delay time
              </label>
            </div>
            
            {useCustomDelay ? (
              <div>
                <label htmlFor="customDelay" className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Delay (seconds)
                </label>
                <input
                  id="customDelay"
                  type="number"
                  value={customDelay}
                  onChange={(e) => setCustomDelay(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                    formErrors.customDelay ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={timelockParams?.minDelay || "Minimum delay in seconds"}
                  min={timelockParams?.minDelay || 0}
                  max={timelockParams?.maxDelay || 2592000} // Default max: 30 days
                />
                {formErrors.customDelay && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.customDelay}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Allowed range: {formatDelay(timelockParams?.minDelay)} to {formatDelay(timelockParams?.maxDelay)}
                </p>
              </div>
            ) : (
              <div className="flex items-center text-sm text-gray-600">
                <ClockIcon size={16} className="mr-1" />
                <span>
                  Using {threatDelay ? 'recommended' : 'default'} delay: {
                    formatDelay(threatDelay || timelockParams?.minDelay || 0)
                  }
                </span>
              </div>
            )}
          </div>
          
          {/* Transaction Risk Analysis */}
          {(target && ethers.isAddress(target) && callData) && (
            <div className="pt-2">
              {renderThreatLevel()}
              {renderFunctionInfo()}
            </div>
          )}
          
          {/* Submit Button */}
          <div className="mt-6">
            <button
              onClick={handleQueueTransaction}
              disabled={pending}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ArrowRightIcon size={16} className="mr-2" />
              Queue Transaction
            </button>
          </div>
          
          {/* Information Box */}
          <div className="mt-4 p-4 bg-gray-50 rounded-md text-sm text-gray-600">
            <h4 className="font-medium text-gray-700 flex items-center">
              <InfoIcon size={16} className="mr-2" />
              About Timelock Transactions
            </h4>
            <p className="mt-1">
              Queued transactions must wait for their delay period before they can be executed.
              The delay period is determined based on the risk level of the transaction.
            </p>
            <p className="mt-2">
              Higher risk transactions require longer delays to give stakeholders time to review
              and potentially cancel dangerous operations.
            </p>
          </div>
        </div>
      )}
    </DashboardCard>
  );
};

export default QueueTransaction;