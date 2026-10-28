import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export default function RoleRoute({ role }) { const { user } = useAuth(); if (!user) return <Navigate to="/login" replace />; return user.role === role ? <Outlet /> : <Navigate to="/unauthorized" replace />; }
