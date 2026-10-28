import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Button from '../../components/Button';
import { getMyReconciliation } from '../../services/reconciliationService';
import { formatDate, formatMoney, localDate } from '../../utils/format';
import './VendorReconciliation.css';

const money = (value) => value === null || value === undefined ? 'Not available' : formatMoney(value);

function PositionCard({ label, balance, movement, tone, updatedAt }) {
  return <article className={`vendor-reconciliation-position vendor-reconciliation-position--${tone}`}>
    <div className="vendor-reconciliation-position__heading">
      <span>{label} position</span>
      <strong>{money(balance)}</strong>
    </div>
    <div className="vendor-reconciliation-position__row"><span>Transaction movement</span><strong>{money(movement)}</strong></div>
    <div className="vendor-reconciliation-position__row"><span>Opening balance</span><strong>Not available</strong></div>
    <div className="vendor-reconciliation-position__row"><span>Expected closing</span><strong>Not available</strong></div>
    <div className="vendor-reconciliation-position__row"><span>Difference</span><strong>Not available</strong></div>
    <small>Last updated: {updatedAt ? new Date(updatedAt).toLocaleString('en-GH') : 'Not available'}</small>
  </article>;
}

function ClosingPanel({ closing }) {
  const closed = closing.status === 'CLOSED';
  return <section className="vendor-reconciliation-closing">
    <div>
      <span className="eyebrow">Daily closing</span>
      <h2>{closed ? 'Business day closed' : 'Business day open'}</h2>
      <p>{closed ? 'Transactions for this business day are locked.' : 'The business day is still accepting activity.'}</p>
    </div>
    <span className={`vendor-reconciliation-status vendor-reconciliation-status--${String(closing.status).toLowerCase()}`}>{closing.status}</span>
    {closed && <div className="vendor-reconciliation-closing__details">
      <span>Closed at<strong>{closing.closed_at ? new Date(closing.closed_at).toLocaleString('en-GH') : 'Not available'}</strong></span>
      <span>Transactions at close<strong>{closing.transaction_count ?? 'Not available'}</strong></span>
      <span>Total at close<strong>{money(closing.total_amount)}</strong></span>
    </div>}
  </section>;
}

export default function VendorReconciliation() {
  const navigate = useNavigate();
  const [date, setDate] = useState(localDate());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReconciliation = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getMyReconciliation(date);
      setData(response.data || null);
    } catch (requestError) {
      setData(null);
      setError(requestError.message || 'Unable to load reconciliation. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    loadReconciliation();
  }, [loadReconciliation]);

  const viewTransactions = () => navigate(`/vendor/transactions?start_date=${encodeURIComponent(date)}&end_date=${encodeURIComponent(date)}`);

  if (loading) return <LoadingSpinner fullScreen label="Loading reconciliation" />;

  return <div className="vendor-reconciliation-page">
    <div className="vendor-reconciliation-heading">
      <PageHeader eyebrow="Financial control" title="Reconciliation" description="Review your backend-recorded activity, balances, and business-day status." />
      <Button variant="outline" onClick={loadReconciliation} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh'}</Button>
    </div>

    <section className="vendor-reconciliation-toolbar">
      <div>
        <label htmlFor="vendor-reconciliation-date">Business date</label>
        <input id="vendor-reconciliation-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      </div>
      <span>All figures are supplied by the backend.</span>
    </section>

    {error ? <div className="vendor-reconciliation-error"><ErrorMessage>{error}</ErrorMessage><Button variant="outline" onClick={loadReconciliation}>Try again</Button></div> : !data ? <div className="vendor-reconciliation-empty">No reconciliation data available.</div> : <>
      <section className="vendor-reconciliation-day">
        <div><span className="eyebrow">Business day</span><h2>{formatDate(data.business_date)}</h2></div>
        <span className={`vendor-reconciliation-status vendor-reconciliation-status--${String(data.closing.status).toLowerCase()}`}>{data.closing.status}</span>
      </section>

      <section className="vendor-reconciliation-grid">
        <PositionCard label="Cash" balance={data.current_balance?.cash} movement={data.transaction_activity.cash_movement} tone="cash" updatedAt={data.current_balance?.updated_at} />
        <PositionCard label="MoMo" balance={data.current_balance?.momo} movement={data.transaction_activity.momo_movement} tone="momo" updatedAt={data.current_balance?.updated_at} />
      </section>

      <section className="vendor-reconciliation-activity">
        <div><span className="eyebrow">Transaction activity</span><h2>{data.transaction_activity.count} completed transactions</h2></div>
        <div className="vendor-reconciliation-activity__metrics">
          <span>Total amount<strong>{formatMoney(data.transaction_activity.amount)}</strong></span>
          <span>Deposits<strong>{formatMoney(data.transaction_activity.deposits)}</strong></span>
          <span>Withdrawals<strong>{formatMoney(data.transaction_activity.withdrawals)}</strong></span>
          <span>Transfers<strong>{formatMoney(data.transaction_activity.transfers)}</strong></span>
          <span>Other types<strong>{formatMoney(data.transaction_activity.other)}</strong></span>
        </div>
      </section>

      <ClosingPanel closing={data.closing} />

      <section className="vendor-reconciliation-actions">
        <div><strong>Need to verify an entry?</strong><p>Open the transactions recorded for this business date.</p></div>
        <div><Button variant="outline" onClick={viewTransactions}>View Transactions</Button><Button variant="outline" onClick={() => navigate('/vendor/closing')}>View Daily Closing</Button></div>
      </section>

      <section className="vendor-reconciliation-unavailable">
        <strong>Reconciliation status: Not Available</strong>
        <p>The backend currently does not provide opening snapshots, expected closing balances, actual closing snapshots, or calculated differences. No financial values are calculated in the frontend.</p>
      </section>
    </>}
  </div>;
}
