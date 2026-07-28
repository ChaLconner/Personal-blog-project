import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

if (process.env.NODE_ENV === 'production') {
  const requiredVariables = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_KEY',
    'CLIENT_URL',
    'FRONTEND_URL'
  ];
  const missingVariables = requiredVariables.filter((name) => !process.env[name]?.trim());

  if (missingVariables.length > 0) {
    throw new Error(`Missing required production environment variables: ${missingVariables.join(', ')}`);
  }

  if (process.env.SUPABASE_SERVICE_KEY === process.env.SUPABASE_ANON_KEY) {
    throw new Error('SUPABASE_SERVICE_KEY must be a service_role key and must not equal SUPABASE_ANON_KEY');
  }

  for (const name of ['SUPABASE_URL', 'CLIENT_URL', 'FRONTEND_URL']) {
    const url = new URL(process.env[name]);
    if (url.protocol !== 'https:') {
      throw new Error(`${name} must use HTTPS in production`);
    }
  }
}

const { default: app } = await import('./app.js');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🚀 Server starting up...');
    console.log(`📡 Server is running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}`);
    console.log(`💻 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
    console.log('✅ Server is ready to accept connections');
  }
});

process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT. Graceful shutdown...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM. Graceful shutdown...');
  process.exit(0);
});
