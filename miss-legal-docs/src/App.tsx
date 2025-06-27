// MISS Legal AI Documentation & Dashboard System
'use client';

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Pages
import HomePage from './pages/HomePage';
import DocumentationPage from './pages/DocumentationPage';
import ApiReferencePage from './pages/ApiReferencePage';
import DeploymentDashboard from './pages/DeploymentDashboard';
import LaunchReadinessPage from './pages/LaunchReadinessPage';
import SystemHealthPage from './pages/SystemHealthPage';
import CompliancePage from './pages/CompliancePage';
import UserGuidesPage from './pages/UserGuidesPage';

// Components
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';

function App() {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex">
          {/* Sidebar */}
          <Sidebar 
            isOpen={sidebarOpen} 
            onToggle={() => setSidebarOpen(!sidebarOpen)} 
          />
          
          {/* Main Content */}
          <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
            <TopBar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
            
            <main className="p-6">
              <AnimatePresence mode="wait">
                <Routes>
                  {/* Home */}
                  <Route path="/" element={<HomePage />} />
                  
                  {/* Documentation */}
                  <Route path="/docs" element={<DocumentationPage />} />
                  <Route path="/docs/:section" element={<DocumentationPage />} />
                  <Route path="/docs/:section/:subsection" element={<DocumentationPage />} />
                  
                  {/* API Reference */}
                  <Route path="/api" element={<ApiReferencePage />} />
                  
                  {/* Dashboard & Operations */}
                  <Route path="/dashboard" element={<DeploymentDashboard />} />
                  <Route path="/health" element={<SystemHealthPage />} />
                  <Route path="/launch" element={<LaunchReadinessPage />} />
                  
                  {/* Compliance & Legal */}
                  <Route path="/compliance" element={<CompliancePage />} />
                  
                  {/* User Guides */}
                  <Route path="/guides" element={<UserGuidesPage />} />
                  <Route path="/guides/:language" element={<UserGuidesPage />} />
                  
                  {/* Redirect */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AnimatePresence>
            </main>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
