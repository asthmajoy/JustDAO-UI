// src/components/daohelper/RoleManagement.jsx
import React, { useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';
import { 
  ShieldIcon, 
  UserPlusIcon, 
  UserMinusIcon,
  AlertTriangleIcon,
  CheckCircleIcon 
} from 'lucide-react';

import { WalletContext } from '../../context/WalletContext';
import { ContractsContext } from '../../context/ContractsContext';
import { RoleContext } from '../../context/RoleContext';
import { NotificationContext } from '../../context/NotificationContext';

import DashboardCard from '../common/DashboardCard';
import { LoadingState, TransactionPending } from '../common/LoadingSpinner';

const RoleManagement = () => {
  const { account } = useContext(WalletContext);
  const { governanceContract, timelockContract, tokenContract, getContract } = useContext(ContractsContext);
  const { notifySuccess, notifyError, notifyWarning, addPendingTransaction } = useContext(NotificationContext);
  
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [roles, setRoles] = useState({
    admin: [],
    guardian: [],
    proposer: [],
    executor: [],
    analytics: []
  });
  
  // Form state
  const [selectedRole, setSelectedRole] = useState('');
  const [address, setAddress] = useState('');
  const [isAdding, setIsAdding] = useState(true);
  const [formErrors, setFormErrors] = useState({});

  // Fetch roles
  useEffect(() => {
    const fetchRoles = async () => {
      if (!governanceContract || !timelockContract) return;
      
      try {
        setLoading(true);
        
        const adminRole = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
        const guardianRole = ethers.keccak256(ethers.toUtf8Bytes("GUARDIAN_ROLE"));
        const proposerRole = ethers.keccak256(ethers.toUtf8Bytes("PROPOSER_ROLE"));
        const executorRole = ethers.keccak256(ethers.toUtf8Bytes("EXECUTOR_ROLE"));
        const analyticsRole = ethers.keccak256(ethers.toUtf8Bytes("ANALYTICS_ROLE"));
        
        // Fetch role members from governance contract
        const fetchRoleMembers = async (contract, role) => {
          try {
            const roleCount = await contract.getRoleMemberCount(role);
            const members = [];
            
            for (let i = 0; i < roleCount; i++) {
              const member = await contract.getRoleMember(role, i);
              members.push(member);
            }
            
            return members;
          } catch (error) {
            console.error(`Error fetching ${role} members:`, error);
            return [];
          }
        };
        
        // Fetch from governance contract
        const adminMembers = await fetchRoleMembers(governanceContract, adminRole);
        const guardianMembers = await fetchRoleMembers(governanceContract, guardianRole);
        
        // Fetch from timelock contract
        const proposerMembers = await fetchRoleMembers(timelockContract, proposerRole);
        const executorMembers = await fetchRoleMembers(timelockContract, executorRole);
        
        // For analytics, we would fetch from the analytics helper contract
        // For demo, we'll use a placeholder
        const analyticsMembers = [account]; // Placeholder
        
        setRoles({
          admin: adminMembers,
          guardian: guardianMembers,
          proposer: proposerMembers,
          executor: executorMembers,
          analytics: analyticsMembers
        });
      } catch (error) {
        console.error("Error fetching roles:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRoles();
  }, [governanceContract, timelockContract, account]);

  // Format address for display
  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!selectedRole) {
      errors.role = "Please select a role";
    }
    
    if (!address) {
      errors.address = "Address is required";
    } else if (!ethers.isAddress(address)) {
      errors.address = "Invalid Ethereum address";
    }
    
    // Check if removing admin role when it's the last admin
    if (!isAdding && selectedRole === 'admin' && roles.admin.length <= 1) {
      const addressLower = address.toLowerCase();
      if (roles.admin.some(admin => admin.toLowerCase() === addressLower)) {
        errors.role = "Cannot remove the last admin";
      }
    }
    
    // Check if address already has the role when adding
    if (isAdding && selectedRole) {
      const addressLower = address.toLowerCase();
      if (roles[selectedRole].some(member => member.toLowerCase() === addressLower)) {
        errors.address = `Address already has the ${selectedRole} role`;
      }
    }
    
    // Check if address doesn't have the role when removing
    if (!isAdding && selectedRole) {
      const addressLower = address.toLowerCase();
      if (!roles[selectedRole].some(member => member.toLowerCase() === addressLower)) {
        errors.address = `Address doesn't have the ${selectedRole} role`;
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setPending(true);
      
      let contract;
      let role;
      
      // Determine which contract to use based on role
      if (selectedRole === 'admin' || selectedRole === 'guardian') {
        contract = getContract('governance', true);
      } else if (selectedRole === 'proposer' || selectedRole === 'executor') {
        contract = getContract('timelock', true);
      } else if (selectedRole === 'analytics') {
        contract = getContract('analyticsHelper', true);
      } else {
        throw new Error("Invalid role selected");
      }
      
      // Determine the role bytes32 value
      if (selectedRole === 'admin') {
        role = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
      } else if (selectedRole === 'guardian') {
        role = ethers.keccak256(ethers.toUtf8Bytes("GUARDIAN_ROLE"));
      } else if (selectedRole === 'proposer') {
        role = ethers.keccak256(ethers.toUtf8Bytes("PROPOSER_ROLE"));
      } else if (selectedRole === 'executor') {
        role = ethers.keccak256(ethers.toUtf8Bytes("EXECUTOR_ROLE"));
      } else if (selectedRole === 'analytics') {
        role = ethers.keccak256(ethers.toUtf8Bytes("ANALYTICS_ROLE"));
      }
      
      // Call the appropriate contract method
      let tx;
      if (isAdding) {
        tx = await contract.grantContractRole(role, address);
      } else {
        tx = await contract.revokeContractRole(role, address);
      }
      
      // Track the transaction
      await addPendingTransaction(tx, `${isAdding ? 'Grant' : 'Revoke'} ${selectedRole} role`);
      
      // Show success message
      notifySuccess(`Successfully ${isAdding ? 'granted' : 'revoked'} ${selectedRole} role for ${formatAddress(address)}`);
      
      // Update the local state to reflect the change
      setRoles(prevRoles => {
        const updatedRoles = { ...prevRoles };
        
        if (isAdding) {
          // Add address to role if not already there
          if (!updatedRoles[selectedRole].includes(address)) {
            updatedRoles[selectedRole] = [...updatedRoles[selectedRole], address];
          }
        } else {
          // Remove address from role
          updatedRoles[selectedRole] = updatedRoles[selectedRole].filter(
            member => member.toLowerCase() !== address.toLowerCase()
          );
        }
        
        return updatedRoles;
      });
      
      // Reset form
      setAddress('');
    } catch (error) {
      console.error("Error managing role:", error);
      notifyError(`Failed to ${isAdding ? 'grant' : 'revoke'} role: ${error.message}`);
    } finally {
      setPending(false);
    }
  };

  if (loading) {
    return <LoadingState text="Loading role information..." />;
  }

  if (pending) {
    return <TransactionPending text={`${isAdding ? 'Granting' : 'Revoking'} role...`} />;
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Role Management</h2>
      
      {/* Role Management Form */}
      <div className="mb-6">
        <DashboardCard
          title="Manage Roles"
          icon={<ShieldIcon size={24} />}
        >
          <form onSubmit={handleSubmit} className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="roleSelect" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  id="roleSelect"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className={`w-full p-2 border rounded-md ${formErrors.role ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select a role</option>
                  <option value="admin">Admin</option>
                  <option value="guardian">Guardian</option>
                  <option value="proposer">Proposer</option>
                  <option value="executor">Executor</option>
                  <option value="analytics">Analytics</option>
                </select>
                {formErrors.role && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.role}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="addressInput" className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  id="addressInput"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="0x..."
                  className={`w-full p-2 border rounded-md ${formErrors.address ? 'border-red-500' : 'border-gray-300'}`}
                />
                {formErrors.address && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.address}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center mb-4">
              <div className="flex items-center space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="roleAction"
                    checked={isAdding}
                    onChange={() => setIsAdding(true)}
                    className="h-4 w-4 text-indigo-600 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Grant Role</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="roleAction"
                    checked={!isAdding}
                    onChange={() => setIsAdding(false)}
                    className="h-4 w-4 text-indigo-600 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Revoke Role</span>
                </label>
              </div>
            </div>
            
            <div className="mt-4">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isAdding ? (
                  <>
                    <UserPlusIcon size={16} className="mr-2" />
                    Grant Role
                  </>
                ) : (
                  <>
                    <UserMinusIcon size={16} className="mr-2" />
                    Revoke Role
                  </>
                )}
              </button>
            </div>
          </form>
        </DashboardCard>
      </div>
      
      {/* Role Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Admin Role */}
        <DashboardCard
          title="Admin Role"
          description="Can manage DAO parameters and roles"
          icon={<ShieldIcon size={20} />}
        >
          <div className="p-4">
            {roles.admin.length === 0 ? (
              <p className="text-gray-500 text-center py-2">No admins found</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {roles.admin.map((admin, index) => (
                  <li key={index} className="py-2">
                    <span className="font-mono text-sm">{formatAddress(admin)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DashboardCard>
        
        {/* Guardian Role */}
        <DashboardCard
          title="Guardian Role"
          description="Can pause contracts and cancel proposals"
          icon={<ShieldIcon size={20} />}
        >
          <div className="p-4">
            {roles.guardian.length === 0 ? (
              <p className="text-gray-500 text-center py-2">No guardians found</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {roles.guardian.map((guardian, index) => (
                  <li key={index} className="py-2">
                    <span className="font-mono text-sm">{formatAddress(guardian)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DashboardCard>
        
        {/* Proposer Role */}
        <DashboardCard
          title="Proposer Role"
          description="Can create timelock transactions"
          icon={<ShieldIcon size={20} />}
        >
          <div className="p-4">
            {roles.proposer.length === 0 ? (
              <p className="text-gray-500 text-center py-2">No proposers found</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {roles.proposer.map((proposer, index) => (
                  <li key={index} className="py-2">
                    <span className="font-mono text-sm">{formatAddress(proposer)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DashboardCard>
        
        {/* Executor Role */}
        <DashboardCard
          title="Executor Role"
          description="Can execute timelock transactions"
          icon={<ShieldIcon size={20} />}
        >
          <div className="p-4">
            {roles.executor.length === 0 ? (
              <p className="text-gray-500 text-center py-2">No executors found</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {roles.executor.map((executor, index) => (
                  <li key={index} className="py-2">
                    <span className="font-mono text-sm">{formatAddress(executor)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DashboardCard>
        
        {/* Analytics Role */}
        <DashboardCard
          title="Analytics Role"
          description="Can access detailed analytics"
          icon={<ShieldIcon size={20} />}
        >
          <div className="p-4">
            {roles.analytics.length === 0 ? (
              <p className="text-gray-500 text-center py-2">No analytics users found</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {roles.analytics.map((analytics, index) => (
                  <li key={index} className="py-2">
                    <span className="font-mono text-sm">{formatAddress(analytics)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DashboardCard>
      </div>
    </div>
  );
};

export default RoleManagement;