'use client';

import { useState, useEffect } from 'react';
import styles from './OrderDashboard.module.css';

export default function OrderDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [notes, setNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      setLoading(true);
      const res = await fetch('/api/orders');
      if (!res.ok) throw new Error('Failed to load orders');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePaymentAction(orderId, action) {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/orders/${orderId}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes: notes || null }),
      });

      if (!res.ok) throw new Error(await res.json().then(d => d.error));

      setNotes('');
      setSelectedOrder(null);
      await loadOrders();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function updateOrderStatus(orderId, newStatus) {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update order');
      await loadOrders();
    } catch (err) {
      setError(err.message);
    }
  }

  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter(o => o.payment_status === filterStatus);

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.payment_status === 'pending_verification').length,
    verified: orders.filter(o => o.payment_status === 'verified').length,
    rejected: orders.filter(o => o.payment_status === 'rejected').length,
  };

  if (loading) return <div className={styles.container}><p>Loading orders...</p></div>;

  return (
    <div className={styles.container}>
      <h1>Order Management</h1>

      {error && <div className={styles.error}>{error}</div>}

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.total}</div>
          <div className={styles.statLabel}>Total Orders</div>
        </div>
        <div className={styles.statCard} style={{ borderColor: '#ff9800' }}>
          <div className={styles.statValue} style={{ color: '#ff9800' }}>{stats.pending}</div>
          <div className={styles.statLabel}>Pending Payment</div>
        </div>
        <div className={styles.statCard} style={{ borderColor: '#4caf50' }}>
          <div className={styles.statValue} style={{ color: '#4caf50' }}>{stats.verified}</div>
          <div className={styles.statLabel}>Verified</div>
        </div>
        <div className={styles.statCard} style={{ borderColor: '#f44336' }}>
          <div className={styles.statValue} style={{ color: '#f44336' }}>{stats.rejected}</div>
          <div className={styles.statLabel}>Rejected</div>
        </div>
      </div>

      {/* Filter */}
      <div className={styles.filter}>
        <label>Filter by payment status:</label>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All Orders</option>
          <option value="pending_verification">Pending Verification</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className={styles.table}>
        <div className={styles.header}>
          <div className={styles.col1}>Order #</div>
          <div className={styles.col2}>Customer</div>
          <div className={styles.col3}>Amount</div>
          <div className={styles.col4}>Payment Status</div>
          <div className={styles.col5}>Order Status</div>
          <div className={styles.col6}>Actions</div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className={styles.empty}>No orders found</div>
        ) : (
          filteredOrders.map(order => (
            <div key={order.id} className={styles.row}>
              <div className={styles.col1}>
                <span className={styles.orderNumber}>{order.order_number}</span>
              </div>
              <div className={styles.col2}>
                <div>{order.customer_name}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>{order.customer_email}</div>
              </div>
              <div className={styles.col3}>${order.total.toFixed(2)}</div>
              <div className={styles.col4}>
                <span className={`${styles.badge} ${styles[`status-${order.payment_status}`]}`}>
                  {order.payment_status.replace(/_/g, ' ')}
                </span>
              </div>
              <div className={styles.col5}>
                <select
                  value={order.order_status}
                  onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                  className={styles.statusSelect}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="packed">Packed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className={styles.col6}>
                <button
                  className={styles.detailsBtn}
                  onClick={() => setSelectedOrder(order)}
                >
                  Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Details Modal */}
      {selectedOrder && (
        <div className={styles.modal} onClick={() => setSelectedOrder(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setSelectedOrder(null)}>×</button>

            <h2>Order Details</h2>

            <div className={styles.details}>
              <div><strong>Order Number:</strong> {selectedOrder.order_number}</div>
              <div><strong>Customer:</strong> {selectedOrder.customer_name}</div>
              <div><strong>Email:</strong> {selectedOrder.customer_email}</div>
              <div><strong>Phone:</strong> {selectedOrder.customer_phone || 'N/A'}</div>
              <div><strong>Address:</strong> {selectedOrder.shipping_address}</div>
              <div><strong>Payment Method:</strong> {selectedOrder.payment_method}</div>
              <div><strong>Total:</strong> ${selectedOrder.total.toFixed(2)}</div>
              <div><strong>Payment Status:</strong> {selectedOrder.payment_status}</div>
              <div><strong>Order Status:</strong> {selectedOrder.order_status}</div>
            </div>

            {selectedOrder.payment_status === 'pending_verification' && (
              <div className={styles.paymentActions}>
                <h3>Verify Payment</h3>
                <textarea
                  placeholder="Notes (optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={styles.textarea}
                />
                <div className={styles.buttonGroup}>
                  <button
                    className={styles.verifyBtn}
                    onClick={() => handlePaymentAction(selectedOrder.id, 'verify')}
                    disabled={actionLoading}
                  >
                    ✓ Verify Payment
                  </button>
                  <button
                    className={styles.rejectBtn}
                    onClick={() => handlePaymentAction(selectedOrder.id, 'reject')}
                    disabled={actionLoading}
                  >
                    ✗ Reject Payment
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
