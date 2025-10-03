import { NextRequest, NextResponse } from 'next/server';
import DataService from '@/lib/data-service';

/**
 * GET /api/resources
 * Get all resources with their current status and assignments
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const available = searchParams.get('available') === 'true';

    console.log('🔍 [RESOURCES] Fetching resources...', { category, status, available });

    const whereClause: any = {};
    
    if (category) {
      whereClause.type = { category };
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    if (available) {
      whereClause.status = 'AVAILABLE';
    }

    const resources = await prisma.resource.findMany({
      where: whereClause,
      include: {
        type: true,
        assignedToConversation: {
          include: {
            emergencyMessage: {
              select: {
                category: true,
                priority: true,
                rawContent: true
              }
            }
          }
        },
        assignments: {
          where: {
            status: {
              in: ['ASSIGNED', 'DEPLOYED', 'ACTIVE']
            }
          },
          include: {
            conversation: {
              select: {
                id: true,
                title: true,
                status: true
              }
            }
          },
          orderBy: {
            assignedAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: [
        { status: 'asc' },
        { type: { category: 'asc' } },
        { name: 'asc' }
      ]
    });

    // Calculate resource statistics
    const stats = {
      total: resources.length,
      available: resources.filter(r => r.status === 'AVAILABLE').length,
      assigned: resources.filter(r => r.status === 'ASSIGNED').length,
      inUse: resources.filter(r => r.status === 'IN_USE').length,
      maintenance: resources.filter(r => r.status === 'MAINTENANCE').length,
      byCategory: resources.reduce((acc: any, resource) => {
        const category = resource.type.category;
        if (!acc[category]) {
          acc[category] = { total: 0, available: 0, assigned: 0 };
        }
        acc[category].total++;
        if (resource.status === 'AVAILABLE') acc[category].available++;
        if (resource.status === 'ASSIGNED' || resource.status === 'IN_USE') acc[category].assigned++;
        return acc;
      }, {})
    };

    console.log(`✅ [RESOURCES] Found ${resources.length} resources`);

    return NextResponse.json({
      success: true,
      data: {
        resources,
        stats
      }
    });

  } catch (error) {
    console.error('❌ [RESOURCES] Error fetching resources:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch resources',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/resources
 * Create a new resource
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, identifier, typeId, location, capacity } = body;

    console.log('🚀 [RESOURCES] Creating new resource:', { name, identifier, typeId });

    if (!name || !identifier || !typeId) {
      return NextResponse.json(
        { success: false, error: 'Name, identifier, and typeId are required' },
        { status: 400 }
      );
    }

    // Check if identifier already exists
    const existingResource = await prisma.resource.findUnique({
      where: { identifier }
    });

    if (existingResource) {
      return NextResponse.json(
        { success: false, error: 'Resource with this identifier already exists' },
        { status: 400 }
      );
    }

    const newResource = await prisma.resource.create({
      data: {
        name,
        identifier,
        typeId,
        location,
        capacity,
        status: 'AVAILABLE'
      },
      include: {
        type: true
      }
    });

    console.log(`✅ [RESOURCES] Created resource: ${newResource.id}`);

    return NextResponse.json({
      success: true,
      data: newResource
    });

  } catch (error) {
    console.error('❌ [RESOURCES] Error creating resource:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create resource',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
