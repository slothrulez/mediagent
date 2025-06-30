import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { PatientRecords } from './components/PatientRecords';
import { MediAgent } from './components/MediAgent';
import { LoginPage } from './components/LoginPage';
import { PatientForm } from './components/PatientForm';
import { ReportsPage } from './components/ReportsPage';
import { SettingsPage } from './components/SettingsPage';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  authenticated: boolean;
  loginTime: string;
  isDemo?: boolean;
}

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    try {
      // Check for existing authentication
      const storedUser = localStorage.getItem('mediagent_user');
      const authToken = localStorage.getItem('mediagent_auth_token');
      
      if (storedUser && authToken) {
        const user = JSON.parse(storedUser);
        
        // Validate user object
        if (user.id && user.email && user.authenticated) {
          // Check if session is still valid (24 hours)
          const loginTime = new Date(user.loginTime);
          const now = new Date();
          const hoursDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
          
          if (hoursDiff < 24) {
            setCurrentUser(user);
          } else {
            // Session expired
            clearAuthData();
          }
        } else {
          clearAuthData();
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      clearAuthData();
    } finally {
      setLoading(false);
      setAuthChecked(true);
    }
  };

  const clearAuthData = () => {
    localStorage.removeItem('mediagent_user');
    localStorage.removeItem('mediagent_auth_token');
    setCurrentUser(null);
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setAuthChecked(true);
  };

  const handleLogout = () => {
    clearAuthData();
    setAuthChecked(true);
    
    // Show logout confirmation
    const confirmLogout = window.confirm('Are you sure you want to logout?');
    if (!confirmLogout && currentUser) {
      // If user cancels, restore the session
      setCurrentUser(currentUser);
      localStorage.setItem('mediagent_user', JSON.stringify(currentUser));
      return;
    }
  };

  // Show loading screen while checking authentication
  if (loading || !authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading MediAgent...</p>
          <p className="text-gray-500 text-sm mt-2">Checking authentication status</p>
        </motion.div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <Header user={currentUser} onLogout={handleLogout} />
        
        <main className="pt-16">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/patients" element={<PatientRecords />} />
              <Route path="/mediagent" element={<MediAgent />} />
              <Route path="/patient-form" element={<PatientForm />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </Router>
  );
}

export default App;