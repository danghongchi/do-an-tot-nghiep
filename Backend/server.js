const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');

// Import configs
const config = require('./config');
const { initializePool } = require('./config/database');
const initializeSocket = require('./config/socket');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const counselorRoutes = require('./routes/counselor');
const adminRoutes = require('./routes/admin');
const appointmentRoutes = require('./routes/appointment');
const chatRoutes = require('./routes/chat');
const aiRoutes = require('./routes/ai');
const specialtiesRoutes = require('./routes/specialties');
const reviewRoutes = require('./routes/review');
const counselorApplicationsRoutes = require('./routes/counselorApplications');
const patientRoutes = require('./routes/patient');
const notificationRoutes = require('./routes/notification');
const paymentRoutes = require('./routes/payment');
const migrationRoutes = require('./routes/migration');
const contactRoutes = require('./routes/contact');

// Import services
const SocketService = require('./services/socketService');
const notificationService = require('./services/notificationService');
const realtimeService = require('./services/realtimeService');

const app = express();

// Security middleware (optional deps guarded)
try {
  const helmet = require('helmet');
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  }));
} catch {}
try {
  const rateLimit = require('express-rate-limit');
  const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 });


  app.use(limiter);
} catch {}
const server = http.createServer(app);

// Initialize database
initializePool();

// Initialize Socket.IO
const io = initializeSocket(server);
const socketService = new SocketService(io);
// Inject socket service into notification service for realtime emits
notificationService.setSocketService(socketService);
// Inject into realtime bridge service
realtimeService.setSocketService(socketService);

// Middleware
app.use(cors({
  origin: [config.frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'].filter(Boolean),
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Normalize Vietnamese text in common fields to mitigate mojibake in responses
function normalizeVN(input) {
  try {
    if (typeof input !== 'string') return input;
    let s = input;
    // Decode literal \uXXXX if present
    if (/\\u[0-9a-fA-F]{4}/.test(s)) {
      try { s = JSON.parse('"' + s.replace(/"/g, '\\"') + '"'); } catch {}
    }
    // Fix common latin1 mojibake: detect 'Ã' (0xC3) or replacement char U+FFFD
    if (/\u00C3/.test(s) || /\uFFFD/.test(s)) {
      try { s = Buffer.from(s, 'latin1').toString('utf8'); } catch {}
    }
    return s;
  } catch { return input; }
}

function deepNormalizeCommonFields(payload) {
  const TARGET_KEYS = new Set(['message','title','error','reason','content']);
  const seen = new WeakSet();
  const walk = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    if (seen.has(obj)) return obj;
    seen.add(obj);
    if (Array.isArray(obj)) { for (let i=0;i<obj.length;i++) obj[i] = walk(obj[i]); return obj; }
    for (const k of Object.keys(obj)) {
      const v = obj[k];
      if (typeof v === 'string' && TARGET_KEYS.has(k)) {
        obj[k] = normalizeVN(v);
      } else if (v && typeof v === 'object') {
        obj[k] = walk(v);
      }
    }
    return obj;
  };
  return walk(payload);
}

app.use((req, res, next) => {
  const _json = res.json.bind(res);
  res.json = (body) => _json(deepNormalizeCommonFields(body));
  next();
});

// Serve static files (ensure absolute path) and relax CORP for images
app.use('/uploads', (req, res, next) => {
  try { res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'); } catch {}
  next();
}, express.static(path.join(__dirname, 'uploads'), {
  fallthrough: true
}));

// Health check endpoint (before other routes)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/specialties', specialtiesRoutes);
app.use('/api/counselors', counselorRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/counselor-applications', counselorApplicationsRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/migration', migrationRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api', chatRoutes);

// Swagger docs (optional)
try {
  const swaggerUi = require('swagger-ui-express');
  const swaggerDocument = {
    openapi: '3.0.0',
    info: { title: 'MindCare API', version: '1.0.0' },
    servers: [{ url: 'http://localhost:' + (config.port || 5000) + '/api' }],
    paths: {
      '/auth/login': { post: { summary: 'Login', requestBody: { required: true }, responses: { '200': { description: 'OK' } } } },
      '/auth/register': { post: { summary: 'Register', requestBody: { required: true }, responses: { '200': { description: 'OK' } } } },
      '/auth/oauth': { post: { summary: 'Login with Google', requestBody: { required: true }, responses: { '200': { description: 'OK' } } } },
      '/specialties': { get: { summary: 'List specialties', responses: { '200': { description: 'OK' } } } }
    }
  };
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  console.log('Swagger docs: http://localhost:' + (config.port || 5000) + '/api/docs');
} catch {}

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = config.port || 5000;
server.listen(PORT, () => {
  console.log(`Server đang chạy trên port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  // Log masked OpenRouter config
  const cfg = require('./config');
  const ok = (cfg.openrouterApiKey || '').toString();
  const masked = ok ? `${ok.slice(0, 4)}...${ok.slice(-4)}` : 'MISSING';
  console.log(`OpenRouter API Key: ${masked}`);
  console.log(`OpenRouter Model: ${cfg.openrouterModel}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = { app, server, io, socketService };
