import { useCallback, useEffect, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Button from '../../components/Button';
import { getAnalyticsComparison, getTransactionTrend, getTransactionTypes, getVendorPerformance } from '../../services/analyticsService';
import { dateDaysAgo, formatDateLabel, formatMoney, formatNumber, localDate } from '../../utils/format';
import './Analytics.css';

const COLORS = ['#bd6546', '#2d7770', '#dba85e', '#6c8da0', '#8b7096', '#829a72'];

export default function Analytics() {
  const [startDate, setStartDate] = useState(dateDaysAgo(6));
  const [endDate, setEndDate] = useState(localDate());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const currentStart = startDate;
      const currentEnd = endDate;
      const previousEndDate = new Date(`${currentStart}T00:00:00`);
      previousEndDate.setDate(previousEndDate.getDate() - 1);
      const previousEnd = previousEndDate.toISOString().slice(0, 10);
      const days = Math.max(1, Math.round((new Date(`${currentEnd}T00:00:00`) - new Date(`${currentStart}T00:00:00`)) / 86400000) + 1);
      const previousStartDate = new Date(`${previousEnd}T00:00:00`);
      previousStartDate.setDate(previousStartDate.getDate() - days + 1);
      const previousStart = previousStartDate.toISOString().slice(0, 10);
      const [trend, types, vendors, comparison] = await Promise.all([
        getTransactionTrend(currentStart, currentEnd),
        getTransactionTypes(currentStart, currentEnd),
        getVendorPerformance(currentStart, currentEnd),
        getAnalyticsComparison({ current_start_date: currentStart, current_end_date: currentEnd, previous_start_date: previousStart, previous_end_date: previousEnd })
      ]);
      setData({ trend: trend.data || [], types: types.data || [], vendors: vendors.data || [], comparison: comparison.data });
    } catch (requestError) {
      setData(null); setError(requestError.message || 'Unable to load analytics. Please try again.');
    } finally { setLoading(false); }
  }, [startDate, endDate]);

  useEffect(() => { load(); }, [load]);
  const trend = (data?.trend || []).map((item) => ({ ...item, shortDate: formatDateLabel(item.date), count: Number(item.transaction_count || 0), amount: Number(item.transaction_amount || 0) }));
  const types = (data?.types || []).map((item) => ({ ...item, name: item.type.replaceAll('_', ' '), value: Number(item.amount || 0) }));
  const comparison = data?.comparison || {};

  return <div className="analytics-page">
    <div className="analytics-heading"><PageHeader eyebrow="Owner workspace" title="Analytics" description="Understand transaction activity, service mix, vendor performance, and period movement." /><Button variant="outline" onClick={load} disabled={loading}>{loading ? 'Loading...' : 'Refresh analytics'}</Button></div>
    <section className="analytics-filters"><div><label htmlFor="analytics-start">Range start</label><input id="analytics-start" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></div><div><label htmlFor="analytics-end">Range end</label><input id="analytics-end" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></div><span>Analytics are calculated from completed backend transactions.</span></section>
    {loading ? <LoadingSpinner label="Loading analytics" /> : error ? <div className="analytics-error"><ErrorMessage>{error}</ErrorMessage><Button variant="outline" onClick={load}>Try again</Button></div> : data && <>
      <section className="analytics-comparison"><div><span>Selected period</span><strong>{formatNumber(comparison.current_period?.transaction_count)} transactions</strong><small>{formatMoney(comparison.current_period?.transaction_amount)}</small></div><div><span>Previous period</span><strong>{formatNumber(comparison.previous_period?.transaction_count)} transactions</strong><small>{formatMoney(comparison.previous_period?.transaction_amount)}</small></div><div><span>Transaction change</span><strong className={Number(comparison.change?.transaction_count) >= 0 ? 'analytics-positive' : 'analytics-negative'}>{Number(comparison.change?.transaction_count || 0) >= 0 ? '+' : ''}{formatNumber(comparison.change?.transaction_count || 0)}</strong><small>{comparison.change?.transaction_count_percentage === null ? 'No prior activity' : `${comparison.change?.transaction_count_percentage}% vs previous`}</small></div><div><span>Value change</span><strong className={Number(comparison.change?.transaction_amount) >= 0 ? 'analytics-positive' : 'analytics-negative'}>{Number(comparison.change?.transaction_amount || 0) >= 0 ? '+' : ''}{formatMoney(comparison.change?.transaction_amount || 0)}</strong><small>{comparison.change?.transaction_amount_percentage === null ? 'No prior activity' : `${comparison.change?.transaction_amount_percentage}% vs previous`}</small></div></section>
      <div className="analytics-grid"><section className="analytics-card analytics-card--wide"><div className="analytics-card-heading"><span className="eyebrow">Selected range</span><h2>Transaction activity</h2></div>{trend.length ? <ResponsiveContainer width="100%" height={280}><BarChart data={trend} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}><CartesianGrid stroke="#e5e3da" vertical={false} /><XAxis dataKey="shortDate" tickLine={false} axisLine={false} tick={{ fill: '#7b8981', fontSize: 11 }} /><YAxis tickLine={false} axisLine={false} tick={{ fill: '#7b8981', fontSize: 11 }} /><Tooltip formatter={(value) => [`${formatNumber(value)} transactions`, 'Activity']} /><Bar dataKey="count" fill="#2d7770" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer> : <div className="analytics-chart-empty analytics-chart-empty--bars"><span>▥</span><strong>No activity for this range</strong><small>Completed transaction data will appear here.</small></div>}</section><section className="analytics-card"><div className="analytics-card-heading"><span className="eyebrow">Service mix</span><h2>Transaction types</h2></div>{types.length ? <div className="analytics-pie"><ResponsiveContainer width="48%" height={220}><PieChart><Pie data={types} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={3}>{types.map((entry, index) => <Cell key={entry.type} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip formatter={(value) => formatMoney(value)} /></PieChart></ResponsiveContainer><div className="analytics-legend">{types.map((item, index) => <div key={item.type}><i style={{ background: COLORS[index % COLORS.length] }} /><span>{item.name}</span><strong>{formatMoney(item.value)}</strong></div>)}</div></div> : <div className="analytics-chart-empty analytics-chart-empty--pie"><span>◌</span><strong>No service mix yet</strong><small>Transaction types will appear here.</small></div>}</section></div>
      <div className="analytics-grid"><section className="analytics-card analytics-card--wide"><div className="analytics-card-heading"><span className="eyebrow">Value movement</span><h2>Transaction value trend</h2></div>{trend.length ? <ResponsiveContainer width="100%" height={280}><AreaChart data={trend} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}><defs><linearGradient id="analyticsValueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#bd6546" stopOpacity=".35" /><stop offset="100%" stopColor="#bd6546" stopOpacity=".03" /></linearGradient></defs><CartesianGrid stroke="#e5e3da" vertical={false} /><XAxis dataKey="shortDate" tickLine={false} axisLine={false} tick={{ fill: '#7b8981', fontSize: 11 }} /><YAxis tickLine={false} axisLine={false} tick={{ fill: '#7b8981', fontSize: 11 }} tickFormatter={(value) => `GH₵${value}`} /><Tooltip formatter={(value) => [formatMoney(value), 'Value']} /><Area type="monotone" dataKey="amount" stroke="#bd6546" fill="url(#analyticsValueFill)" strokeWidth={3} /></AreaChart></ResponsiveContainer> : <div className="analytics-chart-empty analytics-chart-empty--area"><span>⌁</span><strong>No value movement for this range</strong><small>Completed transaction values will appear here.</small></div>}</section><section className="analytics-card"><div className="analytics-card-heading"><span className="eyebrow">Service mix</span><h2>Transaction types</h2></div>{types.length ? <div className="analytics-pie"><ResponsiveContainer width="48%" height={220}><PieChart><Pie data={types} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={3}>{types.map((entry, index) => <Cell key={entry.type} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip formatter={(value) => formatMoney(value)} /></PieChart></ResponsiveContainer><div className="analytics-legend">{types.map((item, index) => <div key={item.type}><i style={{ background: COLORS[index % COLORS.length] }} /><span>{item.name}</span><strong>{formatMoney(item.value)}</strong></div>)}</div></div> : <div className="analytics-chart-empty analytics-chart-empty--pie"><span>◌</span><strong>No service mix yet</strong><small>Transaction types will appear here.</small></div>}</section></div>
      <section className="analytics-card"><div className="analytics-card-heading"><span className="eyebrow">Selected range</span><h2>Vendor performance</h2></div>{data.vendors.length ? <><div className="analytics-vendor-chart"><ResponsiveContainer width="100%" height={250}><BarChart data={data.vendors.slice(0, 8)} layout="vertical" margin={{ top: 0, right: 14, left: 18, bottom: 0 }}><CartesianGrid stroke="#e5e3da" horizontal={false} /><XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: '#7b8981', fontSize: 10 }} /><YAxis type="category" dataKey="vendor_name" width={90} tickLine={false} axisLine={false} tick={{ fill: '#526a62', fontSize: 10 }} /><Tooltip formatter={(value) => [formatMoney(value), 'Value']} /><Bar dataKey="transaction_amount" fill="#dba85e" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div><div className="analytics-vendors">{data.vendors.slice(0, 5).map((vendor) => <div key={vendor.vendor_id}><span>{vendor.vendor_name}<small>{formatNumber(vendor.transaction_count)} transactions</small></span><strong>{formatMoney(vendor.transaction_amount)}</strong></div>)}</div></> : <div className="analytics-empty">No vendor activity for this range.</div>}</section>
    </>}
  </div>;
}
