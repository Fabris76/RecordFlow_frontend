import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Button from '../../components/Button';
import { getAuditLogs } from '../../services/auditService';
import { localDate } from '../../utils/format';
import './AuditTrail.css';

export default function AuditTrail() {
  const [filters, setFilters] = useState({ action: '', entity_type: '', start_date: '', end_date: '', page: 1, limit: 25 });
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const response = await getAuditLogs(filters); setLogs(Array.isArray(response.data) ? response.data : []); setPagination(response.pagination || { total: 0, total_pages: 1 }); }
    catch (requestError) { setError(requestError.message || 'Unable to load the audit trail. Please try again.'); }
    finally { setLoading(false); }
  }, [filters]);
  useEffect(() => { load(); }, [load]);
  const update = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  return <div className="audit-page">
    <div className="audit-heading"><PageHeader eyebrow="Owner workspace" title="Audit Trail" description="Review recorded administrative actions and system activity." /><Button variant="outline" onClick={load} disabled={loading}>{loading ? 'Loading...' : 'Refresh audit trail'}</Button></div>
    <section className="audit-filters"><div><label htmlFor="audit-action">Action</label><input id="audit-action" value={filters.action} onChange={(event) => update('action', event.target.value)} placeholder="e.g. BACKUP_CREATED" /></div><div><label htmlFor="audit-entity">Entity type</label><input id="audit-entity" value={filters.entity_type} onChange={(event) => update('entity_type', event.target.value)} placeholder="e.g. BACKUP" /></div><div><label htmlFor="audit-start">From</label><input id="audit-start" type="date" value={filters.start_date} onChange={(event) => update('start_date', event.target.value)} /></div><div><label htmlFor="audit-end">To</label><input id="audit-end" type="date" value={filters.end_date} onChange={(event) => update('end_date', event.target.value)} /></div><button type="button" onClick={() => setFilters({ action: '', entity_type: '', start_date: '', end_date: '', page: 1, limit: 25 })}>Clear</button></section>
    {loading ? <LoadingSpinner label="Loading audit trail" /> : error ? <div className="audit-error"><ErrorMessage>{error}</ErrorMessage><Button variant="outline" onClick={load}>Try again</Button></div> : <section className="audit-card">{logs.length ? <><div className="audit-table-wrap"><table className="audit-table"><thead><tr><th>Time</th><th>Action</th><th>Entity</th><th>Description</th><th>Recorded by</th></tr></thead><tbody>{logs.map((log) => <tr key={log.id}><td>{new Date(log.created_at).toLocaleString('en-GH')}</td><td><span className="audit-action">{log.action}</span></td><td>{log.entity_type}{log.entity_id ? ` #${log.entity_id}` : ''}</td><td>{log.description}</td><td>{log.user_name}</td></tr>)}</tbody></table></div><div className="audit-pagination"><span>{pagination.total || 0} audit events</span><div><button type="button" disabled={filters.page <= 1 || loading} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}>Previous</button><strong>Page {filters.page} of {pagination.total_pages || 1}</strong><button type="button" disabled={filters.page >= (pagination.total_pages || 1) || loading} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}>Next</button></div></div></> : <div className="audit-empty"><strong>No audit events found</strong><span>Recorded administrative activity will appear here.</span></div>}</section>}
  </div>;
}
