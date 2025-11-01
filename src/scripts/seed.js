const { sequelize, testConnection, syncDatabase } = require('../config/database');
const { User, Medicine, Disposal, PickupRequest, EducationTip } = require('../models');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

    // SAFETY CHECK: Prevent accidental production seeding
    if (process.env.NODE_ENV === 'production') {
      if (!process.env.ALLOW_PROD_SEED) {
        console.error('❌ Seeding not allowed in production without ALLOW_PROD_SEED=true');
        console.error('💡 To seed production, set ALLOW_PROD_SEED=true in environment');
        console.error('⚠️  WARNING: This will recreate all tables and delete existing data!');
        process.exit(1);
      }
      console.warn('⚠️  WARNING: Seeding production database. All existing data will be deleted!');
      console.warn('⏳ Waiting 5 seconds... Press Ctrl+C to cancel.\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Test connection
    console.log('📡 Testing database connection...');
    await testConnection();

    // Sync database - Force recreate tables (DESTRUCTIVE!)
    console.log('\n🔄 Syncing database (recreating tables)...');
    await syncDatabase(true);

    // Seed Users
    console.log('\n👥 Seeding users...');
    const users = await User.bulkCreate([
      {
        firstName: 'Jean',
        lastName: 'Baptiste',
        email: 'jean.baptiste@email.com',
        password: 'password123',
        role: 'user',
        phone: '+250788123456',
        location: 'Kigali, Gasabo',
        status: 'active',
        isApproved: true,
        approvedAt: new Date()
      },
      {
        firstName: 'Marie',
        lastName: 'Claire',
        email: 'marie.claire@email.com',
        password: 'password123',
        role: 'chw',
        phone: '+250788234567',
        district: 'Gasabo',
        sector: 'Remera',
        availability: true,
        status: 'active',
        isApproved: true,
        approvedAt: new Date()
      },
      {
        firstName: 'System',
        lastName: 'Administrator',
        email: 'admin@umutisafe.rw',
        password: 'Admin@123!',
        role: 'admin',
        phone: '+250788345678',
        status: 'active',
        isApproved: true,
        approvedAt: new Date()
      },
      {
        firstName: 'Pierre',
        lastName: 'Uwase',
        email: 'pierre.uwase@email.com',
        password: 'password123',
        role: 'chw',
        phone: '+250788456789',
        district: 'Gasabo',
        sector: 'Kimironko',
        availability: false,
        status: 'active',
        isApproved: true,
        approvedAt: new Date()
      },
      {
        firstName: 'Grace',
        lastName: 'Mukamana',
        email: 'grace.mukamana@email.com',
        password: 'password123',
        role: 'chw',
        phone: '+250788567890',
        district: 'Kicukiro',
        sector: 'Gikondo',
        availability: true,
        status: 'active',
        isApproved: true,
        approvedAt: new Date()
      }
    ], { individualHooks: true }); // Enable hooks to hash passwords
    console.log(`✅ Created ${users.length} users`);

    // Seed Medicines
    console.log('\n💊 Seeding medicines...');
    const medicines = await Medicine.bulkCreate([
      {
        genericName: 'Paracetamol',
        brandName: 'Panadol',
        dosageForm: 'Tablet',
        strength: '500mg',
        category: 'Analgesic',
        manufacturer: 'GSK',
        disposalCategory: 'household',
        safetyInstructions: 'Mix with coffee grounds or kitty litter, seal in plastic bag, and dispose in regular trash. Remove personal information from labels.',
        requiresPickup: false
      },
      {
        genericName: 'Amoxicillin',
        brandName: 'Amoxil',
        dosageForm: 'Capsule',
        strength: '250mg',
        category: 'Antibiotic',
        manufacturer: 'Pfizer',
        disposalCategory: 'pharmaceutical',
        safetyInstructions: 'Return to pharmacy or request CHW pickup. Do not dispose in household trash or flush down toilet.',
        requiresPickup: true
      },
      {
        genericName: 'Diazepam',
        brandName: 'Valium',
        dosageForm: 'Tablet',
        strength: '5mg',
        category: 'Controlled Substance',
        manufacturer: 'Roche',
        disposalCategory: 'hazardous',
        safetyInstructions: 'MUST be returned to CHW or authorized collection site immediately. NEVER dispose in household trash.',
        requiresPickup: true
      },
      {
        genericName: 'Ibuprofen',
        brandName: 'Advil',
        dosageForm: 'Tablet',
        strength: '400mg',
        category: 'NSAID',
        manufacturer: 'Pfizer',
        disposalCategory: 'household',
        safetyInstructions: 'Can be disposed with household waste after mixing with undesirable substance.',
        requiresPickup: false
      },
      {
        genericName: 'Ciprofloxacin',
        brandName: 'Cipro',
        dosageForm: 'Tablet',
        strength: '500mg',
        category: 'Antibiotic',
        manufacturer: 'Bayer',
        disposalCategory: 'pharmaceutical',
        safetyInstructions: 'Return unused antibiotics to pharmacy or CHW to prevent environmental contamination.',
        requiresPickup: true
      },
      {
        genericName: 'Morphine Sulfate',
        brandName: 'MS Contin',
        dosageForm: 'Tablet',
        strength: '30mg',
        category: 'Opioid',
        manufacturer: 'Purdue',
        disposalCategory: 'hazardous',
        safetyInstructions: 'High-risk controlled substance. MUST be disposed through CHW or authorized facility immediately.',
        requiresPickup: true
      }
    ]);
    console.log(`✅ Created ${medicines.length} medicines`);

    // Seed Disposals
    console.log('\n🗑️  Seeding disposals...');
    const disposals = await Disposal.bulkCreate([
      {
        userId: users[0].id,
        medicineName: 'Paracetamol',
        brandName: 'Panadol',
        dosageForm: 'Tablet',
        quantity: '20 tablets',
        expiryDate: new Date('2024-06-15'),
        reason: 'expired',
        disposalCategory: 'household',
        riskLevel: 'low',
        status: 'completed',
        disposalGuidance: 'Mix with coffee grounds or kitty litter, seal in plastic bag, dispose in regular trash.',
        completedAt: new Date('2024-09-18')
      },
      {
        userId: users[0].id,
        medicineName: 'Amoxicillin',
        brandName: 'Amoxil',
        dosageForm: 'Capsule',
        quantity: '10 capsules',
        expiryDate: new Date('2025-03-20'),
        reason: 'completed_treatment',
        disposalCategory: 'pharmaceutical',
        riskLevel: 'medium',
        status: 'pending',
        disposalGuidance: 'Return to pharmacy or CHW for proper disposal. Do not flush or throw in trash.'
      },
      {
        userId: users[0].id,
        medicineName: 'Diazepam',
        brandName: 'Valium',
        dosageForm: 'Tablet',
        quantity: '15 tablets',
        expiryDate: new Date('2025-12-10'),
        reason: 'no_longer_needed',
        disposalCategory: 'hazardous',
        riskLevel: 'high',
        status: 'pickup_scheduled',
        disposalGuidance: 'MUST be returned to CHW or authorized collection site. Do not dispose in household trash.'
      }
    ]);
    console.log(`✅ Created ${disposals.length} disposals`);

    // Seed Pickup Requests
    console.log('\n🚚 Seeding pickup requests...');
    const pickupRequests = await PickupRequest.bulkCreate([
      {
        userId: users[0].id,
        disposalId: disposals[2].id,
        chwId: users[1].id,
        pickupAddress: 'KG 123 St, Remera, Gasabo, Kigali',
        pickupDate: new Date('2024-10-08'),
        pickupTime: '10:00 AM',
        status: 'scheduled',
        notes: 'High-risk controlled substance - handle with care'
      },
      {
        userId: users[0].id,
        disposalId: disposals[1].id,
        chwId: users[4].id,
        pickupAddress: 'KG 123 St, Remera, Gasabo, Kigali',
        pickupDate: new Date('2024-10-12'),
        pickupTime: '2:00 PM',
        status: 'pending',
        notes: 'Leftover antibiotics from completed treatment'
      }
    ]);
    console.log(`✅ Created ${pickupRequests.length} pickup requests`);

    // Seed Education Tips
    console.log('\n📚 Seeding education tips...');
    const educationTips = await EducationTip.bulkCreate([
      {
        title: 'Why Proper Medicine Disposal Matters',
        content: 'When medicines are flushed down toilets or thrown in regular trash, they can end up in rivers and lakes, affecting aquatic life and potentially entering our drinking water. Some medicines can persist in the environment for years. Always use proper disposal methods to protect our community and environment.',
        category: 'general',
        imageUrl: null
      },
      {
        title: 'Expired Medicine Risks',
        content: 'Medicines past their expiration date may lose potency or break down into harmful compounds. Create a habit of checking your medicine cabinet every 6 months. Mark expiration dates clearly and set calendar reminders to review your supplies.',
        category: 'safety',
        imageUrl: null
      },
      {
        title: 'Safe Storage at Home',
        content: 'Keep all medicines in their original containers with labels intact. Store them in a locked cabinet if possible, away from heat and humidity. Never store medicines in bathrooms where moisture can degrade them. Keep emergency contact numbers visible.',
        category: 'storage',
        imageUrl: null
      },
      {
        title: 'Never Share Prescription Medicines',
        content: 'What works for one person may be dangerous for another. Sharing prescription medicines can lead to adverse reactions, drug interactions, or mask symptoms of serious conditions. Always consult a healthcare provider before taking any medicine.',
        category: 'safety',
        imageUrl: null
      },
      {
        title: 'Recognize High-Risk Medicines',
        content: 'Controlled substances (opioids, sedatives), chemotherapy drugs, and certain antibiotics must never be thrown in regular trash. UmutiSafe automatically identifies these high-risk medicines and connects you with CHWs for safe disposal.',
        category: 'disposal',
        imageUrl: null
      },
      {
        title: 'Community Health Worker Support',
        content: 'Your local Community Health Worker can provide guidance, arrange pickups for high-risk medicines, and answer questions about medicine safety. They are your trusted partners in keeping your family and community safe.',
        category: 'general',
        imageUrl: null
      }
    ]);
    console.log(`✅ Created ${educationTips.length} education tips`);

    console.log('\n🎉 Database seeding completed successfully!\n');
    console.log('📊 Database Summary:');
    console.log(`   Users: ${users.length}`);
    console.log(`   Medicines: ${medicines.length}`);
    console.log(`   Disposals: ${disposals.length}`);
    console.log(`   Pickup Requests: ${pickupRequests.length}`);
    console.log(`   Education Tips: ${educationTips.length}\n`);
    
    console.log('📝 Test Credentials:');
    console.log('   👤 Regular User:');
    console.log('      Email: jean.baptiste@email.com');
    console.log('      Password: password123\n');
    console.log('   🏥 CHW (Remera):');
    console.log('      Email: marie.claire@email.com');
    console.log('      Password: password123\n');
    console.log('   👨‍⚕️ CHW (Gikondo):');
    console.log('      Email: grace.mukamana@email.com');
    console.log('      Password: password123\n');
    console.log('   🔐 Admin:');
    console.log('      Email: admin@umutisafe.rw');
    console.log('      Password: Admin@123!');
    console.log('      ⚠️  Change this password immediately after first login!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    console.error(error.stack);
    process.exit(1);
  }
};

seedDatabase();