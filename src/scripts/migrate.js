const { testConnection, syncDatabase } = require('../config/database');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import all models to ensure they are registered with Sequelize
const models = require('../models');

const migrate = async () => {
  try {
    console.log('🔄 Running database migrations...\n');
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

    // Test connection
    const connected = await testConnection();

    if (!connected) {
      console.error('❌ Failed to connect to database. Please check your database configuration.');
      process.exit(1);
    }

    console.log('📦 Models loaded:', Object.keys(models).join(', '));
    console.log('');

    // Sync database (creates/updates tables)
    // Use FORCE_MIGRATE=true to drop & recreate all tables (destructive).
    const force = process.env.FORCE_MIGRATE === 'true';
    
    if (force) {
      console.warn('⚠️  FORCE_MIGRATE is true — this will DROP and RECREATE all tables.');
      if (process.env.NODE_ENV === 'production') {
        console.error('❌ FORCE_MIGRATE not allowed in production. Exiting.');
        process.exit(1);
      }
    }

    await syncDatabase(force);

    // Create default admin user if none exists
    console.log('\n👤 Checking for admin user...');
    const User = models.User;
    const adminExists = await User.findOne({ where: { role: 'admin' } });
    
    if (!adminExists) {
      console.log('👤 Creating default admin user...');
      const hashedPassword = await bcrypt.hash('Admin@123!', 10);
      
      await User.create({
        firstName: 'System',
        lastName: 'Administrator',
        email: 'admin@umutisafe.rw',
        password: hashedPassword,
        phone: '+250788000000',
        role: 'admin',
        status: 'active',
        isApproved: true
      });
      
      console.log('✅ Admin user created:');
      console.log('   📧 Email: admin@umutisafe.rw');
      console.log('   🔑 Password: Admin@123!');
      console.log('   ⚠️  IMPORTANT: Change this password after first login!\n');
    } else {
      console.log('✅ Admin user already exists\n');
    }

    // Display database summary
    console.log('📊 Database Summary:');
    for (const [modelName, Model] of Object.entries(models)) {
      if (Model.count) {
        const count = await Model.count();
        console.log(`   ${modelName}: ${count}`);
      }
    }

    console.log('\n✅ Database migration completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    console.error(error.stack);
    process.exit(1);
  }
};

migrate();