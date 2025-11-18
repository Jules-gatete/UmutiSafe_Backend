const { sequelize, testConnection, syncDatabase } = require('../config/database');
const { User, Medicine, Disposal, PickupRequest, EducationTip } = require('../models');
require('dotenv').config();

const argv = new Set(process.argv.slice(2));
const resetSchema = argv.has('--force') || argv.has('--fresh') || argv.has('--reset');
const skipSync = argv.has('--skip-sync');
const logSql = argv.has('--log-sql') || argv.has('--verbose');
const alterSchema = !resetSchema && argv.has('--alter');

const seedDatabase = async () => {
  let transaction;
  let users = [];
  let adminUser;
  let householdUser;
  let chwUsers = [];
  try {
    console.log('🌱 Starting database seeding...\n');
    console.log(`   • Schema sync: ${skipSync ? 'skipped (--skip-sync)' : resetSchema ? 'force (drop & recreate)' : alterSchema ? 'alter (non-destructive)' : 'safe (create missing tables)'}${logSql ? ' + SQL logging' : ''}`);

    // Test connection
    await testConnection();

    if (!skipSync) {
      await syncDatabase({
        force: resetSchema,
        alter: alterSchema,
        logging: logSql ? console.log : false
      });
    }

    transaction = await sequelize.transaction();

    console.log('👥 Seeding user accounts...');

    const now = new Date();

    householdUser = await User.create({
      name: 'Jean Baptiste Niyonzima',
      email: 'jean.baptiste@email.com',
      password: 'password123',
      role: 'user',
      phone: '+250781234567',
      location: 'Remera, Gasabo District',
      isApproved: true,
      isActive: true
    }, { transaction });

    adminUser = await User.create({
      name: 'UmutiSafe Administrator',
      email: 'admin@umutisafe.gov.rw',
      password: 'admin123',
      role: 'admin',
      phone: '+250780000000',
      location: 'Kigali City',
      isApproved: true,
      isActive: true,
      approvedAt: now
    }, { transaction });

    const kigaliDistricts = [
      {
        district: 'Gasabo',
        sectors: [
          'Remera',
          'Bumbogo',
          'Gatsata',
          'Gikomero',
          'Gisozi',
          'Jabana',
          'Jali',
          'Kacyiru',
          'Kimihurura',
          'Kimironko',
          'Kinyinya',
          'Nduba',
          'Ndera',
          'Rusororo',
          'Rutunga'
        ]
      },
      {
        district: 'Kicukiro',
        sectors: [
          'Gahanga',
          'Gatenga',
          'Gikondo',
          'Kagarama',
          'Kanombe',
          'Kicukiro',
          'Kigarama',
          'Masaka',
          'Niboye',
          'Nyarugunga'
        ]
      },
      {
        district: 'Nyarugenge',
        sectors: [
          'Gitega',
          'Kanyinya',
          'Kigali',
          'Kimisagara',
          'Mageragere',
          'Muhima',
          'Nyakabanda',
          'Nyamirambo',
          'Nyarugenge',
          'Rwezamenyo'
        ]
      }
    ];

    const chwNamePool = [
      'Aline Uwase',
      'Benitha Mukamana',
      'Claudette Niyonsaba',
      'Didier Nkurunziza',
      'Emeraude Habineza',
      'Faustin Uwayezu',
      'Grace Uwamahoro',
      'Herve Ndayishimiye',
      'Immaculee Uwitonze',
      'Jacques Mugabekazi',
      'Keza Nirere',
      'Lionel Rukundo',
      'Malaika Uwimana',
      'Nadia Ingabire',
      'Obed Ishimwe',
      'Pascal Twagiramungu',
      'Queen Mutoni',
      'Roland Habumugisha',
      'Sandrine Isimbi',
      'Thierry Nsengimana',
      'Umwali Kamaraba',
      'Valerie Umuhoza',
      'Willy Gashugi',
      'Xaverine Nyirahabimana',
      'Yvette Umutoni',
      'Zacharie Gakwerere',
      'Alphonse Ndayambaje',
      'Beatha Uwitonze',
      'Claude Niyomugabo',
      'Dativa Mukandayisenga',
      'Eric Ngabonziza',
      'Francine Ufitinema',
      'Germain Ntirenganya',
      'Honeline Umugwaneza',
      'Isabelle Iyakaremye',
      'Jeanette Ujeneza',
      'Kenny Ndayisenga',
      'Laurence Mukarurangwa',
      'Moses Irumva',
      'Nicole Uwamwezi',
      'Olivier Rwigema',
      'Patricia Nyiransabimana',
      'Ruth Ngendo',
      'Samson Kanyamibwa',
      'Teta Uwase'
    ];

    let nameCounter = 0;

    const nextName = () => {
      const name = chwNamePool[nameCounter] || `CHW Agent ${nameCounter + 1}`;
      nameCounter += 1;
      return name;
    };

    const emailLocalParts = new Set([
      'jean.baptiste',
      'admin'
    ]);

    const normalizeToken = (value) => value
      .normalize('NFKD')
      .replace(/[^A-Za-z0-9]+/g, '')
      .toLowerCase();

    const makeEmailLocalPart = (fullName) => {
      const tokens = fullName
        .split(/\s+/)
        .map((token) => normalizeToken(token))
        .filter(Boolean);

      if (tokens.length === 0) {
        tokens.push('chw');
      }

      const primary = tokens[0];
      const secondary = tokens[1] || tokens[tokens.length - 1] || tokens[0];
      const base = `${primary}.${secondary}`.replace(/\.+/g, '.').replace(/^\.|\.$/g, '') || 'chw.agent';

      let candidate = base;
      let counter = 1;
      while (emailLocalParts.has(candidate)) {
        counter += 1;
        candidate = `${base}${counter}`;
      }

      emailLocalParts.add(candidate);
      return candidate;
    };

    const chwUsersData = [];

    kigaliDistricts.forEach((entry) => {
      entry.sectors.forEach((sector) => {
        const globalIndex = chwUsersData.length;
        const isRemera = entry.district === 'Gasabo' && sector === 'Remera';
        const displayName = isRemera ? 'Marie Claire Uwase' : nextName();
        let emailLocalPart;
        if (isRemera) {
          emailLocalPart = emailLocalParts.has('marie.claire')
            ? makeEmailLocalPart(displayName)
            : 'marie.claire';
          emailLocalParts.add(emailLocalPart);
        } else {
          emailLocalPart = makeEmailLocalPart(displayName);
        }
        const email = `${emailLocalPart}@email.com`;
        const phoneSuffix = (1000000 + globalIndex).toString().slice(-7);

        const seededRating = (() => {
          if (isRemera) return 4.8;
          if (entry.district === 'Gasabo' && ['Gisozi', 'Kimironko', 'Kacyiru'].includes(sector)) return 4.6;
          if (entry.district === 'Kicukiro' && ['Gikondo', 'Kanombe', 'Kicukiro'].includes(sector)) return 4.5;
          if (entry.district === 'Nyarugenge' && ['Nyamirambo', 'Muhima', 'Kimisagara'].includes(sector)) return 4.7;
          const base = 4.0 + ((globalIndex % 7) * 0.1);
          return Math.min(4.9, Number(base.toFixed(1)));
        })();

        const seededPickups = (() => {
          if (isRemera) return 42;
          if (entry.district === 'Gasabo') return 15 + (globalIndex % 5) * 3;
          if (entry.district === 'Kicukiro') return 12 + (globalIndex % 4) * 4;
          return 10 + (globalIndex % 6) * 2;
        })();

        chwUsersData.push({
          name: displayName,
          email,
          password: 'password123',
          role: 'chw',
          phone: `+25078${phoneSuffix}`,
          sector,
          coverageArea: `${sector} Sector, ${entry.district} District`,
          location: `${entry.district} District`,
          availability: 'available',
          isActive: true,
          isApproved: true,
          approvedBy: adminUser.id,
          approvedAt: now,
          rating: seededRating,
          completedPickups: seededPickups
        });
      });
    });

    chwUsers = await User.bulkCreate(chwUsersData, {
      transaction,
      returning: true,
      individualHooks: true
    });

    users = [householdUser, ...chwUsers];

    if (!users.length || chwUsers.length < 5) {
      throw new Error('Failed to seed baseline user accounts');
    }

    console.log(`✅ Created ${users.length + 1} user accounts (${chwUsers.length} CHWs, 1 household user, 1 admin).`);

    const seedSampleMedicines = process.env.SEED_SAMPLE_MEDICINES === 'true';
    if (seedSampleMedicines) {
      console.log('� Seeding medicines (sample data enabled)...');
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
        },
        {
          genericName: 'Metformin',
          brandName: 'Glucophage',
          dosageForm: 'Tablet',
          strength: '500mg',
          category: 'Antidiabetic',
          riskLevel: 'MEDIUM',
          fdaApproved: true
        },
        {
          genericName: 'Hydrochlorothiazide',
          brandName: 'Microzide',
          dosageForm: 'Tablet',
          strength: '25mg',
          category: 'Diuretic',
          riskLevel: 'MEDIUM',
          fdaApproved: true
        },
        {
          genericName: 'Atorvastatin',
          brandName: 'Lipitor',
          dosageForm: 'Tablet',
          strength: '20mg',
          category: 'Statin',
          riskLevel: 'LOW',
          fdaApproved: true
        },
        {
          genericName: 'Azithromycin',
          brandName: 'Zithromax',
          dosageForm: 'Tablet',
          strength: '250mg',
          category: 'Antibiotic',
          riskLevel: 'MEDIUM',
          fdaApproved: true
        }
      ], { transaction });
      console.log(`✅ Created ${medicines.length} medicines`);
    } else {
      console.log('ℹ️  Skipping sample medicine seed data (registry will be populated via admin CSV upload).');
    }

    // Seed Disposals
    console.log('🗑️  Seeding disposals...');

    const predictionImageSample = {
      dosage_form: [
        { value: 'tablets', confidence: 0.9869 },
        { value: 'film coated tablets', confidence: 0.007 },
        { value: 'chewable tablets', confidence: 0.0016 }
      ],
      manufacturer: [
        { value: 'other', confidence: 0.9975 },
        { value: 'maxtar bio-genics', confidence: 0.00026 },
        { value: 'industrias farmacéuticas almirall, s.a.', confidence: 0.0002 }
      ],
      disposal_category: { value: '6', confidence: 0.8694 },
      method_of_disposal: [
        { value: 'landfill', confidence: 0.8082 },
        { value: 'medium and high-temperature incineration (cement kiln incinerator)', confidence: 0.9520 },
        { value: 'waste encapsulation', confidence: 0.8871 },
        { value: 'waste inertization', confidence: 0.9173 }
      ],
      handling_method: 'To be removed from outer packaging but remain in inner packaging and placed in clean plastic or steel drums for treatment by encapsulation. Large quantities of loose tablets should be mixed with other medicines in different steel drums to avoid high concentrations of a single drug in any one drum.',
      disposal_remarks: 'No more than 1% of daily municipal waste should be disposed of daily in an untreated form (non-immobilized) to a landfill.',
      similar_generic_name: 'atenolol',
      similarity_distance: 0.4582,
      input_generic_name: 'Daparyllo'
    };

    const predictionTextSample = {
      dosage_form: [
        { value: 'capsules', confidence: 0.9321 },
        { value: 'tablets', confidence: 0.0564 }
      ],
      manufacturer: [
        { value: 'generic manufacturer', confidence: 0.8123 },
        { value: 'glaxo', confidence: 0.0765 }
      ],
      disposal_category: { value: '3', confidence: 0.7456 },
      method_of_disposal: [
        { value: 'return to pharmacy', confidence: 0.9444 },
        { value: 'community take-back', confidence: 0.6544 }
      ],
      handling_method: 'Return to a licensed collection point or coordinate CHW pickup.',
      disposal_remarks: 'Keep sealed until collected to prevent misuse.',
      similar_generic_name: 'amoxicillin',
      similarity_distance: 0.2212,
      input_generic_name: 'Amoxicillin'
    };

    const predictionControlledSample = {
      dosage_form: [
        { value: 'tablet', confidence: 0.9812 }
      ],
      manufacturer: [
        { value: 'roche', confidence: 0.5621 }
      ],
      disposal_category: { value: '5', confidence: 0.9132 },
      method_of_disposal: [
        { value: 'schedule CHW pickup', confidence: 0.991 },
        { value: 'secure lockbox storage', confidence: 0.712 }
      ],
      handling_method: 'Store securely and arrange immediate pickup by certified personnel.',
      disposal_remarks: 'Do not leave unattended; controlled substances require documented hand-off.',
      similar_generic_name: 'diazepam',
      similarity_distance: 0.119,
      input_generic_name: 'Diazepam'
    };

    const demoChws = chwUsers.slice(0, 3);

    const disposals = await Disposal.bulkCreate([
      {
        userId: users[0].id,
        genericName: 'Daparyllo',
        brandName: 'Daparyllo',
        dosageForm: 'Tablet',
        packagingType: 'Blister Pack',
        medicineName: 'Daparyllo',
        inputGenericName: predictionImageSample.input_generic_name,
        predictedCategory: predictionImageSample.disposal_category.value,
        predictedCategoryConfidence: predictionImageSample.disposal_category.confidence,
        confidence: predictionImageSample.disposal_category.confidence,
        status: 'completed',
        reason: 'expired',
        disposalGuidance: predictionImageSample.method_of_disposal[0]?.value,
        handlingMethod: predictionImageSample.handling_method,
        disposalRemarks: predictionImageSample.disposal_remarks,
        categoryCode: predictionImageSample.disposal_category.value,
        categoryLabel: null,
        similarGenericName: predictionImageSample.similar_generic_name,
        similarityDistance: predictionImageSample.similarity_distance,
        predictionInputType: 'image',
        analysis: '# Medicine Analysis: Daparyllo\nBased on image input.',
        disposalMethods: predictionImageSample.method_of_disposal,
        dosageForms: predictionImageSample.dosage_form,
        manufacturers: predictionImageSample.manufacturer,
        messages: [
          'Successfully processed image prediction.',
          'Confidence high for landfill and encapsulation methods.'
        ],
        errors: [],
        predictionDetails: predictionImageSample,
        metadata: {
          seeded: true,
          inputType: 'image',
          success: true,
          modelVersion: 'seed-v2',
          assignedChw: demoChws[2]
            ? {
                id: demoChws[2].id,
                name: demoChws[2].name,
                email: demoChws[2].email
              }
            : null
        },
        completedAt: new Date('2024-09-18')
      },
      {
        userId: users[0].id,
        genericName: 'Amoxicillin',
        brandName: 'Amoxil',
        dosageForm: 'Capsule',
        packagingType: 'Bottle',
        medicineName: 'Amoxicillin',
        inputGenericName: predictionTextSample.input_generic_name,
        predictedCategory: predictionTextSample.disposal_category.value,
        predictedCategoryConfidence: predictionTextSample.disposal_category.confidence,
        confidence: predictionTextSample.disposal_category.confidence,
        status: 'pending_review',
        reason: 'completed_treatment',
        disposalGuidance: predictionTextSample.method_of_disposal[0]?.value,
        handlingMethod: predictionTextSample.handling_method,
        disposalRemarks: predictionTextSample.disposal_remarks,
        categoryCode: predictionTextSample.disposal_category.value,
        categoryLabel: null,
        similarGenericName: predictionTextSample.similar_generic_name,
        similarityDistance: predictionTextSample.similarity_distance,
        predictionInputType: 'text',
        analysis: '## Disposal Guidance\nReturn to pharmacy.',
        disposalMethods: predictionTextSample.method_of_disposal,
        dosageForms: predictionTextSample.dosage_form,
        manufacturers: predictionTextSample.manufacturer,
        messages: ['Model recommends controlled collection to avoid misuse.'],
        errors: [],
        predictionDetails: predictionTextSample,
        metadata: {
          seeded: true,
          inputType: 'text',
          success: true,
          modelVersion: 'seed-v2',
          assignedChw: demoChws[1]
            ? {
                id: demoChws[1].id,
                name: demoChws[1].name,
                email: demoChws[1].email
              }
            : null
        }
      },
      {
        userId: users[0].id,
        genericName: 'Diazepam',
        brandName: 'Valium',
        dosageForm: 'Tablet',
        packagingType: 'Blister Pack',
        medicineName: 'Diazepam',
        inputGenericName: predictionControlledSample.input_generic_name,
        predictedCategory: predictionControlledSample.disposal_category.value,
        predictedCategoryConfidence: predictionControlledSample.disposal_category.confidence,
        confidence: predictionControlledSample.disposal_category.confidence,
        status: 'pickup_requested',
        reason: 'no_longer_needed',
        disposalGuidance: predictionControlledSample.method_of_disposal[0]?.value,
        handlingMethod: predictionControlledSample.handling_method,
        disposalRemarks: predictionControlledSample.disposal_remarks,
        categoryCode: predictionControlledSample.disposal_category.value,
        categoryLabel: null,
        similarGenericName: predictionControlledSample.similar_generic_name,
        similarityDistance: predictionControlledSample.similarity_distance,
        predictionInputType: 'text',
        analysis: '## Controlled Substance Handling\nSchedule certified pickup immediately.',
        disposalMethods: predictionControlledSample.method_of_disposal,
        dosageForms: predictionControlledSample.dosage_form,
        manufacturers: predictionControlledSample.manufacturer,
        messages: ['Requires CHW intervention before disposal.'],
        errors: [],
        predictionDetails: predictionControlledSample,
        metadata: {
          seeded: true,
          inputType: 'text',
          success: true,
          modelVersion: 'seed-v2',
          assignedChw: demoChws[0]
            ? {
                id: demoChws[0].id,
                name: demoChws[0].name,
                email: demoChws[0].email
              }
            : null
        }
      }
    ], { transaction });
    console.log(`✅ Created ${disposals.length} disposals`);

    // Seed Pickup Requests
    console.log('🚚 Seeding pickup requests...');
    const pickupRequests = await PickupRequest.bulkCreate([
      {
        userId: users[0].id,
        chwId: demoChws[0]?.id,
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
        chwId: demoChws[1]?.id,
        medicineName: 'Amoxicillin (Amoxil)',
        disposalGuidance: 'Return to pharmacy or CHW for proper disposal.',
        reason: 'completed_treatment',
        pickupLocation: 'KG 123 St, Remera, Kigali',
        preferredTime: new Date('2024-10-12T14:00:00'),
        status: 'pending',
        consentGiven: true
      },
      {
        userId: users[0].id,
        chwId: demoChws[2]?.id,
        medicineName: 'Daparyllo (Tablets)',
        disposalGuidance: 'Place tablets in sealed container prior to landfill delivery.',
        reason: 'expired',
        pickupLocation: 'Sector office, Rusororo',
        preferredTime: new Date('2024-10-15T09:30:00'),
        status: 'completed',
        consentGiven: true
      }
    ], { transaction });
    console.log(`✅ Created ${pickupRequests.length} pickup requests`);

    // Link seeded disposals to pickup requests to close the loop
    await disposals[2].update({ pickupRequestId: pickupRequests[0].id }, { transaction });
    await disposals[1].update({ pickupRequestId: pickupRequests[1].id }, { transaction });
    await disposals[0].update({ pickupRequestId: pickupRequests[2].id }, { transaction });

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

  await transaction.commit();
  transaction = null;

    console.log('\n✅ Database seeding completed successfully!\n');
    console.log('📝 Test Accounts (passwords stored securely):');
    console.log(`   User: ${householdUser.email}`);
    const demoChw = chwUsers.find((chw) => chw.name === 'Marie Claire Uwase') || chwUsers[0];
    if (demoChw) {
      console.log(`   CHW: ${demoChw.email}`);
    }
    if (adminUser) {
      console.log(`   Admin: ${adminUser.email}`);
    }
    console.log('   (Refer to internal documentation for default password policy)\n');

    process.exit(0);
  } catch (error) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('⚠️  Failed to rollback transaction:', rollbackError.message || rollbackError);
      }
    }

    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();

