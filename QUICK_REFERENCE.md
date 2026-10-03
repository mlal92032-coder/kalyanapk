# Product Variant Selector - Quick Reference

## What Was Done

### Files Modified
1. **`/kalyana/app/products/[slug]/page.js`**
   - Added variant fetching with SQL joins
   - Conditional render: ProductVariantSelector if variants exist, else ProductPurchasePanel
   - ~50 lines added

### Files Created
1. **`/kalyana/components/ProductVariantSelector.jsx`**
   - Complete variant selector component
   - ~450 lines of production-ready code

## 10-Second Overview

```jsx
// Page fetches variants:
const variants = db.prepare(`
  SELECT v.*, c.color_name, c.color_hex, s.size_name
  FROM product_variants v
  LEFT JOIN product_colors c ON v.color_id = c.id
  LEFT JOIN product_sizes s ON v.size_id = s.id
  WHERE v.product_id = ?
`).all(product.id);

// Passes to component:
<ProductVariantSelector product={product} variants={variants} />

// Component renders:
✅ Color swatches (circular with hex colors)
✅ Size dropdown (with smart sorting)
✅ Stock display (variant-specific)
✅ SKU display (variant-specific)
✅ Dynamic pricing (variant price_override)
✅ Professional styling (Flipkart/Amazon style)
```

## Component Props

```javascript
ProductVariantSelector({
  product: {
    id, name, base_price, moq, stock, sku, currency
  },
  variants: [
    {
      id, product_id, color_id, size_id, sku, stock, price_override,
      color_name, color_hex, size_name
    }
  ],
  bulkPricing: [
    { id, min_qty, max_qty, price }
  ]
})
```

## Features at a Glance

| Feature | Details |
|---------|---------|
| **Color Swatches** | Circular buttons, hex colors, hover tooltips, checkmark on select |
| **Size Dropdown** | Professional styling, smart sorting (XS-XXXL), out of stock labels |
| **Stock Display** | Real-time variant stock, green/red text, warning if out |
| **SKU Display** | Variant SKU or falls back to product SKU |
| **Price Updates** | Uses variant price_override or product base_price, applies bulk tiers |
| **Styling** | Emerald/cyan gradients, Flipkart/Amazon aesthetic, responsive |
| **Add to Cart** | Sends productId + variantId to API |
| **Out of Stock** | Button disabled, text changes, warning shown |

## Visual Layout

```
┌─────────────────────────────────────────┐
│ Color Selection                         │
│ ⚫ ⚫ ⚫ ⚫ (color swatches)              │
├─────────────────────────────────────────┤
│ Size Selection                          │
│ [-- Select Size --▼] (dropdown)        │
├─────────────────────────────────────────┤
│ SKU: KLY-SHIRT-RED-S    Stock: 50 pcs  │
├─────────────────────────────────────────┤
│ 💰 Bulk Pricing Tiers                  │
│ Qty Range    | Price/pc                │
│ 1-9          | $10.00                  │
│ 10-49        | $8.00 ← Active          │
│ 50-99        | $6.00                   │
│ 100+         | $5.00                   │
├─────────────────────────────────────────┤
│ Quantity: [15] MOQ: 1 pcs              │
│                                         │
│ 15 pieces × $8.00 = Total: ₨ 1,200   │
│                                         │
│ [    Add to Cart Button     ]           │
│ [ Go to Cart Link (after add) ]        │
└─────────────────────────────────────────┘
```

## Key Functions

### handleColorChange(colorId)
```javascript
// Updates selected color, validates combo, auto-resets size if needed
```

### handleSizeChange(sizeId)
```javascript
// Updates selected size, validates combo, auto-resets color if needed
```

### handleQuantityChange(value)
```javascript
// Updates quantity, fetches new quote price
```

### addToCart()
```javascript
// POST /api/cart with {productId, quantity, variantId}
// Shows loading → success → "Go to Cart" link
```

### fetchQuote(qty, variantId)
```javascript
// POST /api/quote with optional variantId
// Returns {quantity, unitPrice, total}
```

## State Variables

```javascript
// Selection
selectedColor: number | null
selectedSize: number | null

// Purchase
quantity: number
quote: object | null
loading: boolean
adding: boolean
added: boolean
error: string
```

## Styling Classes Used

### Swatches
```
w-12 h-12          // 48x48px
rounded-full       // Circular
border-2           // 2px border
scale-110          // Enlarge on select
shadow-lg          // Shadow on select
```

### Dropdown
```
border-2 border-neutral-300
focus:border-cyan-500
focus:ring-2 focus:ring-cyan-200
rounded-lg px-4 py-3
```

### Panels
```
border-2 border-emerald-200 bg-emerald-50    // Info panel
border border-neutral-200 bg-white           // Regular panel
```

