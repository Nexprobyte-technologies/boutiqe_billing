import { Router, Response } from 'express';
import { db } from '../db.js';
import { AuthenticatedRequest, authenticate, authorize } from '../auth.js';

const router = Router();

// Create Invoice (Transactional checkout with server-side calculation and stock deduction)
router.post('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const payload = req.body;
    const userName = req.user?.name || 'Cashier';
    const invoice = db.createInvoice(payload, userName);
    return res.status(201).json({
      success: true,
      message: `Invoice ${invoice.invoiceNumber} created successfully`,
      invoice,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Failed to create invoice',
    });
  }
});

// List Invoices with search and filters
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { search, paymentStatus, status, startDate, endDate } = req.query;
  let invoices = db.getInvoices();

  if (status) {
    invoices = invoices.filter((i) => i.status === status);
  }

  if (paymentStatus) {
    invoices = invoices.filter((i) => i.paymentStatus === paymentStatus);
  }

  if (startDate) {
    invoices = invoices.filter((i) => i.invoiceDate >= String(startDate));
  }

  if (endDate) {
    invoices = invoices.filter((i) => i.invoiceDate <= String(endDate));
  }

  if (search) {
    const q = String(search).trim().toLowerCase();
    invoices = invoices.filter(
      (i) =>
        i.invoiceNumber.toLowerCase().includes(q) ||
        i.customerName.toLowerCase().includes(q) ||
        i.customerPhone.includes(q) ||
        (i.customerEmail && i.customerEmail.toLowerCase().includes(q))
    );
  }

  return res.json({
    success: true,
    invoices,
    total: invoices.length,
  });
});

// Held Invoices
router.get('/held', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const held = db.getHeldInvoices();
  return res.json({ success: true, invoices: held });
});

router.post('/hold', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const invoiceData = req.body;
    const userName = req.user?.name || 'Cashier';
    const held = db.holdInvoice(invoiceData, userName);
    return res.json({ success: true, invoice: held });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/held/:invoiceNumber', authenticate, (req: AuthenticatedRequest, res: Response) => {
  db.removeHeldInvoice(req.params.invoiceNumber);
  return res.json({ success: true, message: 'Held invoice removed' });
});

// Single Invoice Details
router.get('/:invoiceNumber', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const invoice = db.getInvoices().find((i) => i.invoiceNumber === req.params.invoiceNumber);
  if (!invoice) {
    return res.status(404).json({ success: false, message: 'Invoice not found' });
  }
  return res.json({ success: true, invoice });
});

// Cancel Invoice (Restocks inventory)
router.post('/:invoiceNumber/cancel', authenticate, authorize(['ADMIN', 'SUPER_ADMIN', 'MANAGER']), (req: AuthenticatedRequest, res: Response) => {
  const { reason = 'Customer requested cancellation' } = req.body;
  try {
    const cancelled = db.cancelInvoice(req.params.invoiceNumber, reason, req.user?.name || 'Admin');
    return res.json({
      success: true,
      message: `Invoice ${cancelled.invoiceNumber} cancelled and products restocked`,
      invoice: cancelled,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
