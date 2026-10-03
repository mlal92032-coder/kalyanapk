import nodemailer from "nodemailer";
import getDb from "./db.js";

// Email configuration - supports SendGrid, Gmail, or custom SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.sendgrid.net",
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === "true" || false,
  auth: {
    user: process.env.SMTP_USER || "apikey",
    pass: process.env.SMTP_PASS || "",
  },
});

// Email templates
const templates = {
  orderConfirmation: (order, items) => ({
    subject: `Order Confirmation - ${order.order_number}`,
    html: `
      <h2>Thank you for your order!</h2>
      <p>Your order <strong>${order.order_number}</strong> has been received.</p>

      <h3>Order Details:</h3>
      <ul>
        ${items.map(item => `
          <li>${item.product_name} × ${item.quantity} = $${item.line_total.toFixed(2)}</li>
        `).join('')}
      </ul>

      <p><strong>Subtotal:</strong> $${order.subtotal.toFixed(2)}</p>
      <p><strong>Shipping:</strong> $${order.shipping_fee.toFixed(2)}</p>
      <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>

      <h3>Shipping Address:</h3>
      <p>${order.shipping_address}</p>

      <h3>Payment Method:</h3>
      <p>${formatPaymentMethod(order.payment_method)}</p>

      ${order.payment_method === 'cod' ? '' : `
        <p style="color: #ff9800;">
          <strong>⏳ Payment Status:</strong> Pending verification
        </p>
        <p>We will verify your payment and send you a confirmation email shortly.</p>
      `}

      <p style="color: #666; font-size: 12px; margin-top: 20px;">
        Thank you for shopping with Kalyana!
      </p>
    `,
  }),

  paymentVerified: (order) => ({
    subject: `Payment Verified - ${order.order_number}`,
    html: `
      <h2>Payment Verified ✓</h2>
      <p>We have successfully verified your payment for order <strong>${order.order_number}</strong>.</p>
      <p>Your order will be processed and shipped shortly.</p>
      <p style="color: #4caf50;">Status: <strong>Payment Verified</strong></p>
      <p style="color: #666; font-size: 12px; margin-top: 20px;">
        You will receive another email when your order ships.
      </p>
    `,
  }),

  paymentRejected: (order, notes) => ({
    subject: `Payment Issue - ${order.order_number}`,
    html: `
      <h2>Payment Verification Failed</h2>
      <p>We were unable to verify the payment for order <strong>${order.order_number}</strong>.</p>
      ${notes ? `<p><strong>Details:</strong> ${notes}</p>` : ''}
      <p>Please contact us to resolve this issue or resubmit your payment.</p>
      <p>Contact: <a href="mailto:support@kalyana.test">support@kalyana.test</a></p>
    `,
  }),

  shippingNotification: (order, trackingNumber) => ({
    subject: `Your Order Has Shipped - ${order.order_number}`,
    html: `
      <h2>Your order is on the way!</h2>
      <p>Order <strong>${order.order_number}</strong> has been shipped.</p>
      ${trackingNumber ? `
        <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
      ` : ''}
      <p>You can track your package using the link above.</p>
      <p style="color: #666; font-size: 12px; margin-top: 20px;">
        Thank you for your purchase!
      </p>
    `,
  }),

  adminAlert: (type, data) => ({
    subject: `[ADMIN] ${type} - Kalyana`,
    html: `
      <h2>Admin Alert</h2>
      <p><strong>Type:</strong> ${type}</p>
      <pre>${JSON.stringify(data, null, 2)}</pre>
    `,
  }),
};

function formatPaymentMethod(method) {
  const map = {
    cod: "Cash on Delivery",
    easypaisa: "Easypaisa",
    jazzcash: "JazzCash",
    bank: "Bank Transfer",
  };
  return map[method] || method;
}

export async function logEmail(orderId, recipientEmail, emailType, subject, status, errorMessage = null) {
  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO email_logs (order_id, recipient_email, email_type, subject, status, error_message, retry_count, sent_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `).run(
      orderId || null,
      recipientEmail,
      emailType,
      subject,
      status,
      errorMessage || null,
      status === "sent" ? new Date().toISOString() : null
    );
  } catch (err) {
    console.error("[Email] Error logging email:", err.message);
  }
}

export async function sendOrderConfirmation(order, items) {
  try {
    const template = templates.orderConfirmation(order, items);
    const result = await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@kalyana.test",
      to: order.customer_email,
      subject: template.subject,
      html: template.html,
    });

    await logEmail(order.id, order.customer_email, "order_confirmation", template.subject, "sent");
    console.log(`[Email] Order confirmation sent to ${order.customer_email}`);
    return result;
  } catch (error) {
    console.error("[Email] Error sending order confirmation:", error.message);
    await logEmail(order.id, order.customer_email, "order_confirmation", "Order Confirmation", "failed", error.message);
    throw error;
  }
}

export async function sendPaymentVerified(order) {
  try {
    const template = templates.paymentVerified(order);
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@kalyana.test",
      to: order.customer_email,
      subject: template.subject,
      html: template.html,
    });

    await logEmail(order.id, order.customer_email, "payment_verified", template.subject, "sent");
    console.log(`[Email] Payment verified email sent to ${order.customer_email}`);
  } catch (error) {
    console.error("[Email] Error sending payment verified email:", error.message);
    await logEmail(order.id, order.customer_email, "payment_verified", "Payment Verified", "failed", error.message);
    throw error;
  }
}

export async function sendPaymentRejected(order, notes) {
  try {
    const template = templates.paymentRejected(order, notes);
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@kalyana.test",
      to: order.customer_email,
      subject: template.subject,
      html: template.html,
    });

    await logEmail(order.id, order.customer_email, "payment_rejected", template.subject, "sent");
    console.log(`[Email] Payment rejected email sent to ${order.customer_email}`);
  } catch (error) {
    console.error("[Email] Error sending payment rejected email:", error.message);
    await logEmail(order.id, order.customer_email, "payment_rejected", "Payment Rejected", "failed", error.message);
    throw error;
  }
}

export async function sendShippingNotification(order, trackingNumber = null) {
  try {
    const template = templates.shippingNotification(order, trackingNumber);
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@kalyana.test",
      to: order.customer_email,
      subject: template.subject,
      html: template.html,
    });

    await logEmail(order.id, order.customer_email, "shipping_notification", template.subject, "sent");
    console.log(`[Email] Shipping notification sent to ${order.customer_email}`);
  } catch (error) {
    console.error("[Email] Error sending shipping notification:", error.message);
    await logEmail(order.id, order.customer_email, "shipping_notification", "Shipping Notification", "failed", error.message);
    throw error;
  }
}

export async function sendAdminAlert(type, data, adminEmail) {
  try {
    const template = templates.adminAlert(type, data);
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@kalyana.test",
      to: adminEmail || process.env.ADMIN_EMAIL || "admin@kalyana.test",
      subject: template.subject,
      html: template.html,
    });

    console.log(`[Email] Admin alert sent to ${adminEmail}`);
  } catch (error) {
    console.error("[Email] Error sending admin alert:", error.message);
    throw error;
  }
}

export async function testEmailConnection() {
  try {
    await transporter.verify();
    console.log("✓ Email service is configured and ready");
    return true;
  } catch (error) {
    console.error("✗ Email service error:", error.message);
    return false;
  }
}
