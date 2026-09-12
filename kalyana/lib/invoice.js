import getDb from "@/lib/db";

export function generateInvoice(order, items) {
  const invoiceDate = new Date().toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 3);
  const dueDateStr = dueDate.toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return {
    invoiceNumber: `INV-${order.order_number}`,
    invoiceDate,
    dueDate: dueDateStr,
    orderNumber: order.order_number,
    orderDate: new Date(order.created_at).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone,
    shippingAddress: order.shipping_address,
    items: items.map(item => ({
      productName: item.product_name,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      lineTotal: item.line_total
    })),
    subtotal: order.subtotal,
    shippingFee: order.shipping_fee,
    tax: order.tax,
    discount: order.discount || 0,
    total: order.total,
    paymentStatus: order.payment_status,
    orderStatus: order.order_status
  };
}

export function formatPKR(amount) {
  return `₨ ${parseFloat(amount).toLocaleString('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`;
}

export function generateInvoiceHTML(invoice, companyDetails) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937; }
        .container { max-width: 850px; margin: 0 auto; padding: 40px; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 3px solid #059669; padding-bottom: 20px; }
        .logo { font-size: 28px; font-weight: bold; background: linear-gradient(to right, #059669, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .invoice-title { text-align: right; }
        .invoice-number { font-size: 24px; font-weight: bold; color: #059669; }
        .invoice-date { font-size: 12px; color: #6b7280; }
        .info-section { display: flex; gap: 40px; margin-bottom: 40px; }
        .info-block { flex: 1; }
        .info-label { font-size: 11px; font-weight: bold; color: #6b7280; text-transform: uppercase; margin-bottom: 8px; }
        .info-value { font-size: 14px; color: #1f2937; margin-bottom: 4px; }
        .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .table th { background: #f3f4f6; border-bottom: 2px solid #d1d5db; padding: 12px; text-align: left; font-weight: 600; font-size: 12px; color: #374151; }
        .table td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
        .table tr:last-child td { border-bottom: 2px solid #d1d5db; }
        .text-right { text-align: right; }
        .summary { display: flex; justify-content: flex-end; margin-bottom: 30px; }
        .summary-table { width: 300px; }
        .summary-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
        .summary-row.total { border-bottom: none; border-top: 2px solid #059669; padding-top: 15px; font-size: 18px; font-weight: bold; color: #059669; }
        .payment-status { background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin-bottom: 30px; border-radius: 6px; }
        .payment-status.pending { background: #fef3c7; border-left-color: #f59e0b; }
        .payment-status-label { font-size: 12px; font-weight: bold; text-transform: uppercase; color: #047857; margin-bottom: 4px; }
        .payment-status-label.pending { color: #92400e; }
        .payment-status-value { font-size: 16px; font-weight: bold; color: #047857; }
        .payment-status-value.pending { color: #b45309; }
        .footer { border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center; }
        .bank-details { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin-bottom: 20px; border-radius: 6px; font-size: 12px; }
        .bank-details-title { font-weight: bold; color: #1e40af; margin-bottom: 8px; }
        .bank-detail-line { margin: 4px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🦚 Kalyana</div>
          <div class="invoice-title">
            <div class="invoice-number">${invoice.invoiceNumber}</div>
            <div class="invoice-date">${invoice.invoiceDate}</div>
          </div>
        </div>

        <div class="info-section">
          <div class="info-block">
            <div class="info-label">Bill To</div>
            <div class="info-value" style="font-weight: bold;">${invoice.customerName}</div>
            <div class="info-value">${invoice.customerEmail}</div>
            <div class="info-value">${invoice.customerPhone || 'N/A'}</div>
            <div class="info-value" style="margin-top: 8px; font-size: 12px; color: #6b7280; white-space: pre-wrap;">${invoice.shippingAddress}</div>
          </div>
          <div class="info-block">
            <div class="info-label">Order Details</div>
            <div class="info-value"><strong>Order #:</strong> ${invoice.orderNumber}</div>
            <div class="info-value"><strong>Order Date:</strong> ${invoice.orderDate}</div>
            <div class="info-value"><strong>Invoice Date:</strong> ${invoice.invoiceDate}</div>
            <div class="info-value"><strong>Due Date:</strong> ${invoice.dueDate}</div>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th style="width: 50%;">Product</th>
              <th style="width: 15%; text-align: center;">Qty</th>
              <th style="width: 17%; text-align: right;">Unit Price</th>
              <th style="width: 18%; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => `
              <tr>
                <td>${item.productName}</td>
                <td style="text-align: center;">${item.quantity}</td>
                <td class="text-right">₨ ${item.unitPrice.toLocaleString('en-PK')}</td>
                <td class="text-right">₨ ${item.lineTotal.toLocaleString('en-PK')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-table">
            <div class="summary-row">
              <span>Subtotal:</span>
              <span>₨ ${invoice.subtotal.toLocaleString('en-PK')}</span>
            </div>
            <div class="summary-row">
              <span>Shipping:</span>
              <span>₨ ${invoice.shippingFee.toLocaleString('en-PK')}</span>
            </div>
            ${invoice.tax > 0 ? `
              <div class="summary-row">
                <span>Tax:</span>
                <span>₨ ${invoice.tax.toLocaleString('en-PK')}</span>
              </div>
            ` : ''}
            <div class="summary-row total">
              <span>Total:</span>
              <span>₨ ${invoice.total.toLocaleString('en-PK')}</span>
            </div>
          </div>
        </div>

        <div class="payment-status ${invoice.paymentStatus === 'pending' ? 'pending' : ''}">
          <div class="payment-status-label ${invoice.paymentStatus === 'pending' ? 'pending' : ''}">
            ${invoice.paymentStatus === 'pending' ? '⏳ Payment Pending' : '✅ Payment Completed'}
          </div>
          <div class="payment-status-value ${invoice.paymentStatus === 'pending' ? 'pending' : ''}">
            ${invoice.paymentStatus === 'pending' ? 'Awaiting payment' : 'Paid'}
          </div>
        </div>

        <div class="footer">
          <p>Thank you for your business!</p>
          <p style="margin-top: 8px;">This is an automated invoice. For inquiries, please contact support@kalyana.pk</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
