import { Router, Response } from 'express';
import { db } from '../db.js';
import { AuthenticatedRequest, authenticate, authorize } from '../auth.js';

const router = Router();

router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const returns = db.getReturns();
  return res.json({ success: true, returns });
});

router.post('/', authenticate, authorize(['ADMIN', 'SUPER_ADMIN', 'MANAGER']), (req: AuthenticatedRequest, res: Response) => {
  const { invoiceId, items, refundMethod = 'Store Credit', notes = '' } = req.body;
  if (!invoiceId || !items || !items.length) {
    return res.status(400).json({ success: false, message: 'invoiceId and items are required' });
  }

  try {
    const returnRecord = db.processReturn(
      {
        invoiceId,
        items,
        refundMethod,
        notes,
      },
      req.user?.name || 'Staff'
    );

    return res.status(201).json({
      success: true,
      message: `Return ${returnRecord.id} processed successfully. Items restocked.`,
      returnRecord,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
