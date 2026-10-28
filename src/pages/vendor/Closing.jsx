import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTodayStatus, createClosing } from '../../services/dailyClosingService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import ConfirmModal from '../../components/ConfirmModal';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import { formatMoney, formatDate } from '../../utils/format';
import './DailyClosing.css';

export default function VendorClosing() {
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [closingLoading, setClosingLoading] = useState(false);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getTodayStatus();
      setStatusData(response.data);
    } catch (requestError) {
      setError(requestError.message || 'Unable to load today’s business day.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function confirmClosing() {
    setClosingLoading(true);
    setError('');
    try {
      await createClosing(statusData.date);
      setShowModal(false);
      await load();
    } catch (requestError) {
      setError(requestError.message || 'Unable to close the business day.');
    } finally {
      setClosingLoading(false);
    }
  }

  if (loading && !statusData) return <LoadingSpinner label="Loading daily closing status" />;
  if (!statusData) return <section className="dashboard-error"><h1>Daily closing unavailable</h1><ErrorMessage>{error}</ErrorMessage><Button onClick={load}>Retry</Button></section>;

  const isClosed = statusData.status === 'CLOSED';
  return <div className="closing-page">
    <div className="daily-closing-heading">
      <PageHeader eyebrow="Vendor workspace" title="Daily Closing" description="Review and close today’s backend-recorded business day." />
      <Button variant="outline" onClick={load} disabled={loading || closingLoading}>{loading ? 'Refreshing...' : 'Refresh'}</Button>
    </div>
    {error && <div className="inline-error"><ErrorMessage>{error}</ErrorMessage><Button variant="outline" onClick={load}>Retry</Button></div>}
    <section className={`closing-status-panel ${isClosed ? 'closing-status-panel--closed' : 'closing-status-panel--open'}`}>
      <div className="closing-status-panel__intro"><span className="eyebrow">Business day</span><strong>{formatDate(statusData.date)}</strong><small>{isClosed ? 'This day is locked for editing.' : 'Review everything before closing.'}</small></div>
      <div><span>Closing status</span><strong className={`closing-status-badge closing-status-badge--${isClosed ? 'closed' : 'open'}`}>{statusData.status}</strong></div>
      {statusData.closed_at && <div><span>Closing time</span><strong>{new Date(statusData.closed_at).toLocaleString('en-GH')}</strong></div>}
    </section>
    <section className="closing-summary-grid">
      <div><span>Today's transactions</span><strong>{statusData.total_transactions ?? 0}</strong><small>Completed records</small></div>
      <div><span>Total transaction amount</span><strong>{formatMoney(statusData.total_amount)}</strong><small>Recorded today</small></div>
      <div className="closing-summary-card--cash"><span>Cash balance</span><strong>{formatMoney(statusData.cash_balance)}</strong><small>Backend balance</small></div>
      <div className="closing-summary-card--momo"><span>MoMo balance</span><strong>{formatMoney(statusData.momo_balance)}</strong><small>Backend balance</small></div>
    </section>
    <div className="closing-actions">
      <Button variant="outline" className="closing-action-button closing-action-button--transactions" onClick={() => navigate(`/vendor/transactions?date=${statusData.date}`)}><span className="closing-action-icon" aria-hidden="true">↗</span><span><strong>View Today&apos;s Transactions</strong><small>Review recorded activity</small></span></Button>
      {!isClosed && <Button className="closing-action-button closing-action-button--close" onClick={() => setShowModal(true)} disabled={closingLoading}><span className="closing-action-icon" aria-hidden="true">✓</span><strong>{closingLoading ? "Closing Today's Business Day..." : "Close Today's Business Day"}</strong></Button>}
    </div>
    {isClosed && <section className="closing-success"><h2>Business Day Closed</h2><p>Business date: {formatDate(statusData.date)}</p><p>Closing time: {statusData.closed_at ? new Date(statusData.closed_at).toLocaleString('en-GH') : 'Recorded by backend'}</p><p>Cash Balance: {formatMoney(statusData.cash_balance)}</p><p>MoMo Balance: {formatMoney(statusData.momo_balance)}</p><p>Transaction count: {statusData.total_transactions || 0}</p></section>}
    <ConfirmModal className="closing-confirm-modal" overlayClassName="closing-confirm-overlay" isOpen={showModal} title="Close Today's Business Day?" onCancel={() => !closingLoading && setShowModal(false)} onConfirm={confirmClosing} confirmLabel={closingLoading ? 'Closing...' : 'Confirm Closing'} cancelLabel="Cancel" confirmDisabled={closingLoading}>
      <div className="closing-confirm-modal__body">
        <div className="closing-confirm-modal__icon" aria-hidden="true">✓</div>
        <div className="closing-confirm-modal__intro">
          <p>Ready to close this business day?</p>
          <span>Please review the final figures below before confirming. This action cannot be undone.</span>
        </div>
        <div className="closing-confirm-modal__notice"><strong>Important</strong><span>After closing, transactions for {formatDate(statusData.date)} can no longer be added or edited.</span></div>
        <dl>
          <div><dt>Business date</dt><dd>{formatDate(statusData.date)}</dd></div>
          <div><dt>Completed transactions</dt><dd>{statusData.total_transactions ?? 0}</dd></div>
          <div><dt>Total transaction amount</dt><dd>{formatMoney(statusData.total_amount)}</dd></div>
          <div><dt>Cash balance</dt><dd>{formatMoney(statusData.cash_balance)}</dd></div>
          <div><dt>MoMo balance</dt><dd>{formatMoney(statusData.momo_balance)}</dd></div>
        </dl>
      </div>
    </ConfirmModal>
  </div>;
}
