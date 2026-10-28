import { useCallback, useEffect, useMemo, useState } from 'react';
import { createVendor, deleteAllVendors, getVendors, updateVendor, updateVendorStatus } from '../../services/vendorService';
import { adjustVendorBalance, getAllBalanceHistory, getAllBalances, getVendorBalance } from '../../services/balanceService';
import { formatMoney, formatNumber } from '../../utils/formatters';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';
import LoadingSpinner from '../../components/LoadingSpinner';
import PageHeader from '../../components/PageHeader';

const emptyForm = { name: '', phone: '', password: '', confirmPassword: '' };

function StatusBadge({ status }) { return <span className={`vendor-status vendor-status--${status.toLowerCase()}`}>{status === 'ACTIVE' ? 'Active' : 'Inactive'}</span>; }
function Modal({ title, children, onClose }) { return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="vendor-modal-title"><button className="modal-close" type="button" aria-label="Close dialog" onClick={onClose}>x</button><p className="eyebrow">Vendor account</p><h2 id="vendor-modal-title">{title}</h2>{children}</section></div>; }

function BalanceModal({ vendor, onClose, onChanged }) {
  const [balance, setBalance] = useState(null); const [history, setHistory] = useState([]); const [form, setForm] = useState({ balance_type: 'CASH', amount: '', reason: '' }); const [confirming, setConfirming] = useState(false); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  const load = useCallback(async () => { setLoading(true); setError(''); try { const [balanceResponse, historyResponse] = await Promise.all([getVendorBalance(vendor.id), getAllBalanceHistory({ vendor_id: vendor.id, limit: 50 })]); setBalance(balanceResponse.data); setHistory(historyResponse.data || []); } catch (requestError) { setError(requestError.message || 'Unable to load vendor balance.'); } finally { setLoading(false); } }, [vendor.id]);
  useEffect(() => { load(); }, [load]);
  const change = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  async function submitAdjustment() { setSaving(true); setError(''); try { await adjustVendorBalance(vendor.id, { balance_type: form.balance_type, amount: form.amount.trim(), reason: form.reason.trim() }); setConfirming(false); setForm({ balance_type: 'CASH', amount: '', reason: '' }); await load(); onChanged(); } catch (requestError) { setError(requestError.message || 'Unable to adjust vendor balance.'); } finally { setSaving(false); } }
  if (confirming) return <Modal title="Confirm Balance Adjustment" onClose={() => setConfirming(false)}><div className="balance-confirmation"><p><strong>Vendor:</strong> {vendor.name}</p><p><strong>Balance type:</strong> {form.balance_type === 'CASH' ? 'Cash' : 'MoMo'}</p><p><strong>Adjustment amount:</strong> {formatMoney(form.amount)}</p><p><strong>Reason:</strong> {form.reason}</p></div><ErrorMessage>{error}</ErrorMessage><div className="modal-actions"><Button variant="outline" onClick={() => setConfirming(false)} disabled={saving}>Cancel</Button><Button onClick={submitAdjustment} disabled={saving}>{saving ? 'Applying...' : 'Confirm Adjustment'}</Button></div></Modal>;
  return <Modal title={`Balance — ${vendor.name}`} onClose={onClose}><div className="balance-owner-detail">{loading ? <LoadingSpinner label="Loading vendor balance" /> : balance ? <><div className="balance-owner-cards"><div><span>Cash Balance</span><strong>{formatMoney(balance.cash_balance)}</strong></div><div><span>MoMo Balance</span><strong>{formatMoney(balance.momo_balance)}</strong></div></div><p><strong>Business Day:</strong> {balance.business_day_status}</p><p><strong>Last Updated:</strong> {balance.updated_at ? new Date(balance.updated_at).toLocaleString('en-GH') : 'Not available'}</p></> : <p>Balance information is unavailable.</p>}<ErrorMessage>{error}</ErrorMessage><h3>Adjust balance</h3><p className="field-help">The backend calculates the resulting balance. Do not enter a replacement balance.</p><label htmlFor="owner-balance-type">Balance type</label><select id="owner-balance-type" value={form.balance_type} onChange={change('balance_type')} disabled={saving}><option value="CASH">Cash</option><option value="MOMO">MoMo</option></select><label htmlFor="owner-balance-amount">Adjustment amount</label><input id="owner-balance-amount" type="text" inputMode="decimal" value={form.amount} onChange={change('amount')} placeholder="Use a negative amount to decrease" disabled={saving} /><label htmlFor="owner-balance-reason">Reason</label><textarea id="owner-balance-reason" value={form.reason} onChange={change('reason')} maxLength="255" disabled={saving} /><Button onClick={() => setConfirming(true)} disabled={saving || !form.amount.trim() || form.reason.trim().length < 5}>Review Adjustment</Button><h3>Balance history</h3>{history.length ? <div className="balance-history-table"><table className="management-table"><thead><tr><th>Date/time</th><th>Type</th><th>Adjustment</th><th>Reason</th><th>Performed by</th></tr></thead><tbody>{history.map((entry) => <tr key={entry.id}><td>{entry.created_at ? new Date(entry.created_at).toLocaleString('en-GH') : '-'}</td><td>{entry.balance_type === 'CASH' ? 'Cash' : 'MoMo'}</td><td>{formatMoney(entry.change_amount)}</td><td>{entry.reason}</td><td>{entry.changed_by_name || '-'}</td></tr>)}</tbody></table></div> : <div className="empty-state">No balance history available.</div>}</div></Modal>;
}

