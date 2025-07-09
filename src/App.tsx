import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Dashboard from './pages/Dashboard';
import Pipeline from './pages/Pipeline';
import Activities from './pages/Activities';
import Cadences from './pages/Cadences';
import Courses from './pages/Courses';
import Planning from './pages/Planning';
import Settings from './pages/Settings';
import WhatsApp from './pages/WhatsApp';
import ScrappingMap from './pages/ScrappingMap';
import Community from './pages/Community';
import Login from './pages/Login';
import Register from './pages/Register';
import ImportSettings from './pages/ImportSettings';
import Layout from './components/layout/Layout';
import CollaboratorInvitation from './components/settings/CollaboratorInvitation';
import './App.css';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/invite" element={
              <ProtectedRoute>
                <CollaboratorInvitation />
              </ProtectedRoute>
            } />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/pipeline" element={
              <ProtectedRoute>
                <Layout>
                  <Pipeline />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/activities" element={
              <ProtectedRoute>
                <Layout>
                  <Activities />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/import-settings" element={
              <ProtectedRoute>
                <Layout>
                  <ImportSettings />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/cadences" element={
              <ProtectedRoute>
                <Layout>
                  <Cadences />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/whatsapp" element={
              <ProtectedRoute>
                <Layout>
                  <WhatsApp />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/courses" element={
              <ProtectedRoute>
                <Layout>
                  <Courses />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/planning" element={
              <ProtectedRoute>
                <Layout>
                  <Planning />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/scrapping-map" element={
              <ProtectedRoute>
                <Layout>
                  <ScrappingMap />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/community" element={
              <ProtectedRoute>
                <Layout>
                  <Community />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;