import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getAllTransactions } from '../../services/transactionService';
import { getVendors } from '../../services/vendorService';
import LoadingSpinner from '../../components/LoadingSpinner';
import PageHeader from '../../components/PageHeader';
import ErrorMessage from '../../components/ErrorMessage';
import SummaryCard from '../../components/SummaryCard';
import { formatMoney, formatNumber } from '../../utils/format';
import './OwnerTransactions.css';

const TransactionStatusBadge = ({ status }) => {
  const colors = {
    COMPLETED: 'green',
    PENDING: 'orange',
    FAILED: 'red',
  };
  const color = colors[status] || 'gray';
  return <span className={`transaction-status transaction-status--${color}`}>{status}</span>;
};

export default function OwnerTransactions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [vendors, setVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [vendorsError, setVendorsError] = useState('');

  const filters = {
    type: searchParams.get('type') || '',
    status: searchParams.get('status') || '',
    vendor_id: searchParams.get('vendor_id') || '',
    start_date: searchParams.get('start_date') || '',
    end_date: searchParams.get('end_date') || '',
    search: searchParams.get('search') || '',
    sort_by: searchParams.get('sort_by') || 'transaction_date',
    sort_order: searchParams.get('sort_order') || 'desc',
    page: parseInt(searchParams.get('page') || '1', 10),
    limit: parseInt(searchParams.get('limit') || '10', 10),
  };

  // Fetch vendors for the vendor filter dropdown
  useEffect(() => {
    const fetchVendors = async () => {
      setVendorsLoading(true);
      setVendorsError('');
      try {
        const data = await getVendors();
        const vendorRows = Array.isArray(data) ? data : data?.data || data?.rows;
        setVendors(Array.isArray(vendorRows) ? vendorRows : []);
        if (!Array.isArray(vendorRows)) {
          setVendorsError('Vendor filter is unavailable.');
        }
      } catch (err) {
        setVendors([]);
        setVendorsError(err.message || 'Vendor filter is unavailable.');
      } finally {
        setVendorsLoading(false);
      }
    };
    fetchVendors();
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllTransactions({
        type: filters.type || undefined,
        status: filters.status || undefined,
        vendor_id: filters.vendor_id || undefined,
        start_date: filters.start_date || undefined,
        end_date: filters.end_date || undefined,
        search: filters.search || undefined,
        sort_by: filters.sort_by,
        sort_order: filters.sort_order,
        page: filters.page,
        limit: filters.limit,
      });
      setTransactions(Array.isArray(data?.rows) ? data.rows : []);
      setPagination(data?.pagination || { page: filters.page, limit: filters.limit, total: 0 });
    } catch (err) {
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [
    filters.type,
    filters.status,
    filters.vendor_id,
    filters.start_date,
    filters.end_date,
    filters.search,
    filters.sort_by,
    filters.sort_order,
    filters.page,
    filters.limit,
  ]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const updateParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', String(newPage));
    setSearchParams(newParams);
  };

  const handleLimitChange = (e) => {
    const newLimit = e.target.value;
    const newParams = new URLSearchParams(searchParams);
    newParams.set('limit', newLimit);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const clearFilters = () => setSearchParams({});

  const setQuickDate = (daysAgo) => {
    const start = new Date();
    start.setDate(start.getDate() - daysAgo);
    const iso = start.toISOString().split('T')[0];
    const newParams = new URLSearchParams(searchParams);
    newParams.set('start_date', iso);
    newParams.delete('end_date');
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const transactionSummary = transactions.reduce((summary, transaction) => {
    const amount = Number(transaction.amount || 0);
    summary.amount += amount;
    summary[transaction.status?.toLowerCase()] = (summary[transaction.status?.toLowerCase()] || 0) + 1;
    return summary;
  }, { amount: 0, completed: 0, pending: 0, failed: 0 });
  const totalPages = Math.ceil(Number(pagination.total || 0) / Number(pagination.limit || filters.limit)) || 1;

  if (loading) return <LoadingSpinner fullScreen label="Loading transactions" />;
  if (error) return <ErrorMessage message={error} retry={fetchTransactions} />;

  return (
    <div className="owner-transactions-page">
      <div className="owner-transactions-heading">
        <PageHeader eyebrow="Business activity" title="All transactions" description="A clear view of every vendor transaction across your business." />
        <div className="owner-transactions-heading__meta">
          <span className="owner-transactions-heading__dot" />
          Live transaction ledger
        </div>
      </div>
      <section className="summary-grid" aria-label="Transaction summary">
        <SummaryCard label="Transactions shown" value={formatNumber(transactions.length)} detail={`${formatNumber(pagination.total)} matching records`} icon="01" tone="copper" />
        <SummaryCard label="Value shown" value={formatMoney(transactionSummary.amount)} detail="Current page total" icon="02" tone="teal" />
        <SummaryCard label="Completed" value={formatNumber(transactionSummary.completed)} detail="Current page" icon="03" tone="gold" />
        <SummaryCard label="Needs attention" value={formatNumber(transactionSummary.pending + transactionSummary.failed)} detail={`${formatNumber(transactionSummary.pending)} pending · ${formatNumber(transactionSummary.failed)} failed`} icon="04" tone="blue" />
      </section>
      <section className="transaction-filter-panel" aria-label="Transaction filters">
        <div className="transaction-filter-panel__top">
          <div>
            <span className="transaction-filter-panel__eyebrow">Refine activity</span>
            <h2>Find a transaction</h2>
          </div>
          <button className="transaction-clear-button" type="button" onClick={clearFilters}>Clear all</button>
        </div>
      <div className="toolbar">
        <input
          type="text"
          placeholder="Search…"
          value={filters.search}
          onChange={(e) => updateParam('search', e.target.value)}
        />
        <select value={filters.type} onChange={(e) => updateParam('type', e.target.value)}>
          <option value="">All Types</option>
          <option value="DEPOSIT">Deposit</option>
          <option value="WITHDRAWAL">Withdrawal</option>
          <option value="TRANSFER">Transfer</option>
          <option value="AIRTIME">Airtime</option>
          <option value="DATA">Data</option>
          <option value="BILL_PAYMENT">Bill Payment</option>
        </select>
        <select value={filters.status} onChange={(e) => updateParam('status', e.target.value)}>
          <option value="">All Statuses</option>
          <option value="COMPLETED">Completed</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
        </select>
        <select value={filters.vendor_id} onChange={(e) => updateParam('vendor_id', e.target.value)} disabled={vendorsLoading}>
          <option value="">All Vendors</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name || v.vendor_name || v.id}
            </option>
          ))}
        </select>
        {vendorsError && <span role="status">{vendorsError}</span>}
        <label className="transaction-date-filter">
          <span>From date</span>
          <input type="date" value={filters.start_date} onChange={(e) => updateParam('start_date', e.target.value)} aria-label="From date" />
        </label>
        <label className="transaction-date-filter">
          <span>To date</span>
          <input type="date" value={filters.end_date} onChange={(e) => updateParam('end_date', e.target.value)} aria-label="To date" />
        </label>
        <button type="button" onClick={() => setQuickDate(0)}>Today</button>
        <button type="button" onClick={() => setQuickDate(1)}>Yesterday</button>
        <button type="button" onClick={() => setQuickDate(7)}>Last 7 Days</button>
        <button type="button" onClick={() => setQuickDate(30)}>Last 30 Days</button>
        <select value={filters.sort_by} onChange={(e) => updateParam('sort_by', e.target.value)}>
          <option value="transaction_date">Date</option>
          <option value="amount">Amount</option>
          <option value="created_at">Created At</option>
        </select>
        <select value={filters.sort_order} onChange={(e) => updateParam('sort_order', e.target.value)}>
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
        <select value={filters.limit} onChange={handleLimitChange}>
          <option value={10}>10 / page</option>
          <option value={20}>20 / page</option>
          <option value={50}>50 / page</option>
          <option value={100}>100 / page</option>
        </select>
      </div>
      </section>
      {transactions.length === 0 ? (
        <div>No transactions found for the selected criteria.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
        <table className="transaction-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Vendor</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Customer Ref</th>
              <th>Status</th>
              <th>Date</th>
              <th>Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td>{tx.id}</td>
                <td>{tx.vendor_name || tx.vendor_id || '—'}</td>
                <td>{tx.type}</td>
                <td>{formatMoney(tx.amount)}</td>
                <td>{tx.customer_reference || '—'}</td>
                <td><TransactionStatusBadge status={tx.status} /></td>
                <td>{tx.transaction_date || tx.created_at?.split('T')[0] || '—'}</td>
                <td>{tx.transaction_time || tx.created_at?.split('T')[1]?.slice(0, 8) || '—'}</td>
                <td>
                  <button type="button" onClick={() => navigate(`/owner/transactions/${tx.id}`)}>
                    Open
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
      <div className="pagination" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
        <button type="button" disabled={pagination.page <= 1} onClick={() => handlePageChange(pagination.page - 1)}>
          Prev
        </button>
        <span>Page {pagination.page} of {totalPages}</span>
        <button type="button" disabled={pagination.page >= totalPages} onClick={() => handlePageChange(pagination.page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
