import { NextRequest, NextResponse } from 'next/server';
import DataService from '@/lib/data-service';

/**
 * GET /api/dashboard
 * Get comprehensive dashboard data using the universal data service
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📊 [DASHBOARD] Fetching dashboard data using DataService...');

    const dataService = DataService.getInstance();

    // Get all data using the centralized service
    const [resources, emergencies, stats] = await Promise.all([
      dataService.getAllResources(),
      dataService.getActiveEmergencies(),
      dataService.getDashboardStats()
    ]);

    const dashboardData = {
      resources: {
        list: resources,
        stats: stats.resources
      },
      emergencies: {
        active: emergencies,
        stats: stats.emergencies
      },
      performance: stats.performance,
      lastUpdated: new Date().toISOString()
    };

    console.log(`✅ [DASHBOARD] Data fetched - ${resources.length} resources, ${emergencies.length} active emergencies`);
    return NextResponse.json({ 
      success: true, 
      data: dashboardData 
    });

  } catch (error) {
    console.error('❌ [DASHBOARD] Error fetching dashboard data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch dashboard data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/dashboard
 * Clear all emergencies and reset resources to available status
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log('🧹 [DASHBOARD] Clearing all emergencies...');

    const dataService = DataService.getInstance();
    const success = await dataService.clearAllEmergencies();

    if (success) {
      console.log('✅ [DASHBOARD] All emergencies cleared successfully');
      return NextResponse.json({ 
        success: true, 
        message: 'All emergencies cleared and resources released' 
      });
    } else {
      throw new Error('Failed to clear emergencies');
    }

  } catch (error) {
    console.error('❌ [DASHBOARD] Error clearing emergencies:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to clear emergencies',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
