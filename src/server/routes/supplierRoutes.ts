import { Router, Response } from 'express';
import { db } from '../db.js';
import { AuthenticatedRequest, authenticate, authorize } from '../auth.js';

const router = Router();

router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const suppliers = db.getSuppliers();
  return res.json({ success: true, suppliers });
});

router.post('/', authenticate, authorize(['ADMIN', 'SUPER_ADMIN', 'MANAGER']), (req: AuthenticatedRequest, res: Response) => {
  const { name, company, phone, email, address, gstin } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ success: false, message: 'Supplier name and phone are required' });
  }

  const supplier = db.addSupplier(
    {
      name: name.trim(),
      company: (company || '').trim(),
      phone: phone.trim(),
      email: (email || '').trim(),
      address: (address || '').trim(),
      gstin: (gstin || '').trim(),
    },
    req.user?.name || 'Admin'
  );

  return res.status(201).json({ success: true, supplier });
});

router.put('/:id', authenticate, authorize(['ADMIN', 'SUPER_ADMIN', 'MANAGER']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = db.updateSupplier(req.params.id, req.body, req.user?.name || 'Admin');
    return res.json({ success: true, supplier: updated });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
