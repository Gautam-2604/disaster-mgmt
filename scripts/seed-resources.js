const { PrismaClient } = require('../app/generated/prisma')

const prisma = new PrismaClient()

async function seedResources() {
  console.log('🌱 Seeding resource management system...')

  try {
    // Check if data already exists
    const existingResourceTypes = await prisma.resourceType.count()
    const existingResources = await prisma.resource.count()

    if (existingResourceTypes > 0 || existingResources > 0) {
      console.log('📋 Existing resource data found. Clearing database...')
      
      // Clear existing data in proper order (due to foreign key constraints)
      await prisma.resourceAssignment.deleteMany({})
      await prisma.resource.deleteMany({})
      await prisma.resourceType.deleteMany({})
      
      console.log('✅ Cleared existing resource data')
    }

    // Create Resource Types
    const resourceTypes = await Promise.all([
      // Personnel Resources
      prisma.resourceType.create({
        data: {
          name: 'Emergency Medical Technician',
          category: 'PERSONNEL',
          description: 'Certified EMT for medical emergencies'
        }
      }),
      prisma.resourceType.create({
        data: {
          name: 'Rescue Specialist',
          category: 'PERSONNEL',
          description: 'Trained rescue operations specialist'
        }
      }),
      prisma.resourceType.create({
        data: {
          name: 'Disaster Coordinator',
          category: 'PERSONNEL',
          description: 'Emergency response coordinator'
        }
      }),

      // Vehicle Resources
      prisma.resourceType.create({
        data: {
          name: 'Ambulance',
          category: 'VEHICLE',
          description: 'Emergency medical transport vehicle'
        }
      }),
      prisma.resourceType.create({
        data: {
          name: 'Fire Truck',
          category: 'VEHICLE',
          description: 'Fire and rescue vehicle'
        }
      }),
      prisma.resourceType.create({
        data: {
          name: 'Search & Rescue Vehicle',
          category: 'VEHICLE',
          description: 'All-terrain rescue vehicle'
        }
      }),

      // Equipment Resources
      prisma.resourceType.create({
        data: {
          name: 'Medical Kit',
          category: 'EQUIPMENT',
          description: 'Portable emergency medical supplies'
        }
      }),
      prisma.resourceType.create({
        data: {
          name: 'Rescue Equipment',
          category: 'EQUIPMENT',
          description: 'Ropes, tools, and rescue gear'
        }
      }),

      // Supply Resources
      prisma.resourceType.create({
        data: {
          name: 'Emergency Food Package',
          category: 'SUPPLY',
          description: 'Ready-to-eat emergency food for 10 people'
        }
      }),
      prisma.resourceType.create({
        data: {
          name: 'Water Purification Kit',
          category: 'SUPPLY',
          description: 'Portable water treatment system'
        }
      }),

      // Facility Resources
      prisma.resourceType.create({
        data: {
          name: 'Emergency Shelter',
          category: 'FACILITY',
          description: 'Temporary shelter facility'
        }
      }),
      prisma.resourceType.create({
        data: {
          name: 'Medical Station',
          category: 'FACILITY',
          description: 'Mobile medical treatment facility'
        }
      })
    ])

    console.log(`✅ Created ${resourceTypes.length} resource types`)

    // Create actual Resources with coordinates around emergency area (22.253° N, 84.908° E)
    // Spread resources within 10-15km radius for realistic distribution
    const resourcesData = [
      // Personnel (3 EMTs, 2 Rescue Specialists, 2 Coordinators)
      { name: 'EMT-001', identifier: 'EMT-001', typeIndex: 0, capacity: 1, location: 'Ispat General Hospital', lat: 22.270, lng: 84.900 },
      { name: 'EMT-002', identifier: 'EMT-002', typeIndex: 0, capacity: 1, location: 'Regional Medical Center', lat: 22.250, lng: 84.920 },
      { name: 'EMT-003', identifier: 'EMT-003', typeIndex: 0, capacity: 1, location: 'City Medical Center', lat: 22.260, lng: 84.910 },
      
      { name: 'RESCUE-01', identifier: 'RESCUE-01', typeIndex: 1, capacity: 1, location: 'Fire Station Sector-1', lat: 22.280, lng: 84.890 },
      { name: 'RESCUE-02', identifier: 'RESCUE-02', typeIndex: 1, capacity: 1, location: 'Fire Station Sector-6', lat: 22.240, lng: 84.930 },
      
      { name: 'COORD-01', identifier: 'COORD-01', typeIndex: 2, capacity: 1, location: 'Emergency Command Center', lat: 22.260, lng: 84.910 },
      { name: 'COORD-02', identifier: 'COORD-02', typeIndex: 2, capacity: 1, location: 'Municipal Command Center', lat: 22.255, lng: 84.915 },

      // Vehicles (2 Ambulances, 1 Fire Truck, 2 Rescue Vehicles)
            // Vehicles (2 Ambulances, 1 Fire Truck, 2 Search & Rescue vehicles)
      { name: 'AMB-001', identifier: 'AMB-001', typeIndex: 3, capacity: 4, location: 'Ispat General Hospital', lat: 22.270, lng: 84.900 },
      { name: 'AMB-002', identifier: 'AMB-002', typeIndex: 3, capacity: 4, location: 'Regional Medical Center', lat: 22.250, lng: 84.920 },
      
      { name: 'FIRE-001', identifier: 'FIRE-001', typeIndex: 4, capacity: 6, location: 'Central Fire Station', lat: 22.260, lng: 84.910 },
      
      { name: 'SAR-001', identifier: 'SAR-001', typeIndex: 5, capacity: 4, location: 'Steel Plant SAR', lat: 22.290, lng: 84.880 },
      { name: 'SAR-002', identifier: 'SAR-002', typeIndex: 5, capacity: 4, location: 'Railway SAR Station', lat: 22.230, lng: 84.930 },

      // Equipment (5 Medical Kits, 3 Rescue Equipment sets)
      { name: 'MEDKIT-001', identifier: 'MEDKIT-001', typeIndex: 6, capacity: 10, location: 'Medical Storage North', lat: 22.280, lng: 84.910 },
      { name: 'MEDKIT-002', identifier: 'MEDKIT-002', typeIndex: 6, capacity: 10, location: 'Medical Storage North', lat: 22.280, lng: 84.910 },
      { name: 'MEDKIT-003', identifier: 'MEDKIT-003', typeIndex: 6, capacity: 10, location: 'Medical Storage North', lat: 22.280, lng: 84.910 },
      { name: 'MEDKIT-004', identifier: 'MEDKIT-004', typeIndex: 6, capacity: 10, location: 'Medical Storage South', lat: 22.240, lng: 84.910 },
      { name: 'MEDKIT-005', identifier: 'MEDKIT-005', typeIndex: 6, capacity: 10, location: 'Medical Storage South', lat: 22.240, lng: 84.910 },
      
      { name: 'RESCUE-KIT-01', identifier: 'RESCUE-KIT-01', typeIndex: 7, capacity: 1, location: 'Equipment Storage East', lat: 22.260, lng: 84.920 },
      { name: 'RESCUE-KIT-02', identifier: 'RESCUE-KIT-02', typeIndex: 7, capacity: 1, location: 'Equipment Storage West', lat: 22.260, lng: 84.900 },
      { name: 'RESCUE-KIT-03', identifier: 'RESCUE-KIT-03', typeIndex: 7, capacity: 1, location: 'Equipment Storage Central', lat: 22.260, lng: 84.910 },

      // Supplies (10 Food Packages, 5 Water Purification Kits)
            // Supplies (10 Food Packages, 5 Water Purification Kits)
      { name: 'FOOD-001', identifier: 'FOOD-001', typeIndex: 8, capacity: 10, location: 'Supply Depot Civil Township', lat: 22.250, lng: 84.890 },
      { name: 'FOOD-002', identifier: 'FOOD-002', typeIndex: 8, capacity: 10, location: 'Supply Depot Civil Township', lat: 22.250, lng: 84.890 },
      { name: 'FOOD-003', identifier: 'FOOD-003', typeIndex: 8, capacity: 10, location: 'Supply Depot Civil Township', lat: 22.250, lng: 84.890 },
      { name: 'FOOD-004', identifier: 'FOOD-004', typeIndex: 8, capacity: 10, location: 'Supply Depot Civil Township', lat: 22.250, lng: 84.890 },
      { name: 'FOOD-005', identifier: 'FOOD-005', typeIndex: 8, capacity: 10, location: 'Supply Depot Fertilizer Township', lat: 22.275, lng: 84.920 },
      { name: 'FOOD-006', identifier: 'FOOD-006', typeIndex: 8, capacity: 10, location: 'Supply Depot Fertilizer Township', lat: 22.275, lng: 84.920 },
      { name: 'FOOD-007', identifier: 'FOOD-007', typeIndex: 8, capacity: 10, location: 'Supply Depot Fertilizer Township', lat: 22.275, lng: 84.920 },
      { name: 'FOOD-008', identifier: 'FOOD-008', typeIndex: 8, capacity: 10, location: 'Supply Depot Fertilizer Township', lat: 22.275, lng: 84.920 },
      { name: 'FOOD-009', identifier: 'FOOD-009', typeIndex: 8, capacity: 10, location: 'Supply Depot Steel Plant', lat: 22.260, lng: 84.880 },
      { name: 'FOOD-010', identifier: 'FOOD-010', typeIndex: 8, capacity: 10, location: 'Supply Depot Steel Plant', lat: 22.260, lng: 84.880 },
      
      { name: 'WATER-001', identifier: 'WATER-001', typeIndex: 9, capacity: 5, location: 'Water Treatment Plant A', lat: 22.285, lng: 84.905 },
      { name: 'WATER-002', identifier: 'WATER-002', typeIndex: 9, capacity: 5, location: 'Water Treatment Plant B', lat: 22.235, lng: 84.915 },
      { name: 'WATER-003', identifier: 'WATER-003', typeIndex: 9, capacity: 5, location: 'Water Treatment Plant C', lat: 22.265, lng: 84.935 },
      { name: 'WATER-004', identifier: 'WATER-004', typeIndex: 9, capacity: 5, location: 'Water Treatment Plant D', lat: 22.245, lng: 84.885 },
      { name: 'WATER-005', identifier: 'WATER-005', typeIndex: 9, capacity: 5, location: 'Water Treatment Plant E', lat: 22.270, lng: 84.895 },
      
      { name: 'WATER-001', identifier: 'WATER-001', typeIndex: 9, capacity: 100, location: 'Water Station Sector-2', lat: 22.2854, lng: 84.8486 },
      { name: 'WATER-002', identifier: 'WATER-002', typeIndex: 9, capacity: 100, location: 'Water Station Sector-5', lat: 22.2354, lng: 84.8586 },
      { name: 'WATER-003', identifier: 'WATER-003', typeIndex: 9, capacity: 100, location: 'Water Station Railway Colony', lat: 22.2454, lng: 84.8736 },
      { name: 'WATER-004', identifier: 'WATER-004', typeIndex: 9, capacity: 100, location: 'Water Station Steel Plant', lat: 22.2754, lng: 84.8186 },
      { name: 'WATER-005', identifier: 'WATER-005', typeIndex: 9, capacity: 100, location: 'Water Station Central', lat: 22.2604, lng: 84.8486 },

      // Facilities (3 Emergency Shelters, 2 Medical Stations)
            // Facilities (3 Emergency Shelters)
      { name: 'SHELTER-01', identifier: 'SHELTER-01', typeIndex: 10, capacity: 100, location: 'Community Center Sector-1', lat: 22.270, lng: 84.900 },
      { name: 'SHELTER-02', identifier: 'SHELTER-02', typeIndex: 10, capacity: 150, location: 'School Complex Sector-6', lat: 22.240, lng: 84.920 },
      { name: 'SHELTER-03', identifier: 'SHELTER-03', typeIndex: 10, capacity: 200, location: 'Sports Complex Bisra Road', lat: 22.280, lng: 84.930 },
      
      { name: 'MEDSTATION-01', identifier: 'MEDSTATION-01', typeIndex: 11, capacity: 20, location: 'Primary Health Center North', lat: 22.275, lng: 84.910 },
      { name: 'MEDSTATION-02', identifier: 'MEDSTATION-02', typeIndex: 11, capacity: 20, location: 'Primary Health Center South', lat: 22.245, lng: 84.910 }
    ];    const resources = resourcesData.map(resourceData => 
      prisma.resource.create({
        data: {
          name: resourceData.name,
          identifier: resourceData.identifier,
          typeId: resourceTypes[resourceData.typeIndex].id,
          status: 'AVAILABLE',
          capacity: resourceData.capacity,
          location: resourceData.location,
          latitude: resourceData.lat,
          longitude: resourceData.lng
        }
      })
    )

    // Create all resources
    const createdResources = await Promise.all(resources)

    console.log(`✅ Created ${createdResources.length} resources`)

    // Summary
    console.log('\n📊 Resource Inventory Summary:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('👥 Personnel: 7 (3 EMTs, 2 Rescue, 2 Coordinators)')
    console.log('🚗 Vehicles: 5 (2 Ambulances, 1 Fire Truck, 2 SAR)')
    console.log('🛠️  Equipment: 8 (5 Medical Kits, 3 Rescue Kits)')
    console.log('📦 Supplies: 15 (10 Food Packages, 5 Water Kits)')
    console.log('🏢 Facilities: 5 (3 Shelters, 2 Medical Stations)')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`📋 Total Resources: ${createdResources.length}`)

    console.log('\n🎉 Resource management system seeding completed successfully!')

  } catch (error) {
    console.error('❌ Error seeding resources:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedResources()
