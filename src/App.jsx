import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';
import OwnerLayout from './layouts/OwnerLayout';
import VendorLayout from './layouts/VendorLayout';
import Login from './pages/auth/Login';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import VendorManagement from './pages/owner/VendorManagement';
import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorBalance from './pages/vendor/Balance';
import OwnerTransactions from './pages/owner/Transactions';
import OwnerTransactionDetail from './pages/owner/TransactionDetail';
import EditTransaction from './pages/vendor/EditTransaction';
import VendorClosing from './pages/vendor/Closing';
import OwnerClosing from './pages/owner/Closing';
import OwnerClosingDetail from './pages/owner/ClosingDetail.jsx';
import OwnerReconciliation from './pages/owner/Reconciliation';
import OwnerBalance from './pages/owner/OwnerBalance';
import Reports from './pages/owner/Reports';
import Analytics from './pages/owner/Analytics';
import AuditTrail from './pages/owner/AuditTrail';
import Notifications from './pages/owner/Notifications';
import Backups from './pages/owner/Backups';
import Calculator from './pages/Calculator';

// Inside vendor routes block, after TransactionDetail route
// Removed stray route definition

import Transactions from './pages/vendor/Transactions';
import NewTransaction from './pages/vendor/NewTransaction';
import TransactionDetail from './pages/vendor/TransactionDetail';
import VendorReconciliation from './pages/vendor/Reconciliation';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'OWNER' ? '/owner/dashboard' : '/vendor/dashboard'} replace />;
}

export default function App() {
  const { loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen label="Restoring your session" />;
  return <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/" element={<HomeRedirect />} />
    <Route path="/unauthorized" element={<Unauthorized />} />
    <Route path="/404" element={<NotFound />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<RoleRoute role="OWNER" />}>
                <Route element={<OwnerLayout />}>
          <Route path="/owner/dashboard" element={<OwnerDashboard />} />
          <Route path="/owner/vendors" element={<VendorManagement />} />
<Route path="/owner/transactions" element={<OwnerTransactions />} />
<Route path="/owner/balance" element={<OwnerBalance />} />
          <Route path="/owner/transactions/:id" element={<OwnerTransactionDetail />} />
          <Route path="/owner/closing" element={<OwnerClosing />} />
          <Route path="/owner/closing/:id" element={<OwnerClosingDetail />} />
          <Route path="/owner/reconciliation" element={<OwnerReconciliation />} />
          <Route path="/owner/reports" element={<Reports />} />
          <Route path="/owner/analytics" element={<Analytics />} />
          <Route path="/owner/audit" element={<AuditTrail />} />
          <Route path="/owner/notifications" element={<Notifications />} />
          <Route path="/owner/backups" element={<Backups />} />
          <Route path="/owner/calculator" element={<Calculator />} />
        </Route>
      </Route>
      <Route element={<RoleRoute role="VENDOR" />}>
                <Route element={<VendorLayout />}>
          <Route path="/vendor/dashboard" element={<VendorDashboard />} />
          <Route path="/vendor/balance" element={<VendorBalance />} />
          <Route path="/vendor/transactions" element={<Transactions />} />
          <Route path="/vendor/transactions/new" element={<NewTransaction />} />
          <Route path="/vendor/transactions/:id" element={<TransactionDetail />} />
          <Route path="/vendor/transactions/:id/edit" element={<EditTransaction />} />
          <Route path="/vendor/closing" element={<VendorClosing />} />
          <Route path="/vendor/reconciliation" element={<VendorReconciliation />} />
          <Route path="/vendor/calculator" element={<Calculator />} />
        </Route>
      </Route>
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>;
}
