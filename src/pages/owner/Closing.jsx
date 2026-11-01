import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllClosings } from '../../services/dailyClosingService';
import { getVendors } from '../../services/vendorService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import PageHeader from '../../components/PageHeader';
import { formatDate, formatMoney, formatNumber, localDate, dateDaysAgo } from '../../utils/format';
import './OwnerClosing.css';

const PAGE_SIZE = 10;
const EMPTY_FILTERS = { status: '', vendor_id: '', start_date: '', end_date: '', page: 1 };

const formatClosedAt = (value) => value
  ? new Date(value).toLocaleString('en-GH', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })
  : 'Awaiting closeout';

export default function OwnerClosing() {
  const [closings, setClosings] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const requestId = useRef(0);
  const navigate = useNavigate();

  const load = useCallback(() => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(null);
    getAllClosings({ ...filters, limit: PAGE_SIZE })
      .then((response) => {
        if (currentRequest !== requestId.current) return;
        const rows = response.data || [];
        setClosings(rows);
        setPagination(response.pagination || { page: filters.page, limit: PAGE_SIZE, total: rows.length, totalPages: 1 });
      })
      .catch((requestError) => {
        if (currentRequest === requestId.current) setError(requestError.message || 'Unable to load daily closings. Please try again.');
      })
      .finally(() => {
        if (currentRequest === requestId.current) setLoading(false);
      });
  }, [filters]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    getVendors().then((response) => setVendors(Array.isArray(response?.data) ? response.data : [])).catch(() => setVendors([]));
  }, []);

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  const setDateRange = (startDate, endDate) => setFilters((current) => ({ ...current, start_date: startDate, end_date: endDate, page: 1 }));
  const clearFilters = () => {
    requestId.current += 1;
    setError(null);
    setClosings([]);
    setFilters({ ...EMPTY_FILTERS });
  };
  const changePage = (page) => setFilters((current) => ({ ...current, page }));

  const summary = useMemo(() => closings.reduce((result, closing) => {
    if (closing.status === 'CLOSED') result.closed += 1;
    else result.open += 1;
    result.transactions += Number(closing.total_transactions || 0);
    result.amount += Number(closing.total_amount || 0);
    return result;
  }, { closed: 0, open: 0, transactions: 0, amount: 0 }), [closings]);

  if (loading && closings.length === 0 && !error) return <LoadingSpinner fullScreen label="Loading daily closings" />;
  if (error && closings.length === 0) return <div className="closing-page owner-closing-page"><PageHeader eyebrow="Owner workspace" title="Daily closeouts" /><div className="inline-error"><ErrorMessage>{error}</ErrorMessage><button type="button" onClick={load}>Try again</button></div></div>;

  return (
    <div className="closing-page owner-closing-page">
      <div className="daily-closing-heading owner-closeouts-heading">
        <PageHeader eyebrow="Owner workspace / operations" title="Daily closeouts" description="Track each vendor's business day, review recorded totals, and follow up on open closeouts." />
        <button className="owner-closing-refresh" type="button" onClick={load} disabled={loading} aria-label="Refresh closeout records">{loading ? 'Refreshing...' : <><span aria-hidden="true">{'\u21bb'}</span> Refresh</>}</button>
      </div>

      <section className="owner-closeouts-summary" aria-label="Closeout summary for this page">
        <article className="owner-closeouts-stat owner-closeouts-stat--records"><span className="owner-closeouts-stat__icon" aria-hidden="true">{'\u25a6'}</span><div><small>Matching closeouts</small><strong>{formatNumber(pagination.total)}</strong><span>Records for selected filters</span></div></article>
        <article className="owner-closeouts-stat owner-closeouts-stat--closed"><span className="owner-closeouts-stat__icon" aria-hidden="true">{'\u2713'}</span><div><small>Closed on this page</small><strong>{formatNumber(summary.closed)}</strong><span>Completed business days</span></div></article>
        <article className="owner-closeouts-stat owner-closeouts-stat--open"><span className="owner-closeouts-stat__icon" aria-hidden="true">{'\u23f1'}</span><div><small>Open on this page</small><strong>{formatNumber(summary.open)}</strong><span>Need vendor follow-up</span></div></article>
        <article className="owner-closeouts-stat owner-closeouts-stat--volume"><span className="owner-closeouts-stat__icon" aria-hidden="true">{'\u2197'}</span><div><small>Transaction value</small><strong>{formatMoney(summary.amount)}</strong><span>{formatNumber(summary.transactions)} transactions on this page</span></div></article>
      </section>

      <section className="owner-closeouts-controls" aria-label="Filter daily closeouts">
        <div className="owner-closeouts-controls__top"><div><span className="eyebrow">Closeout ledger</span><h2>Find business days</h2></div><button type="button" className="owner-closeouts-reset" onClick={clearFilters} disabled={!filters.status && !filters.vendor_id && !filters.start_date && !filters.end_date && filters.page === 1} aria-label="Reset filters and return to page one"><span aria-hidden="true">{'\u21ba'}</span>Reset filters</button></div>
        <div className="owner-closeouts-filter-grid">
          <label>Vendor<select value={filters.vendor_id} onChange={(event) => updateFilter('vendor_id', event.target.value)}><option value="">All vendors</option>{vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}</select></label>
          <label>Status<select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}><option value="">All statuses</option><option value="CLOSED">Closed</option><option value="OPEN">Open</option></select></label>
          <label>From date<input type="date" value={filters.start_date} onChange={(event) => updateFilter('start_date', event.target.value)} /></label>
          <label>To date<input type="date" value={filters.end_date} onChange={(event) => updateFilter('end_date', event.target.value)} /></label>
        </div>
        <div className="owner-closeouts-presets" aria-label="Quick date ranges"><span>Quick range</span><button type="button" className={filters.start_date === localDate() && filters.end_date === localDate() ? 'is-active' : ''} onClick={() => setDateRange(localDate(), localDate())}>Today</button><button type="button" className={filters.start_date === dateDaysAgo(6) && filters.end_date === localDate() ? 'is-active' : ''} onClick={() => setDateRange(dateDaysAgo(6), localDate())}>Last 7 days</button><button type="button" className={filters.start_date === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01` && filters.end_date === localDate() ? 'is-active' : ''} onClick={() => setDateRange(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`, localDate())}>This month</button></div>
      </section>

      <section className="owner-closeouts-ledger" aria-label="Vendor closeout records">
        <div className="owner-closeouts-ledger__heading"><div><span className="eyebrow">Vendor activity</span><h2>Closeout records</h2></div><span>{formatNumber(closings.length)} shown <i aria-hidden="true">/</i> {formatNumber(pagination.total)} total</span></div>
        {error && <div className="owner-closing-inline-error"><ErrorMessage>{error}</ErrorMessage><button type="button" onClick={load}>Retry</button></div>}
        {!error && !closings.length && <div className="owner-closeouts-empty"><span aria-hidden="true">{'\u2300'}</span><strong>{filters.status || filters.vendor_id || filters.start_date || filters.end_date ? 'No closeouts match these filters' : 'No closeouts recorded yet'}</strong><p>{filters.status || filters.vendor_id || filters.start_date || filters.end_date ? 'Try a different vendor, status, or date range.' : 'Completed vendor business days will appear here.'}</p></div>}
        {closings.length > 0 && <div className="owner-closeouts-table-wrap"><table className="owner-closeouts-table"><thead><tr><th>Vendor</th><th>Business date</th><th>Status</th><th>Transactions</th><th>Transaction value</th><th>Closed at</th><th><span className="sr-only">Details</span></th></tr></thead><tbody>{closings.map((closing) => (
          <tr key={closing.id}>
            <td><div className="owner-closeouts-vendor"><span>{(closing.vendor_name || 'V').charAt(0).toUpperCase()}</span><div><strong>{closing.vendor_name || 'Unknown vendor'}</strong><small>Vendor #{closing.vendor_id}</small></div></div></td>
            <td><strong className="owner-closeouts-date">{formatDate(closing.closing_date)}</strong></td>
            <td><span className={`owner-closeouts-status owner-closeouts-status--${(closing.status || 'open').toLowerCase()}`}><i aria-hidden="true" />{closing.status || 'OPEN'}</span></td>
            <td className="owner-closeouts-count">{formatNumber(closing.total_transactions || 0)}</td>
            <td className="owner-closeouts-amount">{formatMoney(closing.total_amount)}</td>
            <td><span className="owner-closeouts-time">{formatClosedAt(closing.closed_at)}</span></td>
            <td><button className="owner-closeouts-view" type="button" onClick={() => navigate(`/owner/closing/${closing.id}`)}>Details <span aria-hidden="true">{'\u2192'}</span></button></td>
          </tr>
        ))}</tbody></table></div>}
      </section>
      {pagination.totalPages > 1 && <nav className="owner-closing-pagination" aria-label="Daily closeout pages"><button type="button" disabled={pagination.page <= 1 || loading} onClick={() => changePage(pagination.page - 1)}>Previous</button><span>Page {pagination.page} of {pagination.totalPages}</span><button type="button" disabled={pagination.page >= pagination.totalPages || loading} onClick={() => changePage(pagination.page + 1)}>Next</button></nav>}
    </div>
  );
}
