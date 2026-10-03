import paypalCheckoutServerSdk from "@paypal/checkout-server-sdk";
import getDb from "./db.js";

// Initialize PayPal environment
const environment =
  process.env.NODE_ENV === "production"
    ? new paypalCheckoutServerSdk.core.LiveEnvironment(
        process.env.PAYPAL_CLIENT_ID,
        process.env.PAYPAL_CLIENT_SECRET
      )
    : new paypalCheckoutServerSdk.core.SandboxEnvironment(
        process.env.PAYPAL_CLIENT_ID || "test",
        process.env.PAYPAL_CLIENT_SECRET || "test"
      );

const client = new paypalCheckoutServerSdk.core.PayPalHttpClient(environment);

export async function createOrder(order, returnUrl, cancelUrl) {
  try {
    const request = new paypalCheckoutServerSdk.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.body = {
      intent: "CAPTURE",
      payer: {
        name: {
          given_name: order.customer_name.split(" ")[0],
          surname: order.customer_name.split(" ").slice(1).join(" "),
        },
        email_address: order.customer_email,
        address: {
          address_line_1: order.shipping_address.split("\n")[0],
          admin_area_2: "City",
          postal_code: "00000",
          country_code: "US",
        },
      },
      purchase_units: [
        {
          reference_id: order.id.toString(),
          amount: {
            currency_code: "USD",
            value: order.total.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: "USD",
                value: order.subtotal.toFixed(2),
              },
              shipping: {
                currency_code: "USD",
                value: order.shipping_fee.toFixed(2),
              },
              tax_total: {
                currency_code: "USD",
                value: order.tax.toFixed(2),
              },
            },
          },
          items: [],
          shipping: {
            name: {
              full_name: order.customer_name,
            },
            address: {
              address_line_1: order.shipping_address.split("\n")[0],
              admin_area_2: "City",
              postal_code: "00000",
              country_code: "US",
            },
          },
        },
      ],
      application_context: {
        return_url: returnUrl,
        cancel_url: cancelUrl,
        user_action: "PAY_NOW",
      },
    };

    const response = await client.execute(request);

    // Store in database
    const db = getDb();
    db.prepare(`
      INSERT INTO payment_gateway_transactions
      (order_id, gateway_name, gateway_transaction_id, amount, currency, status, response_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      order.id,
      "paypal",
      response.result.id,
      order.total,
      "USD",
      "pending",
      JSON.stringify({ orderId: response.result.id })
    );

    return {
      id: response.result.id,
      approvalUrl: response.result.links.find((link) => link.rel === "approve").href,
    };
  } catch (error) {
    console.error("[PayPal] Error creating order:", error.message);
    throw error;
  }
}

export async function captureOrder(paypalOrderId) {
  try {
    const request = new paypalCheckoutServerSdk.orders.OrdersCaptureRequest(paypalOrderId);
    request.requestBody({});

    const response = await client.execute(request);

    const db = getDb();

    if (response.result.status === "COMPLETED") {
      const captureId = response.result.purchase_units[0].payments.captures[0].id;

      db.prepare(`
        UPDATE payment_gateway_transactions
        SET status = ?, response_json = ?, updated_at = ?
        WHERE gateway_transaction_id = ?
      `).run(
        "succeeded",
        JSON.stringify({ captureId }),
        new Date().toISOString(),
        paypalOrderId
      );

      db.prepare(`
        UPDATE orders
        SET payment_status = ?, payment_reference = ?, gateway_transaction_id = ?, updated_at = ?
        WHERE id = ?
      `).run(
        "verified",
        paypalOrderId,
        paypalOrderId,
        new Date().toISOString(),
        response.result.purchase_units[0].reference_id
      );

      return { status: "succeeded", orderId: response.result.purchase_units[0].reference_id };
    }

    return { status: response.result.status };
  } catch (error) {
    console.error("[PayPal] Error capturing order:", error.message);
    throw error;
  }
}

export async function refundCapture(captureId, amount = null) {
  try {
    const request = new paypalCheckoutServerSdk.payments.CapturesRefundRequest(captureId);
    request.body = amount
      ? {
          amount: {
            currency_code: "USD",
            value: amount.toFixed(2),
          },
        }
      : {};

    const response = await client.execute(request);

    console.log(`[PayPal] Refund created: ${response.result.id}`);
    return response.result;
  } catch (error) {
    console.error("[PayPal] Error refunding:", error.message);
    throw error;
  }
}

export function getPayPalClient() {
  return client;
}