function PasswordField({ id, label, value, onChange, visible, onToggle, disabled }) {
  return <div className="vendor-password-field">
    <label htmlFor={id}>{label}</label>
    <div className="vendor-password-input">
      <input id={id} type={visible ? 'text' : 'password'} value={value} onChange={onChange} disabled={disabled} autoComplete="new-password" />
      <button type="button" className="password-toggle" onClick={onToggle} disabled={disabled} aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}>
        {visible ? 'Hide' : 'Show'}
      </button>
    </div>
  </div>;
}

function VendorForm({ vendor, onDone, onCancel }) {
  const editing = Boolean(vendor);
  const [form, setForm] = useState(vendor ? { name: vendor.name, phone: vendor.phone, password: '', confirmPassword: '' } : emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(''); const [saving, setSaving] = useState(false);
  const change = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  async function submit(event) {
    event.preventDefault(); setError('');
    if (form.name.trim().length < 2 || form.name.trim().length > 100) return setError('Name must be between 2 and 100 characters.');
    if (!/^0\d{9}$/.test(form.phone.trim())) return setError('Enter a valid 10-digit phone number starting with 0.');
    const strong = form.password.length >= 8 && /[A-Z]/.test(form.password) && /[a-z]/.test(form.password) && /\d/.test(form.password) && /[^A-Za-z0-9]/.test(form.password);
    if (!editing && !strong) return setError('Password must be 8+ characters with uppercase, lowercase, a number, and a special character.');
    if (!editing && form.password !== form.confirmPassword) return setError('Passwords do not match.');
    setSaving(true);
    try {
      const response = editing ? await updateVendor(vendor.id, { name: form.name.trim(), phone: form.phone.trim() }) : await createVendor({ name: form.name.trim(), phone: form.phone.trim(), password: form.password });
      onDone(response.message || (editing ? 'Vendor updated successfully.' : 'Vendor created successfully.'));
    } catch (requestError) { setError(requestError.message); } finally { setSaving(false); }
  }
  return <form className="vendor-form" onSubmit={submit} noValidate>
    {!editing && <div className="vendor-form-intro"><span className="vendor-form-icon">+</span><div><strong>Create a vendor account</strong><p>Set up secure access for a new member of your team.</p></div></div>}
    <div className="vendor-form-fields">
      <div><label htmlFor="vendor-name">Full name</label><input id="vendor-name" value={form.name} onChange={change('name')} disabled={saving} autoFocus placeholder="e.g. Ama Mensah" /></div>
      <div><label htmlFor="vendor-phone">Phone number</label><input id="vendor-phone" type="tel" value={form.phone} onChange={change('phone')} disabled={saving} placeholder="0240000000" /></div>
    </div>
    {!editing && <div className="vendor-form-security">
      <div><strong>Account security</strong><p>Use a strong password with uppercase, lowercase, a number, and a special character.</p></div>
      <PasswordField id="vendor-password" label="Initial password" value={form.password} onChange={change('password')} visible={showPassword} onToggle={() => setShowPassword((current) => !current)} disabled={saving} />
      <PasswordField id="vendor-confirm-password" label="Confirm password" value={form.confirmPassword} onChange={change('confirmPassword')} visible={showConfirmPassword} onToggle={() => setShowConfirmPassword((current) => !current)} disabled={saving} />
    </div>}
    <ErrorMessage>{error}</ErrorMessage><div className="modal-actions"><Button variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? (editing ? 'Saving...' : 'Creating vendor...') : (editing ? 'Save changes' : 'Create vendor')}</Button></div>
  </form>;
}

