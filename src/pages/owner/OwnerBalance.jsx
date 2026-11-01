import { useCallback, useEffect, useMemo, useState } from 'react';
import { adjustOwnerFunds, allocateOwnerFunds, getAllBalances, getAllBalanceHistory, getOwnerBalanceSummary, getOwnerFunds, getVendorBalance } from '../../services/balanceService';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatMoney } from '../../utils/formatters';
import './OwnerBalance.css';

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString('en-GH') : 'Not available';
}

export default function OwnerBalance() {
  const [summary, setSummary] = useState(null);
  const [ownerFunds, setOwnerFunds] = useState(null);
  const [balances, setBalances] = useState([]);
  const [vendorSearch, setVendorSearch] = useState('');
  const [businessDayFilter, setBusinessDayFilter] = useState('ALL');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [detailError, setDetailError] = useState('');
  const [form, setForm] = useState({ balance_type: 'CASH', amount: '', reason: '' });

  const visibleBalances = useMemo(() => {
    const query = vendorSearch.trim().toLowerCase();
    return balances.filter((vendor) => {
      const matchesSearch = !query || `${vendor.vendor_name || ''} ${vendor.vendor_id || ''}`.toLowerCase().includes(query);
      const matchesStatus = businessDayFilter === 'ALL' || vendor.business_day_status === businessDayFilter;
      return matchesSearch && matchesStatus;
    });
  }, [balances, vendorSearch, businessDayFilter]);

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
    <section className="owner-balance-hero" aria-label="Business balance overview">
      <div className="owner-balance-hero__header"><div><span className="owner-balance-hero__eyebrow">Owner workspace <i aria-hidden="true">/</i> Finance</span><h1>Balance overview</h1><p>See how funds are distributed across your business and vendor accounts.</p></div><Button variant="outline" onClick={load} disabled={loading}>{loading ? 'Refreshing...' : <><span aria-hidden="true">{'\u21bb'}</span> Refresh balances</>}</Button></div>
      {summary && <><div className="owner-balance-hero__grid"><div className="owner-balance-hero__total"><span>Combined vendor balance</span><strong>{formatMoney(Number(summary.total_cash_balance || 0) + Number(summary.total_momo_balance || 0))}</strong><small>Funds currently held by {summary.vendor_count} vendor{Number(summary.vendor_count) === 1 ? '' : 's'}</small></div><div className="owner-balance-hero__type owner-balance-hero__type--cash"><span><i aria-hidden="true">C</i>Cash</span><strong>{formatMoney(summary.total_cash_balance)}</strong><small>Across vendor accounts</small></div><div className="owner-balance-hero__type owner-balance-hero__type--momo"><span><i aria-hidden="true">M</i>Mobile money</span><strong>{formatMoney(summary.total_momo_balance)}</strong><small>Across vendor accounts</small></div></div><div className="owner-balance-hero__footer"><span><i aria-hidden="true" />{summary.vendor_count} vendor accounts</span><span>Business day <strong className={`business-day business-day--${(summary.business_day_status || 'open').toLowerCase()}`}>{summary.business_day_status || 'OPEN'}</strong></span><span>Last updated <strong>{formatDateTime(summary.last_updated)}</strong></span></div></>}
    </section>
    {error && <div className="inline-error"><ErrorMessage>{error}</ErrorMessage><Button variant="outline" onClick={load}>Try again</Button></div>}
    {ownerFunds && <section className="owner-funds-panel">
      <div className="owner-funds-panel__main"><span className="owner-funds-kicker">Business reserve</span><h2>Available to distribute</h2><p>Maintain your business cash and MoMo reserves before assigning funds to vendors.</p>
        <div className="owner-funds-cards"><div><span>Cash reserve</span><strong>{formatMoney(ownerFunds.cash_balance)}</strong><small>Available for vendor allocation</small></div><div><span>MoMo reserve</span><strong>{formatMoney(ownerFunds.momo_balance)}</strong><small>Available for vendor allocation</small></div></div>
      </div>
      <form className="owner-funds-form" onSubmit={addFunds}><div className="owner-funds-form__heading"><span className="eyebrow">Reserve adjustment</span><strong>Record business funds</strong></div><label>Action<select name="operation" defaultValue="ADD" aria-label="Funds operation"><option value="ADD">Add to reserve</option><option value="SUBTRACT">Subtract from reserve</option></select></label><label>Balance type<select name="balance_type" defaultValue="CASH" aria-label="Balance type"><option value="CASH">Cash</option><option value="MOMO">Mobile money</option></select></label><label className="owner-funds-form__amount">Amount<input name="amount" type="text" inputMode="decimal" placeholder="0.00" aria-label="Amount" required /></label><Button type="submit" variant="success" size="large" className="owner-funds-submit">Update reserve</Button></form>
    </section>}
    <section className="owner-vendor-balances" aria-label="Vendor balances">
      <div className="owner-vendor-balances__heading"><div><span className="eyebrow">Team accounts</span><h2>Vendor balances</h2><p>Review each vendor's cash, MoMo, and business-day status.</p></div><span className="owner-vendor-record-count">{visibleBalances.length} <small>of {balances.length} vendors</small></span></div>
      <div className="owner-vendor-balance-tools"><label className="owner-vendor-search"><span className="sr-only">Search vendors</span><span aria-hidden="true">{'\u2315'}</span><input type="search" value={vendorSearch} onChange={(event) => setVendorSearch(event.target.value)} placeholder="Search by vendor name or ID" /></label><label className="owner-vendor-status-filter"><span>Business day</span><select value={businessDayFilter} onChange={(event) => setBusinessDayFilter(event.target.value)}><option value="ALL">All statuses</option><option value="OPEN">Open</option><option value="CLOSED">Closed</option><option value="MIXED">Mixed</option></select></label></div>
      {balances.length === 0 ? <div className="owner-balance-empty"><span aria-hidden="true">{'\u25a6'}</span><strong>No vendor balances yet</strong><p>Vendor balance accounts will appear here.</p></div> : visibleBalances.length === 0 ? <div className="owner-balance-empty"><span aria-hidden="true">{'\u2315'}</span><strong>No vendors match</strong><p>Try another name, vendor ID, or business-day status.</p></div> : <div className="owner-balance-table-wrap"><table className="management-table owner-balance-table"><thead><tr><th>Vendor</th><th>Cash balance</th><th>MoMo balance</th><th>Business day</th><th>Last updated</th><th><span className="sr-only">Vendor actions</span></th></tr></thead><tbody>{visibleBalances.map((vendor) => <tr key={vendor.vendor_id}><td><div className="owner-balance-vendor"><span>{(vendor.vendor_name || 'V').charAt(0).toUpperCase()}</span><div><strong>{vendor.vendor_name}</strong><small>Vendor #{vendor.vendor_id}</small></div></div></td><td><strong className="owner-balance-table__cash">{formatMoney(vendor.cash_balance)}</strong></td><td><strong className="owner-balance-table__momo">{formatMoney(vendor.momo_balance)}</strong></td><td><span className={`business-day business-day--${(vendor.business_day_status || 'open').toLowerCase()}`}>{vendor.business_day_status || 'OPEN'}</span></td><td><span className="owner-balance-updated">{formatDateTime(vendor.updated_at)}</span></td><td><button className="owner-balance-view" type="button" onClick={() => viewVendor(vendor)}>View account <span aria-hidden="true">{'\u2192'}</span></button></td></tr>)}</tbody></table></div>}
    </section>
    {selectedVendor && <section className="owner-balance-detail" aria-label="Vendor balance details">
      <div className="owner-balance-detail__heading"><div><span className="eyebrow">Vendor detail</span><h2>{selectedVendor.vendor_name}</h2></div><button type="button" className="owner-balance-close" onClick={() => setSelectedVendor(null)}>Close</button></div>
      {detailLoading ? <LoadingSpinner label="Loading vendor balance" /> : <><div className="owner-balance-detail__cards"><div><span>Cash Balance</span><strong>{formatMoney(selectedVendor.cash_balance)}</strong></div><div><span>MoMo Balance</span><strong>{formatMoney(selectedVendor.momo_balance)}</strong></div><div><span>Business-day status</span><strong>{selectedVendor.business_day_status}</strong></div><div><span>Last updated</span><strong>{formatDateTime(selectedVendor.updated_at)}</strong></div></div>
      {detailError && <ErrorMessage>{detailError}</ErrorMessage>}
      <form className="owner-balance-adjust" onSubmit={submitAdjustment}><div><span className="eyebrow">Owner allocation</span><h3>Set funds for this vendor</h3><p>This transfers available owner funds to the vendor. The backend enforces available funds and closed-day restrictions.</p></div><label htmlFor="owner-adjust-type">Balance type</label><select id="owner-adjust-type" value={form.balance_type} onChange={(event) => updateForm('balance_type', event.target.value)} disabled={saving}><option value="CASH">Cash</option><option value="MOMO">MoMo</option></select><label htmlFor="owner-adjust-amount">Adjustment amount</label><input id="owner-adjust-amount" value={form.amount} onChange={(event) => updateForm('amount', event.target.value)} placeholder="e.g. 100 or -50" inputMode="decimal" disabled={saving} /><label htmlFor="owner-adjust-reason">Reason</label><textarea id="owner-adjust-reason" value={form.reason} onChange={(event) => updateForm('reason', event.target.value)} minLength="5" maxLength="255" disabled={saving} /><Button type="submit" disabled={saving || !form.amount.trim() || form.reason.trim().length < 5}>{saving ? 'Applying...' : 'Adjust Balance'}</Button></form>
      <div className="owner-balance-history"><h3>Recent history</h3>{history.length ? <table className="management-table"><thead><tr><th>Date</th><th>Type</th><th>Change</th><th>Reason</th></tr></thead><tbody>{history.map((entry) => <tr key={entry.id}><td>{formatDateTime(entry.created_at)}</td><td>{entry.balance_type === 'CASH' ? 'Cash' : 'MoMo'}</td><td>{formatMoney(entry.change_amount)}</td><td>{entry.reason || '-'}</td></tr>)}</tbody></table> : <div className="empty-state">No balance history available.</div>}</div></>}
    </section>}
  </div>;
}
