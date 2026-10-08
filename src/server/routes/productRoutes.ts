import { Router, Response } from 'express';
import { db } from '../db.js';
import { AuthenticatedRequest, authenticate, authorize } from '../auth.js';

const router = Router();

// Fast Barcode Lookup
router.get('/barcode/:barcode', (req: AuthenticatedRequest, res: Response) => {
  const barcode = req.params.barcode.trim();
  if (!barcode) {
    return res.status(400).json({ success: false, message: 'Barcode is required' });
  }

  const result = db.findProductByBarcode(barcode);
  if (!result) {
    return res.status(404).json({
      success: false,
      message: `Product with barcode "${barcode}" not found in inventory.`,
    });
  }

  const { product, variant } = result;

  // Format response for immediate addition to bill
  return res.json({
    success: true,
    product: {
      id: product.id,
      name: product.name,
      sku: variant ? variant.sku : product.sku,
      barcode: variant ? variant.barcode : product.barcode,
      category: product.category,
      subcategory: product.subcategory,
      color: variant ? variant.color : product.color,
      size: variant ? variant.size : product.size,
      price: variant ? variant.price : product.sellingPrice,
      mrp: product.mrp,
      stock: variant ? variant.stock : product.currentStock,
      taxRateId: product.taxRateId,
      imageUrl: product.imageUrl,
      variantId: variant ? variant.id : undefined,
    },
  });
});

// Barcode Generator Utility
router.post('/barcodes/generate', (req: AuthenticatedRequest, res: Response) => {
  const { type = 'CODE128', prefix = '890' } = req.body;
  // Generate valid 13 digit EAN or alphanumeric CODE128
  let barcode = '';
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 100) {
    attempts++;
    if (type === 'EAN13') {
      const base = `${prefix}${Math.floor(100000000 + Math.random() * 900000000)}`;
      // Calculate EAN-13 check digit
      let sum = 0;
      for (let i = 0; i < 12; i++) {
        sum += parseInt(base[i], 10) * (i % 2 === 0 ? 1 : 3);
      }
      const checkDigit = (10 - (sum % 10)) % 10;
      barcode = `${base}${checkDigit}`;
    } else {
      // CODE128
      barcode = `${prefix}${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    }

    // Check uniqueness
    const existing = db.findProductByBarcode(barcode);
    if (!existing) {
      isUnique = true;
    }
  }

  return res.json({
    success: true,
    barcode,
    format: type,
  });
});

// List all products with search & filters
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const { search, category, stockStatus, status } = req.query;
  let list = db.getProducts();

  if (status) {
    list = list.filter((p) => p.status === status);
  }

  if (category && category !== 'All') {
    list = list.filter((p) => p.category.toLowerCase() === String(category).toLowerCase());
  }

  if (stockStatus) {
    if (stockStatus === 'OUT_OF_STOCK') {
      list = list.filter((p) => p.currentStock <= 0);
    } else if (stockStatus === 'LOW_STOCK') {
      list = list.filter((p) => p.currentStock > 0 && p.currentStock <= p.minStock);
    } else if (stockStatus === 'IN_STOCK') {
      list = list.filter((p) => p.currentStock > p.minStock);
    }
  }

  if (search) {
    const q = String(search).trim().toLowerCase();
    list = list.filter((p) => {
      const matchBasic =
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.color.toLowerCase().includes(q) ||
        p.size.toLowerCase().includes(q);

      if (matchBasic) return true;
      if (p.variants) {
        return p.variants.some(
          (v) =>
            v.sku.toLowerCase().includes(q) ||
            v.barcode.toLowerCase().includes(q) ||
            v.color.toLowerCase().includes(q) ||
            v.size.toLowerCase().includes(q)
        );
      }
      return false;
    });
  }

  return res.json({
    success: true,
    products: list,
    total: list.length,
  });
});

// Get Single Product
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const product = db.findProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  return res.json({ success: true, product });
});

// Create Product
router.post('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const data = req.body;
  const sku = String(data.sku || '').trim().toUpperCase();
  const barcode = String(data.barcode || '').trim();
  if (!String(data.name || '').trim() || !sku || !barcode || data.sellingPrice === undefined) {
    return res.status(400).json({ success: false, message: 'Name, SKU, Barcode, and Price are required' });
  }

  if (!Number.isFinite(Number(data.sellingPrice)) || Number(data.sellingPrice) < 0 || Number(data.currentStock ?? 0) < 0) {
    return res.status(400).json({ success: false, message: 'Price and stock must be valid non-negative numbers.' });
  }

  // Check barcode uniqueness
  const existingWithBarcode = db.findProductByBarcode(barcode);
  if (existingWithBarcode) {
    return res.status(400).json({
      success: false,
      message: `Barcode "${barcode}" is already assigned to "${existingWithBarcode.product.name}".`,
    });
  }

  // Check SKU uniqueness
  const existingWithSku = db.getProducts().find((p) =>
    p.sku.toUpperCase() === sku || p.variants?.some((variant) => variant.sku.toUpperCase() === sku)
  );
  if (existingWithSku) {
    return res.status(400).json({
      success: false,
      message: `SKU "${sku}" already exists.`,
    });
  }

  try {
    const product = db.addProduct(
      {
        sku,
        barcode,
        name: data.name.trim(),
        category: data.category || 'Sarees',
        subcategory: data.subcategory || '',
        brand: data.brand || 'Velvet & Vine',
        description: data.description || '',
        imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80',
        color: data.color || 'Multi',
        size: data.size || 'Free Size',
        material: data.material || 'Pure Silk',
        purchasePrice: Number(data.purchasePrice) || 0,
        sellingPrice: Number(data.sellingPrice) || 0,
        mrp: Number(data.mrp) || Number(data.sellingPrice) || 0,
        discount: Number(data.discount) || 0,
        taxRateId: data.taxRateId || 'TAX-12',
        currentStock: Number(data.currentStock) || 0,
        minStock: Number(data.minStock) || 3,
        supplierId: data.supplierId,
        supplierName: data.supplierName,
        status: data.status || 'ACTIVE',
        variants: data.variants || [],
      },
      req.user?.name || 'Staff'
    );

    return res.status(201).json({ success: true, product });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Update Product
router.put('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  const sku = updates.sku === undefined ? undefined : String(updates.sku).trim().toUpperCase();
  const barcode = updates.barcode === undefined ? undefined : String(updates.barcode).trim();

  const existingSku = sku && db.getProducts().find((product) => product.id !== id && (
    product.sku.toUpperCase() === sku || product.variants?.some((variant) => variant.sku.toUpperCase() === sku)
  ));
  if (existingSku) {
    return res.status(400).json({ success: false, message: `SKU "${sku}" already exists.` });
  }

  // If barcode changed, verify uniqueness
  if (barcode) {
    const existing = db.findProductByBarcode(barcode);
    if (existing && existing.product.id !== id) {
      return res.status(400).json({
        success: false,
        message: `Barcode "${updates.barcode}" is already used by "${existing.product.name}"`,
      });
    }
  }

  try {
    const updated = db.updateProduct(id, { ...updates, ...(sku ? { sku } : {}), ...(barcode ? { barcode } : {}) }, req.user?.name || 'Staff');
    return res.json({ success: true, product: updated });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// Delete Product
router.delete('/:id', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const success = db.deleteProduct(id, req.user?.name || 'Admin');
  if (!success) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  return res.json({ success: true, message: 'Product deleted successfully' });
});

export default router;
