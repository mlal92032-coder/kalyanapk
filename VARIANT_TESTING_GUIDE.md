# Variant Selector Testing & Integration Guide

## Quick Start

### 1. Files Created/Modified
- ✅ **Modified**: `/kalyana/app/products/[slug]/page.js` - Updated to fetch variants
- ✅ **Created**: `/kalyana/components/ProductVariantSelector.jsx` - New variant selector component

### 2. Database Requirements
The following database tables must exist and be populated:
```
- product_variants (v.id, v.product_id, v.color_id, v.size_id, v.sku, v.stock, v.price_override, v.status)
- product_colors (c.id, c.color_name, c.color_hex)
- product_sizes (s.id, s.size_name)
```

---

## Testing Scenarios

### Test 1: Product Without Variants
**Expected Behavior**: Falls back to ProductPurchasePanel

```javascript
// Test Case
1. Visit a product with 0 variants
2. Expect: Standard purchase panel (no color swatches, no size selector)
3. Add to cart works normally
```

### Test 2: Product With Color Only (No Size)
**Expected Behavior**: Shows color swatches, no size dropdown

```javascript
// Sample Variants
- Red (No Size)
- Blue (No Size)
- Green (No Size)

// Test Case
1. Visit product
2. See color swatches for Red, Blue, Green
3. No size dropdown visible
4. Click different colors, SKU and stock update
5. Add to cart sends variant ID
```

### Test 3: Product With Size Only (No Color)
**Expected Behavior**: Shows size dropdown, no color swatches

```javascript
// Sample Variants
- S (No Color)
- M (No Color)
- L (No Color)
- XL (No Color)

// Test Case
1. Visit product
2. See size dropdown (sorted: S, M, L, XL)
3. No color swatches visible
4. Select different sizes, SKU and stock update
5. Pricing updates based on size variant's price_override
```

### Test 4: Product With Both Color and Size
**Expected Behavior**: Shows both color swatches AND size dropdown

```javascript
// Sample Variants
- Red + S, Red + M, Red + L
- Blue + S, Blue + M, Blue + L
- Green + S, Green + M, Green + L

// Test Case
1. Visit product
2. See color swatches: Red, Blue, Green
3. See size dropdown: S, M, L
4. Select Red → Size dropdown shows S, M, L for Red
5. Select S → Color swatches shows available colors for S
6. Verify stock/SKU update correctly
7. Price updates based on Red+S variant's price_override
8. Add to cart works
```

### Test 5: Color Swatch Interaction
**Test Case: Color Selection**

```javascript
// Setup
Product with variants: Red, Blue, Green

// Test Steps
1. Initial render: First color (Red) selected by default
2. Click Blue swatch
   - Blue gets selected (border-neutral-900, scale-110, checkmark visible)
   - Red swatch becomes normal
   - Hover shows "Blue" tooltip
3. Click Green swatch
   - Smooth transition
   - Stock/SKU updates
   - Price recalculated
4. Disabled colors appear grayed out (opacity-50)
```

### Test 6: Size Dropdown Interaction
**Test Case: Size Selection**

```javascript
// Setup
Product with sizes: XS, S, M, L, XL, XXL, XXXL

// Test Steps
1. Dropdown opens with all sizes listed
2. Select M
3. Expect:
   - Selected size shows in state
   - "Selected size: M" text appears below dropdown
   - If color-size combo unavailable, color auto-resets
   - Price updates for variant M
4. Out of stock sizes show "(Out of stock)" label
5. Can't select disabled options
```

### Test 7: Dynamic Price Updates
**Test Case: Price Changes on Variant Selection**

```javascript
// Setup
Product base_price: $10
Red+S price_override: $12
Red+M price_override: null (uses $10)
Blue+S price_override: $15

// Test Steps
1. Load product → shows $10 (base price)
2. Select Red+S → quote API fetches, shows $12
3. Select Red+M → quote API fetches, shows $10
4. Select Blue+S → quote API fetches, shows $15
5. Quantity change → recalculates with variant price
```

### Test 8: Stock Level Display
**Test Case: Variant Stock Updates**

```javascript
// Setup
Base stock: 100
Red+S stock: 50
Red+M stock: 0 (out of stock)
Blue+S stock: 200

// Test Steps
1. Select Red+S
   - Stock shows: "50 pcs"
   - Color: emerald-700 (green)
   - Can add to cart
2. Select Red+M
   - Stock shows: "0 pcs"
   - Color: red-600 (red)
   - Button changes to "Out of Stock"
   - Cannot click add to cart
   - Warning: "⚠️ This variant is currently out of stock"
3. Select Blue+S
   - Stock shows: "200 pcs"
   - Button enabled again
   - Can add to cart
```

### Test 9: SKU Display
**Test Case: Variant-Specific SKU**

