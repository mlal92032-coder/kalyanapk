import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { generateInvoice, generateInvoiceHTML } from "@/lib/invoice";

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const db = getDb();

    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(id);

    const invoice = generateInvoice(order, items);
    const companyDetails = {
      name: "Kalyana",
      address: "Karachi, Pakistan",
      email: "support@kalyana.pk",
      phone: "0300-1234567"
    };

    const invoiceHTML = generateInvoiceHTML(invoice, companyDetails);

    return new NextResponse(invoiceHTML, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="Invoice-${order.order_number}.html"`
      }
    });
  } catch (error) {
    console.error("Error generating invoice:", error);
    return NextResponse.json(
      { error: "Could not generate invoice" },
      { status: 500 }
    );
  }
}
