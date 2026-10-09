import { Router, Response } from 'express';
import { db } from '../db.js';
import { AuthenticatedRequest, authenticate } from '../auth.js';

const router = Router();

// Executive Dashboard KPIs and Chart Feeds
router.get('/dashboard', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const invoices = db.getInvoices();
  const products = db.getProducts();
  const customers = db.getCustomers();

  const todayStr = new Date().toISOString().slice(0, 10);
  const currentMonthStr = todayStr.slice(0, 7);

  const completedInvoices = invoices.filter((i) => i.status === 'COMPLETED');
  const todayInvoices = completedInvoices.filter((i) => i.invoiceDate === todayStr);
  const thisMonthInvoices = completedInvoices.filter((i) => i.invoiceDate.startsWith(currentMonthStr));

  const totalSales = completedInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const todaySales = todayInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const thisMonthSales = thisMonthInvoices.reduce((sum, i) => sum + i.grandTotal, 0);

  const totalOrders = completedInvoices.length;
  const todayOrders = todayInvoices.length;

  const lowStockProducts = products.filter((p) => p.currentStock > 0 && p.currentStock <= p.minStock);
  const outOfStockProducts = products.filter((p) => p.currentStock <= 0);

  // Pending Payments Total
  const pendingPaymentsTotal = invoices
    .filter((i) => i.status !== 'CANCELLED' && i.paymentStatus !== 'PAID')
    .reduce((sum, i) => sum + i.balanceAmount, 0);

  // Top Selling Products Calculation
  const productSalesMap: Record<string, { id: string; name: string; sku: string; unitsSold: number; revenue: number }> = {};
  for (const inv of completedInvoices) {
    for (const itm of inv.items) {
      if (!productSalesMap[itm.productId]) {
        productSalesMap[itm.productId] = {
          id: itm.productId,
          name: itm.name,
          sku: itm.sku,
          unitsSold: 0,
          revenue: 0,
        };
      }
      productSalesMap[itm.productId].unitsSold += itm.quantity;
      productSalesMap[itm.productId].revenue += itm.total;
    }
  }

  const topSellingProducts = Object.values(productSalesMap)
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 5);

  // Category-wise sales
  const categorySalesMap: Record<string, number> = {};
  for (const inv of completedInvoices) {
    for (const itm of inv.items) {
      const prod = products.find((p) => p.id === itm.productId);
      const cat = prod?.category || 'Other';
      categorySalesMap[cat] = (categorySalesMap[cat] || 0) + itm.total;
    }
  }

  // Payment Method Breakdown
  const paymentMethodMap: Record<string, number> = {
    Cash: 0,
    UPI: 0,
    'Credit Card': 0,
    'Debit Card': 0,
    'Bank Transfer': 0,
  };
  for (const inv of completedInvoices) {
    const meth = inv.paymentMethod || 'Cash';
    paymentMethodMap[meth] = (paymentMethodMap[meth] || 0) + inv.grandTotal;
  }

  // Daily sales for the last 7 days
  const last7Days: { date: string; label: string; amount: number; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const dayBills = completedInvoices.filter((inv) => inv.invoiceDate === dateStr);
    const amount = dayBills.reduce((acc, curr) => acc + curr.grandTotal, 0);
    last7Days.push({ date: dateStr, label, amount, count: dayBills.length });
  }

  return res.json({
    success: true,
    kpis: {
      totalSales,
      todaySales,
      thisMonthSales,
      totalOrders,
      todayOrders,
      totalProducts: products.length,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      totalCustomers: customers.length,
      pendingPaymentsTotal,
    },
    topSellingProducts,
    categorySales: categorySalesMap,
    paymentMethodDistribution: paymentMethodMap,
    salesTrend: last7Days,
    recentInvoices: completedInvoices.slice(0, 20),
    lowStockAlerts: lowStockProducts.slice(0, 5),
  });
});

// Sales Report with Date Filter
router.get('/sales', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { startDate, endDate, category } = req.query;
  let invoices = db.getInvoices().filter((i) => i.status === 'COMPLETED');

  if (startDate) {
    invoices = invoices.filter((i) => i.invoiceDate >= String(startDate));
  }
  if (endDate) {
    invoices = invoices.filter((i) => i.invoiceDate <= String(endDate));
  }

  const totalSales = invoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const totalTax = invoices.reduce((sum, i) => sum + i.taxAmount, 0);
  const totalDiscount = invoices.reduce((sum, i) => sum + i.itemDiscountTotal + i.invoiceDiscountAmount, 0);

  return res.json({
    success: true,
    summary: {
      invoiceCount: invoices.length,
      totalSales,
      totalTax,
      totalDiscount,
    },
    invoices,
  });
});

export default router;
