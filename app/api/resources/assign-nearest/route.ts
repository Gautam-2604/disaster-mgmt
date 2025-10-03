import { NextRequest, NextResponse } from 'next/server';
import DataService from '@/lib/data-service';
import { ResourceCategory } from '@/types';

/**
 * POST /api/resources/assign-nearest
 * Assign nearest available resources to an emergency based on location and requirements
 */
export async function POST(request: NextRequest) {
  try {
    const { 
      latitude, 
      longitude, 
      conversationId, 
      requirements = [],
      assignedBy = 'system'
    } = await request.json();

    if (!latitude || !longitude || !conversationId) {
      return NextResponse.json(
        { success: false, error: 'Latitude, longitude, and conversation ID are required' },
        { status: 400 }
      );
    }

    console.log(`🎯 [ASSIGN-NEAREST] Request for nearest resources to emergency at (${latitude}, ${longitude})`);

    const dataService = DataService.getInstance();
    const result = await dataService.assignNearestResources(
      parseFloat(latitude),
      parseFloat(longitude),
      conversationId,
      requirements,
      assignedBy
    );

    if (result.success) {
      console.log(`✅ [ASSIGN-NEAREST] Successfully assigned ${result.assignedResources.length} resources`);
      return NextResponse.json({ 
        success: true, 
        message: `Assigned ${result.assignedResources.length} nearest resources`,
        data: {
          assignedResources: result.assignedResources,
          unavailableRequirements: result.unavailableRequirements,
          totalDistance: result.totalDistance,
          summary: {
            assigned: result.assignedResources.length,
            failed: result.unavailableRequirements.length,
            averageDistance: result.assignedResources.length > 0 ? 
              (result.totalDistance / result.assignedResources.length).toFixed(2) : 0
          }
        }
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to assign any resources',
          data: {
            assignedResources: result.assignedResources,
            unavailableRequirements: result.unavailableRequirements,
            totalDistance: result.totalDistance
          }
        },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('❌ [ASSIGN-NEAREST] Error assigning nearest resources:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to assign nearest resources',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
