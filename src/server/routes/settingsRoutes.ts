import { Router, Response } from 'express';
import { db } from '../db.js';
import { AuthenticatedRequest, authenticate, authorize } from '../auth.js';

const router = Router();

// Get settings and tax configurations
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const storeSettings = db.getStoreSettings();
  const taxRates = db.getTaxRates();
  const categories = db.getCategories();
  return res.json({
    success: true,
    settings: storeSettings,
    taxRates,
    categories,
  });
});

// Update store settings
router.put('/', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = db.updateStoreSettings(req.body);
    db.logAudit(req.user?.name || 'Admin', 'SETTINGS_UPDATED', 'StoreSettings', 'SETTINGS', 'Updated boutique store details');
    return res.json({ success: true, settings: updated });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// Update tax rates
router.put('/taxes', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { taxRates } = req.body;
  if (!Array.isArray(taxRates)) {
    return res.status(400).json({ success: false, message: 'taxRates array is required' });
  }

  try {
    const updated = db.updateTaxRates(taxRates);
    db.logAudit(req.user?.name || 'Admin', 'TAX_CONFIG_UPDATED', 'TaxRate', 'TAXES', 'Updated tax rates');
    return res.json({ success: true, taxRates: updated });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
