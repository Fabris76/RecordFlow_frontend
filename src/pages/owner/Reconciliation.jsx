import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Button from '../../components/Button';
import { getVendors } from '../../services/vendorService';
import { getOwnerReconciliation } from '../../services/reconciliationService';
import { formatDate, formatMoney, localDate } from '../../utils/format';
import './OwnerReconciliation.css';

const money = (value) => value === null || value === undefined ? 'Not available' : formatMoney(value);

function PositionCard({ label, movement, balance, tone }) {
  return <article className={`reconciliation-position reconciliation-position--${tone}`}>
    <div className="reconciliation-position__heading"><span>{label}</span><strong>{money(balance)}</strong></div>
    <div className="reconciliation-position__row"><span>Transaction movement</span><strong>{money(movement)}</strong></div>
    <div className="reconciliation-position__row"><span>Opening balance</span><strong>Not available</strong></div>
    <div className="reconciliation-position__row"><span>Expected closing</span><strong>Not available</strong></div>
    <div className="reconciliation-position__row"><span>Difference</span><strong>Not available</strong></div>
  </article>;
}

function ClosingPanel({ closing }) {
  const closed = closing.status === 'CLOSED';
  return <section className="reconciliation-closing">
    <div><span className="eyebrow">Daily closing</span><h2>{closed ? 'Business day closed' : 'Business day open'}</h2></div>
    <span className={`reconciliation-status reconciliation-status--${closing.status.toLowerCase()}`}>{closing.status}</span>
    {closed && <div className="reconciliation-closing__details"><span>Closed at <strong>{closing.closed_at ? new Date(closing.closed_at).toLocaleString('en-GH') : 'Not available'}</strong></span><span>Closing transaction count <strong>{closing.transaction_count ?? 'Not available'}</strong></span><span>Closing total <strong>{money(closing.total_amount)}</strong></span></div>}
  </section>;
}

export default function OwnerReconciliation() {
  const navigate = useNavigate();
  const [date, setDate] = useState(localDate());
  const [vendorId, setVendorId] = useState('');
  const [vendors, setVendors] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [error, setError] = useState('');
  const [vendorError, setVendorError] = useState('');

  useEffect(() => {
    getVendors({ status: 'ACTIVE' })
      .then((response) => setVendors(Array.isArray(response.data) ? response.data : []))
      .catch((requestError) => setVendorError(requestError.message || 'Unable to load vendors.'))
      .finally(() => setVendorsLoading(false));
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    getOwnerReconciliation({ date, vendorId })
      .then((response) => { if (active) setRows(Array.isArray(response.data) ? response.data : []); })
      .catch((requestError) => { if (active) setError(requestError.message || 'Unable to load reconciliation.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [date, vendorId]);

  const selected = useMemo(() => vendorId ? rows[0] : null, [rows, vendorId]);
  const viewTransactions = (row) => navigate(`/owner/transactions?vendor_id=${encodeURIComponent(row.vendor_id)}&start_date=${encodeURIComponent(row.business_date)}&end_date=${encodeURIComponent(row.business_date)}`);

  return <div className="owner-reconciliation-page">
    <div className="owner-reconciliation-heading">
      <PageHeader eyebrow="Financial control" title="Reconciliation" description="Review backend-recorded activity, balances, and daily closing state." />
      <Button variant="outline" onClick={() => { setError(''); setLoading(true); getOwnerReconciliation({ date, vendorId }).then((response) => setRows(response.data || [])).catch((requestError) => setError(requestError.message || 'Unable to load reconciliation.')).finally(() => setLoading(false)); }} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh'}</Button>
    </div>
    <section className="reconciliation-filters">
      <div><label htmlFor="owner-reconciliation-date">Business date</label><input id="owner-reconciliation-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></div>
      <div><label htmlFor="owner-reconciliation-vendor">Vendor</label><select id="owner-reconciliation-vendor" value={vendorId} onChange={(event) => setVendorId(event.target.value)} disabled={vendorsLoading}><option value="">All vendors</option>{vendors.map((vendor) => <option key={vendor.id || vendor.user_id} value={vendor.id || vendor.user_id}>{vendor.name}</option>)}</select></div>
      {vendorError && <span role="alert">{vendorError}</span>}
    </section>
    {loading ? <LoadingSpinner label="Loading reconciliation" /> : error ? <div className="inline-error"><ErrorMessage>{error}</ErrorMessage><Button variant="outline" onClick={() => setDate(date)}>Try again</Button></div> : rows.length === 0 ? <div className="empty-state">No reconciliation data available.</div> : selected ? <><div className="reconciliation-vendor-heading"><div><span className="eyebrow">Selected vendor</span><h2>{selected.vendor_name}</h2><p>{formatDate(selected.business_date)}</p></div><Button variant="outline" onClick={() => viewTransactions(selected)}>View Transactions</Button></div><ClosingPanel closing={selected.closing} /><section className="reconciliation-grid"><PositionCard label="Cash" movement={selected.transaction_activity.cash_movement} balance={selected.current_balance?.cash} tone="cash" /><PositionCard label="MoMo" movement={selected.transaction_activity.momo_movement} balance={selected.current_balance?.momo} tone="momo" /></section><section className="reconciliation-activity"><div><span className="eyebrow">Transaction movement</span><h2>{selected.transaction_activity.count} completed transactions</h2></div><div className="reconciliation-activity__metrics"><span>Total amount <strong>{formatMoney(selected.transaction_activity.amount)}</strong></span><span>Deposits <strong>{formatMoney(selected.transaction_activity.deposits)}</strong></span><span>Withdrawals <strong>{formatMoney(selected.transaction_activity.withdrawals)}</strong></span></div></section><div className="reconciliation-unavailable"><strong>Reconciliation status: Not Available</strong><p>The backend does not currently provide opening snapshots, expected closing balances, actual closing snapshots, or calculated differences.</p></div></> : <div className="reconciliation-table-wrap"><table className="vendor-table"><thead><tr><th>Vendor</th><th>Cash balance</th><th>MoMo balance</th><th>Transactions</th><th>Closing status</th><th>Action</th></tr></thead><tbody>{rows.map((row) => <tr key={row.vendor_id}><td><strong>{row.vendor_name}</strong><small>{formatDate(row.business_date)}</small></td><td>{money(row.current_balance?.cash)}</td><td>{money(row.current_balance?.momo)}</td><td>{row.transaction_activity.count}</td><td><span className={`reconciliation-status reconciliation-status--${row.closing.status.toLowerCase()}`}>{row.closing.status}</span></td><td><button className="reconciliation-view" type="button" onClick={() => setVendorId(String(row.vendor_id))}>View details</button></td></tr>)}</tbody></table></div>}
  </div>;
}
