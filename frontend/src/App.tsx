import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CustomerList from './pages/customers/CustomerList';
import CustomerForm from './pages/customers/CustomerForm';
import ProductList from './pages/inventory/ProductList';
import ProductForm from './pages/inventory/ProductForm';
import ChallanList from './pages/challans/ChallanList';
import ChallanForm from './pages/challans/ChallanForm';
import ChallanDetail from './pages/challans/ChallanDetail';
import UserList from './pages/users/UserList';
import UserForm from './pages/users/UserForm';
import ReportsPage from './pages/reports/ReportsPage';
import { useAuth } from './contexts/AuthContext';
import type { UserRole } from './contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: UserRole[] }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={<Layout />}>
        <Route index element={<ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']}><Dashboard /></ProtectedRoute>} />

        {/* Customers */}
        <Route path="customers" element={<ProtectedRoute allowedRoles={['ADMIN', 'SALES']}><CustomerList /></ProtectedRoute>} />
        <Route path="customers/new" element={<ProtectedRoute allowedRoles={['ADMIN', 'SALES']}><CustomerForm /></ProtectedRoute>} />
        <Route path="customers/:id" element={<ProtectedRoute allowedRoles={['ADMIN', 'SALES']}><CustomerForm /></ProtectedRoute>} />

        {/* Inventory */}
        <Route path="inventory" element={<ProtectedRoute allowedRoles={['ADMIN', 'WAREHOUSE']}><ProductList /></ProtectedRoute>} />
        <Route path="inventory/new" element={<ProtectedRoute allowedRoles={['ADMIN', 'WAREHOUSE']}><ProductForm /></ProtectedRoute>} />
        <Route path="inventory/:id" element={<ProtectedRoute allowedRoles={['ADMIN', 'WAREHOUSE']}><ProductForm /></ProtectedRoute>} />

        {/* Challans */}
        <Route path="challans" element={<ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']}><ChallanList /></ProtectedRoute>} />
        <Route path="challans/new" element={<ProtectedRoute allowedRoles={['ADMIN', 'SALES']}><ChallanForm /></ProtectedRoute>} />
        <Route path="challans/:id" element={<ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']}><ChallanDetail /></ProtectedRoute>} />

        {/* Users — ADMIN only */}
        <Route path="users" element={<ProtectedRoute allowedRoles={['ADMIN']}><UserList /></ProtectedRoute>} />
        <Route path="users/new" element={<ProtectedRoute allowedRoles={['ADMIN']}><UserForm /></ProtectedRoute>} />
        <Route path="users/:id" element={<ProtectedRoute allowedRoles={['ADMIN']}><UserForm /></ProtectedRoute>} />

        {/* Reports — ADMIN + ACCOUNTS */}
        <Route path="reports" element={<ProtectedRoute allowedRoles={['ADMIN', 'ACCOUNTS']}><ReportsPage /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
};

export default App;


