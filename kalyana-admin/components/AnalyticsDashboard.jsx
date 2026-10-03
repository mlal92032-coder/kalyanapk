'use client';

import { useState, useEffect } from 'react';
import styles from './AnalyticsDashboard.module.css';

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('30days');

  useEffect(() => {
    loadStats();
  }, [period]);

  async function loadStats() {
    try {
      setLoading(true);
      const res = await fetch(`/api/analytics?period=${period}`);
      if (!res.ok) throw new Error('Failed to load analytics');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className={styles.container}><p>Loading analytics...</p></div>;
  if (error) return <div className={styles.container}><div className={styles.error}>{error}</div></div>;
  if (!stats) return <div className={styles.container}><p>No data available</p></div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Analytics Dashboard</h1>
        <select value={period} onChange={(e) => setPeriod(e.target.value)} className={styles.periodSelect}>
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="90days">Last 90 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Revenue Stats */}
      <div className={styles.section}>
        <h2>Revenue</h2>
        <div className={styles.grid}>
          <div className={styles.card}>
            <div className={styles.label}>Total Revenue</div>
            <div className={styles.value}>${stats.revenue?.total?.toFixed(2) || '0.00'}</div>
            <div className={styles.change} style={{ color: stats.revenue?.change >= 0 ? '#4caf50' : '#f44336' }}>
              {stats.revenue?.change >= 0 ? '↑' : '↓'} {Math.abs(stats.revenue?.change || 0).toFixed(1)}%
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.label}>Avg Order Value</div>
            <div className={styles.value}>${stats.revenue?.avgOrderValue?.toFixed(2) || '0.00'}</div>
          </div>

          <div className={styles.card}>
            <div className={styles.label}>Total Orders</div>
            <div className={styles.value}>{stats.orders?.total || 0}</div>
          </div>

          <div className={styles.card}>
            <div className={styles.label}>Conversion Rate</div>
            <div className={styles.value}>{(stats.orders?.conversionRate * 100).toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* Payment Stats */}
      <div className={styles.section}>
        <h2>Payment Status</h2>
        <div className={styles.grid}>
          <div className={styles.card} style={{ borderColor: '#ff9800' }}>
            <div className={styles.label}>Pending Verification</div>
            <div className={styles.value} style={{ color: '#ff9800' }}>{stats.payments?.pending || 0}</div>
            <div className={styles.percentage}>{((stats.payments?.pending || 0) / (stats.orders?.total || 1) * 100).toFixed(1)}%</div>
          </div>

          <div className={styles.card} style={{ borderColor: '#4caf50' }}>
            <div className={styles.label}>Verified</div>
            <div className={styles.value} style={{ color: '#4caf50' }}>{stats.payments?.verified || 0}</div>
            <div className={styles.percentage}>{((stats.payments?.verified || 0) / (stats.orders?.total || 1) * 100).toFixed(1)}%</div>
          </div>

          <div className={styles.card} style={{ borderColor: '#f44336' }}>
            <div className={styles.label}>Rejected</div>
            <div className={styles.value} style={{ color: '#f44336' }}>{stats.payments?.rejected || 0}</div>
            <div className={styles.percentage}>{((stats.payments?.rejected || 0) / (stats.orders?.total || 1) * 100).toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className={styles.section}>
        <h2>Payment Methods</h2>
        <div className={styles.methodsList}>
          {stats.paymentMethods?.map((method) => (
            <div key={method.method} className={styles.methodItem}>
              <div className={styles.methodName}>{method.displayName}</div>
              <div className={styles.methodStats}>
                <span className={styles.count}>{method.count} orders</span>
                <span className={styles.amount}>${method.amount.toFixed(2)}</span>
              </div>
              <div className={styles.bar}>
                <div
                  className={styles.barFill}
                  style={{
                    width: `${(method.count / (stats.orders?.total || 1)) * 100}%`,
                    background: getColorForMethod(method.method),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Products */}
      <div className={styles.section}>
        <h2>Top Products</h2>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Units Sold</th>
                <th>Revenue</th>
                <th>Avg Price</th>
              </tr>
            </thead>
            <tbody>
              {stats.topProducts?.map((product) => (
                <tr key={product.id}>
                  <td className={styles.productName}>{product.name}</td>
                  <td>{product.unitsSold}</td>
                  <td>${product.revenue.toFixed(2)}</td>
                  <td>${product.avgPrice.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function getColorForMethod(method) {
  const colors = {
    cod: '#4caf50',
    easypaisa: '#2196f3',
    jazzcash: '#ff9800',
    bank: '#9c27b0',
    stripe: '#635bff',
    paypal: '#0070ba',
  };
  return colors[method] || '#999';
}
