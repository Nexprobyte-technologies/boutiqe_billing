import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'CASHIER' | 'INVENTORY_MANAGER';
  phone?: string;
  active: boolean;
  createdAt: string;
}

export interface TaxRate {
  id: string;
  name: string;
  rate: number; // e.g. 12 for 12%
  cgst: number; // e.g. 6%
  sgst: number; // e.g. 6%
  igst: number; // e.g. 12%
  isDefault?: boolean;
}

export interface StoreSettings {
  boutiqueName: string;
  tagline: string;
  logoText: string;
  address: string;
  cityStateZip: string;
  phone: string;
  email: string;
  website: string;
  gstin: string;
  currencySymbol: string;
  currencyCode: string;
  invoicePrefix: string;
  defaultPrintFormat: 'A4' | 'THERMAL';
  invoiceFooterNotes: string;
  termsAndConditions: string;
}

export interface ProductVariant {
  id: string;
  size: string;
  color: string;
  sku: string;
  barcode: string;
  price: number;
  stock: number;
}

export interface Product {
  id: string; // e.g. PROD-000001
  sku: string; // e.g. SAR-001
  barcode: string; // e.g. 8901234567890
  name: string;
  category: string;
  subcategory: string;
  brand: string;
  description: string;
  imageUrl?: string;
  color: string;
  size: string;
  material: string;
  purchasePrice: number;
  sellingPrice: number;
  mrp: number;
  discount: number; // default discount %
  taxRateId: string;
  currentStock: number;
  minStock: number;
  supplierId?: string;
  supplierName?: string;
  status: 'ACTIVE' | 'INACTIVE';
  variants?: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string; // e.g. CUS-000001
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  gstin?: string;
  notes?: string;
  totalPurchases: number;
  totalBills: number;
  lastPurchaseDate?: string;
  outstandingAmount: number;
  createdAt: string;
}

export interface Supplier {
  id: string; // e.g. SUP-000001
  name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  gstin: string;
  totalPurchases: number;
  outstandingAmount: number;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  sku: string;
  barcode: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number; // total discount on this line
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface PaymentRecord {
  method: 'Cash' | 'UPI' | 'Credit Card' | 'Debit Card' | 'Bank Transfer' | 'Other';
  amount: number;
  referenceNumber?: string;
  date: string;
}

export interface Invoice {
  id: string; // e.g. INV-2026-000001
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  items: InvoiceItem[];
  subtotal: number;
  itemDiscountTotal: number;
  invoiceDiscountType: 'percentage' | 'fixed';
  invoiceDiscountValue: number;
  invoiceDiscountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  additionalCharges: number;
  roundOff: number;
  grandTotal: number;
  paymentMethod: string;
  payments: PaymentRecord[];
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: 'PAID' | 'PARTIALLY_PAID' | 'PENDING' | 'REFUNDED';
  status: 'COMPLETED' | 'HOLD' | 'CANCELLED' | 'REFUNDED';
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  barcode: string;
  quantity: number; // positive or negative
  previousStock: number;
  newStock: number;
  type: 'PURCHASE' | 'SALE' | 'RETURN' | 'ADJUSTMENT' | 'DAMAGE' | 'TRANSFER';
  referenceInvoiceId?: string;
  user: string;
  date: string;
  notes: string;
}

export interface ReturnRecord {
  id: string; // e.g. RET-000001
  invoiceId: string;
  customerName: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    refundAmount: number;
    reason: string;
  }[];
  totalRefundAmount: number;
  refundMethod: 'Cash' | 'UPI' | 'Store Credit';
  processedBy: string;
  date: string;
  notes: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  ipAddress?: string;
}

interface DatabaseSchema {
  users: User[];
  taxRates: TaxRate[];
  storeSettings: StoreSettings;
  products: Product[];
  categories: { id: string; name: string; subcategories: string[] }[];
  customers: Customer[];
  suppliers: Supplier[];
  invoices: Invoice[];
  heldInvoices: Invoice[];
  stockMovements: StockMovement[];
  returns: ReturnRecord[];
  auditLogs: AuditLog[];
  counters: {
    product: number;
    customer: number;
    supplier: number;
    invoice: number;
    return: number;
    movement: number;
    audit: number;
  };
}

