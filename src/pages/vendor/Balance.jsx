import { useCallback, useEffect, useState } from 'react';
import { getOwnBalance, getOwnBalanceHistory } from '../../services/balanceService';
import { formatMoney, formatDate } from '../../utils/formatters';
import Button from '../../components/Button';
import DashboardSection from '../../components/DashboardSection';
import ErrorMessage from '../../components/ErrorMessage';
import LoadingSpinner from '../../components/LoadingSpinner';
import PageHeader from '../../components/PageHeader';
import './Balance.css';

function BalanceCard({ label, value }) {
  return <article className="balance-detail-card"><span>{label}</span><strong>{formatMoney(value)}</strong></article>;
}

export default function Balance() {
  const [balance, setBalance] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const results = await Promise.allSettled([getOwnBalance(), getOwnBalanceHistory({ limit: 20 })]);
    if (results[0].status === 'fulfilled') setBalance(results[0].value.data);
    if (results[1].status === 'fulfilled') setHistory(results[1].value.data || []);
    if (results[0].status === 'rejected') setError(results[0].reason.message || 'Unable to load your balance.');
    else if (results[1].status === 'rejected') setError('Balance history is currently unavailable.');
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading && !balance) return <LoadingSpinner label="Loading balance" />;
  const cashBalance = Number(balance?.cash_balance || 0);
  const momoBalance = Number(balance?.momo_balance || 0);
  const totalBalance = cashBalance + momoBalance;

  return <div className="balance-page">
    <div className="balance-heading">
      <PageHeader eyebrow="Vendor workspace" title="Balance" description="Know exactly what is available before you move money." />
      <Button variant="outline" onClick={load} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh balance'}</Button>
    </div>
    {error && <div className="inline-error"><ErrorMessage>{error}</ErrorMessage><Button variant="outline" onClick={load}>Retry</Button></div>}
    {balance ? <><section className="balance-overview">
      <article className="balance-total-card"><span className="balance-card-label">Total available</span><strong>{formatMoney(totalBalance)}</strong><small>Cash and MoMo combined</small></article>
      <div className="balance-detail-grid"><BalanceCard label="Cash balance" value={cashBalance} /><BalanceCard label="MoMo balance" value={momoBalance} /></div>
    </section><p className="balance-updated">Last updated: {balance.updated_at ? new Date(balance.updated_at).toLocaleString('en-GH') : 'Not available'}</p></> : !loading && <div className="empty-state">Balance information is not available.</div>}
    <DashboardSection title="Balance history" eyebrow={`${history.length} recent changes`}>{history.length ? <div className="balance-history-table"><table className="management-table"><thead><tr><th>Date</th><th>Balance</th><th>Change</th><th>New balance</th><th>Reason</th></tr></thead><tbody>{history.map((entry) => <tr key={entry.id}><td>{entry.created_at ? <><strong>{formatDate(entry.created_at)}</strong><small>{new Date(entry.created_at).toLocaleTimeString('en-GH')}</small></> : '-'}</td><td><span className={`balance-type balance-type--${entry.balance_type === 'CASH' ? 'cash' : 'momo'}`}>{entry.balance_type === 'CASH' ? 'Cash' : 'MoMo'}</span></td><td className={Number(entry.change_amount) >= 0 ? 'balance-change balance-change--positive' : 'balance-change balance-change--negative'}>{Number(entry.change_amount) >= 0 ? '+' : ''}{formatMoney(entry.change_amount)}</td><td>{formatMoney(entry.new_balance)}</td><td>{entry.reason || '-'}</td></tr>)}</tbody></table></div> : <div className="empty-state">No balance history is available yet.</div>}</DashboardSection>
  </div>;
}
