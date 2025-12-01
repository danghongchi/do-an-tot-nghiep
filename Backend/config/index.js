// Load environment variables (prefer Backend/.env)
try {
  const path = require('path');
  const envPath = path.resolve(__dirname, '../.env');
  require('dotenv').config({ path: envPath });
} catch (e) {
  // dotenv is optional in some environments
}

const config = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  // Cohere (optional)
  cohereApiKey: process.env.COHERE_API_KEY,
  cohereModel: process.env.COHERE_MODEL || 'command',
  // OpenRouter (active when configured)
  openrouterApiKey: process.env.OPENROUTER_API_KEY,
  openrouterModel: process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo',
  openrouterBaseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  // VNPAY Sandbox config
  vnpay: {
    tmnCode: process.env.VNP_TMN_CODE || 'VNPAY_SANDBOX_TMN',
    hashSecret: process.env.VNP_HASH_SECRET || 'VNPAY_SANDBOX_SECRET',
    vnpUrl: process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    returnUrl: process.env.VNP_RETURN_URL || 'http://localhost:5000/api/payment/return',
    ipnUrl: process.env.VNP_IPN_URL || 'http://localhost:5000/api/payment/ipn',
    locale: process.env.VNP_LOCALE || 'vn',
    currCode: 'VND'
  },
  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  }
};

module.exports = config;
