import getDb from "./db";

/**
 * Resolves the correct unit price for a given product + quantity using the
 * product's bulk pricing tiers. Falls back to base_price if quantity is
 * below the lowest tier or no tiers exist. This is the ONLY place price
 * should be computed — never trust a price sent from the browser.
 */
export function resolveUnitPrice(product, quantity) {
  const db = getDb();
  const tiers = db
    .prepare(
      "SELECT * FROM bulk_pricing WHERE product_id = ? ORDER BY min_qty ASC"
    )
    .all(product.id);

  if (!tiers.length) return product.base_price;

  let matched = null;
  for (const tier of tiers) {
    const withinMin = quantity >= tier.min_qty;
    const withinMax = tier.max_qty === null || quantity <= tier.max_qty;
    if (withinMin && withinMax) {
      matched = tier;
      break;
    }
  }

  // If quantity is below the smallest tier's min_qty, use base price.
  if (!matched) {
    const smallest = tiers[0];
    if (quantity < smallest.min_qty) return product.base_price;
    // above the largest tier's max (shouldn't happen since last tier is unbounded)
    return tiers[tiers.length - 1].price;
  }

  return matched.price;
}

export function getBulkTiers(productId) {
  const db = getDb();
  return db
    .prepare(
      "SELECT * FROM bulk_pricing WHERE product_id = ? ORDER BY min_qty ASC"
    )
    .all(productId);
}

/**
 * Computes a full priced quote for a set of {productId, quantity} lines
 * by re-reading the product + tiers from the DB. Used by cart display,
 * checkout, and order creation so the server always owns the numbers.
 */
export function priceLines(lines) {
  const db = getDb();
  const priced = [];
  let subtotal = 0;

  for (const line of lines) {
    const product = db
      .prepare("SELECT * FROM products WHERE id = ?")
      .get(line.productId);
    if (!product) continue;
    if (product.status !== "published") continue;

    const quantity = Math.max(1, parseInt(line.quantity, 10) || 1);
    const unitPrice = resolveUnitPrice(product, quantity);
    const lineTotal = Math.round(unitPrice * quantity * 100) / 100;
    subtotal += lineTotal;

    priced.push({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      quantity,
      unitPrice,
      lineTotal,
      moq: product.moq,
      stock: product.stock,
    });
  }

  subtotal = Math.round(subtotal * 100) / 100;
  return { lines: priced, subtotal };
}
