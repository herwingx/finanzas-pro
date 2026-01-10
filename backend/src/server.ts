import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';

// Security middleware
import {
  corsMiddleware,
  helmetMiddleware,
  generalLimiter
} from './middleware/security';

// Routes
import authRoutes from './routes/auth';
import transactionRoutes from './routes/transactions';
import categoryRoutes from './routes/categories';
import profileRoutes from './routes/profile';
import recurringRoutes from './routes/recurring';
import accountsRoutes from './routes/accounts';
import installmentsRoutes from './routes/installments';
import financialPlanningRoutes from './routes/financialPlanningRoutes';
import creditCardPaymentsRoutes from './routes/creditCardPayments';
import loansRoutes from './routes/loans';
import aiRoutes from './routes/ai';

// Jobs (P0 - Persistencia Crítica)
import { generateCreditCardStatements, createDailyAccountSnapshots } from './jobs';

const app = express();

// =============================================================================
// Proxy Trust Configuration (Required for nginx/Cloudflare)
// =============================================================================
// When running behind a reverse proxy (nginx, Cloudflare), Express needs to trust
// the X-Forwarded-For header to correctly identify client IPs for rate limiting.
// Value of 1 means trust the first proxy in the chain.
app.set('trust proxy', 1);

// =============================================================================
// Security Middleware Chain
// =============================================================================

// 1. Helmet - Security headers
app.use(helmetMiddleware);

// 2. CORS - Restrict allowed origins
app.use(corsMiddleware());

// 3. Rate limiting - Protect against abuse (applied to all /api routes)
app.use('/api', generalLimiter);

// =============================================================================
// Body Parsing
// =============================================================================

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// =============================================================================
// Static Files (uploads/avatars)
// =============================================================================

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// =============================================================================
// Health Check
// =============================================================================

app.get('/', (req, res) => {
  res.send('Finanzas Pro Backend is running!');
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// =============================================================================
// API Routes
// =============================================================================

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/recurring', recurringRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/installments', installmentsRoutes);
app.use('/api/financial-planning', financialPlanningRoutes);
app.use('/api/credit-card', creditCardPaymentsRoutes);
app.use('/api/loans', loansRoutes);
app.use('/api/ai', aiRoutes);

// =============================================================================
// Server Startup with Security Info
// =============================================================================

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 Finanzas Pro Backend is running!');
  console.log(`📍 Port: ${PORT}`);
  console.log('');
  console.log('🔒 Security Configuration:');
  console.log(`   • CORS: ${process.env.ALLOWED_ORIGINS || 'Open (development mode)'}`);
  console.log(`   • Rate Limiting: ${process.env.RATE_LIMIT_ENABLED !== 'false' ? 'Enabled' : 'Disabled'}`);
  console.log(`   • Registration: ${process.env.REGISTRATION_ENABLED !== 'false' ? 'Open' : 'Disabled'}`);
  console.log('');

  // =============================================================================
  // Cronjobs P0 (solo en producción)
  // =============================================================================
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_CRON_JOBS === 'true') {
    console.log('⏰ Cronjobs habilitados:');

    // Ejecutar statements job diario a las 00:05
    const runStatementsJob = async () => {
      const now = new Date();
      // Solo ejecutar a las 00:05
      if (now.getHours() === 0 && now.getMinutes() >= 5 && now.getMinutes() < 6) {
        console.log('[CRON] Generando statements de TDC...');
        await generateCreditCardStatements();
      }
    };

    // Ejecutar snapshots job diario a las 23:55
    const runSnapshotsJob = async () => {
      const now = new Date();
      // Solo ejecutar a las 23:55
      if (now.getHours() === 23 && now.getMinutes() >= 55 && now.getMinutes() < 56) {
        console.log('[CRON] Creando snapshots de balances...');
        await createDailyAccountSnapshots();
      }
    };

    // Verificar cada minuto
    setInterval(() => {
      runStatementsJob().catch(console.error);
      runSnapshotsJob().catch(console.error);
    }, 60000);

    console.log('   • Statement Generation: 00:05 daily');
    console.log('   • Balance Snapshots: 23:55 daily');
    console.log('');
  }
});
