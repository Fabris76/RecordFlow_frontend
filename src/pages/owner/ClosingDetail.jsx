import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClosingById, reopenClosing } from '../../services/dailyClosingService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Notification from '../../components/Notification';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import { formatMoney, formatDate } from '../../utils/format';
import '../vendor/DailyClosing.css';

export default function OwnerClosingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [closing, setClosing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reopening, setReopening] = useState(false);

  useEffect(() => {
    getClosingById(id)
      .then((res) => setClosing(res.data))
      .catch((e) => setError(e.message || 'Failed to load closing'))
      .finally(() => setLoading(false));
  }, [id]);

  const goBack = () => navigate('/owner/closing');
  async function handleReopen() {
    if (!window.confirm('Reopen this business day for corrections? The action will be recorded in the audit trail.')) return;
    setReopening(true);
    setError(null);
    try {
      await reopenClosing(closing.id);
      setClosing((current) => ({ ...current, status: 'OPEN', closed_at: null }));
    } catch (requestError) {
      setError(requestError.message || 'Unable to reopen this business day.');
    } finally {
      setReopening(false);
    }
  }

  if (loading) return <LoadingSpinner fullScreen label="Loading closing detail" />;
  if (error) return <ErrorMessage fullScreen message={error} retry={goBack} />;

  return (
    <div className="closing-page">
      <PageHeader eyebrow="Owner workspace" title="Closing Detail" description="Backend-recorded closing information for this vendor." />
      <div className="closing-detail-heading">
        <div><span>Vendor</span><strong>{closing.vendor_name}</strong></div>
        <div><span>Business date</span><strong>{formatDate(closing.closing_date)}</strong></div>
        <div><span>Status</span><strong className={`closing-status-badge closing-status-badge--${closing.status.toLowerCase()}`}>{closing.status}</strong></div>
        {closing.closed_at && <div><span>Closed at</span><strong>{new Date(closing.closed_at).toLocaleString('en-GH')}</strong></div>}
      </div>
      <div className="closing-detail-grid">
        <div>
          <h3 className="font-medium">Total Transactions</h3>
          <p>{closing.total_transactions || 0}</p>
        </div>
        <div>
          <h3 className="font-medium">Total Amount</h3>
          <p>{formatMoney(closing.total_amount)}</p>
        </div>
        {/* Render any other total_* fields */}
        {Object.entries(closing)
          .filter(([k]) => k.startsWith('total_') && !['total_transactions', 'total_amount'].includes(k))
          .map(([k, v]) => (
            <div key={k}>
              <h3 className="font-medium">{k.replace('total_', '').replace('_', ' ')}</h3>
              <p>{formatMoney(v)}</p>
            </div>
          ))}
      </div>
      <div className="closing-detail-actions">
        <Button variant="outline" onClick={goBack}>Back to list</Button>
        {closing.status === 'CLOSED' && <Button variant="warning" onClick={handleReopen} disabled={reopening}>{reopening ? 'Reopening...' : 'Reopen business day'}</Button>}
      </div>
    </div>
  );
}
