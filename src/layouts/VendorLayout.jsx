import AppShell from './AppShell';

// Define sidebar navigation links for the vendor UI
const links = [
  { label: 'Dashboard', to: '/vendor/dashboard', icon: 'D', enabled: true },
  { label: 'Balance', to: '/vendor/balance', icon: 'B', enabled: true },
  // Transaction list (history) page
  { label: 'Transactions', to: '/vendor/transactions', icon: 'T', enabled: true },
  // Page for recording a new transaction
  { label: 'Record Transaction', to: '/vendor/transactions/new', icon: 'R', enabled: true },
  { label: 'Reconciliation', to: '/vendor/reconciliation', icon: 'C', enabled: true },
  { label: 'Daily Closing', to: '/vendor/closing', icon: 'D', enabled: true },
  { label: 'Calculator', to: '/vendor/calculator', icon: '+', enabled: true },
];

export default function VendorLayout() {
  return <AppShell role="VENDOR" accent="teal" links={links} />;
}
