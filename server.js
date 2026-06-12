const app = require('./src/app');
const env = require('./src/config/env');
const validateEnv = require('./src/config/validateEnv');
const { sequelize } = require('./src/models');

// Validate environment variables before starting
validateEnv();

const PORT = env.port;

const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // Sync models (development only — use migrations in production)
    if (env.nodeEnv === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ Models synced');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} in ${env.nodeEnv} mode`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error.message);
    process.exit(1);
  }
};

startServer();
