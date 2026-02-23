import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';

// Force timezone for the server to prevent cut-off shifts in CRON
process.env.TZ = 'America/Mexico_City';

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
import investmentsRoutes from './routes/investments';
import goalsRoutes from './routes/goals';
import aiRoutes from './routes/ai';
import notificationRoutes from './routes/notifications';

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
app.use('/api/investments', investmentsRoutes); // P2: Inversiones
app.use('/api/goals', goalsRoutes); // P2: Metas de ahorro
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);

// =============================================================================
// Server Startup with Security Info
// =============================================================================

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  // ANSI Colors
  const BLUE = '\x1b[34m';
  const GREEN = '\x1b[32m';
  const YELLOW = '\x1b[33m';
  const RED = '\x1b[31m';
  const RESET = '\x1b[0m';
  const BOLD = '\x1b[1m';

  console.log(BLUE);
  console.log('  ______ _                              _____           ');
  console.log(' |  ____(_)                            |  __ \\          ');
  console.log(' | |__   _ _ __   __ _ _ __  ______ _  | |__) | __ ___  ');
  console.log(' |  __| | | \'_ \\ / _` | \'_ \\|_  / _` | |  ___/ \'__/ _ \\ ');
  console.log(' | |    | | | | | (_| | | | |/ / (_| | | |   | | | (_) |');
  console.log(' |_|    |_|_| |_|\\__,_|_| |_/___\\__,_| |_|   |_|  \\___/ ');
  console.log(RESET);

  console.log(`  🚀 ${GREEN}${BOLD}Finanzas Pro Backend v1.0.0${RESET}`);
  console.log(`  🌍 environment: ${YELLOW}${process.env.NODE_ENV || 'development'}${RESET}`);
  console.log(`  📍 port:        ${YELLOW}${PORT}${RESET}`);
  console.log('');

  console.log(`  ${BOLD}🔒 Security Status:${RESET}`);
  console.log(`     • CORS:           ${process.env.ALLOWED_ORIGINS ? GREEN + 'Restricted' + RESET : YELLOW + 'Open (Dev)' + RESET}`);
  console.log(`     • Rate Limiting:  ${process.env.RATE_LIMIT_ENABLED !== 'false' ? GREEN + 'Enabled' + RESET : RED + 'Disabled' + RESET}`);
  console.log(`     • Registration:   ${process.env.REGISTRATION_ENABLED !== 'false' ? GREEN + 'Open' + RESET : YELLOW + 'Closed' + RESET}`);
  console.log('');

  // =============================================================================
  // Cronjobs P0 (solo en producción)
  // =============================================================================
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_CRON_JOBS === 'true') {
    console.log(`  ${BOLD}⏰ Active Cronjobs:${RESET}`);
    console.log(`     • Credit Cards:   ${BLUE}00:05 daily${RESET}`);
    console.log(`     • Balance Snaps:  ${BLUE}23:55 daily${RESET}`);
    console.log('');

    // Ejecutar statements job diario a las 00:05
    const runStatementsJob = async () => {
      const now = new Date();
      // Solo ejecutar a las 00:05
      if (now.getHours() === 0 && now.getMinutes() >= 5 && now.getMinutes() < 6) {
        console.log(`[${new Date().toISOString()}] 💳 Running CC Statements Job...`);
        await generateCreditCardStatements();
      }
    };

    // Ejecutar snapshots job diario a las 23:55
    const runSnapshotsJob = async () => {
      const now = new Date();
      // Solo ejecutar a las 23:55
      if (now.getHours() === 23 && now.getMinutes() >= 55 && now.getMinutes() < 56) {
        console.log(`[${new Date().toISOString()}] 📸 Running Balance Snapshot Job...`);
        await createDailyAccountSnapshots();
      }
    };

    // Verificar cada minuto
    setInterval(() => {
      runStatementsJob().catch(console.error);
      runSnapshotsJob().catch(console.error);
    }, 60000);
  } else {
    console.log(`  ${BOLD}⏰ Cronjobs:${RESET}        ${YELLOW}Disabled${RESET}`);
    console.log('');
  }
});