```javascript
// Setup
Base SKU: KLY-SHIRT-001
Red+S SKU: KLY-SHIRT-RED-S
Red+M SKU: KLY-SHIRT-RED-M
Blue+S SKU: null (falls back to base)

// Test Steps
1. Select Red+S → SKU shows "KLY-SHIRT-RED-S"
2. Select Red+M → SKU shows "KLY-SHIRT-RED-M"
3. Select Blue+S → SKU shows "KLY-SHIRT-001" (base)
```

### Test 10: Bulk Pricing with Variants
**Test Case: Bulk Pricing Interaction**

```javascript
// Setup
Bulk Pricing:
- 1-9 pcs: $10/piece
- 10-49 pcs: $8/piece
- 50-99 pcs: $6/piece
- 100+ pcs: $5/piece

Variant Red+S price_override: $12

// Test Steps
1. Select Red+S, qty 5
   - Quote: 5 × $12 = $60
   - Bulk table active row: "1–9"
2. Change qty to 15
   - Quote: 15 × $8 = $120 (uses bulk tier, NOT override?)
   - Wait for response...
   - Bulk table active row: "10–49"
3. Change qty to 100
   - Quote: 100 × $5 = $500
   - Bulk table active row: "100+"
```

### Test 11: Add to Cart with Variant
**Test Case: Cart API Integration**

```javascript
// Setup
Product ID: 1
Variant ID: 5 (Red+M)
Quantity: 10

// Test Steps
1. Select Red+M, qty 10
2. Click "Add to Cart"
3. Button shows "Adding…"
4. API call to POST /api/cart with body:
   {
     "productId": 1,
     "quantity": 10,
     "variantId": 5
   }
5. On success:
   - Button shows "Added ✓ — Add More"
   - "Go to Cart" button appears
   - "kalyana:cart-updated" event dispatched
6. Can click "Added ✓ — Add More" to reset
7. Click "Go to Cart" → navigates to /cart
```

### Test 12: Error Handling
**Test Case: Network & Validation Errors**

```javascript
// Test 12a: Price Calculation Error
1. Select variant
2. Quote API fails (simulate 500 error)
3. Expect: Red error text, "Could not calculate price."
4. Add to cart button disabled

// Test 12b: Add to Cart Error
1. Select variant
2. Add to cart → API returns 400 error
3. Expect: Error message displayed
4. Button re-enabled after error

// Test 12c: Network Error
1. All fetch calls fail (no network)
2. Expect: "Network error while..." message
3. User can retry
```

### Test 13: Responsive Design
**Test Case: Mobile Responsiveness**

```javascript
// Desktop (1024px+)
1. Color swatches in row
2. Size dropdown full width
3. Two-column info grid
4. Large buttons

// Tablet (768px)
1. Color swatches wrap if needed
2. Single-column layout
3. Buttons 100% width

// Mobile (375px)
1. Single column for all sections
2. Color swatches wrap
3. Full-width inputs
4. Full-width buttons
5. Touch-friendly sizes
```

### Test 14: Browser Compatibility
**Test Case: Cross-Browser**

```javascript
// Chrome/Edge (Chromium)
- ✓ Color swatches render
- ✓ Dropdown works
- ✓ Animations smooth
- ✓ SVG arrow displays

// Firefox
- ✓ All features work
- ✓ SVG custom arrow visible

// Safari (macOS)
- ✓ Responsive
- ✓ Dropdown styling
- ✓ CSS gradients work

// Mobile Safari
- ✓ Touch-friendly buttons
- ✓ Dropdown accessible
- ✓ Swatches tappable
```

### Test 15: State Reset Scenarios
**Test Case: State Management**

```javascript
// Scenario 1: Navigate back
1. Visit product, select Red+M, qty 15
2. Go back, return to product
3. Expect: Fresh state, first color/size selected, qty=MOQ

// Scenario 2: Unavailable combination
1. Select Red color
2. All available sizes for Red load
3. Select size S
4. Change to Blue color
5. If Blue+S unavailable → Blue selects, size resets to first available
6. Expect: No crash, valid variant selected

// Scenario 3: Stock runs out
1. Select variant with 10 pcs stock
2. Admin updates to 0 pcs (simulate)
3. Refresh page
4. Expect: Out of stock state, button disabled
```

---

## Integration Points

### 1. Cart API (`/api/cart`)
Must handle `variantId` in request body:

```javascript
POST /api/cart
{
  "productId": 1,
  "quantity": 10,
  "variantId": 5  // NEW
}
```

**Current Cart API Location**: `/kalyana/app/api/cart/route.js`

**Needed Changes**:
- Accept `variantId` from request
- Store variant selection with cart item
- Use variant's stock when checking availability
- Apply variant's price_override when calculating

