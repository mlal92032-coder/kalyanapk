# Product Variant Implementation Guide

## Overview
This document outlines the implementation of a professional product detail page with full variant support, including color swatches, size selectors, and dynamic pricing.

---

## Files Modified/Created

### 1. **Updated: `/kalyana/app/products/[slug]/page.js`**
The main product detail page server component that now:
- Fetches all active variants for a product
- Joins variant data with color and size information
- Passes variant data to the new ProductVariantSelector component
- Falls back to ProductPurchasePanel if no variants exist

**Key Changes:**
```javascript
// Fetch all variants with their color and size details
const variants = db
  .prepare(
    `SELECT
       v.id, v.product_id, v.color_id, v.size_id, v.sku, v.stock, v.price_override,
       c.color_name, c.color_hex, s.size_name
     FROM product_variants v
     LEFT JOIN product_colors c ON v.color_id = c.id
     LEFT JOIN product_sizes s ON v.size_id = s.id
     WHERE v.product_id = ? AND v.status = 'active'
     ORDER BY c.color_name, s.size_name`
  )
  .all(product.id);

// Render variant selector if variants exist, otherwise fall back
{variants.length > 0 ? (
  <ProductVariantSelector
    product={product}
    variants={variants}
    bulkPricing={bulkPricing}
  />
) : (
  <ProductPurchasePanel product={product} bulkPricing={bulkPricing} />
)}
```

---

### 2. **New: `/kalyana/components/ProductVariantSelector.jsx`**
A comprehensive client-side component that handles all variant selection and purchasing logic.

## Features Implemented

### 1. **Color Swatches Display**
- Renders colored circular buttons for each unique color
- Shows hex color with visual swatch
- Displays color name on hover
- Shows checkmark on selected color
- Disables unavailable color/size combinations
- Professional styling similar to Flipkart/Amazon

```jsx
<div className="flex gap-3 flex-wrap">
  {uniqueColors.map((color) => (
    <button
      onClick={() => handleColorChange(color.id)}
      className={`w-12 h-12 rounded-full border-2 transition-all ${
        isSelected
          ? "border-neutral-900 shadow-lg shadow-neutral-900/30 scale-110"
          : "border-neutral-300 hover:border-neutral-600"
      }`}
      style={{ backgroundColor: color.hex }}
    />
  ))}
</div>
```

**Styling Details:**
- Circular swatches with 48x48px size
- 2px border with hover effects
- Scale up animation on selection
- Shadow effect for selected state
- Tooltip showing color name on hover

### 2. **Size Dropdown Selector**
- Professional styled dropdown with custom arrow icon
- Displays all available sizes
- Disables unavailable combinations
- Custom styling matching Flipkart/Amazon aesthetic
- Smart size sorting (XS, S, M, L, XL, XXL, XXXL order)

```jsx
<select
  value={selectedSize || ""}
  onChange={(e) => handleSizeChange(e.target.value ? Number(e.target.value) : null)}
  className="w-full px-4 py-3 border-2 border-neutral-300 rounded-lg..."
>
  {uniqueSizes.map((size) => (
    <option key={size.id} value={size.id} disabled={!availableForSize}>
      {size.name} {!availableForSize ? "(Out of stock)" : ""}
    </option>
  ))}
</select>
```

### 3. **Variant-Specific Information Display**
Shows real-time variant details in a dedicated info panel:
- **SKU**: Product SKU specific to the selected variant
- **Stock Level**: Available quantity for that variant
- **Stock Status**: Visual indicator when out of stock

```jsx
<div className="border-2 border-emerald-200 rounded-lg p-5 bg-emerald-50">
  <div className="grid grid-cols-2 gap-4 mb-3">
    <div>
      <div className="text-xs text-neutral-600 font-medium">SKU</div>
      <div className="text-sm font-bold">{variantSKU || "N/A"}</div>
    </div>
    <div>
      <div className="text-xs text-neutral-600 font-medium">Stock Available</div>
      <div className={`text-sm font-bold ${isOutOfStock ? "text-red-600" : "text-emerald-700"}`}>
        {variantStock} pcs
      </div>
    </div>
  </div>
</div>
```

