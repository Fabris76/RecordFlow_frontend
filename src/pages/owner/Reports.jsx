import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Button from '../../components/Button';
import { getClosingReport, getDailyReport, getDailyTrendReport, getTransactionTypesReport, getVendorPerformanceReport } from '../../services/reportService';
import { formatMoney, localDate, dateDaysAgo } from '../../utils/format';
import './Reports.css';

const empty = { total_transactions: 0, total_amount: '0.00', total_deposits: '0.00', total_withdrawals: '0.00', total_transfers: '0.00', total_airtime: '0.00', total_data: '0.00', total_bill_payments: '0.00', total_other: '0.00' };
const label = (value) => String(value || '').replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (character) => character.toUpperCase());

export default function Reports() {
  const [startDate, setStartDate] = useState(dateDaysAgo(6));
  const [endDate, setEndDate] = useState(localDate());
  const [dailyDate, setDailyDate] = useState(localDate());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [daily, types, vendors, trend, closing] = await Promise.all([
        getDailyReport(dailyDate),
        getTransactionTypesReport(startDate, endDate),
        getVendorPerformanceReport(startDate, endDate),
        getDailyTrendReport(startDate, endDate),
        getClosingReport(startDate, endDate)
      ]);
      setReport({ daily: daily.data || empty, types: Array.isArray(types.data) ? types.data : [], vendors: Array.isArray(vendors.data) ? vendors.data : [], trend: Array.isArray(trend.data) ? trend.data : [], closing: closing.data || { summary: {}, details: [] } });
    } catch (requestError) {
      setReport(null);
      setError(requestError.message || 'Unable to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [dailyDate, startDate, endDate]);

  useEffect(() => { load(); }, [load]);

  return <div className="reports-page">
    <div className="reports-heading"><PageHeader eyebrow="Owner workspace" title="Reports" description="Review backend-recorded transaction activity, vendor performance, and business-day closing results." /><Button variant="outline" onClick={load} disabled={loading}>{loading ? 'Loading...' : 'Refresh reports'}</Button></div>
    <section className="reports-filters">
      <div><label htmlFor="reports-daily-date">Daily report date</label><input id="reports-daily-date" type="date" value={dailyDate} onChange={(event) => setDailyDate(event.target.value)} /></div>
      <div><label htmlFor="reports-start-date">Range start</label><input id="reports-start-date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></div>
      <div><label htmlFor="reports-end-date">Range end</label><input id="reports-end-date" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></div>
    </section>
    {loading ? <LoadingSpinner label="Loading reports" /> : error ? <div className="reports-error"><ErrorMessage>{error}</ErrorMessage><Button variant="outline" onClick={load}>Try again</Button></div> : report && <>
      <section className="reports-section"><div className="reports-section-heading"><div><span className="eyebrow">Daily snapshot · {report.daily.date}</span><h2>Daily activity</h2></div></div><div className="reports-metrics"><div><span>Transactions</span><strong>{report.daily.total_transactions}</strong></div><div><span>Total amount</span><strong>{formatMoney(report.daily.total_amount)}</strong></div><div><span>Deposits</span><strong>{formatMoney(report.daily.total_deposits)}</strong></div><div><span>Withdrawals</span><strong>{formatMoney(report.daily.total_withdrawals)}</strong></div></div></section>
      <div className="reports-grid"><section className="reports-section"><div className="reports-section-heading"><div><span className="eyebrow">Selected range</span><h2>Transaction types</h2></div></div>{report.types.length ? <div className="reports-list">{report.types.map((item) => <div key={item.type}><span>{label(item.type)}<small>{item.transaction_count} transactions</small></span><strong>{formatMoney(item.total_amount)}</strong></div>)}</div> : <p className="reports-empty">No completed transaction data for this range.</p>}</section><section className="reports-section"><div className="reports-section-heading"><div><span className="eyebrow">Selected range</span><h2>Vendor performance</h2></div></div>{report.vendors.length ? <div className="reports-list">{report.vendors.map((item) => <div key={item.vendor_id}><span>{item.vendor_name}<small>{item.transaction_count} transactions</small></span><strong>{formatMoney(item.total_amount)}</strong></div>)}</div> : <p className="reports-empty">No vendor activity for this range.</p>}</section></div>
      <div className="reports-grid"><section className="reports-section"><div className="reports-section-heading"><div><span className="eyebrow">Daily trend</span><h2>Activity by day</h2></div></div>{report.trend.length ? <div className="reports-list">{report.trend.map((item) => <div key={item.date}><span>{item.date}<small>{item.transaction_count} transactions</small></span><strong>{formatMoney(item.total_amount)}</strong></div>)}</div> : <p className="reports-empty">No daily activity for this range.</p>}</section><section className="reports-section reports-section--closing"><div className="reports-section-heading"><div><span className="eyebrow">Daily closing</span><h2>Closing overview</h2></div></div><div className="reports-metrics reports-metrics--compact"><div><span>Total days</span><strong>{report.closing.summary?.total_days || 0}</strong></div><div><span>Closed</span><strong>{report.closing.summary?.closed_days || 0}</strong></div><div><span>Open</span><strong>{report.closing.summary?.open_days || 0}</strong></div></div></section></div>
    </>}
  </div>;
}
