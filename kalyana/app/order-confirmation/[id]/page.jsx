'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './confirmation.module.css';

export default function OrderConfirmationPage({ params }) {
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadOrder() {
      try {
        const { id } = await params;
        const res = await fetch(`/api/orders/${id}`);
        if (!res.ok) throw new Error('Order not found');

        const data = await res.json();
        setOrder(data.order);
        setItems(data.items || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [params]);

  if (loading) return <div className={styles.container}><p>Loading...</p></div>;
  if (error) return <div className={styles.container}><p className={styles.error}>{error}</p></div>;
  if (!order) return <div className={styles.container}><p>Order not found</p></div>;

  const paymentStatusColor = {
    pending_verification: '#ff9800',
    verified: '#4caf50',
    rejected: '#f44336',
  }[order.payment_status];

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1>Order Confirmed!</h1>
          <p>Thank you for your order. We'll process it shortly.</p>
        </div>

        <div className={styles.orderInfo}>
          <div className={styles.infoRow}>
            <label>Order Number:</label>
            <strong>{order.order_number}</strong>
          </div>
          <div className={styles.infoRow}>
            <label>Order Status:</label>
            <span className={styles.badge}>{order.order_status}</span>
          </div>
          <div className={styles.infoRow}>
            <label>Payment Status:</label>
            <span className={styles.badge} style={{ backgroundColor: paymentStatusColor }}>
              {order.payment_status.replace(/_/g, ' ')}
            </span>
          </div>
          <div className={styles.infoRow}>
            <label>Payment Method:</label>
            <span>{order.payment_method}</span>
          </div>
        </div>

        <div className={styles.section}>
          <h2>Shipping Information</h2>
          <div className={styles.infoRow}>
            <label>Name:</label>
            <span>{order.customer_name}</span>
          </div>
          <div className={styles.infoRow}>
            <label>Email:</label>
            <span>{order.customer_email}</span>
          </div>
          {order.customer_phone && (
            <div className={styles.infoRow}>
              <label>Phone:</label>
              <span>{order.customer_phone}</span>
            </div>
          )}
          <div className={styles.infoRow}>
            <label>Address:</label>
            <span>{order.shipping_address}</span>
          </div>
        </div>

        {items.length > 0 && (
          <div className={styles.section}>
            <h2>Order Items</h2>
            <div className={styles.itemsTable}>
              <div className={styles.tableHeader}>
                <div className={styles.col1}>Product</div>
                <div className={styles.col2}>Qty</div>
                <div className={styles.col3}>Unit Price</div>
                <div className={styles.col4}>Total</div>
              </div>
              {items.map((item) => (
                <div key={item.id} className={styles.tableRow}>
                  <div className={styles.col1}>{item.product_name}</div>
                  <div className={styles.col2}>{item.quantity}</div>
                  <div className={styles.col3}>${item.unit_price.toFixed(2)}</div>
                  <div className={styles.col4}>${item.line_total.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={styles.summary}>
          <div className={styles.summaryRow}>
            <label>Subtotal:</label>
            <span>${order.subtotal.toFixed(2)}</span>
          </div>
          <div className={styles.summaryRow}>
            <label>Shipping:</label>
            <span>${order.shipping_fee.toFixed(2)}</span>
          </div>
          {order.tax > 0 && (
            <div className={styles.summaryRow}>
              <label>Tax:</label>
              <span>${order.tax.toFixed(2)}</span>
            </div>
          )}
          <div className={styles.summaryRow} style={{ borderTop: '2px solid #ddd', paddingTop: '12px', marginTop: '12px' }}>
            <label style={{ fontWeight: '600' }}>Total:</label>
            <span style={{ fontWeight: '600', fontSize: '18px' }}>${order.total.toFixed(2)}</span>
          </div>
        </div>

        {order.payment_status === 'pending_verification' && (
          <div className={styles.notice}>
            <strong>Payment Verification Pending</strong>
            <p>We've received your payment details and will verify them within 24 hours. You'll receive an email confirmation once verified.</p>
          </div>
        )}

        {order.payment_status === 'rejected' && (
          <div className={styles.notice} style={{ borderColor: '#f44336', backgroundColor: '#ffebee' }}>
            <strong style={{ color: '#f44336' }}>Payment Rejected</strong>
            <p>Your payment could not be verified. Please contact us for assistance.</p>
          </div>
        )}

        <div className={styles.actions}>
          <Link href="/products" className={styles.btn}>
            Continue Shopping
          </Link>
          <Link href="/" className={styles.btnSecondary}>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
