import { Router, Response } from 'express';
import { db } from '../db.js';
import { AuthenticatedRequest, authenticate, authorize } from '../auth.js';

const router = Router();

// List / Search Customers
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { search } = req.query;
  let customers = db.getCustomers();

  if (search) {
    const q = String(search).trim().toLowerCase();
    const phoneDigits = q.replace(/\D/g, '');
    customers = customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (phoneDigits.length > 0 && c.phone.replace(/\D/g, '').includes(phoneDigits)) ||
        c.email.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
    );
  }

  return res.json({ success: true, customers });
});

// Single Customer Details with Invoices
router.get('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const customer = db.getCustomers().find((c) => c.id === req.params.id);
  if (!customer) {
    return res.status(404).json({ success: false, message: 'Customer not found' });
  }

  const invoices = db.getInvoices().filter((i) => i.customerId === customer.id);
  return res.json({
    success: true,
    customer,
    invoices,
  });
});

// Create Customer
router.post('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { name, phone, email, address, city, state, postalCode, gstin, notes } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ success: false, message: 'Customer name and phone number are required' });
  }

  const existing = db.getCustomers().find((c) => c.phone.trim() === phone.trim());
  if (existing) {
    return res.status(400).json({ success: false, message: 'Customer with this phone number already exists', customer: existing });
  }

  const customer = db.addCustomer(
    {
      name: name.trim(),
      phone: phone.trim(),
      email: (email || '').trim(),
      address: (address || '').trim(),
      city: (city || '').trim(),
      state: (state || '').trim(),
      postalCode: (postalCode || '').trim(),
      gstin: (gstin || '').trim(),
      notes: (notes || '').trim(),
    },
    req.user?.name || 'Cashier'
  );

  return res.status(201).json({ success: true, customer });
});

// Update Customer
router.put('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = db.updateCustomer(req.params.id, req.body, req.user?.name || 'Staff');
    return res.json({ success: true, customer: updated });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// Delete Customer
router.delete('/:id', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const success = db.deleteCustomer(req.params.id, req.user?.name || 'Admin');
  if (!success) {
    return res.status(404).json({ success: false, message: 'Customer not found' });
  }
  return res.json({ success: true, message: 'Customer deleted successfully' });
});

export default router;
