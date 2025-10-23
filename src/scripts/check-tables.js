const { sequelize } = require('../config/database');
require('dotenv').config();

const checkTables = async () => {
  try {
    console.log('🔍 Checking database connection and tables...\n');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful!\n');
    
    // Get database name
    const dbName = sequelize.config.database;
    console.log(`📊 Database: ${dbName}`);
    console.log(`🏠 Host: ${sequelize.config.host}`);
    console.log(`👤 User: ${sequelize.config.username}\n`);
    
    // List all tables
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    if (results.length === 0) {
      console.log('⚠️  No tables found in the database!\n');
      console.log('This could mean:');
      console.log('1. The migration did not create tables');
      console.log('2. You are looking at a different database\n');
      console.log('Run: npm run db:migrate');
    } else {
      console.log(`✅ Found ${results.length} tables:\n`);
      results.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.table_name}`);
      });
      
      // Get row counts for each table
      console.log('\n📊 Table row counts:');
      for (const row of results) {
        const [countResult] = await sequelize.query(`SELECT COUNT(*) as count FROM "${row.table_name}"`);
        console.log(`   ${row.table_name}: ${countResult[0].count} rows`);
      }
    }
    
    console.log('\n✅ Check completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
};

checkTables();

