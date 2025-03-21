// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Contexts
import { WalletProvider } from './context/WalletContext';
import { ContractsProvider } from './context/ContractsContext';
import { NotificationProvider } from './context/NotificationContext';
import { RoleProvider } from './context/RoleContext';

// Layouts
import MainLayout from './components/layout/MainLayout';

// Pages
import Dashboard from './pages/Dashboard';
import TokenManagement from './pages/TokenManagement';
import Governance from './pages/Governance';
import Timelock from './pages/Timelock';
import DAOHelper from './pages/DAOHelper';
import Analytics from './pages/Analytics';
import Unauthorized from './pages/Unauthorized';

// Governance subpages
import ProposalDetails from './components/governance/ProposalDetails';
import CreateProposal from './components/governance/CreateProposal';
import CastVote from './components/governance/CastVote';

function App() {
  return (
    <Router>
      <WalletProvider>
        <ContractsProvider>
          <NotificationProvider>
            <RoleProvider>
              <Routes>
                {/* Main dashboard - accessible to everyone */}
                <Route
                  path="/"
                  element={<MainLayout requiresAuth={false} />}
                >
                  <Route index element={<Dashboard />} />
                </Route>

                {/* Token Management - accessible to everyone */}
                <Route
                  path="/token"
                  element={<MainLayout requiresAuth={true} />}
                >
                  <Route index element={<TokenManagement />} />
                </Route>

                {/* Governance Section */}
                <Route
                  path="/governance"
                  element={<MainLayout requiresAuth={true} />}
                >
                  <Route index element={<Governance />} />
                  <Route path="proposal/:proposalId" element={<ProposalDetails />} />
                  <Route path="proposals/:proposalId" element={<ProposalDetails />} />
                  <Route path="create" element={<CreateProposal />} />
                  <Route path="vote/:proposalId" element={<CastVote />} />
                </Route>

                {/* Timelock Management - restricted to specific roles */}
                <Route
                  path="/timelock"
                  element={<MainLayout requiresAuth={true} requiredRoles={['admin', 'guardian', 'proposer', 'executor']} />}
                >
                  <Route index element={<Timelock />} />
                </Route>

                {/* DAO Helper - accessible to everyone */}
                <Route
                  path="/dao-helper"
                  element={<MainLayout requiresAuth={true} />}
                >
                  <Route index element={<DAOHelper />} />
                </Route>

                {/* Analytics - restricted access */}
                <Route
                  path="/analytics"
                  element={<MainLayout requiresAuth={true} requiredRoles={['admin', 'analytics']} />}
                >
                  <Route index element={<Analytics />} />
                </Route>

                {/* Access denied page */}
                <Route path="/unauthorized" element={<Unauthorized />} />

                {/* Redirect unknown routes to dashboard */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </RoleProvider>
          </NotificationProvider>
        </ContractsProvider>
      </WalletProvider>
    </Router>
  );
}

export default App;