### 4. **Dynamic Price Updates**
- Automatically fetches updated pricing when variant changes
- Uses variant's `price_override` if set, otherwise falls back to product's `base_price`
- Integrates with bulk pricing calculator
- Shows total price in PKR format with proper formatting

```javascript
const variantPrice = selectedVariant?.price_override ?? product.base_price;

useEffect(() => {
  fetchQuote(quantity, selectedVariant?.id);
}, [selectedVariant?.id]);
```

### 5. **Smart Variant Availability Logic**
- Extracts unique colors and sizes from all variants
- Intelligently handles color/size combination validation
- When user selects a color, only shows compatible sizes
- When user selects a size, only shows compatible colors
- Auto-resets selections if combination becomes unavailable

```javascript
const uniqueColors = Array.from(
  new Map(
    variants
      .filter(v => v.color_hex)
      .map(v => [v.color_id, { id: v.color_id, name: v.color_name, hex: v.color_hex }])
  ).values()
);

const selectedVariant = variants.find(v => 
  v.color_id === selectedColor && v.size_id === selectedSize
);
```

### 6. **Professional Styling**
Implements Flipkart/Amazon-style UI with:
- **Color Panel**: Emerald green accents with cyan highlights
- **Gradient Elements**: Emerald to cyan gradients for visual hierarchy
- **Rounded Corners**: Consistent border-radius throughout
- **Responsive Layout**: Grid-based responsive design
- **Hover Effects**: Smooth transitions and hover states
- **Typography**: Clear font weights and sizes for hierarchy