### Buttons
```
bg-gradient-to-r from-emerald-500 to-cyan-500  // Primary
border-2 border-emerald-400                     // Secondary
disabled:opacity-50 disabled:cursor-not-allowed
hover:shadow-lg hover:shadow-emerald-500/50
```

## Database Tables Used

```sql
-- Variants
product_variants (id, product_id, color_id, size_id, sku, stock, price_override, status)

-- Colors
product_colors (id, product_id, color_name, color_hex)

-- Sizes
product_sizes (id, product_id, size_name)
```

## API Contracts

### Quote API
```javascript
POST /api/quote
{
  productId: number,
  quantity: number,
  variantId?: number  // NEW - optional
}

Response:
{
  quantity: number,
  unitPrice: number,
  total: number
}
```

### Cart API
```javascript
POST /api/cart
{
  productId: number,
  quantity: number,
  variantId?: number  // NEW - optional
}

Response:
{
  success: boolean,
  cartId: number,
  itemId: number
}
```

## Backward Compatibility

✅ **No Breaking Changes**
- Optional variantId in API calls
- Falls back to ProductPurchasePanel if no variants
- Existing products work unchanged

## Usage Example

Visit any product with variants:
```
/products/premium-cotton-t-shirt
```

Component automatically:
1. Extracts unique colors from variants
2. Extracts unique sizes from variants
3. Shows color swatches
4. Shows size dropdown
5. Updates stock/SKU when selection changes
6. Updates price when variant or quantity changes

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| No color swatches | Check product_colors exist for product |
| No size dropdown | Check product_sizes exist for product |
| Stock not updating | Verify variant.stock in database |
| Price not changing | Check price_override is set or API working |
| "Out of Stock" frozen | Refresh page to reload variant data |

## Testing Quick Checks

```javascript
// 1. Colors appear
Expect: Circular color buttons visible

// 2. Sizes appear  
Expect: Dropdown with size options

// 3. Selection works
Click color → stock/sku update
Select size → stock/sku update

// 4. Pricing updates
Change variant → quote API called
Change quantity → quote API called

// 5. Add to cart
Click "Add to Cart" → sends variantId
Shows "Added ✓"
"Go to Cart" link appears

// 6. Out of stock
Set variant stock to 0
Button shows "Out of Stock"
Button is disabled
```

## Files to Know

```
Primary Files:
├── /kalyana/app/products/[slug]/page.js
├── /kalyana/components/ProductVariantSelector.jsx
└── /kalyana/app/api/cart/route.js (needs variantId support)
└── /kalyana/app/api/quote/route.js (needs variantId support)

Documentation:
├── VARIANT_IMPLEMENTATION_GUIDE.md
├── VARIANT_SELECTOR_CODE.md
├── VARIANT_TESTING_GUIDE.md
├── IMPLEMENTATION_SUMMARY.md
└── QUICK_REFERENCE.md (this file)
```

## Color Scheme

```
Primary:      Emerald-500 (#10b981)
Secondary:    Cyan-500 (#06b6d4)
Text Dark:    Neutral-900 (#111827)
Text Light:   Neutral-500 (#6b7280)
Background:   Emerald-50 (#f0fdf4), Neutral-100 (#f3f4f6)
Alert:        Red-600 (#dc2626)
```

## Responsive Breakpoints

```
Mobile:     375px  - Single column, full-width
Tablet:     768px  - Flexbox wrap, medium inputs
Desktop:    1024px - Multi-column, optimized spacing
```

## Performance Notes

- ✅ Lazy loads quote only on variant change
- ✅ Memoized fetchQuote function
- ✅ Conditional rendering (no extra DOM)
- ✅ Minimal state updates
- ✅ Efficient unique extraction from variants

## Next Steps to Deploy

1. **API Integration** (2-3 hours)
   - Update /api/cart to accept variantId
   - Update /api/quote to use variant pricing

2. **Testing** (1-2 hours)
   - Create product with variants
   - Test color selection
   - Test size selection
   - Test add to cart
   - Test checkout

3. **Deployment** (30 min)
   - Push to production
   - Monitor errors
   - Verify cart checkout

## Quick Deploy Checklist

- [ ] ProductVariantSelector.jsx copied to components/
- [ ] Page component updated
- [ ] Database has test product with variants
- [ ] /api/cart handles variantId
- [ ] /api/quote uses variant pricing
- [ ] Tested on desktop browser
- [ ] Tested on mobile browser
- [ ] Tested with out-of-stock variant
- [ ] Tested add to cart flow
- [ ] Ready for production

---

**Questions?** See full docs:
- `VARIANT_IMPLEMENTATION_GUIDE.md` - Features
- `VARIANT_SELECTOR_CODE.md` - All code
- `VARIANT_TESTING_GUIDE.md` - Testing
- `IMPLEMENTATION_SUMMARY.md` - Full report
