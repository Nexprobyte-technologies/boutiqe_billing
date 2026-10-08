import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import authRoutes from './src/server/routes/authRoutes.js';
import productRoutes from './src/server/routes/productRoutes.js';
import invoiceRoutes from './src/server/routes/invoiceRoutes.js';
import customerRoutes from './src/server/routes/customerRoutes.js';
import supplierRoutes from './src/server/routes/supplierRoutes.js';
import inventoryRoutes from './src/server/routes/inventoryRoutes.js';
import returnRoutes from './src/server/routes/returnRoutes.js';
import reportRoutes from './src/server/routes/reportRoutes.js';
import settingsRoutes from './src/server/routes/settingsRoutes.js';
import auditRoutes from './src/server/routes/auditRoutes.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging for API calls
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[API] ${req.method} ${req.path}`);
  }
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/audit-logs', auditRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Velvet & Vine Boutique Backend', time: new Date().toISOString() });
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const server = app.listen(PORT, HOST, () => {
    console.log(`âœ¨ Velvet & Vine Boutique POS Server running at http://localhost:${PORT}`);
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Stop the other process using it, then run npm run dev again.`);
      process.exit(1);
    }

    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