export default function VendorManagement() {
  const [vendors, setVendors] = useState([]); const [allVendors, setAllVendors] = useState([]); const [balances, setBalances] = useState({}); const [status, setStatus] = useState('ALL'); const [search, setSearch] = useState(''); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [modal, setModal] = useState(null); const [toast, setToast] = useState(''); const [actionId, setActionId] = useState(null);
  const load = useCallback(async ({ query = search, filter = status, initial = false } = {}) => { setLoading(true); setError(''); try { const [vendorResponse, balanceResponse] = await Promise.all([getVendors({ search: query, status: filter }), getAllBalances()]); setVendors(vendorResponse.data || []); setBalances(Object.fromEntries((balanceResponse.data || []).map((balance) => [balance.vendor_id, balance]))); if (initial) setAllVendors(vendorResponse.data || []); } catch (requestError) { setError(requestError.message || 'Unable to load vendors and balances.'); } finally { setLoading(false); } }, [search, status]);
  useEffect(() => { const timer = setTimeout(() => load({ initial: search === '' && status === 'ALL' }), 350); return () => clearTimeout(timer); }, [search, status, load]);
  const counts = useMemo(() => ({ total: allVendors.length, active: allVendors.filter((vendor) => vendor.status === 'ACTIVE').length, inactive: allVendors.filter((vendor) => vendor.status === 'INACTIVE').length }), [allVendors]);
  const showToast = (message) => { setToast(message); setTimeout(() => setToast(''), 3200); };
  async function refreshAfterChange(message) { setModal(null); showToast(message); const response = await getVendors(); setAllVendors(response.data || []); await load({ query: search, filter: status }); }
  async function removeAllVendors() {
    const confirmation = window.prompt('This permanently deletes every vendor and their transactions, closings, balances, and related history. Type DELETE_ALL_VENDORS to continue.');
    if (confirmation !== 'DELETE_ALL_VENDORS') return;
    setActionId('all');
    setError('');
    try {
      const response = await deleteAllVendors();
      showToast(response.message || 'All vendors were permanently removed.');
      setStatus('ALL');
      setSearch('');
      await load({ query: '', filter: 'ALL', initial: true });
    } catch (requestError) {
      setError(requestError.message || 'Unable to remove all vendors.');
    } finally {
      setActionId(null);
    }
  }
  async function changeStatus(vendor) { const next = vendor.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'; const action = next === 'ACTIVE' ? 'Activate' : 'Deactivate'; if (!window.confirm(`${action} ${vendor.name}?${next === 'INACTIVE' ? '\n\nThe vendor will no longer be able to access their account.' : ''}`)) return; setActionId(vendor.id); try { const response = await updateVendorStatus(vendor.id, next); showToast(response.message || `Vendor ${next === 'ACTIVE' ? 'activated' : 'deactivated'} successfully.`); const fresh = await getVendors(); setAllVendors(fresh.data || []); await load({ query: search, filter: status }); } catch (requestError) { setError(requestError.message); } finally { setActionId(null); } }
  return <div className="vendor-page"><div className="vendor-page-heading"><PageHeader eyebrow="Owner workspace" title="Vendor Management" description="Manage your business vendors and their accounts." /><div className="vendor-page-actions"><Button variant="outline" onClick={removeAllVendors} disabled={actionId === 'all' || allVendors.length === 0}>{actionId === 'all' ? 'Removing vendors...' : 'Remove all vendors'}</Button><Button onClick={() => setModal({ type: 'create' })}>+ Add vendor</Button></div></div>
    <section className="vendor-summary"><div><span>Total vendors</span><strong>{formatNumber(counts.total)}</strong></div><div><span>Active vendors</span><strong className="summary-green">{formatNumber(counts.active)}</strong></div><div><span>Inactive vendors</span><strong className="summary-muted">{formatNumber(counts.inactive)}</strong></div></section>
    <section className="vendor-list-panel"><div className="vendor-toolbar"><div className="vendor-search"><label htmlFor="vendor-search">Search vendors</label><input id="vendor-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or phone" /></div><div className="vendor-filter"><label htmlFor="vendor-status-filter">Status</label><select id="vendor-status-filter" value={status} onChange={(event) => setStatus(event.target.value)}><option value="ALL">All vendors</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></div></div>
      {error && <div className="inline-error"><ErrorMessage>{error}</ErrorMessage><Button variant="outline" onClick={() => load()}>Retry</Button></div>}
      {loading ? <LoadingSpinner label="Loading vendors" /> : vendors.length === 0 ? <div className="vendor-empty"><h2>{search ? 'No vendors match your search.' : 'No vendors have been added yet.'}</h2><p>{search ? 'Try a different name, phone number, or status.' : 'Add your first vendor account to get started.'}</p>{!search && <Button onClick={() => setModal({ type: 'create' })}>+ Add vendor</Button>}</div> : <div className="vendor-table-scroll"><table className="management-table"><thead><tr><th>Vendor</th><th>Phone</th><th>Status</th><th>Cash balance</th><th>MoMo balance</th><th>Business day</th><th>Last updated</th><th>Actions</th></tr></thead><tbody>{vendors.map((vendor) => { const balance = balances[vendor.id]; return <tr key={vendor.id}><td><div className="vendor-identity"><span className="table-avatar">{vendor.name.charAt(0)}</span><strong>{vendor.name}</strong></div></td><td>{vendor.phone}</td><td><StatusBadge status={vendor.status} /></td><td>{balance ? formatMoney(balance.cash_balance) : 'Unavailable'}</td><td>{balance ? formatMoney(balance.momo_balance) : 'Unavailable'}</td><td>{balance?.business_day_status || 'Unavailable'}</td><td>{balance?.updated_at ? new Date(balance.updated_at).toLocaleString('en-GH') : '-'}</td><td><div className="row-actions"><button type="button" onClick={() => setModal({ type: 'balance', vendor })}>Balance</button><button type="button" onClick={() => setModal({ type: 'edit', vendor })}>Edit</button><button type="button" disabled={actionId === vendor.id} onClick={() => changeStatus(vendor)}>{actionId === vendor.id ? 'Saving...' : vendor.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}</button></div></td></tr>; })}</tbody></table></div>}
  </section>{modal?.type === 'balance' && <BalanceModal vendor={modal.vendor} onClose={() => setModal(null)} onChanged={() => load()} />}{modal && modal.type !== 'balance' && <Modal title={modal.type === 'edit' ? 'Edit vendor' : 'Add vendor'} onClose={() => setModal(null)}><VendorForm vendor={modal.vendor} onCancel={() => setModal(null)} onDone={refreshAfterChange} /></Modal>}{toast && <div className="toast" role="status">{toast}</div>}</div>;
}