**Color Scheme:**
- Primary: Emerald-500 (#10b981)
- Secondary: Cyan-500 (#06b6d4)
- Text: Neutral-900 (#111827)
- Backgrounds: Neutral-100/50 with gradient overlays

### 7. **Quantity Selector**
- Number input with min value enforcement
- Updates pricing automatically on change
- Disabled when variant is out of stock
- Shows MOQ (Minimum Order Quantity) hint

### 8. **Bulk Pricing Display**
- Shows all applicable bulk pricing tiers
- Highlights current active tier based on quantity
- Displays range and price per piece
- Color-coded rows (emerald highlight for active tier)

### 9. **Add to Cart with Variant Support**
- Sends both product ID and variant ID to cart API
- Handles variant-specific pricing
- Shows loading/success states
- Quick navigate to cart after adding

```javascript
const res = await fetch("/api/cart", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    productId: product.id,
    quantity,
    ...(selectedVariant?.id && { variantId: selectedVariant.id }),
  }),
});
```

### 10. **Stock Management**
- Disables "Add to Cart" button when out of stock
- Shows "Out of Stock" label instead of button
- Displays warning in variant info panel
- Visual indicators for stock status

---

## Data Flow

```
1. Server-side (page.js):
   - Fetch product
   - Fetch all variants with color/size joins
   - Pass to ProductVariantSelector

2. Client-side (ProductVariantSelector.jsx):
   - Extract unique colors and sizes
   - User selects color → show compatible sizes
   - User selects size → fetch new quote
   - User enters quantity → update pricing
   - User clicks "Add to Cart" → send variant ID to cart API

3. Cart API:
   - Receives productId + variantId
   - Stores variant selection
   - Applies variant-specific pricing
```

---

## Database Schema

The implementation relies on these tables:

```sql
-- Product variants table
CREATE TABLE product_variants (
  id INTEGER PRIMARY KEY,
  product_id INTEGER,
  color_id INTEGER,
  size_id INTEGER,
  sku TEXT UNIQUE,
  stock INTEGER,
  price_override REAL,  -- Overrides product.base_price if set
  status TEXT,
  created_at TEXT,
  updated_at TEXT
);

-- Product colors
CREATE TABLE product_colors (
  id INTEGER PRIMARY KEY,
  product_id INTEGER,
  color_name TEXT,
  color_hex TEXT,  -- e.g., "#FF5733"
  created_at TEXT
);

-- Product sizes
CREATE TABLE product_sizes (
  id INTEGER PRIMARY KEY,
  product_id INTEGER,
  size_name TEXT,  -- e.g., "M", "Large", "XL"
  created_at TEXT
);
```

---

## Component Props

```javascript
ProductVariantSelector.propTypes = {
  product: {
    id: number,
    name: string,
    base_price: number,
    moq: number,
    stock: number,
    sku: string,
    currency: string,
  },
  variants: [
    {
      id: number,
      product_id: number,
      color_id: number,
      size_id: number,
      sku: string,
      stock: number,
      price_override: number,
      color_name: string,
      color_hex: string,  // e.g., "#FF5733"
      size_name: string,
    }
  ],
  bulkPricing: [
    {
      id: number,
      min_qty: number,
      max_qty: number,
      price: number,
    }
  ],
}
```

---

## Styling Classes

The component uses Tailwind CSS with custom configurations:

### Color Swatches
- `w-12 h-12`: 48x48px size
- `rounded-full`: Circular shape
- `border-2`: 2px borders
- `transition-all`: Smooth animations
- `scale-110`: Enlarges on selection

### Dropdowns
- `border-2 border-neutral-300`: Professional border
- `focus:border-cyan-500 focus:ring-2`: Focus states
- Custom SVG arrow background

### Panels
- `border border-neutral-200 rounded-lg p-5`: Card style
- `bg-emerald-50 border-2 border-emerald-200`: Emerald panels
- `bg-gradient-to-r from-emerald-100 to-cyan-100`: Gradient headers

### Buttons
- `bg-gradient-to-r from-emerald-500 to-cyan-500`: Primary button
- `hover:shadow-lg hover:shadow-emerald-500/50`: Hover effect
- `disabled:opacity-50`: Disabled state

---

## Features Summary

✅ **Color Swatches** - Visual color selection with hex colors
✅ **Size Dropdown** - Smart size selector with availability checks
✅ **Variant Stock Display** - Real-time stock levels
✅ **Variant SKU Display** - Product-specific SKU numbers
✅ **Dynamic Pricing** - Updates when variant changes
✅ **Professional Styling** - Flipkart/Amazon-like UI
✅ **Bulk Pricing** - Full tier support with highlighting
✅ **Quantity Selector** - With MOQ enforcement
✅ **Add to Cart** - Variant-aware cart operations
✅ **Responsive Design** - Mobile and desktop friendly
✅ **Loading States** - Proper async/await handling
✅ **Error Handling** - User-friendly error messages
✅ **Out of Stock** - Clear UI indicators
✅ **Backward Compatible** - Falls back to basic panel if no variants

---

## Usage Example

When a product has variants:
1. User visits `/products/premium-cotton-t-shirt`
2. Page loads ProductVariantSelector with all variants
3. Color swatches are displayed (Red, Blue, Green, etc.)
4. User clicks a color (e.g., Red)
5. Compatible sizes appear in dropdown (S, M, L, XL)
6. User selects size (M)
7. Stock and SKU update to show variant-specific info
8. Price updates based on variant's price_override
9. User enters quantity and clicks "Add to Cart"
10. Variant ID is sent to cart API for proper tracking

---

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- Uses native HTML5 input types
- CSS Grid and Flexbox support required

---

## Future Enhancements

- [ ] Variant images (different image per color)
- [ ] Size guide modal
- [ ] Saved favorites for variants
- [ ] Variant comparison
- [ ] Reviews per variant
- [ ] Inventory predictions
- [ ] Variant-specific shipping info
- [ ] Color/size filters on listing page
