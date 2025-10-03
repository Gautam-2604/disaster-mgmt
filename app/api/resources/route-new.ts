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

    const dataService = DataService.getInstance();
    let resources = await dataService.getAllResources();

    // Apply filters
    if (category) {
      resources = resources.filter(r => r.category === category);
    }
    
    if (status) {
      resources = resources.filter(r => r.status === status);
    }
    
    if (available) {
      resources = resources.filter(r => r.status === 'AVAILABLE');
    }

    console.log(`✅ [RESOURCES] Found ${resources.length} resources`);
    return NextResponse.json({ 
      success: true, 
      data: resources 
    });

  } catch (error) {
    console.error('❌ [RESOURCES] Error fetching resources:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch resources',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
