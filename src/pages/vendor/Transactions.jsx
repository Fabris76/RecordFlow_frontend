import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getMyTransactions } from '../../services/transactionService';
import LoadingSpinner from '../../components/LoadingSpinner';
import PageHeader from '../../components/PageHeader';
import ErrorMessage from '../../components/ErrorMessage';

// Simple helper to format currency – reuse existing utils if available
import { formatMoney } from '../../utils/format';
import { formatNumber } from '../../utils/formatters';
import './VendorTransactions.css';

const TransactionStatusBadge = ({ status }) => {
  const colors = {
    COMPLETED: 'green',
    PENDING: 'orange',
    FAILED: 'red',
  };
  const color = colors[status] || 'gray';
  return (
    <span className={`vendor-transaction-status vendor-transaction-status--${color}`}>{status}</span>
  );
};

export default function Transactions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  // Extract filter values from URL query params
  const filters = {
    type: searchParams.get('type') || '',
    status: searchParams.get('status') || '',
    start_date: searchParams.get('start_date') || '',
    end_date: searchParams.get('end_date') || '',
    search: searchParams.get('search') || '', // maps to customer or transaction reference
    sort_by: searchParams.get('sort_by') || 'transaction_date',
    sort_order: searchParams.get('sort_order') || 'desc',
    page: parseInt(searchParams.get('page') || '1', 10),
    limit: parseInt(searchParams.get('limit') || '10', 10),
  };

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyTransactions({
        type: filters.type || undefined,
        status: filters.status || undefined,
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
    filters.start_date,
    filters.end_date,
    filters.search,
    filters.sort_by,
    filters.sort_order,
    filters.page,
    filters.limit,
  ]);

  // Refetch when filters change
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Handlers for filters – they update URL params which triggers reload
  const updateParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value); else newParams.delete(key);
    // Reset to page 1 on filter change
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

  const clearFilters = () => {
    setSearchParams({});
  };

  // Quick‑date helpers
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

  const totalPages = Math.ceil(Number(pagination.total || 0) / Number(pagination.limit || filters.limit)) || 1;
  const completedCount = transactions.filter((transaction) => transaction.status === 'COMPLETED').length;
  const visibleAmount = transactions.reduce((total, transaction) => total + Number(transaction.amount || 0), 0);

  if (loading) return <LoadingSpinner fullScreen label="Loading transactions" />;
  if (error) return <ErrorMessage message={error} retry={fetchTransactions} />;

  return (
    <div className="vendor-transactions-page">
      <div className="vendor-transactions-heading">
        <PageHeader eyebrow="Vendor workspace" title="Transactions" description="Review your recorded activity and keep every entry easy to find." />
        <button className="vendor-transactions-refresh" type="button" onClick={fetchTransactions} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh'}</button>
      </div>
      <section className="vendor-transaction-summary" aria-label="Transaction summary">
        <div><span>Matching transactions</span><strong>{formatNumber(pagination.total || 0)}</strong><small>Across all pages</small></div>
        <div><span>Shown on this page</span><strong>{formatNumber(transactions.length)}</strong><small>{formatNumber(completedCount)} completed</small></div>
        <div><span>Value shown</span><strong>{formatMoney(visibleAmount)}</strong><small>Current page total</small></div>
      </section>
      <div className="toolbar" style={{ marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {/* Search */}
        <input
          type="text"
          placeholder="Search…"
          value={filters.search}
          onChange={(e) => updateParam('search', e.target.value)}
        />
        {/* Type filter */}
        <select value={filters.type} onChange={(e) => updateParam('type', e.target.value)}>
          <option value="">All Types</option>
          <option value="DEPOSIT">Deposit</option>
          <option value="WITHDRAWAL">Withdrawal</option>
          <option value="TRANSFER">Transfer</option>
          <option value="AIRTIME">Airtime</option>
          <option value="DATA">Data</option>
          <option value="BILL_PAYMENT">Bill Payment</option>
        </select>
        {/* Status filter */}
        <select value={filters.status} onChange={(e) => updateParam('status', e.target.value)}>
          <option value="">All Statuses</option>
          <option value="COMPLETED">Completed</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
        </select>
        {/* Date range */}
        <input
          type="date"
          value={filters.start_date}
          onChange={(e) => updateParam('start_date', e.target.value)}
          placeholder="Start date"
        />
        <input
          type="date"
          value={filters.end_date}
          onChange={(e) => updateParam('end_date', e.target.value)}
          placeholder="End date"
        />
        {/* Quick dates */}
        <button type="button" onClick={() => setQuickDate(0)}>Today</button>
        <button type="button" onClick={() => setQuickDate(1)}>Yesterday</button>
        <button type="button" onClick={() => setQuickDate(7)}>Last 7 Days</button>
        <button type="button" onClick={() => setQuickDate(30)}>Last 30 Days</button>
        <button type="button" onClick={clearFilters}>Clear Filters</button>
        {/* Sorting */}
        <select value={filters.sort_by} onChange={(e) => updateParam('sort_by', e.target.value)}>
          <option value="transaction_date">Date</option>
          <option value="amount">Amount</option>
          <option value="created_at">Created At</option>
        </select>
        <select value={filters.sort_order} onChange={(e) => updateParam('sort_order', e.target.value)}>
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
        {/* Page size */}
        <select value={filters.limit} onChange={handleLimitChange}>
          <option value={10}>10 / page</option>
          <option value={20}>20 / page</option>
          <option value={50}>50 / page</option>
          <option value={100}>100 / page</option>
        </select>
      </div>
      {transactions.length === 0 ? (
        <div className="vendor-transactions-empty"><strong>No transactions found</strong><span>Try changing the filters or selecting a wider date range.</span></div>
      ) : (
        <div className="vendor-transactions-table-wrap"><table className="transaction-table">
          <thead>
            <tr>
              <th>ID</th>
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
                <td>{tx.type}</td>
                <td>{formatMoney(tx.amount)}</td>
                <td>{tx.customer_reference || '—'}</td>
                <td><TransactionStatusBadge status={tx.status} /></td>
                <td>{tx.transaction_date || tx.created_at?.split('T')[0] || '—'}</td>
                <td>{tx.transaction_time || tx.created_at?.split('T')[1]?.slice(0, 8) || '—'}</td>
                <td>
                  <button type="button" onClick={() => navigate(`/vendor/transactions/${tx.id}`)}>
                    View details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
      {/* Pagination controls */}
      <div className="pagination" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
        <button
          type="button"
          disabled={pagination.page <= 1}
          onClick={() => handlePageChange(pagination.page - 1)}
        >
          Prev
        </button>
        <span>Page {pagination.page} of {totalPages}</span>
        <button
          type="button"
          disabled={pagination.page >= totalPages}
          onClick={() => handlePageChange(pagination.page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
