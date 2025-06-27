// Main App Component for MISS Legal AI Frontend
'use client';

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from '@/components/ui/toaster';

// Pages
import HomePage from '@/pages/HomePage';
import TalkPage from '@/pages/TalkPage';
import PricingPage from '@/pages/PricingPage';
import DocumentsPage from '@/pages/DocumentsPage';
import ClonePage from '@/pages/ClonePage';
import LegalPage from '@/pages/LegalPage';
import DashboardPage from '@/pages/DashboardPage';

// Components
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import LoadingScreen from '@/components/layout/LoadingScreen';

// Types and Utils
import { User, UIState, Language } from '@/types';
import { getFromStorage, setToStorage } from '@/lib/utils';

// Mock user for demo
const mockUser: User = {
  id: '1',
  email: 'demo@example.com',
  firstName: 'Demo',
  lastName: 'User',
  country: 'Nigeria',
  preferredLanguage: 'english',
  subscriptionTier: 'premium',
  emergencyContacts: [],
  createdAt: new Date(),
};

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language>('english');

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Simulate initialization delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check for stored user session
        const storedUser = getFromStorage<User | null>('user', null);
        if (storedUser) {
          setUser(storedUser);
        } else {
          // For demo purposes, set mock user
          setUser(mockUser);
          setToStorage('user', mockUser);
        }

        // Load user preferences
        const storedLanguage = getFromStorage<Language>('preferredLanguage', 'english');
        setCurrentLanguage(storedLanguage);

        setIsLoading(false);
      } catch (error) {
        console.error('App initialization error:', error);
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Handle language change
  const handleLanguageChange = (language: Language) => {
    setCurrentLanguage(language);
    setToStorage('preferredLanguage', language);
    if (user) {
      const updatedUser = { ...user, preferredLanguage: language };
      setUser(updatedUser);
      setToStorage('user', updatedUser);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-cream-50 text-charcoal-700">
        <AnimatePresence mode="wait">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/legal" element={<LegalPage />} />
            
            {/* App Routes with Sidebar */}
            <Route path="/app/*" element={
              <div className="flex min-h-screen">
                <Sidebar 
                  isOpen={sidebarOpen}
                  onToggle={() => setSidebarOpen(!sidebarOpen)}
                  user={user}
                />
                
                <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
                  <TopBar 
                    user={user}
                    onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
                    currentLanguage={currentLanguage}
                    onLanguageChange={handleLanguageChange}
                  />
                  
                  <main className="p-6">
                    <Routes>
                      <Route path="/dashboard" element={<DashboardPage />} />
                      <Route path="/talk" element={<TalkPage />} />
                      <Route path="/documents" element={<DocumentsPage />} />
                      <Route path="/clone" element={<ClonePage />} />
                      <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
                    </Routes>
                  </main>
                </div>
              </div>
            } />

            {/* Direct access routes (full screen) */}
            <Route path="/talk" element={<TalkPage />} />
            
            {/* Redirect all other routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>

        {/* Global Toast Notifications */}
        <Toaster />
      </div>
    </Router>
  );
}

export default App;
