import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Pipeline from './pages/Pipeline';
import { ClientsList, ClientDetail } from './pages/Clients';
import { Documents, Signatures, Payments, Reports, Team, Settings } from './pages/OtherPages';
import Products from './pages/Products';
import Login from './pages/Login';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/pipeline': 'Client Pipeline',
  '/clients': 'Clients',
  '/documents': 'Documents',
  '/signatures': 'Signature Requests',
  '/payments': 'Payments',
  '/reports': 'Reports',
  '/team': 'Team',
  '/settings': 'Settings',
  '/products': 'Products',
};

function Topbar() {
  const location = useLocation();
  const { user } = useAuth();
  const isClientDetail = location.pathname.startsWith('/clients/') && location.pathname.length > 9;
  const title = isClientDetail ? 'Client Profile' : (PAGE_TITLES[location.pathname] || 'Notable');
  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'DJ';
  return (
    <div className="topbar">
      <div className="topbar-title">{title}</div>
      <div className="topbar-right">
        <div className="topbar-badge">Amplify Portal</div>
        <div className="topbar-avatar">{initials}</div>
      </div>
    </div>
  );
}

function Shell() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <Topbar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/clients" element={<ClientsList />} />
          <Route path="/clients/:id" element={<ClientDetail />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/signatures" element={<Signatures />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/team" element={<Team />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/products" element={<Products />} />
        </Routes>
      </div>
    </div>
  );
}

function AuthGate() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Montserrat, sans-serif', color: '#7B4F5E', fontSize: 13, letterSpacing: 2 }}>
        Loading portal...
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </BrowserRouter>
  );
}