### 2. Quote API (`/api/quote`)
Must handle `variantId` for accurate pricing:

```javascript
POST /api/quote
{
  "productId": 1,
  "quantity": 10,
  "variantId": 5  // NEW - optional
}
```

**Current Quote API Location**: `/kalyana/lib/pricing.js` or `/kalyana/app/api/quote/route.js`

**Needed Changes**:
- Accept optional `variantId`
- If variant provided, use its `price_override` if set
- Apply bulk pricing tiers
- Return accurate unit price and total

### 3. Database Queries
Already working:
```sql
-- Page component fetches variants
SELECT v.id, v.color_id, v.size_id, v.sku, v.stock, v.price_override,
       c.color_name, c.color_hex, s.size_name
FROM product_variants v
LEFT JOIN product_colors c ON v.color_id = c.id
LEFT JOIN product_sizes s ON v.size_id = s.id
WHERE v.product_id = ? AND v.status = 'active'
```

### 4. Cart Item Display
When displaying cart items, need to show:
- Product name
- Variant details (color name + hex, size name)
- Variant SKU
- Variant price used

---

## Performance Considerations

### 1. Image Optimization
Consider adding variant-specific images:
```javascript
// Future enhancement
product_variant_images table with:
- variant_id
- image_url
- is_primary

// Then update cart display to show correct image
```

### 2. API Calls Optimization
Current approach:
- Fetches quote on mount and on quantity/variant change
- Could debounce quote calls to reduce API hits

Improvement:
```javascript
const debouncedFetchQuote = useCallback(
  debounce((qty, variantId) => fetchQuote(qty, variantId), 300),
  []
);
```

### 3. Database Indexing
Ensure indexes exist:
```sql
-- Add to database migrations
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_status ON product_variants(status);
CREATE INDEX idx_product_colors_product_id ON product_colors(product_id);
CREATE INDEX idx_product_sizes_product_id ON product_sizes(product_id);
```

---

## Migration Checklist

If adding variants to existing products:

- [ ] Run database migrations to create color/size/variant tables
- [ ] Populate existing products with variants
- [ ] Update cart API to handle variantId
- [ ] Update quote API to use variant pricing
- [ ] Test with existing products (no variants)
- [ ] Test with new products (with variants)
- [ ] Update order history to show variant info
- [ ] Update invoice templates to include variant details
- [ ] Test cart checkout flow with variants
- [ ] Update admin panel to manage variants

---

## Debugging Tips

### 1. Check Variant Data
```javascript
// In browser console
const variants = JSON.parse(sessionStorage.getItem('pageProps'))?.variants;
console.log(variants); // Should see all variants with color/size info
```

### 2. Network Tab
Watch for:
- `/api/quote` calls when variant/quantity changes
- `/api/cart` POST when adding to cart
- Verify request bodies include `variantId`

### 3. React DevTools
- Check ProductVariantSelector state
- Verify `selectedColor`, `selectedSize`, `selectedVariant`
- Watch quote/loading states change

### 4. Database Queries
```sql
-- Verify variants exist for product
SELECT v.*, c.color_name, s.size_name 
FROM product_variants v
LEFT JOIN product_colors c ON v.color_id = c.id
LEFT JOIN product_sizes s ON v.size_id = s.id
WHERE v.product_id = 1;
```

---

## Known Limitations & Future Work

### Current Limitations
1. No variant-specific images (uses product main image)
2. No size guide modal
3. No variant comparison view
4. No variant filters on product listing page
5. Bulk pricing doesn't differentiate by variant

### Future Enhancements
1. **Variant Images**: Add image per variant
2. **Size Chart**: Modal with size measurements
3. **Inventory Sync**: Real-time stock from admin
4. **Variant Reviews**: Reviews tagged by variant
5. **Bundle Deals**: Discount on variant combinations
6. **Pre-order**: Mark variants as pre-order
7. **Notifications**: Alert when variant back in stock
8. **Wishlist**: Save favorite variants

---

## Support & Troubleshooting

### Issue: Variants not displaying
**Solution**: 
1. Check database has variants for product
2. Verify variant status = 'active'
3. Ensure color_hex is populated
4. Check browser console for errors

### Issue: Price not updating
**Solution**:
1. Verify /api/quote is working
2. Check variant price_override in database
3. Ensure quantity is valid (>= MOQ)
4. Check network tab for failed requests

### Issue: "Out of Stock" always showing
**Solution**:
1. Check variant stock values in database
2. Verify SELECT query returns stock correctly
3. Test with variant stock > 0
4. Refresh page cache

### Issue: Dropdown not showing sizes
**Solution**:
1. Ensure product_sizes table has records
2. Verify variants have size_id populated
3. Check that size_id references existing product_sizes.id
4. Database foreign key constraints

