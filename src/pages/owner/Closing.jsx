import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllClosings } from '../../services/dailyClosingService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import PageHeader from '../../components/PageHeader';
import { formatDate } from '../../utils/format';
import '../vendor/DailyClosing.css';

export default function OwnerClosing() {
  const [closings, setClosings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    setError(null);
    getAllClosings()
      .then((res) => setClosings(res.data || []))
      .catch((e) => setError(e.message || 'Unable to load daily closings. Please try again.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const viewDetail = (id) => {
    navigate(`/owner/closing/${id}`);
  };

  if (loading) return <LoadingSpinner fullScreen label="Loading daily closings" />;
  if (error) return <div className="closing-page"><PageHeader eyebrow="Owner workspace" title="Daily Closings" /><div className="inline-error"><ErrorMessage>{error}</ErrorMessage><button type="button" onClick={load}>Try again</button></div></div>;

  if (!closings.length) {
    return (
      <div className="closing-page owner-closing-page">
        <div className="daily-closing-heading"><PageHeader eyebrow="Owner workspace" title="Daily Closings" description="Review business-day status for every vendor." /><button className="owner-closing-refresh" type="button" onClick={load}>Refresh</button></div>
        <div className="owner-closing-empty"><strong>No closings recorded</strong><span>Vendor business-day submissions will appear here once they are completed.</span></div>
      </div>
    );
  }

  const closedCount = closings.filter((closing) => closing.status === 'CLOSED').length;
  const openCount = closings.filter((closing) => closing.status !== 'CLOSED').length;

  return (
    <div className="closing-page owner-closing-page">
      <div className="daily-closing-heading"><PageHeader eyebrow="Owner workspace" title="Daily Closings" description="Review business-day status for every vendor." /><button className="owner-closing-refresh" type="button" onClick={load} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh'}</button></div>
      <section className="owner-closing-summary" aria-label="Daily closing summary">
        <div className="owner-closing-summary-card owner-closing-summary-card--total"><span>Total records</span><strong>{closings.length}</strong><small>Vendor closing submissions</small></div>
        <div className="owner-closing-summary-card owner-closing-summary-card--closed"><span>Closed</span><strong>{closedCount}</strong><small>Completed business days</small></div>
        <div className="owner-closing-summary-card owner-closing-summary-card--open"><span>Open</span><strong>{openCount}</strong><small>Still requiring attention</small></div>
      </section>
      <section className="owner-closing-list" aria-label="Vendor daily closings">
        <div className="owner-closing-list-heading"><div><span className="eyebrow">Vendor activity</span><h2>Closing records</h2></div><span>{closings.length} record{closings.length === 1 ? '' : 's'}</span></div>
        <div className="owner-closing-cards">
          {closings.map((closing) => (
            <article className="owner-closing-card" key={closing.id}>
              <div className="owner-closing-card__identity"><span className="owner-closing-avatar">{(closing.vendor_name || 'V').charAt(0).toUpperCase()}</span><div><strong>{closing.vendor_name || 'Unknown vendor'}</strong><small>Business day · {formatDate(closing.closing_date)}</small></div></div>
              <span className={`closing-status-badge closing-status-badge--${closing.status.toLowerCase()}`}>{closing.status}</span>
              <div className="owner-closing-card__time"><span>Closing time</span><strong>{closing.closed_at ? new Date(closing.closed_at).toLocaleString('en-GH') : 'Not closed yet'}</strong></div>
              <button className="closing-view-button" type="button" onClick={() => viewDetail(closing.id)}>View details <span aria-hidden="true">→</span></button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
