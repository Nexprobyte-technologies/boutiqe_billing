import { Router, Response } from 'express';
import { db } from '../db.js';
import { AuthenticatedRequest, authenticate, authorize } from '../auth.js';

const router = Router();

// Inventory items with stock status & total valuation
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { search, filter } = req.query;
  let products = db.getProducts();

  if (filter === 'LOW_STOCK') {
    products = products.filter((p) => p.currentStock > 0 && p.currentStock <= p.minStock);
  } else if (filter === 'OUT_OF_STOCK') {
    products = products.filter((p) => p.currentStock <= 0);
  } else if (filter === 'IN_STOCK') {
    products = products.filter((p) => p.currentStock > p.minStock);
  }

  if (search) {
    const q = String(search).trim().toLowerCase();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }

  const allProducts = db.getProducts();
  const totalStockCount = allProducts.reduce((acc, p) => acc + p.currentStock, 0);
  const totalValuation = allProducts.reduce((acc, p) => acc + p.currentStock * p.purchasePrice, 0);
  const retailValuation = allProducts.reduce((acc, p) => acc + p.currentStock * p.sellingPrice, 0);
  const lowStockCount = allProducts.filter((p) => p.currentStock > 0 && p.currentStock <= p.minStock).length;
  const outOfStockCount = allProducts.filter((p) => p.currentStock <= 0).length;

  return res.json({
    success: true,
    inventory: products,
    stats: {
      totalProducts: allProducts.length,
      totalUnits: totalStockCount,
      costValuation: totalValuation,
      retailValuation,
      lowStockCount,
      outOfStockCount,
    },
  });
});

// Manual Stock Adjustment
router.post('/adjust', authenticate, authorize(['ADMIN', 'SUPER_ADMIN', 'MANAGER', 'INVENTORY_MANAGER']), (req: AuthenticatedRequest, res: Response) => {
  const { productId, quantity, type = 'ADJUSTMENT', notes = 'Stock adjustment' } = req.body;
  if (!productId || typeof quantity !== 'number' || quantity === 0) {
    return res.status(400).json({ success: false, message: 'Valid productId and non-zero quantity are required' });
  }

  try {
    const updated = db.adjustStock(productId, quantity, type, notes, req.user?.name || 'Staff');
    return res.json({
      success: true,
      message: `Stock successfully adjusted for ${updated.name}`,
      product: updated,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// Stock Movements Ledger
router.get('/movements', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { productId, type } = req.query;
  let movements = db.getStockMovements();

  if (productId) {
    movements = movements.filter((m) => m.productId === productId);
  }

  if (type) {
    movements = movements.filter((m) => m.type === type);
  }

  return res.json({ success: true, movements });
});

export default router;
