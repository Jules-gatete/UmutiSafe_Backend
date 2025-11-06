const { sequelize, testConnection, syncDatabase } = require('../config/database');
const { User, Medicine, Disposal, PickupRequest, EducationTip } = require('../models');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Test connection
    await testConnection();

    // Sync database
    await syncDatabase(true); // Force recreate tables

    // Seed Users
    console.log('👥 Seeding users...');
    const users = await User.bulkCreate([
      {
        name: 'Jean Baptiste',
        email: 'jean.baptiste@email.com',
        password: 'password123',
        role: 'user',
        phone: '+250 788 123 456',
        location: 'Kigali, Gasabo',
        avatar: 'JB',
        isApproved: true,
        approvedAt: new Date()
      },
      {
        name: 'Marie Claire',
        email: 'marie.claire@email.com',
        password: 'password123',
        role: 'chw',
        phone: '+250 788 234 567',
        sector: 'Remera',
        availability: 'available',
        completedPickups: 45,
        rating: 4.8,
        coverageArea: 'Gasabo District - Remera Sector',
        avatar: 'MC',
        isApproved: true,
        approvedAt: new Date()
      },
      {
        name: 'Admin User',
        email: 'admin@umutisafe.gov.rw',
        password: 'admin123',
        role: 'admin',
        phone: '+250 788 345 678',
        avatar: 'AU',
        isApproved: true,
        approvedAt: new Date()
      },
      {
        name: 'Pierre Uwase',
        email: 'pierre.uwase@email.com',
        password: 'password123',
        role: 'chw',
        phone: '+250 788 456 789',
        sector: 'Kimironko',
        availability: 'busy',
        completedPickups: 38,
        rating: 4.6,
        coverageArea: 'Gasabo District - Kimironko Sector',
        avatar: 'PU',
        isApproved: true,
        approvedAt: new Date()
      },
      {
        name: 'Grace Mukamana',
        email: 'grace.mukamana@email.com',
        password: 'password123',
        role: 'chw',
        phone: '+250 788 567 890',
        sector: 'Gikondo',
        availability: 'available',
        completedPickups: 52,
        rating: 4.9,
        coverageArea: 'Kicukiro District - Gikondo Sector',
        avatar: 'GM',
        isApproved: true,
        approvedAt: new Date()
      }
    ], { individualHooks: true }); // Enable hooks to hash passwords
    console.log(`✅ Created ${users.length} users`);

    // Seed Medicines
    console.log('💊 Seeding medicines...');
    const medicines = await Medicine.bulkCreate([
      {
        genericName: 'Paracetamol',
        brandName: 'Panadol',
        dosageForm: 'Tablet',
        strength: '500mg',
        category: 'Analgesic',
        riskLevel: 'LOW',
        fdaApproved: true,
        disposalInstructions: 'Mix with coffee grounds or kitty litter, seal in plastic bag, and dispose in regular trash. Remove personal information from labels.'
      },
      {
        genericName: 'Amoxicillin',
        brandName: 'Amoxil',
        dosageForm: 'Capsule',
        strength: '250mg',
        category: 'Antibiotic',
        riskLevel: 'MEDIUM',
        fdaApproved: true,
        disposalInstructions: 'Return to pharmacy or request CHW pickup. Do not dispose in household trash or flush down toilet.'
      },
      {
        genericName: 'Diazepam',
        brandName: 'Valium',
        dosageForm: 'Tablet',
        strength: '5mg',
        category: 'Controlled Substance',
        riskLevel: 'HIGH',
        fdaApproved: true,
        disposalInstructions: 'MUST be returned to CHW or authorized collection site immediately. NEVER dispose in household trash.'
      },
      {
        genericName: 'Ibuprofen',
        brandName: 'Advil',
        dosageForm: 'Tablet',
        strength: '400mg',
        category: 'NSAID',
        riskLevel: 'LOW',
        fdaApproved: true
      },
      {
        genericName: 'Ciprofloxacin',
        brandName: 'Cipro',
        dosageForm: 'Tablet',
        strength: '500mg',
        category: 'Antibiotic',
        riskLevel: 'MEDIUM',
        fdaApproved: true
      },
      {
        genericName: 'Morphine Sulfate',
        brandName: 'MS Contin',
        dosageForm: 'Tablet',
        strength: '30mg',
        category: 'Opioid',
        riskLevel: 'HIGH',
        fdaApproved: true
      }
    ]);
    console.log(`✅ Created ${medicines.length} medicines`);

    // Seed Disposals
    console.log('🗑️  Seeding disposals...');
    const disposals = await Disposal.bulkCreate([
      {
        userId: users[0].id,
        genericName: 'Paracetamol',
        brandName: 'Panadol',
        dosageForm: 'Tablet',
        packagingType: 'Blister Pack',
        predictedCategory: 'Analgesic',
        riskLevel: 'LOW',
        confidence: 0.95,
        status: 'completed',
        reason: 'expired',
        disposalGuidance: 'Mix with coffee grounds or kitty litter, seal in plastic bag, dispose in regular trash.',
        completedAt: new Date('2024-09-18')
      },
      {
        userId: users[0].id,
        genericName: 'Amoxicillin',
        brandName: 'Amoxil',
        dosageForm: 'Capsule',
        packagingType: 'Bottle',
        predictedCategory: 'Antibiotic',
        riskLevel: 'MEDIUM',
        confidence: 0.89,
        status: 'pending_review',
        reason: 'completed_treatment',
        disposalGuidance: 'Return to pharmacy or CHW for proper disposal. Do not flush or throw in trash.'
      },
      {
        userId: users[0].id,
        genericName: 'Diazepam',
        brandName: 'Valium',
        dosageForm: 'Tablet',
        packagingType: 'Blister Pack',
        predictedCategory: 'Controlled Substance',
        riskLevel: 'HIGH',
        confidence: 0.92,
        status: 'pickup_requested',
        reason: 'no_longer_needed',
        disposalGuidance: 'MUST be returned to CHW or authorized collection site. Do not dispose in household trash.'
      }
    ]);
    console.log(`✅ Created ${disposals.length} disposals`);

    // Seed Pickup Requests
    console.log('🚚 Seeding pickup requests...');
    const pickupRequests = await PickupRequest.bulkCreate([
      {
        userId: users[0].id,
        chwId: users[1].id,
        medicineName: 'Diazepam (Valium)',
        disposalGuidance: 'MUST be returned to CHW or authorized collection site.',
        reason: 'no_longer_needed',
        pickupLocation: 'KG 123 St, Remera, Kigali',
        preferredTime: new Date('2024-10-08T10:00:00'),
        status: 'scheduled',
        consentGiven: true
      },
      {
        userId: users[0].id,
        chwId: users[4].id,
        medicineName: 'Amoxicillin (Amoxil)',
        disposalGuidance: 'Return to pharmacy or CHW for proper disposal.',
        reason: 'completed_treatment',
        pickupLocation: 'KG 123 St, Remera, Kigali',
        preferredTime: new Date('2024-10-12T14:00:00'),
        status: 'pending',
        consentGiven: true
      }
    ]);
    console.log(`✅ Created ${pickupRequests.length} pickup requests`);

    // Update disposal with pickup request
    await disposals[2].update({ pickupRequestId: pickupRequests[0].id });

    // Seed Education Tips
    console.log('📚 Seeding education tips...');
    const educationTips = await EducationTip.bulkCreate([
      {
        title: 'Why Proper Medicine Disposal Matters',
        icon: 'AlertTriangle',
        summary: 'Improper disposal can contaminate water supplies, harm wildlife, and lead to medicine misuse.',
        content: 'When medicines are flushed down toilets or thrown in regular trash, they can end up in rivers and lakes, affecting aquatic life and potentially entering our drinking water. Some medicines can persist in the environment for years. Always use proper disposal methods to protect our community and environment.',
        category: 'general',
        displayOrder: 1
      },
      {
        title: 'Expired Medicine Risks',
        icon: 'Clock',
        summary: 'Expired medicines may be ineffective or even harmful. Check expiration dates regularly.',
        content: 'Medicines past their expiration date may lose potency or break down into harmful compounds. Create a habit of checking your medicine cabinet every 6 months. Mark expiration dates clearly and set calendar reminders to review your supplies.',
        category: 'safety',
        displayOrder: 2
      },
      {
        title: 'Safe Storage at Home',
        icon: 'Lock',
        summary: 'Store medicines in a cool, dry place away from children and pets.',
        content: 'Keep all medicines in their original containers with labels intact. Store them in a locked cabinet if possible, away from heat and humidity. Never store medicines in bathrooms where moisture can degrade them. Keep emergency contact numbers visible.',
        category: 'storage',
        displayOrder: 3
      },
      {
        title: 'Never Share Prescription Medicines',
        icon: 'Users',
        summary: 'Prescription medicines are prescribed for specific individuals and conditions.',
        content: 'What works for one person may be dangerous for another. Sharing prescription medicines can lead to adverse reactions, drug interactions, or mask symptoms of serious conditions. Always consult a healthcare provider before taking any medicine.',
        category: 'safety',
        displayOrder: 4
      },
      {
        title: 'Recognize High-Risk Medicines',
        icon: 'ShieldAlert',
        summary: 'Some medicines require special disposal procedures due to their potential for misuse or environmental harm.',
        content: 'Controlled substances (opioids, sedatives), chemotherapy drugs, and certain antibiotics must never be thrown in regular trash. UmutiSafe automatically identifies these high-risk medicines and connects you with CHWs for safe disposal.',
        category: 'disposal',
        displayOrder: 5
      },
      {
        title: 'Community Health Worker Support',
        icon: 'Heart',
        summary: 'CHWs are trained professionals ready to help you dispose of medicines safely.',
        content: 'Your local Community Health Worker can provide guidance, arrange pickups for high-risk medicines, and answer questions about medicine safety. They are your trusted partners in keeping your family and community safe.',
        category: 'general',
        displayOrder: 6
      }
    ]);
    console.log(`✅ Created ${educationTips.length} education tips`);

    console.log('\n✅ Database seeding completed successfully!\n');
    console.log('📝 Test Credentials:');
    console.log('   User: jean.baptiste@email.com / password123');
    console.log('   CHW: marie.claire@email.com / password123');
    console.log('   Admin: admin@umutisafe.gov.rw / admin123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();

