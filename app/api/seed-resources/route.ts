import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/app/generated/prisma";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    console.log('🌱 [SEED] Starting resource seeding...');

    // First, create resource types
    const resourceTypes = await Promise.all([
      // Personnel types
      prisma.resourceType.upsert({
        where: { name: 'Paramedic' },
        update: {},
        create: {
          name: 'Paramedic',
          category: 'PERSONNEL',
          description: 'Emergency medical personnel'
        }
      }),
      prisma.resourceType.upsert({
        where: { name: 'Firefighter' },
        update: {},
        create: {
          name: 'Firefighter',
          category: 'PERSONNEL',
          description: 'Fire and rescue personnel'
        }
      }),
      prisma.resourceType.upsert({
        where: { name: 'Police Officer' },
        update: {},
        create: {
          name: 'Police Officer',
          category: 'PERSONNEL',
          description: 'Law enforcement personnel'
        }
      }),

      // Vehicle types
      prisma.resourceType.upsert({
        where: { name: 'Ambulance' },
        update: {},
        create: {
          name: 'Ambulance',
          category: 'VEHICLE',
          description: 'Emergency medical vehicle'
        }
      }),
      prisma.resourceType.upsert({
        where: { name: 'Fire Truck' },
        update: {},
        create: {
          name: 'Fire Truck',
          category: 'VEHICLE',
          description: 'Fire suppression vehicle'
        }
      }),
      prisma.resourceType.upsert({
        where: { name: 'Police Car' },
        update: {},
        create: {
          name: 'Police Car',
          category: 'VEHICLE',
          description: 'Police patrol vehicle'
        }
      }),

      // Equipment types
      prisma.resourceType.upsert({
        where: { name: 'Medical Kit' },
        update: {},
        create: {
          name: 'Medical Kit',
          category: 'EQUIPMENT',
          description: 'Emergency medical supplies'
        }
      }),
      prisma.resourceType.upsert({
        where: { name: 'Rescue Equipment' },
        update: {},
        create: {
          name: 'Rescue Equipment',
          category: 'EQUIPMENT',
          description: 'Search and rescue tools'
        }
      }),

      // Supply types
      prisma.resourceType.upsert({
        where: { name: 'Food Supplies' },
        update: {},
        create: {
          name: 'Food Supplies',
          category: 'SUPPLY',
          description: 'Emergency food rations'
        }
      }),
      prisma.resourceType.upsert({
        where: { name: 'Water Supplies' },
        update: {},
        create: {
          name: 'Water Supplies',
          category: 'SUPPLY',
          description: 'Emergency water supplies'
        }
      })
    ]);

    console.log(`✅ [SEED] Created ${resourceTypes.length} resource types`);

    // Now create actual resources
    const resources = [];
    
    // Get resource type IDs safely
    const paramedicType = resourceTypes.find((t: { name: string; }) => t.name === 'Paramedic');
    const firefighterType = resourceTypes.find((t: { name: string; }) => t.name === 'Firefighter');
    const ambulanceType = resourceTypes.find((t: { name: string; }) => t.name === 'Ambulance');
    const fireTruckType = resourceTypes.find((t: { name: string; }) => t.name === 'Fire Truck');
    const medicalKitType = resourceTypes.find((t: { name: string; }) => t.name === 'Medical Kit');
    const foodSupplyType = resourceTypes.find((t: { name: string; }) => t.name === 'Food Supplies');

    if (!paramedicType || !firefighterType || !ambulanceType || !fireTruckType || !medicalKitType || !foodSupplyType) {
      throw new Error('Failed to create required resource types');
    }
    
    // Create personnel resources
    for (let i = 1; i <= 10; i++) {
      resources.push(
        prisma.resource.upsert({
          where: { identifier: `paramedic-${i}` },
          update: {},
          create: {
            identifier: `paramedic-${i}`,
            name: `Paramedic Team ${i}`,
            typeId: paramedicType.id,
            status: 'AVAILABLE',
            capacity: 2,
            location: `Station ${Math.ceil(i / 2)}`
          }
        })
      );
    }

    for (let i = 1; i <= 8; i++) {
      resources.push(
        prisma.resource.upsert({
          where: { identifier: `firefighter-${i}` },
          update: {},
          create: {
            identifier: `firefighter-${i}`,
            name: `Fire Team ${i}`,
            typeId: firefighterType.id,
            status: 'AVAILABLE',
            capacity: 4,
            location: `Fire Station ${Math.ceil(i / 2)}`
          }
        })
      );
    }

    // Create vehicle resources
    for (let i = 1; i <= 6; i++) {
      resources.push(
        prisma.resource.upsert({
          where: { identifier: `ambulance-${i}` },
          update: {},
          create: {
            identifier: `ambulance-${i}`,
            name: `Ambulance ${i}`,
            typeId: ambulanceType.id,
            status: 'AVAILABLE',
            capacity: 2,
            location: `Medical Station ${Math.ceil(i / 2)}`
          }
        })
      );
    }

    for (let i = 1; i <= 4; i++) {
      resources.push(
        prisma.resource.upsert({
          where: { identifier: `fire-truck-${i}` },
          update: {},
          create: {
            identifier: `fire-truck-${i}`,
            name: `Fire Truck ${i}`,
            typeId: fireTruckType.id,
            status: 'AVAILABLE',
            capacity: 6,
            location: `Fire Station ${Math.ceil(i / 2)}`
          }
        })
      );
    }

    // Create equipment and supply resources
    for (let i = 1; i <= 15; i++) {
      resources.push(
        prisma.resource.upsert({
          where: { identifier: `medical-kit-${i}` },
          update: {},
          create: {
            identifier: `medical-kit-${i}`,
            name: `Medical Kit ${i}`,
            typeId: medicalKitType.id,
            status: 'AVAILABLE',
            capacity: 1,
            location: `Supply Depot ${Math.ceil(i / 5)}`
          }
        })
      );
    }

    for (let i = 1; i <= 20; i++) {
      resources.push(
        prisma.resource.upsert({
          where: { identifier: `food-supply-${i}` },
          update: {},
          create: {
            identifier: `food-supply-${i}`,
            name: `Food Supply Package ${i}`,
            typeId: foodSupplyType.id,
            status: 'AVAILABLE',
            capacity: 50, // Can feed 50 people
            location: `Distribution Center ${Math.ceil(i / 4)}`
          }
        })
      );
    }

    // Execute all resource creations
    const createdResources = await Promise.all(resources);

    console.log(`✅ [SEED] Created ${createdResources.length} resources`);
    console.log('🎉 [SEED] Resource seeding completed successfully!');

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${resourceTypes.length} resource types and ${createdResources.length} resources`,
      data: {
        resourceTypes: resourceTypes.length,
        resources: createdResources.length
      }
    });

  } catch (error) {
    console.error('❌ [SEED] Error seeding resources:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to seed resources",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
