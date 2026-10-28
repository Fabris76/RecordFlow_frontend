import { useCallback, useEffect, useState } from 'react';
import { adjustOwnerFunds, allocateOwnerFunds, getAllBalances, getAllBalanceHistory, getOwnerBalanceSummary, getOwnerFunds, getVendorBalance } from '../../services/balanceService';
import Button from '../../components/Button';
import DashboardSection from '../../components/DashboardSection';
import ErrorMessage from '../../components/ErrorMessage';
import LoadingSpinner from '../../components/LoadingSpinner';
import PageHeader from '../../components/PageHeader';
import { formatMoney } from '../../utils/formatters';
import './OwnerBalance.css';

function BalanceCard({ label, value, tone }) {
  return <article className={`owner-balance-card owner-balance-card--${tone}`}>
    <span>{label}</span>
    <strong>{formatMoney(value)}</strong>
    <small>Backend reported balance</small>
  </article>;
}

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString('en-GH') : 'Not available';
}

export default function OwnerBalance() {
  const [summary, setSummary] = useState(null);
  const [ownerFunds, setOwnerFunds] = useState(null);
  const [balances, setBalances] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [detailError, setDetailError] = useState('');
  const [form, setForm] = useState({ balance_type: 'CASH', amount: '', reason: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [summaryResponse, balancesResponse, fundsResponse] = await Promise.all([getOwnerBalanceSummary(), getAllBalances(), getOwnerFunds()]);
      setSummary(summaryResponse.data);
      setBalances(Array.isArray(balancesResponse.data) ? balancesResponse.data : []);
      setOwnerFunds(fundsResponse.data);
    } catch (requestError) {
      setError(requestError.message || 'Unable to load balance information. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function viewVendor(vendor) {
    setDetailLoading(true);
    setDetailError('');
    setSelectedVendor(vendor);
    try {
      const [balanceResponse, historyResponse] = await Promise.all([
        getVendorBalance(vendor.vendor_id),
        getAllBalanceHistory({ vendor_id: vendor.vendor_id, limit: 20 })
      ]);
      setSelectedVendor(balanceResponse.data);
      setHistory(historyResponse.data || []);
    } catch (requestError) {
      setDetailError(requestError.message || 'Unable to load vendor balance details.');
    } finally {
      setDetailLoading(false);
    }
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitAdjustment(event) {
    event.preventDefault();
    const amount = form.amount.trim();
    const reason = form.reason.trim();
    if (!selectedVendor || !amount || Number(amount) <= 0 || reason.length < 5) return;
    const typeLabel = form.balance_type === 'CASH' ? 'Cash' : 'MoMo';
    const confirmed = window.confirm(
      `Confirm this balance adjustment?\n\nVendor: ${selectedVendor.vendor_name}\nBalance type: ${typeLabel}\nAdjustment amount: ${formatMoney(amount)}\nReason: ${reason}`
    );
    if (!confirmed) return;

    setSaving(true);
    setDetailError('');
    try {
      await allocateOwnerFunds(selectedVendor.vendor_id, { balance_type: form.balance_type, amount, reason });
      setForm({ balance_type: 'CASH', amount: '', reason: '' });
      await load();
      await viewVendor({ ...selectedVendor });
    } catch (requestError) {
      setDetailError(requestError.message || 'Unable to adjust vendor balance.');
    } finally {
      setSaving(false);
    }

  }

  async function addFunds(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const amount = formElement.amount.value.trim();
    if (!amount) return;
    try {
      await adjustOwnerFunds({ balance_type: formElement.balance_type.value, operation: formElement.operation.value, amount });
      formElement.reset();
      await load();
    } catch (requestError) {
      setError(requestError.message || 'Unable to add business funds.');
    }
  }

  if (loading && !summary) return <LoadingSpinner fullScreen label="Loading business balance" />;

  return <div className="owner-balance-page">
    <div className="owner-balance-heading">
      <PageHeader eyebrow="Owner workspace" title="Business Balance" description="Monitor the balances held across your vendor network." />
      <Button variant="outline" onClick={load} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh'}</Button>
    </div>
    {error && <div className="inline-error"><ErrorMessage>{error}</ErrorMessage><Button variant="outline" onClick={load}>Try again</Button></div>}
    {summary && <section className="owner-balance-summary">
      <BalanceCard label="Cash Balance" value={summary.total_cash_balance} tone="cash" />
      <BalanceCard label="MoMo Balance" value={summary.total_momo_balance} tone="momo" />
    </section>}
    {ownerFunds && <section className="owner-funds-panel">
      <div><span className="eyebrow">Business funds</span><h2>Owner balance</h2><p>Record money available to the business before allocating it to vendors.</p></div>
      <div className="owner-funds-cards"><div><span>Cash available</span><strong>{formatMoney(ownerFunds.cash_balance)}</strong></div><div><span>MoMo available</span><strong>{formatMoney(ownerFunds.momo_balance)}</strong></div></div>
      <form className="owner-funds-form" onSubmit={addFunds}><select name="operation" defaultValue="ADD" aria-label="Funds operation"><option value="ADD">Add funds</option><option value="SUBTRACT">Subtract funds</option></select><select name="balance_type" defaultValue="CASH" aria-label="Balance type"><option value="CASH">Cash</option><option value="MOMO">MoMo</option></select><input name="amount" type="text" inputMode="decimal" placeholder="Amount" aria-label="Amount" required /><Button type="submit" variant="success" size="large" className="owner-funds-submit">Update funds</Button></form>
    </section>}
    {summary && <section className="owner-balance-meta" aria-label="Balance summary">
      <div><span>Vendors with balances</span><strong>{summary.vendor_count}</strong></div>
      <div><span>Business-day status</span><strong className={`business-day business-day--${summary.business_day_status.toLowerCase()}`}>{summary.business_day_status}</strong></div>
      <div><span>Last updated</span><strong>{formatDateTime(summary.last_updated)}</strong></div>
    </section>}
    <DashboardSection title="Vendor balances" eyebrow={`${balances.length} vendor balance records`}>
      {balances.length === 0 ? <div className="empty-state">No vendor balance data available.</div> : <div className="owner-balance-table-wrap"><table className="management-table owner-balance-table"><thead><tr><th>Vendor</th><th>Cash balance</th><th>MoMo balance</th><th>Status</th><th>Last updated</th><th>Action</th></tr></thead><tbody>{balances.map((vendor) => <tr key={vendor.vendor_id}><td><strong>{vendor.vendor_name}</strong></td><td>{formatMoney(vendor.cash_balance)}</td><td>{formatMoney(vendor.momo_balance)}</td><td><span className={`business-day business-day--${vendor.business_day_status.toLowerCase()}`}>{vendor.business_day_status}</span></td><td>{formatDateTime(vendor.updated_at)}</td><td><button className="owner-balance-view" type="button" onClick={() => viewVendor(vendor)}>View details</button></td></tr>)}</tbody></table></div>}
    </DashboardSection>
    {selectedVendor && <section className="owner-balance-detail" aria-label="Vendor balance details">
      <div className="owner-balance-detail__heading"><div><span className="eyebrow">Vendor detail</span><h2>{selectedVendor.vendor_name}</h2></div><button type="button" className="owner-balance-close" onClick={() => setSelectedVendor(null)}>Close</button></div>
      {detailLoading ? <LoadingSpinner label="Loading vendor balance" /> : <><div className="owner-balance-detail__cards"><div><span>Cash Balance</span><strong>{formatMoney(selectedVendor.cash_balance)}</strong></div><div><span>MoMo Balance</span><strong>{formatMoney(selectedVendor.momo_balance)}</strong></div><div><span>Business-day status</span><strong>{selectedVendor.business_day_status}</strong></div><div><span>Last updated</span><strong>{formatDateTime(selectedVendor.updated_at)}</strong></div></div>
      {detailError && <ErrorMessage>{detailError}</ErrorMessage>}
      <form className="owner-balance-adjust" onSubmit={submitAdjustment}><div><span className="eyebrow">Owner allocation</span><h3>Set funds for this vendor</h3><p>This transfers available owner funds to the vendor. The backend enforces available funds and closed-day restrictions.</p></div><label htmlFor="owner-adjust-type">Balance type</label><select id="owner-adjust-type" value={form.balance_type} onChange={(event) => updateForm('balance_type', event.target.value)} disabled={saving}><option value="CASH">Cash</option><option value="MOMO">MoMo</option></select><label htmlFor="owner-adjust-amount">Adjustment amount</label><input id="owner-adjust-amount" value={form.amount} onChange={(event) => updateForm('amount', event.target.value)} placeholder="e.g. 100 or -50" inputMode="decimal" disabled={saving} /><label htmlFor="owner-adjust-reason">Reason</label><textarea id="owner-adjust-reason" value={form.reason} onChange={(event) => updateForm('reason', event.target.value)} minLength="5" maxLength="255" disabled={saving} /><Button type="submit" disabled={saving || !form.amount.trim() || form.reason.trim().length < 5}>{saving ? 'Applying...' : 'Adjust Balance'}</Button></form>
      <div className="owner-balance-history"><h3>Recent history</h3>{history.length ? <table className="management-table"><thead><tr><th>Date</th><th>Type</th><th>Change</th><th>Reason</th></tr></thead><tbody>{history.map((entry) => <tr key={entry.id}><td>{formatDateTime(entry.created_at)}</td><td>{entry.balance_type === 'CASH' ? 'Cash' : 'MoMo'}</td><td>{formatMoney(entry.change_amount)}</td><td>{entry.reason || '-'}</td></tr>)}</tbody></table> : <div className="empty-state">No balance history available.</div>}</div></>}
    </section>}
  </div>;
}
