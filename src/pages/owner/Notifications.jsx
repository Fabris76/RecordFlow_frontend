import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Button from '../../components/Button';
import { deleteNotification, getNotifications, markAllNotificationsRead, markNotificationRead } from '../../services/notificationService';
import './Notifications.css';

const types = ['VENDOR_CREATED', 'VENDOR_ACTIVATED', 'VENDOR_DEACTIVATED', 'TRANSACTION_EDITED', 'LARGE_TRANSACTION', 'BALANCE_ADJUSTED', 'DAILY_CLOSING_COMPLETED', 'CLOSING_PENDING', 'UNUSUAL_ACTIVITY'];
const typeLabel = (value) => String(value || '').replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function Notifications() {
  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await getNotifications({ is_read: filter === 'all' ? undefined : filter === 'unread' ? 'false' : 'true', page, limit: 20, sort_order: 'desc' });
      setNotifications(Array.isArray(response.data) ? response.data : []);
      setPagination(response.pagination || { total: 0, total_pages: 1 });
    } catch (requestError) { setError(requestError.message || 'Unable to load notifications. Please try again.'); }
    finally { setLoading(false); }
  }, [filter, page]);
  useEffect(() => { load(); }, [load]);
  const changeFilter = (value) => { setFilter(value); setPage(1); };
  const markRead = async (notification) => {
    if (notification.is_read) return;
    try { await markNotificationRead(notification.id); setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, is_read: true } : item)); }
    catch (requestError) { setError(requestError.message || 'Unable to update notification.'); }
  };
  const markAllRead = async () => {
    try { await markAllNotificationsRead(); setNotifications((current) => current.map((item) => ({ ...item, is_read: true }))); }
    catch (requestError) { setError(requestError.message || 'Unable to update notifications.'); }
  };
  const removeNotification = async (notification) => {
    if (!window.confirm(`Delete this notification?\n\n${notification.title}`)) return;
    try {
      await deleteNotification(notification.id);
      const remaining = notifications.filter((item) => item.id !== notification.id);
      if (remaining.length === 0 && page > 1) setPage((current) => current - 1);
      else setNotifications(remaining);
      setPagination((current) => ({ ...current, total: Math.max(0, Number(current.total || 0) - 1) }));
    } catch (requestError) { setError(requestError.message || 'Unable to delete notification.'); }
  };
  const unread = notifications.filter((item) => !item.is_read).length;
  return <div className="notifications-page">
    <div className="notifications-heading"><PageHeader eyebrow="Owner workspace" title="Notifications" description="Stay informed about important business activity and operational events." /><Button variant="outline" onClick={load} disabled={loading}>{loading ? 'Loading...' : 'Refresh notifications'}</Button></div>
    <section className="notifications-toolbar"><div className="notifications-tabs"><button className={filter === 'all' ? 'is-active' : ''} onClick={() => changeFilter('all')} type="button">All</button><button className={filter === 'unread' ? 'is-active' : ''} onClick={() => changeFilter('unread')} type="button">Unread</button><button className={filter === 'read' ? 'is-active' : ''} onClick={() => changeFilter('read')} type="button">Read</button></div><Button variant="outline" onClick={markAllRead} disabled={!unread || loading}>Mark all as read</Button></section>
    {error && <div className="notifications-error"><ErrorMessage>{error}</ErrorMessage><Button variant="outline" onClick={load}>Try again</Button></div>}
    {loading ? <LoadingSpinner label="Loading notifications" /> : <section className="notifications-card">{notifications.length ? <div className="notifications-list">{notifications.map((notification) => <article key={notification.id} className={`notification-item ${notification.is_read ? '' : 'notification-item--unread'}`}><div className={`notification-mark notification-mark--${notification.type?.toLowerCase()}`} aria-hidden="true">{notification.is_read ? '✓' : '!'}</div><div className="notification-content"><div className="notification-meta"><span>{typeLabel(notification.type)}</span><time>{new Date(notification.created_at).toLocaleString('en-GH')}</time></div><h2>{notification.title}</h2><p>{notification.message}</p>{notification.entity_type && <small>{notification.entity_type}{notification.entity_id ? ` #${notification.entity_id}` : ''}</small>}</div><div className="notification-actions">{!notification.is_read && <button className="notification-read-button" type="button" onClick={() => markRead(notification)}>Mark read</button>}<button className="notification-delete-button" type="button" onClick={() => removeNotification(notification)}>Delete</button></div></article>)}</div> : <div className="notifications-empty"><strong>No notifications found</strong><span>Important business events will appear here.</span></div>}{notifications.length > 0 && <div className="notifications-pagination"><span>{pagination.total || 0} notifications</span><div><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>Previous</button><strong>Page {page} of {pagination.total_pages || 1}</strong><button type="button" disabled={page >= (pagination.total_pages || 1) || loading} onClick={() => setPage((current) => current + 1)}>Next</button></div></div>}</section>}
  </div>;
}