const DB_FILE_PATH = path.resolve(process.cwd(), 'data', 'boutique_db.json');

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadOrInitialize();
  }

  private loadOrInitialize(): DatabaseSchema {
    try {
      const dataDir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        const loaded = JSON.parse(raw) as DatabaseSchema;
        const demoUser = loaded.users.find((user) => user.name.toLowerCase() === 'test');
        if (!demoUser) {
          loaded.users.push({
            id: 'USR-TEST',
            name: 'test',
            email: 'test@velvetvine.com',
            passwordHash: bcrypt.hashSync('test123', bcrypt.genSaltSync(10)),
            role: 'SUPER_ADMIN',
            active: true,
            createdAt: new Date().toISOString(),
          });
          this.saveData(loaded);
        } else if (demoUser.role !== 'SUPER_ADMIN' || !demoUser.active || !bcrypt.compareSync('test123', demoUser.passwordHash)) {
          demoUser.role = 'SUPER_ADMIN';
          demoUser.active = true;
          demoUser.passwordHash = bcrypt.hashSync('test123', bcrypt.genSaltSync(10));
          this.saveData(loaded);
        }
        return loaded;
      }
    } catch (err) {
      console.warn('Failed to load DB file, using fresh seed data:', err);
    }

    const initial = this.generateSeedData();
    this.saveData(initial);
    return initial;
  }

  private saveData(data: DatabaseSchema) {
    try {
      const dataDir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error persisting database:', err);
    }
  }

  public save() {
    this.saveData(this.data);
  }

  private generateSeedData(): DatabaseSchema {
    const salt = bcrypt.genSaltSync(10);
    const adminHash = bcrypt.hashSync('admin123', salt);
    const managerHash = bcrypt.hashSync('manager123', salt);
    const cashierHash = bcrypt.hashSync('cashier123', salt);

    const users: User[] = [
      {
        id: 'USR-001',
        name: 'Aishwarya Roy',
        email: 'admin@velvetvine.com',
        passwordHash: adminHash,
        role: 'SUPER_ADMIN',
        phone: '+91 98450 11001',
        active: true,
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'USR-002',
        name: 'Devika Menon',
        email: 'manager@velvetvine.com',
        passwordHash: managerHash,
        role: 'MANAGER',
        phone: '+91 98450 22002',
        active: true,
        createdAt: '2026-01-05T00:00:00Z',
      },
      {
        id: 'USR-003',
        name: 'Pooja Hegde',
        email: 'cashier@velvetvine.com',
        passwordHash: cashierHash,
        role: 'CASHIER',
        phone: '+91 98450 33003',
        active: true,
        createdAt: '2026-01-10T00:00:00Z',
      },
      {
        id: 'USR-TEST',
        name: 'test',
        email: 'test@velvetvine.com',
        passwordHash: bcrypt.hashSync('test123', salt),
        role: 'SUPER_ADMIN',
        active: true,
        createdAt: '2026-01-11T00:00:00Z',
      },
    ];

    const taxRates: TaxRate[] = [
      { id: 'TAX-0', name: 'GST 0% (Exempt)', rate: 0, cgst: 0, sgst: 0, igst: 0 },
      { id: 'TAX-5', name: 'GST 5% (Apparel under ₹1,000)', rate: 5, cgst: 2.5, sgst: 2.5, igst: 5 },
      { id: 'TAX-12', name: 'GST 12% (Silk & Premium Wear)', rate: 12, cgst: 6, sgst: 6, igst: 12, isDefault: true },
      { id: 'TAX-18', name: 'GST 18% (Luxury & Accessories)', rate: 18, cgst: 9, sgst: 9, igst: 18 },
    ];

    const storeSettings: StoreSettings = {
      boutiqueName: 'Velvet & Vine',
      tagline: 'Haute Couture & Heritage Silks',
      logoText: 'VELVET & VINE',
      address: '14 Lavelle Promenade, Indiranagar 100ft Road',
      cityStateZip: 'Bengaluru, Karnataka 560038',
      phone: '+91 98450 12890',
      email: 'concierge@velvetandvine.in',
      website: 'www.velvetandvine.in',
      gstin: '29AABCU9603R1ZM',
      currencySymbol: '₹',
      currencyCode: 'INR',
      invoicePrefix: 'INV-2026-',
      defaultPrintFormat: 'A4',
      invoiceFooterNotes: 'Thank you for shopping at Velvet & Vine. Your handcrafted garment is bespoke and precious.',
      termsAndConditions: '1. Exchange within 7 days with original invoice & security tag attached.\n2. Customized, altered, or worn garments cannot be returned.\n3. Dry clean only for pure silks and metallic embroideries.\n4. Dispute jurisdiction: Bengaluru Courts only.',
    };

    const categories = [
      { id: 'CAT-1', name: 'Sarees', subcategories: ['Kanjivaram Silk', 'Banarasi Brocade', 'Chanderi', 'Organza Hand-Painted', 'Tussar'] },
      { id: 'CAT-2', name: 'Kurtis', subcategories: ['Anarkali Sets', 'A-Line Chanderi', 'Straight Cut Silk', 'Embroidered Daily'] },
      { id: 'CAT-3', name: 'Lehengas', subcategories: ['Bridal Velvet', 'Georgette Floral', 'Mirror Work Festive'] },
      { id: 'CAT-4', name: 'Dresses', subcategories: ['Maxi Evening Wear', 'Indo-Western Gowns', 'Wrap Dresses'] },
      { id: 'CAT-5', name: 'Jewellery & Accessories', subcategories: ['Kundan Necklaces', 'Temple Jewellery', 'Silk Potli Bags', 'Zari Clutches'] },
      { id: 'CAT-6', name: 'Dupattas', subcategories: ['Phulkari', 'Bandhani Silk', 'Pure Pashmina Shawls'] },
    ];

    const suppliers: Supplier[] = [
      {
        id: 'SUP-000001',
        name: 'Kanchipuram Silk Guild',
        company: 'Royal Weaves Handlooms Ltd',
        phone: '+91 94441 55667',
        email: 'orders@royalweaves.in',
        address: '45 Silk Loom Street, Kanchipuram, TN',
        gstin: '33AABCR1234F1Z8',
        totalPurchases: 285000,
        outstandingAmount: 0,
        createdAt: '2026-01-05T00:00:00Z',
      },
      {
        id: 'SUP-000002',
        name: 'Varanasi Zari Crafts',
        company: 'Ganga Heritage Silks',
        phone: '+91 94150 99881',
        email: 'contact@gangasilks.com',
        address: '12 Ghat Road, Varanasi, UP',
        gstin: '09AAACG7890H1Z2',
        totalPurchases: 190000,
        outstandingAmount: 25000,
        createdAt: '2026-01-10T00:00:00Z',
      },
      {
        id: 'SUP-000003',
        name: 'Jaipur Gotapatti Studio',
        company: 'Marwar Ethnic Creations',
        phone: '+91 98290 33445',
        email: 'sales@marwarethnic.in',
        address: '77 Hawa Mahal Bazar, Jaipur, RJ',
        gstin: '08AAACM4455K1Z9',
        totalPurchases: 140000,
        outstandingAmount: 0,
        createdAt: '2026-01-15T00:00:00Z',
      },
    ];

    const customers: Customer[] = [
      {
        id: 'CUS-000001',
        name: 'Ananya Sharma',
        phone: '9876543210',
        email: 'ananya.sharma@example.com',
        address: 'Flat 402, Prestige Hermitage, Kensington Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560042',
        notes: 'VIP client. Prefers pure Kanjivaram pastels and heavy temple zari borders.',
        totalPurchases: 45800,
        totalBills: 3,
        lastPurchaseDate: '2026-09-28T14:30:00Z',
        outstandingAmount: 0,
        createdAt: '2026-01-20T00:00:00Z',
      },
      {
        id: 'CUS-000002',
        name: 'Rhea Sengupta',
        phone: '9845112233',
        email: 'rhea.sengupta@example.com',
        address: 'B-12, Palm Meadows, Whitefield',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560066',
        notes: 'Enjoys Indo-western cocktail gowns and organza prints.',
        totalPurchases: 22400,
        totalBills: 2,
        lastPurchaseDate: '2026-10-02T11:15:00Z',
        outstandingAmount: 0,
        createdAt: '2026-02-14T00:00:00Z',
      },
      {
        id: 'CUS-000003',
        name: 'Dr. Meenakshi Sundaram',
        phone: '9740055443',
        email: 'meenakshi.sundaram@hospital.org',
        address: '7th Main, Malleshwaram 15th Cross',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560003',
        notes: 'Loyal patron. Regular purchaser during Diwali & wedding seasons.',
        totalPurchases: 68900,
        totalBills: 4,
        lastPurchaseDate: '2026-10-06T16:45:00Z',
        outstandingAmount: 0,
        createdAt: '2026-01-25T00:00:00Z',
      },
    ];

    const products: Product[] = [
      {
        id: 'PROD-000001',
        sku: 'SAR-001',
        barcode: '8901234567890',
        name: 'Royal Crimson Kanjivaram Silk Saree',
        category: 'Sarees',
        subcategory: 'Kanjivaram Silk',
        brand: 'Velvet Heritage',
        description: 'Authentic 6-yard pure mulberry silk saree featuring 24K gold electroplated zari border and grand peacock motifs.',
        imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80',
        color: 'Deep Crimson',
        size: 'Free Size (6.3m with blouse)',
        material: 'Pure Mulberry Silk & Zari',
        purchasePrice: 6500,
        sellingPrice: 11999,
        mrp: 14999,
        discount: 0,
        taxRateId: 'TAX-12',
        currentStock: 14,
        minStock: 3,
        supplierId: 'SUP-000001',
        supplierName: 'Kanchipuram Silk Guild',
        status: 'ACTIVE',
        createdAt: '2026-02-01T00:00:00Z',
        updatedAt: '2026-02-01T00:00:00Z',
      },
      {
        id: 'PROD-000002',
        sku: 'SAR-002',
        barcode: '8901234567891',
        name: 'Emerald Pastel Organza Hand-Painted Saree',
        category: 'Sarees',
        subcategory: 'Organza Hand-Painted',
        brand: 'Velvet Flora',
        description: 'Featherlight sheer silk organza saree with hand-painted botanical lotus motifs and scalloped resham borders.',
        imageUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=80',
        color: 'Mint Sage & Emerald',
        size: 'Free Size',
        material: 'Silk Organza',
        purchasePrice: 3800,
        sellingPrice: 6899,
        mrp: 8500,
        discount: 5,
        taxRateId: 'TAX-12',
        currentStock: 8,
        minStock: 2,
        supplierId: 'SUP-000002',
        supplierName: 'Varanasi Zari Crafts',
        status: 'ACTIVE',
        createdAt: '2026-02-05T00:00:00Z',
        updatedAt: '2026-02-05T00:00:00Z',
      },
      {
        id: 'PROD-000003',
        sku: 'KUR-101',
        barcode: '8901234567892',
        name: 'Dusty Rose Chanderi Anarkali Suit Set',
        category: 'Kurtis',
        subcategory: 'Anarkali Sets',
        brand: 'Vine Studio',
        description: 'Three-piece ensemble with intricate gota patti handwork, flared anarkali silhouette, tonal cigarette pants and sheer dupatta.',
        imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80',
        color: 'Dusty Rose',
        size: 'Medium (M)',
        material: 'Chanderi Silk & Mulmul Lining',
        purchasePrice: 2400,
        sellingPrice: 4799,
        mrp: 5999,
        discount: 0,
        taxRateId: 'TAX-12',
        currentStock: 18,
        minStock: 4,
        supplierId: 'SUP-000003',
        supplierName: 'Jaipur Gotapatti Studio',
        status: 'ACTIVE',
        variants: [
          { id: 'VAR-101-S', size: 'Small (S)', color: 'Dusty Rose', sku: 'KUR-101-S', barcode: '8901234567892-S', price: 4799, stock: 5 },
          { id: 'VAR-101-M', size: 'Medium (M)', color: 'Dusty Rose', sku: 'KUR-101-M', barcode: '8901234567892-M', price: 4799, stock: 7 },
          { id: 'VAR-101-L', size: 'Large (L)', color: 'Dusty Rose', sku: 'KUR-101-L', barcode: '8901234567892-L', price: 4799, stock: 6 },
        ],
        createdAt: '2026-02-10T00:00:00Z',
        updatedAt: '2026-02-10T00:00:00Z',
      },
      {
        id: 'PROD-000004',
        sku: 'LEH-501',
        barcode: '8901234567893',
        name: 'Midnight Navy Velvet Bridal Lehenga',
        category: 'Lehengas',
        subcategory: 'Bridal Velvet',
        brand: 'Velvet Couture',
        description: 'Statement micro-velvet lehenga with dabka, tilla, and swarovski stone embroidery. Includes double dupatta styling.',
        imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80',
        color: 'Midnight Navy',
        size: 'Custom Tailored (38-42)',
        material: 'Silk Micro-Velvet',
        purchasePrice: 18000,
        sellingPrice: 34999,
        mrp: 42000,
        discount: 10,
        taxRateId: 'TAX-12',
        currentStock: 4,
        minStock: 1,
        supplierId: 'SUP-000002',
        supplierName: 'Varanasi Zari Crafts',
        status: 'ACTIVE',
        createdAt: '2026-02-15T00:00:00Z',
        updatedAt: '2026-02-15T00:00:00Z',
      },
      {
        id: 'PROD-000005',
        sku: 'ACC-801',
        barcode: '8901234567894',
        name: 'Heritage Kundan Choker & Jhumka Set',
        category: 'Jewellery & Accessories',
        subcategory: 'Kundan Necklaces',
        brand: 'Royal Adornments',
        description: '22K gold-plated Jadau Kundan necklace with semi-precious emerald drops and matching chandelier earrings.',
        imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80',
        color: 'Gold & Emerald Green',
        size: 'Adjustable Dori',
        material: 'Brass alloy, Kundan stones, Green Beads',
        purchasePrice: 2200,
        sellingPrice: 4299,
        mrp: 5500,
        discount: 0,
        taxRateId: 'TAX-18',
        currentStock: 12,
        minStock: 3,
        supplierId: 'SUP-000003',
        supplierName: 'Jaipur Gotapatti Studio',
        status: 'ACTIVE',
        createdAt: '2026-02-20T00:00:00Z',
        updatedAt: '2026-02-20T00:00:00Z',
      },
      {
        id: 'PROD-000006',
        sku: 'ACC-802',
        barcode: '8901234567895',
        name: 'Handcrafted Zari Embroidered Silk Potli',
        category: 'Jewellery & Accessories',
        subcategory: 'Silk Potli Bags',
        brand: 'Velvet Accents',
        description: 'Traditional drawstring clutch bag adorned with antique pearl bead tassels and intricate gold zardozi stitching.',
        imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80',
        color: 'Antique Gold / Maroon',
        size: 'One Size',
        material: 'Raw Silk & Pearl Tassels',
        purchasePrice: 650,
        sellingPrice: 1499,
        mrp: 1899,
        discount: 0,
        taxRateId: 'TAX-18',
        currentStock: 22,
        minStock: 5,
        supplierId: 'SUP-000003',
        supplierName: 'Jaipur Gotapatti Studio',
        status: 'ACTIVE',
        createdAt: '2026-02-25T00:00:00Z',
        updatedAt: '2026-02-25T00:00:00Z',
      },
      {
        id: 'PROD-000007',
        sku: 'DRS-301',
        barcode: '8901234567896',
        name: 'Maroon Pleated Indo-Western Cocktail Gown',
        category: 'Dresses',
        subcategory: 'Indo-Western Gowns',
        brand: 'Vine Atelier',
        description: 'Modern structured evening gown with Grecian pleating, metallic embroidered waist cincher and flared trail.',
        imageUrl: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=600&q=80',
        color: 'Burgundy Wine',
        size: 'Large (L)',
        material: 'Silk Georgette & Satin Crepe',
        purchasePrice: 4200,
        sellingPrice: 8499,
        mrp: 10999,
        discount: 0,
        taxRateId: 'TAX-12',
        currentStock: 2, // Low stock on purpose for testing alerts
        minStock: 3,
        supplierId: 'SUP-000002',
        supplierName: 'Varanasi Zari Crafts',
        status: 'ACTIVE',
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: '2026-03-01T00:00:00Z',
      },
    ];

    const stockMovements: StockMovement[] = [
      {
        id: 'SM-000001',
        productId: 'PROD-000001',
        productName: 'Royal Crimson Kanjivaram Silk Saree',
        sku: 'SAR-001',
        barcode: '8901234567890',
        quantity: 15,
        previousStock: 0,
        newStock: 15,
        type: 'PURCHASE',
        user: 'Devika Menon',
        date: '2026-09-01T10:00:00Z',
        notes: 'Initial consignment received from Kanchipuram Weavers',
      },
      {
        id: 'SM-000002',
        productId: 'PROD-000001',
        productName: 'Royal Crimson Kanjivaram Silk Saree',
        sku: 'SAR-001',
        barcode: '8901234567890',
        quantity: -1,
        previousStock: 15,
        newStock: 14,
        type: 'SALE',
        referenceInvoiceId: 'INV-2026-000001',
        user: 'Pooja Hegde',
        date: '2026-09-28T14:30:00Z',
        notes: 'Billed to Ananya Sharma',
      },
    ];

    const invoices: Invoice[] = [
      {
        id: 'INV-2026-000001',
        invoiceNumber: 'INV-2026-000001',
        invoiceDate: '2026-09-28',
        dueDate: '2026-09-28',
        customerId: 'CUS-000001',
        customerName: 'Ananya Sharma',
        customerPhone: '9876543210',
        customerEmail: 'ananya.sharma@example.com',
        customerAddress: 'Flat 402, Prestige Hermitage, Kensington Road, Bengaluru',
        items: [
          {
            id: 'ITM-001',
            productId: 'PROD-000001',
            name: 'Royal Crimson Kanjivaram Silk Saree',
            sku: 'SAR-001',
            barcode: '8901234567890',
            size: 'Free Size',
            color: 'Deep Crimson',
            quantity: 1,
            unitPrice: 11999,
            discountAmount: 0,
            discountType: 'percentage',
            discountValue: 0,
            taxRate: 12,
            taxAmount: 1439.88,
            total: 13438.88,
          },
        ],
        subtotal: 11999,
        itemDiscountTotal: 0,
        invoiceDiscountType: 'fixed',
        invoiceDiscountValue: 0,
        invoiceDiscountAmount: 0,
        taxableAmount: 11999,
        taxAmount: 1439.88,
        cgstAmount: 719.94,
        sgstAmount: 719.94,
        igstAmount: 0,
        additionalCharges: 0,
        roundOff: 0.12,
        grandTotal: 13439,
        paymentMethod: 'UPI',
        payments: [
          {
            method: 'UPI',
            amount: 13439,
            referenceNumber: 'UPI984928172938',
            date: '2026-09-28T14:30:00Z',
          },
        ],
        paidAmount: 13439,
        balanceAmount: 0,
        paymentStatus: 'PAID',
        status: 'COMPLETED',
        notes: 'Festive shopping. Customer enrolled in loyalty points.',
        createdBy: 'Pooja Hegde',
        createdAt: '2026-09-28T14:30:00Z',
        updatedAt: '2026-09-28T14:30:00Z',
      },
    ];

    const auditLogs: AuditLog[] = [
      {
        id: 'AUD-000001',
        timestamp: '2026-09-01T10:00:00Z',
        user: 'Aishwarya Roy',
        action: 'STORE_INITIALIZED',
        entity: 'StoreSettings',
        entityId: 'SETTINGS',
        details: 'Velvet & Vine Boutique POS and Inventory initialized.',
        ipAddress: '127.0.0.1',
      },
      {
        id: 'AUD-000002',
        timestamp: '2026-09-28T14:30:00Z',
        user: 'Pooja Hegde',
        action: 'INVOICE_CREATED',
        entity: 'Invoice',
        entityId: 'INV-2026-000001',
        details: 'Created invoice for Ananya Sharma amounting to ₹13,439 (UPI)',
        ipAddress: '127.0.0.1',
      },
    ];

    return {
      users,
      taxRates,
      storeSettings,
      products,
      categories,
      customers,
      suppliers,
      invoices,
      heldInvoices: [],
      stockMovements,
      returns: [],
      auditLogs,
      counters: {
        product: 7,
        customer: 3,
        supplier: 3,
        invoice: 1,
        return: 0,
        movement: 2,
        audit: 2,
      },
    };
  }

  // Getters
  public getUsers(): User[] { return this.data.users; }
  public getTaxRates(): TaxRate[] { return this.data.taxRates; }
  public getStoreSettings(): StoreSettings { return this.data.storeSettings; }
  public getCategories() { return this.data.categories; }
  public getProducts(): Product[] { return this.data.products; }
  public getCustomers(): Customer[] { return this.data.customers; }
  public getSuppliers(): Supplier[] { return this.data.suppliers; }
  public getInvoices(): Invoice[] { return this.data.invoices; }
  public getHeldInvoices(): Invoice[] { return this.data.heldInvoices; }
  public getStockMovements(): StockMovement[] { return this.data.stockMovements; }
  public getReturns(): ReturnRecord[] { return this.data.returns; }
  public getAuditLogs(): AuditLog[] { return this.data.auditLogs; }

  // Updaters
  public updateStoreSettings(settings: Partial<StoreSettings>) {
    this.data.storeSettings = { ...this.data.storeSettings, ...settings };
    this.save();
    return this.data.storeSettings;
  }

  public updateTaxRates(rates: TaxRate[]) {
    this.data.taxRates = rates;
    this.save();
    return this.data.taxRates;
  }

  // Next ID Generators
  public nextProductId(): string {
    this.data.counters.product += 1;
    this.save();
    return `PROD-${String(this.data.counters.product).padStart(6, '0')}`;
  }

  public nextCustomerId(): string {
    this.data.counters.customer += 1;
    this.save();
    return `CUS-${String(this.data.counters.customer).padStart(6, '0')}`;
  }

  public nextSupplierId(): string {
    this.data.counters.supplier += 1;
    this.save();
    return `SUP-${String(this.data.counters.supplier).padStart(6, '0')}`;
  }

  public nextInvoiceNumber(): string {
    this.data.counters.invoice += 1;
    this.save();
    const prefix = this.data.storeSettings.invoicePrefix || 'INV-2026-';
    return `${prefix}${String(this.data.counters.invoice).padStart(6, '0')}`;
  }

  public nextReturnId(): string {
    this.data.counters.return += 1;
    this.save();
    return `RET-${String(this.data.counters.return).padStart(6, '0')}`;
  }

  public nextMovementId(): string {
    this.data.counters.movement += 1;
    this.save();
    return `SM-${String(this.data.counters.movement).padStart(6, '0')}`;
  }

  public logAudit(user: string, action: string, entity: string, entityId: string, details: string, ipAddress = '127.0.0.1') {
    this.data.counters.audit += 1;
    const log: AuditLog = {
      id: `AUD-${String(this.data.counters.audit).padStart(6, '0')}`,
      timestamp: new Date().toISOString(),
      user,
      action,
      entity,
      entityId,
      details,
      ipAddress,
    };
    this.data.auditLogs.unshift(log);
    // keep maximum 1000 logs
    if (this.data.auditLogs.length > 1000) {
      this.data.auditLogs.pop();
    }
    this.save();
    return log;
  }

  // Product Operations
  public findProductByBarcode(barcode: string): { product: Product; variant?: ProductVariant } | null {
    const clean = barcode.trim();
    for (const p of this.data.products) {
      if (p.barcode === clean) {
        return { product: p };
      }
      if (p.variants) {
        const v = p.variants.find((item) => item.barcode === clean);
        if (v) {
          return { product: p, variant: v };
        }
      }
    }
    return null;
  }

  public findProductById(id: string): Product | null {
    return this.data.products.find((p) => p.id === id) || null;
  }

  public addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>, userName = 'Admin'): Product {
    const id = this.nextProductId();
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...product,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.data.products.unshift(newProduct);

    // Initial stock movement if stock > 0
    if (newProduct.currentStock > 0) {
      this.data.stockMovements.unshift({
        id: this.nextMovementId(),
        productId: newProduct.id,
        productName: newProduct.name,
        sku: newProduct.sku,
        barcode: newProduct.barcode,
        quantity: newProduct.currentStock,
        previousStock: 0,
        newStock: newProduct.currentStock,
        type: 'PURCHASE',
        user: userName,
        date: now,
        notes: 'Initial inventory entry upon product creation',
      });
    }

    this.logAudit(userName, 'PRODUCT_CREATED', 'Product', id, `Added ${newProduct.name} (${newProduct.sku})`);
    this.save();
    return newProduct;
  }

  public updateProduct(id: string, updates: Partial<Product>, userName = 'Admin'): Product {
    const idx = this.data.products.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Product not found');
    const prev = this.data.products[idx];

    // If stock changed directly via product edit
    if (typeof updates.currentStock === 'number' && updates.currentStock !== prev.currentStock) {
      const diff = updates.currentStock - prev.currentStock;
      this.data.stockMovements.unshift({
        id: this.nextMovementId(),
        productId: prev.id,
        productName: updates.name || prev.name,
        sku: updates.sku || prev.sku,
        barcode: updates.barcode || prev.barcode,
        quantity: diff,
        previousStock: prev.currentStock,
        newStock: updates.currentStock,
        type: 'ADJUSTMENT',
        user: userName,
        date: new Date().toISOString(),
        notes: 'Stock updated via product edit',
      });
    }

    const updated: Product = {
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.data.products[idx] = updated;
    this.logAudit(userName, 'PRODUCT_UPDATED', 'Product', id, `Updated product ${updated.name}`);
    this.save();
    return updated;
  }

  public deleteProduct(id: string, userName = 'Admin'): boolean {
    const idx = this.data.products.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    const deleted = this.data.products[idx];
    this.data.products.splice(idx, 1);
    this.logAudit(userName, 'PRODUCT_DELETED', 'Product', id, `Deleted product ${deleted.name} (${deleted.sku})`);
    this.save();
    return true;
  }

  public adjustStock(productId: string, quantity: number, type: StockMovement['type'], notes: string, userName = 'Admin'): Product {
    const product = this.findProductById(productId);
    if (!product) throw new Error('Product not found');
    const prevStock = product.currentStock;
    const newStock = prevStock + quantity;
    if (newStock < 0) throw new Error('Insufficient stock for this deduction');

    product.currentStock = newStock;
    product.updatedAt = new Date().toISOString();

    const movement: StockMovement = {
      id: this.nextMovementId(),
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      barcode: product.barcode,
      quantity,
      previousStock: prevStock,
      newStock,
      type,
      user: userName,
      date: new Date().toISOString(),
      notes,
    };
    this.data.stockMovements.unshift(movement);
    this.logAudit(userName, 'STOCK_ADJUSTED', 'Inventory', product.id, `Stock adjusted by ${quantity} (${type}): ${notes}`);
    this.save();
    return product;
  }

  // Customer Operations
  public addCustomer(customer: Omit<Customer, 'id' | 'totalPurchases' | 'totalBills' | 'outstandingAmount' | 'createdAt'>, userName = 'Cashier'): Customer {
    const id = this.nextCustomerId();
    const newCustomer: Customer = {
      ...customer,
      id,
      totalPurchases: 0,
      totalBills: 0,
      outstandingAmount: 0,
      createdAt: new Date().toISOString(),
    };
    this.data.customers.unshift(newCustomer);
    this.logAudit(userName, 'CUSTOMER_CREATED', 'Customer', id, `Added customer ${newCustomer.name} (${newCustomer.phone})`);
    this.save();
    return newCustomer;
  }

  public updateCustomer(id: string, updates: Partial<Customer>, userName = 'Cashier'): Customer {
    const idx = this.data.customers.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Customer not found');
    const updated = { ...this.data.customers[idx], ...updates };
    this.data.customers[idx] = updated;
    this.logAudit(userName, 'CUSTOMER_UPDATED', 'Customer', id, `Updated customer ${updated.name}`);
    this.save();
    return updated;
  }

  public deleteCustomer(id: string, userName = 'Admin'): boolean {
    const idx = this.data.customers.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    const removed = this.data.customers.splice(idx, 1)[0];
    this.logAudit(userName, 'CUSTOMER_DELETED', 'Customer', id, `Deleted customer ${removed.name}`);
    this.save();
    return true;
  }

  // Supplier Operations
  public addSupplier(supplier: Omit<Supplier, 'id' | 'totalPurchases' | 'outstandingAmount' | 'createdAt'>, userName = 'Admin'): Supplier {
    const id = this.nextSupplierId();
    const newSupplier: Supplier = {
      ...supplier,
      id,
      totalPurchases: 0,
      outstandingAmount: 0,
      createdAt: new Date().toISOString(),
    };
    this.data.suppliers.unshift(newSupplier);
    this.logAudit(userName, 'SUPPLIER_CREATED', 'Supplier', id, `Added supplier ${newSupplier.name}`);
    this.save();
    return newSupplier;
  }

  public updateSupplier(id: string, updates: Partial<Supplier>, userName = 'Admin'): Supplier {
    const idx = this.data.suppliers.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Supplier not found');
    const updated = { ...this.data.suppliers[idx], ...updates };
    this.data.suppliers[idx] = updated;
    this.logAudit(userName, 'SUPPLIER_UPDATED', 'Supplier', id, `Updated supplier ${updated.name}`);
    this.save();
    return updated;
  }

  // Transactional Invoice Creation
  public createInvoice(
    payload: {
      customerId?: string;
      customerName: string;
      customerPhone: string;
      customerEmail?: string;
      customerAddress?: string;
      invoiceDate?: string;
      dueDate?: string;
      items: {
        productId: string;
        variantId?: string;
        quantity: number;
        discountType?: 'percentage' | 'fixed';
        discountValue?: number;
      }[];
      invoiceDiscountType?: 'percentage' | 'fixed';
      invoiceDiscountValue?: number;
      additionalCharges?: number;
      paymentMethod: string;
      payments?: PaymentRecord[];
      paidAmount?: number;
      notes?: string;
    },
    userName = 'Cashier'
  ): Invoice {
    // 1. Validate Customer
    let customer: Customer | undefined;
    const customerName = (payload.customerName || '').trim();
    const customerPhone = (payload.customerPhone || '').trim();
    if (payload.customerId) {
      customer = this.data.customers.find((c) => c.id === payload.customerId);
    }
    if (!customer && customerPhone && customerPhone !== '0000000000') {
      customer = this.data.customers.find((c) => c.phone === customerPhone);
    }
    const isWalkIn = !customerName || customerName.toLowerCase() === 'walk-in patron' || customerPhone === '0000000000';
    if (!customer && !isWalkIn) {
      customer = this.addCustomer(
        {
          name: customerName,
          phone: customerPhone,
          email: (payload.customerEmail || '').trim(),
          address: (payload.customerAddress || '').trim(),
          city: '',
          state: '',
          postalCode: '',
        },
        userName
      );
    }

    if (!payload.items || payload.items.length === 0) {
      throw new Error('Invoice must have at least one product item');
    }

    // 2. Validate Products & Stock Levels
    const verifiedItems: InvoiceItem[] = [];
    let subtotal = 0;
    let itemDiscountTotal = 0;
    let totalTaxAmount = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;

    for (const itemInput of payload.items) {
      if (itemInput.quantity <= 0) {
        throw new Error('Quantity must be greater than zero');
      }

      const product = this.findProductById(itemInput.productId);
      if (!product) {
        throw new Error(`Product not found: ${itemInput.productId}`);
      }

      // Check stock
      if (product.currentStock < itemInput.quantity) {
        throw new Error(
          `Insufficient stock for "${product.name}". Available: ${product.currentStock}, Requested: ${itemInput.quantity}`
        );
      }

      // Calculate unit price & discount
      let unitPrice = product.sellingPrice;
      let variantName = '';
      if (itemInput.variantId && product.variants) {
        const variant = product.variants.find((v) => v.id === itemInput.variantId);
        if (variant) {
          unitPrice = variant.price;
          variantName = ` (${variant.size} - ${variant.color})`;
        }
      }

      const lineGross = unitPrice * itemInput.quantity;
      let itemDiscAmount = 0;
      const discType = itemInput.discountType || 'percentage';
      const discVal = itemInput.discountValue || 0;

      if (discType === 'percentage') {
        itemDiscAmount = (lineGross * Math.min(100, Math.max(0, discVal))) / 100;
      } else {
        itemDiscAmount = Math.min(lineGross, Math.max(0, discVal));
      }

      const lineNet = lineGross - itemDiscAmount;

      // Tax calculation
      const taxConfig = this.data.taxRates.find((t) => t.id === product.taxRateId) ||
        this.data.taxRates.find((t) => t.isDefault) || { rate: 12, cgst: 6, sgst: 6, igst: 12 };
      
      const itemTax = (lineNet * taxConfig.rate) / 100;
      const lineFinal = lineNet + itemTax;

      subtotal += lineGross;
      itemDiscountTotal += itemDiscAmount;
      totalTaxAmount += itemTax;
      cgstTotal += (lineNet * taxConfig.cgst) / 100;
      sgstTotal += (lineNet * taxConfig.sgst) / 100;

      verifiedItems.push({
        id: `ITM-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        productId: product.id,
        variantId: itemInput.variantId,
        name: product.name + variantName,
        sku: product.sku,
        barcode: product.barcode,
        size: product.size,
        color: product.color,
        quantity: itemInput.quantity,
        unitPrice,
        discountAmount: Math.round(itemDiscAmount * 100) / 100,
        discountType: discType,
        discountValue: discVal,
        taxRate: taxConfig.rate,
        taxAmount: Math.round(itemTax * 100) / 100,
        total: Math.round(lineFinal * 100) / 100,
      });
    }

    // 3. Overall Invoice Discount
    const invDiscType = payload.invoiceDiscountType || 'fixed';
    const invDiscVal = payload.invoiceDiscountValue || 0;
    const grossAfterItemDiscounts = subtotal - itemDiscountTotal;
    let invoiceDiscountAmount = 0;

    if (invDiscType === 'percentage') {
      invoiceDiscountAmount = (grossAfterItemDiscounts * Math.min(100, Math.max(0, invDiscVal))) / 100;
    } else {
      invoiceDiscountAmount = Math.min(grossAfterItemDiscounts, Math.max(0, invDiscVal));
    }

    const taxableAmount = grossAfterItemDiscounts - invoiceDiscountAmount;
    const additionalCharges = Math.max(0, payload.additionalCharges || 0);

    const calculatedTotal = taxableAmount + totalTaxAmount + additionalCharges;
    const roundedGrandTotal = Math.round(calculatedTotal);
    const roundOff = Math.round((roundedGrandTotal - calculatedTotal) * 100) / 100;

    // Payments
    const grandTotal = roundedGrandTotal;
    const invoiceNumber = this.nextInvoiceNumber();
    const now = new Date().toISOString();
    const today = now.slice(0, 10);

    let paidAmount = payload.paidAmount !== undefined ? payload.paidAmount : grandTotal;
    paidAmount = Math.max(0, paidAmount);
    const balanceAmount = Math.max(0, grandTotal - paidAmount);

    let paymentStatus: Invoice['paymentStatus'] = 'PAID';
    if (paidAmount <= 0) {
      paymentStatus = 'PENDING';
    } else if (paidAmount < grandTotal) {
      paymentStatus = 'PARTIALLY_PAID';
    } else {
      paymentStatus = 'PAID';
    }

    const payments: PaymentRecord[] = payload.payments && payload.payments.length > 0
      ? payload.payments
      : [
          {
            method: (payload.paymentMethod as any) || 'Cash',
            amount: paidAmount,
            date: now,
          },
        ];

    // 4. Atomic Deductions & Stock Movement Logging
    for (const item of verifiedItems) {
      const prod = this.findProductById(item.productId)!;
      const prev = prod.currentStock;
      prod.currentStock = prev - item.quantity;
      prod.updatedAt = now;

      this.data.stockMovements.unshift({
        id: this.nextMovementId(),
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        barcode: prod.barcode,
        quantity: -item.quantity,
        previousStock: prev,
        newStock: prod.currentStock,
        type: 'SALE',
        referenceInvoiceId: invoiceNumber,
        user: userName,
        date: now,
        notes: `Sold in invoice ${invoiceNumber}`,
      });
    }

    // 5. Build Invoice Record
    const newInvoice: Invoice = {
      id: invoiceNumber,
      invoiceNumber,
      invoiceDate: payload.invoiceDate || today,
      dueDate: payload.dueDate || today,
      customerId: customer ? customer.id : 'GUEST',
      customerName: customerName || 'Walk-in Patron',
      customerPhone: customerPhone,
      customerEmail: (payload.customerEmail || '').trim(),
      customerAddress: (payload.customerAddress || '').trim(),
      items: verifiedItems,
      subtotal: Math.round(subtotal * 100) / 100,
      itemDiscountTotal: Math.round(itemDiscountTotal * 100) / 100,
      invoiceDiscountType: invDiscType,
      invoiceDiscountValue: invDiscVal,
      invoiceDiscountAmount: Math.round(invoiceDiscountAmount * 100) / 100,
      taxableAmount: Math.round(taxableAmount * 100) / 100,
      taxAmount: Math.round(totalTaxAmount * 100) / 100,
      cgstAmount: Math.round(cgstTotal * 100) / 100,
      sgstAmount: Math.round(sgstTotal * 100) / 100,
      igstAmount: Math.round(igstTotal * 100) / 100,
      additionalCharges,
      roundOff,
      grandTotal,
      paymentMethod: payload.paymentMethod || 'Cash',
      payments,
      paidAmount,
      balanceAmount,
      paymentStatus,
      status: 'COMPLETED',
      notes: payload.notes || '',
      createdBy: userName,
      createdAt: now,
      updatedAt: now,
    };

    // Update Customer Stats
    if (customer) {
      customer.totalPurchases += grandTotal;
      customer.totalBills += 1;
      customer.lastPurchaseDate = now;
      customer.outstandingAmount += balanceAmount;
    }

    this.data.invoices.unshift(newInvoice);
    this.logAudit(
      userName,
      'INVOICE_CREATED',
      'Invoice',
      invoiceNumber,
      `Billed ${newInvoice.customerName} for ${this.data.storeSettings.currencySymbol}${grandTotal} (${paymentStatus})`
    );
    this.save();
    return newInvoice;
  }

  // Hold and Recall Bills
  public holdInvoice(invoice: Invoice, userName = 'Cashier'): Invoice {
    invoice.status = 'HOLD';
    this.data.heldInvoices.unshift(invoice);
    this.logAudit(userName, 'BILL_HELD', 'Invoice', invoice.invoiceNumber, `Held bill for ${invoice.customerName}`);
    this.save();
    return invoice;
  }

  public removeHeldInvoice(invoiceNumber: string) {
    const idx = this.data.heldInvoices.findIndex((h) => h.invoiceNumber === invoiceNumber);
    if (idx !== -1) {
      this.data.heldInvoices.splice(idx, 1);
      this.save();
    }
  }

  // Cancel Invoice
  public cancelInvoice(invoiceNumber: string, reason: string, userName = 'Admin'): Invoice {
    const invoice = this.data.invoices.find((i) => i.invoiceNumber === invoiceNumber);
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status === 'CANCELLED') throw new Error('Invoice is already cancelled');

    const now = new Date().toISOString();
    // Restock all items
    for (const item of invoice.items) {
      const prod = this.findProductById(item.productId);
      if (prod) {
        const prev = prod.currentStock;
        prod.currentStock = prev + item.quantity;
        prod.updatedAt = now;

        this.data.stockMovements.unshift({
          id: this.nextMovementId(),
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          barcode: prod.barcode,
          quantity: item.quantity,
          previousStock: prev,
          newStock: prod.currentStock,
          type: 'RETURN',
          referenceInvoiceId: invoice.invoiceNumber,
          user: userName,
          date: now,
          notes: `Restocked on invoice cancellation: ${reason}`,
        });
      }
    }

    invoice.status = 'CANCELLED';
    invoice.paymentStatus = 'REFUNDED';
    invoice.notes = `${invoice.notes || ''} [CANCELLED: ${reason}]`.trim();
    invoice.updatedAt = now;

    // Adjust customer stats
    const customer = this.data.customers.find((c) => c.id === invoice.customerId);
    if (customer) {
      customer.totalPurchases = Math.max(0, customer.totalPurchases - invoice.grandTotal);
      customer.outstandingAmount = Math.max(0, customer.outstandingAmount - invoice.balanceAmount);
    }

    this.logAudit(userName, 'INVOICE_CANCELLED', 'Invoice', invoiceNumber, `Cancelled invoice: ${reason}`);
    this.save();
    return invoice;
  }

  // Process Return & Refund
  public processReturn(
    payload: {
      invoiceId: string;
      items: {
        productId: string;
        quantity: number;
        reason: string;
      }[];
      refundMethod: 'Cash' | 'UPI' | 'Store Credit';
      notes: string;
    },
    userName = 'Manager'
  ): ReturnRecord {
    const invoice = this.data.invoices.find((i) => i.invoiceNumber === payload.invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    let totalRefund = 0;
    const returnItemsProcessed = [];
    const now = new Date().toISOString();

    for (const rItem of payload.items) {
      const invItem = invoice.items.find((i) => i.productId === rItem.productId);
      if (!invItem) throw new Error(`Item ${rItem.productId} was not found in invoice`);
      if (rItem.quantity > invItem.quantity) {
        throw new Error(`Cannot return more than purchased (${invItem.quantity})`);
      }

      const itemPrice = invItem.total / invItem.quantity;
      const refundAmount = Math.round(itemPrice * rItem.quantity * 100) / 100;
      totalRefund += refundAmount;

      // Restock
      const product = this.findProductById(rItem.productId);
      if (product) {
        const prev = product.currentStock;
        product.currentStock = prev + rItem.quantity;
        product.updatedAt = now;

        this.data.stockMovements.unshift({
          id: this.nextMovementId(),
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          barcode: product.barcode,
          quantity: rItem.quantity,
          previousStock: prev,
          newStock: product.currentStock,
          type: 'RETURN',
          referenceInvoiceId: invoice.invoiceNumber,
          user: userName,
          date: now,
          notes: `Returned: ${rItem.reason}`,
        });
      }

      returnItemsProcessed.push({
        productId: rItem.productId,
        productName: invItem.name,
        quantity: rItem.quantity,
        unitPrice: invItem.unitPrice,
        refundAmount,
        reason: rItem.reason,
      });
    }

    const returnRecord: ReturnRecord = {
      id: this.nextReturnId(),
      invoiceId: invoice.invoiceNumber,
      customerName: invoice.customerName,
      items: returnItemsProcessed,
      totalRefundAmount: totalRefund,
      refundMethod: payload.refundMethod,
      processedBy: userName,
      date: now,
      notes: payload.notes || '',
    };

    this.data.returns.unshift(returnRecord);
    this.logAudit(
      userName,
      'RETURN_PROCESSED',
      'Return',
      returnRecord.id,
      `Refunded ${this.data.storeSettings.currencySymbol}${totalRefund} on ${invoice.invoiceNumber}`
    );
    this.save();
    return returnRecord;
  }
}

export const db = new Database();
