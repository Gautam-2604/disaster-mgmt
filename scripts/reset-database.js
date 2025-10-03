/**
 * Database Reset and Resource Setup Script
 * This script clears all emergencies and sets up a consistent resource system
 */

const { PrismaClient } = require('../app/generated/prisma')

const prisma = new PrismaClient()

// Comprehensive resource configuration
const RESOURCE_SETUP = {
  resourceTypes: [
    // Personnel Resources
    { name: 'Emergency Medical Technician', category: 'PERSONNEL', description: 'Certified EMT for medical emergencies' },
    { name: 'Paramedic', category: 'PERSONNEL', description: 'Advanced life support paramedic' },
    { name: 'Fire Fighter', category: 'PERSONNEL', description: 'Certified firefighter for fire suppression and rescue' },
    { name: 'Police Officer', category: 'PERSONNEL', description: 'Law enforcement officer for emergency response' },
    { name: 'Rescue Specialist', category: 'PERSONNEL', description: 'Specialized rescue operations expert' },
    { name: 'Disaster Coordinator', category: 'PERSONNEL', description: 'Emergency response coordinator' },
    { name: 'Search & Rescue Technician', category: 'PERSONNEL', description: 'Specialized search and rescue operations' },

    // Vehicle Resources
    { name: 'Emergency Ambulance', category: 'VEHICLE', description: 'Advanced life support ambulance' },
    { name: 'Basic Life Support Ambulance', category: 'VEHICLE', description: 'Basic medical transport vehicle' },
    { name: 'Fire Engine', category: 'VEHICLE', description: 'Primary fire suppression vehicle' },
    { name: 'Ladder Truck', category: 'VEHICLE', description: 'Aerial ladder and rescue vehicle' },
    { name: 'Police Patrol Car', category: 'VEHICLE', description: 'Standard police response vehicle' },
    { name: 'Search & Rescue Vehicle', category: 'VEHICLE', description: 'All-terrain search and rescue vehicle' },
    { name: 'Mobile Command Unit', category: 'VEHICLE', description: 'Mobile incident command center' },
    { name: 'Utility Truck', category: 'VEHICLE', description: 'General utility and support vehicle' },

    // Equipment Resources
    { name: 'Defibrillator', category: 'EQUIPMENT', description: 'Automated external defibrillator' },
    { name: 'Hydraulic Rescue Tools', category: 'EQUIPMENT', description: 'Jaws of life and cutting tools' },
    { name: 'Portable Oxygen Unit', category: 'EQUIPMENT', description: 'Portable oxygen delivery system' },
    { name: 'Communication Radio', category: 'EQUIPMENT', description: 'Emergency communication equipment' },
    { name: 'Thermal Imaging Camera', category: 'EQUIPMENT', description: 'Heat detection and search equipment' },
    { name: 'Emergency Generator', category: 'EQUIPMENT', description: 'Portable power generation unit' },

    // Facility Resources
    { name: 'Emergency Shelter', category: 'FACILITY', description: 'Temporary housing facility' },
    { name: 'Medical Triage Center', category: 'FACILITY', description: 'Field medical assessment facility' },
    { name: 'Command Center', category: 'FACILITY', description: 'Emergency operations center' },

    // Supply Resources
    { name: 'Medical Supply Kit', category: 'SUPPLY', description: 'Emergency medical supplies' },
    { name: 'Emergency Food Package', category: 'SUPPLY', description: 'Non-perishable emergency food' },
    { name: 'Water Supply Unit', category: 'SUPPLY', description: 'Potable water distribution' },
    { name: 'Emergency Blankets', category: 'SUPPLY', description: 'Thermal emergency blankets' }
  ],

  resources: [
    // Personnel (15 total)
    { name: 'EMT John Smith', typeIndex: 0, identifier: 'EMT-001', capacity: 1, location: 'Station 1' },
    { name: 'EMT Maria Garcia', typeIndex: 0, identifier: 'EMT-002', capacity: 1, location: 'Station 2' },
    { name: 'EMT David Wilson', typeIndex: 0, identifier: 'EMT-003', capacity: 1, location: 'Station 3' },
    { name: 'Paramedic Sarah Johnson', typeIndex: 1, identifier: 'PM-001', capacity: 1, location: 'Station 1' },
    { name: 'Paramedic Mike Brown', typeIndex: 1, identifier: 'PM-002', capacity: 1, location: 'Station 2' },
    { name: 'Firefighter Alex Thompson', typeIndex: 2, identifier: 'FF-001', capacity: 1, location: 'Fire Station 1' },
    { name: 'Firefighter Lisa Chen', typeIndex: 2, identifier: 'FF-002', capacity: 1, location: 'Fire Station 1' },
    { name: 'Firefighter Robert Davis', typeIndex: 2, identifier: 'FF-003', capacity: 1, location: 'Fire Station 2' },
    { name: 'Officer Jennifer White', typeIndex: 3, identifier: 'PO-001', capacity: 1, location: 'Police Station A' },
    { name: 'Officer Michael Rodriguez', typeIndex: 3, identifier: 'PO-002', capacity: 1, location: 'Police Station B' },
    { name: 'Rescue Specialist Tom Anderson', typeIndex: 4, identifier: 'RS-001', capacity: 1, location: 'Rescue Base' },
    { name: 'Rescue Specialist Emma Taylor', typeIndex: 4, identifier: 'RS-002', capacity: 1, location: 'Rescue Base' },
    { name: 'Coordinator Jane Miller', typeIndex: 5, identifier: 'DC-001', capacity: 1, location: 'EOC Center' },
    { name: 'SAR Tech Chris Wilson', typeIndex: 6, identifier: 'SAR-001', capacity: 1, location: 'SAR Base' },
    { name: 'SAR Tech Amanda Clark', typeIndex: 6, identifier: 'SAR-002', capacity: 1, location: 'SAR Base' },

    // Vehicles (12 total)
    { name: 'Ambulance A-01', typeIndex: 7, identifier: 'AMB-001', capacity: 2, location: 'Station 1' },
    { name: 'Ambulance A-02', typeIndex: 7, identifier: 'AMB-002', capacity: 2, location: 'Station 2' },
    { name: 'Ambulance A-03', typeIndex: 7, identifier: 'AMB-003', capacity: 2, location: 'Station 3' },
    { name: 'BLS Unit B-01', typeIndex: 8, identifier: 'BLS-001', capacity: 4, location: 'Station 1' },
    { name: 'BLS Unit B-02', typeIndex: 8, identifier: 'BLS-002', capacity: 4, location: 'Station 2' },
    { name: 'Fire Engine E-11', typeIndex: 9, identifier: 'ENG-011', capacity: 6, location: 'Fire Station 1' },
    { name: 'Fire Engine E-12', typeIndex: 9, identifier: 'ENG-012', capacity: 6, location: 'Fire Station 2' },
    { name: 'Ladder Truck L-01', typeIndex: 10, identifier: 'LAD-001', capacity: 4, location: 'Fire Station 1' },
    { name: 'Patrol Unit P-101', typeIndex: 11, identifier: 'PAT-101', capacity: 2, location: 'Police Station A' },
    { name: 'Patrol Unit P-102', typeIndex: 11, identifier: 'PAT-102', capacity: 2, location: 'Police Station B' },
    { name: 'SAR Vehicle S-01', typeIndex: 12, identifier: 'SAR-V01', capacity: 8, location: 'SAR Base' },
    { name: 'Command Unit C-01', typeIndex: 13, identifier: 'CMD-001', capacity: 6, location: 'EOC Center' },

    // Equipment (8 total)  
    { name: 'AED Unit 1', typeIndex: 15, identifier: 'AED-001', capacity: 1, location: 'Station 1' },
    { name: 'AED Unit 2', typeIndex: 15, identifier: 'AED-002', capacity: 1, location: 'Station 2' },
    { name: 'Jaws of Life Set A', typeIndex: 16, identifier: 'JOL-A01', capacity: 1, location: 'Fire Station 1' },
    { name: 'Jaws of Life Set B', typeIndex: 16, identifier: 'JOL-B01', capacity: 1, location: 'Fire Station 2' },
    { name: 'Portable O2 Unit 1', typeIndex: 17, identifier: 'O2-001', capacity: 1, location: 'Station 1' },
    { name: 'Radio Set Alpha', typeIndex: 18, identifier: 'RAD-A01', capacity: 1, location: 'EOC Center' },
    { name: 'Thermal Camera TC-1', typeIndex: 19, identifier: 'TC-001', capacity: 1, location: 'Fire Station 1' },
    { name: 'Generator Unit G-1', typeIndex: 20, identifier: 'GEN-001', capacity: 1, location: 'Utility Base' },

    // Facilities (3 total)
    { name: 'Emergency Shelter North', typeIndex: 21, identifier: 'SHE-N01', capacity: 200, location: 'North District' },
    { name: 'Triage Center Main', typeIndex: 22, identifier: 'TRI-M01', capacity: 50, location: 'Central Hospital' },
    { name: 'EOC Command Center', typeIndex: 23, identifier: 'EOC-001', capacity: 25, location: 'City Hall' },

    // Supplies (2 total)
    { name: 'Medical Kit Alpha', typeIndex: 24, identifier: 'MED-A01', capacity: 100, location: 'Supply Depot' },
    { name: 'Food Package Bravo', typeIndex: 25, identifier: 'FOD-B01', capacity: 500, location: 'Supply Depot' }
  ]
}

