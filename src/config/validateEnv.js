const requiredVars = [
  'PORT',
  'DB_HOST',
  'DB_NAME',
  'DB_USER',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'REDIS_HOST',
  'REDIS_PORT',
];

const validateEnv = () => {
  const missing = requiredVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error('Missing required environment variables:');
    missing.forEach((key) => console.error(`  - ${key}`));
    console.error('\nPlease check your .env file');
    process.exit(1);
  }
};

module.exports = validateEnv;
