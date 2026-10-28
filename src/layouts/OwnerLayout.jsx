import AppShell from './AppShell';
import { useEffect, useState } from 'react';
import { getUnreadCount } from '../services/analyticsService';
const links = [
  { label: 'Dashboard', to: '/owner/dashboard', icon: 'D', enabled: true },
  { label: 'Vendors', to: '/owner/vendors', icon: 'V', enabled: true },
  { label: 'Transactions', to: '/owner/transactions', icon: 'T', enabled: true },
  { label: 'Balance', to: '/owner/balance', icon: 'B', enabled: true },
  { label: 'Reconciliation', to: '/owner/reconciliation', icon: 'R', enabled: true },
  { label: 'Daily Closing', to: '/owner/closing', icon: 'C', enabled: true },
  { label: 'Reports', to: '/owner/reports', icon: 'P', enabled: true },
  { label: 'Analytics', to: '/owner/analytics', icon: 'A', enabled: true },
  { label: 'Audit Trail', to: '/owner/audit', icon: 'L', enabled: true },
  { label: 'Notifications', to: '/owner/notifications', icon: 'N', enabled: true },
  { label: 'Backups', to: '/owner/backups', icon: 'B', enabled: true },
  { label: 'Calculator', to: '/owner/calculator', icon: '+', enabled: true }
];
export default function OwnerLayout() { const [notificationCount, setNotificationCount] = useState(0); useEffect(() => { getUnreadCount().then((response) => setNotificationCount(response.data?.unread_count || 0)).catch(() => {}); }, []); return <AppShell role="OWNER" accent="copper" links={links} notificationCount={notificationCount} />; }