async function resetDatabase() {
  console.log('🧹 Starting comprehensive database reset...')

  try {
    // Step 1: Clear all emergency-related data
    console.log('📝 Clearing all emergency data...')
    
    await prisma.$transaction(async (tx) => {
      // Release all assigned resources first
      await tx.resource.updateMany({
        where: {
          status: { in: ['ASSIGNED', 'IN_USE'] }
        },
        data: {
          status: 'AVAILABLE',
          assignedToConversationId: null,
          assignedAt: null
        }
      })

      // Clear assignments
      await tx.resourceAssignment.deleteMany({})
      
      // Clear chat messages
      await tx.chatMessage.deleteMany({})
      
      // Clear conversation participants
      await tx.conversationParticipant.deleteMany({})
      
      // Clear conversations
      await tx.conversation.deleteMany({})
      
      // Clear emergency messages
      await tx.emergencyMessage.deleteMany({})
      
      // Clear voice calls
      await tx.voiceCall.deleteMany({})
    })

    console.log('✅ Emergency data cleared successfully')

    // Step 2: Reset resource system
    console.log('🔧 Setting up resource system...')
    
    // Clear existing resources but keep structure intact
    await prisma.resource.deleteMany({})
    await prisma.resourceType.deleteMany({})

    // Create resource types
    console.log('📋 Creating resource types...')
    const createdResourceTypes = []
    
    for (const resourceType of RESOURCE_SETUP.resourceTypes) {
      const created = await prisma.resourceType.create({
        data: resourceType
      })
      createdResourceTypes.push(created)
      console.log(`  ✓ Created ${resourceType.category}: ${resourceType.name}`)
    }

    // Create resources
    console.log('🚑 Creating resources...')
    let createdCount = 0

    for (const resourceData of RESOURCE_SETUP.resources) {
      const resourceType = createdResourceTypes[resourceData.typeIndex]
      
      await prisma.resource.create({
        data: {
          name: resourceData.name,
          identifier: resourceData.identifier,
          typeId: resourceType.id,
          status: 'AVAILABLE',
          capacity: resourceData.capacity,
          location: resourceData.location
        }
      })
      
      createdCount++
      console.log(`  ✓ Created: ${resourceData.name} (${resourceType.category})`)
    }

    // Step 3: Verify setup
    console.log('📊 Verifying resource setup...')
    
    const stats = await prisma.resource.groupBy({
      by: ['status'],
      _count: true
    })

    const categoryStats = await prisma.resource.findMany({
      include: {
        type: true
      }
    })

    const categoryCounts = categoryStats.reduce((acc, resource) => {
      const category = resource.type.category
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {})

    console.log('\n📈 Resource Statistics:')
    console.log(`  Total Resources: ${createdCount}`)
    console.log('  By Status:')
    stats.forEach(stat => {
      console.log(`    ${stat.status}: ${stat._count}`)
    })
    console.log('  By Category:')
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`    ${category}: ${count}`)
    })

    console.log('\n🎉 Database reset and resource setup completed successfully!')
    console.log('📍 All resources are now AVAILABLE and ready for assignment')
    console.log('🔄 Resource status will be automatically managed when assigned to emergencies')

  } catch (error) {
    console.error('❌ Error during database reset:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the reset
resetDatabase()
  .then(() => {
    console.log('✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
