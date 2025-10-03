import { NextRequest, NextResponse } from 'next/server';
import DataService from '@/lib/data-service';

/**
 * GET /api/dashboard
 * Get comprehensive dashboard data using the universal data service
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📊 [DASHBOARD] Fetching dashboard data...');

    // Fetch resources with their current assignments
    const resources = await prisma.resource.findMany({
      include: {
        type: true,
        assignedToConversation: {
          include: {
            emergencyMessage: {
              select: {
                id: true,
                category: true,
                priority: true,
                rawContent: true,
                address: true,
                createdAt: true
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
              include: {
                emergencyMessage: {
                  select: {
                    id: true,
                    category: true,
                    priority: true,
                    rawContent: true,
                    address: true
                  }
                }
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
    const resourceStats = {
      total: resources.length,
      available: resources.filter(r => r.status === 'AVAILABLE').length,
      assigned: resources.filter(r => r.status === 'ASSIGNED').length,
      inUse: resources.filter(r => r.status === 'IN_USE').length,
      maintenance: resources.filter(r => r.status === 'MAINTENANCE').length,
      outOfService: resources.filter(r => r.status === 'OUT_OF_SERVICE').length,
      byCategory: resources.reduce((acc: any, resource) => {
        const category = resource.type.category;
        if (!acc[category]) {
          acc[category] = { total: 0, available: 0, assigned: 0, inUse: 0 };
        }
        acc[category].total++;
        if (resource.status === 'AVAILABLE') acc[category].available++;
        if (resource.status === 'ASSIGNED') acc[category].assigned++;
        if (resource.status === 'IN_USE') acc[category].inUse++;
        return acc;
      }, {})
    };

    // Get active emergencies (conversations)
    const activeEmergencies = await prisma.conversation.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        emergencyMessage: {
          select: {
            id: true,
            category: true,
            priority: true,
            rawContent: true,
            address: true,
            latitude: true,
            longitude: true,
            createdAt: true,
            estimatedCount: true
          }
        },
        _count: {
          select: {
            messages: true,
            resourceAssignments: {
              where: {
                status: {
                  in: ['ASSIGNED', 'DEPLOYED', 'ACTIVE']
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    // Get recent emergency reports
    const recentReports = await prisma.emergencyMessage.findMany({
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        conversation: {
          select: {
            id: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    // Calculate emergency statistics
    const emergencyStats = {
      total: recentReports.length,
      unprocessed: recentReports.filter(r => r.status === 'UNPROCESSED').length,
      inProgress: recentReports.filter(r => r.status === 'IN_PROGRESS').length,
      completed: recentReports.filter(r => r.status === 'COMPLETED').length,
      critical: recentReports.filter(r => r.priority === 'CRITICAL' || r.priority === 'LIFE_THREATENING').length,
      byCategory: recentReports.reduce((acc: any, report) => {
        if (report.category) {
          acc[report.category] = (acc[report.category] || 0) + 1;
        }
        return acc;
      }, {}),
      byPriority: recentReports.reduce((acc: any, report) => {
        if (report.priority) {
          acc[report.priority] = (acc[report.priority] || 0) + 1;
        }
        return acc;
      }, {})
    };

    // Get active resource assignments with details
    const activeAssignments = await prisma.resourceAssignment.findMany({
      where: {
        status: {
          in: ['ASSIGNED', 'DEPLOYED', 'ACTIVE']
        }
      },
      include: {
        resource: {
          include: {
            type: true
          }
        },
        conversation: {
          include: {
            emergencyMessage: {
              select: {
                id: true,
                category: true,
                priority: true,
                rawContent: true,
                address: true,
                latitude: true,
                longitude: true
              }
            }
          }
        },
        assignedByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        assignedAt: 'desc'
      },
      take: 15
    });

    // Get system performance metrics
    const performanceMetrics = {
      averageResponseTime: '2.5 min', // TODO: Calculate from actual data
      activeResponders: await prisma.user.count({
        where: {
          role: 'RESPONDER'
        }
      }),
      totalDispatchers: await prisma.user.count({
        where: {
          role: 'DISPATCHER'
        }
      }),
      systemLoad: Math.random() * 0.3 + 0.1, // Mock system load (10-40%)
      uptime: '99.8%' // Mock uptime
    };

    const dashboardData = {
      resources: {
        items: resources,
        stats: resourceStats
      },
      emergencies: {
        active: activeEmergencies,
        recent: recentReports.slice(0, 10),
        stats: emergencyStats
      },
      assignments: {
        active: activeAssignments,
        total: activeAssignments.length
      },
      performance: performanceMetrics,
      summary: {
        totalResources: resourceStats.total,
        availableResources: resourceStats.available,
        activeEmergencies: activeEmergencies.length,
        criticalEmergencies: emergencyStats.critical,
        resourceUtilization: Math.round(((resourceStats.assigned + resourceStats.inUse) / resourceStats.total) * 100),
        systemStatus: 'operational'
      }
    };

    console.log(`✅ [DASHBOARD] Dashboard data compiled successfully`);
    console.log(`📊 [DASHBOARD] Summary: ${dashboardData.summary.totalResources} resources, ${dashboardData.summary.activeEmergencies} active emergencies`);

    return NextResponse.json({
      success: true,
      data: dashboardData,
      message: 'Dashboard data retrieved successfully'
    });

  } catch (error) {
    console.error('❌ [DASHBOARD] Error fetching dashboard data:', error);
    
    // Return mock data if database fails
    const mockData = {
      resources: {
        items: [],
        stats: {
          total: 0,
          available: 0,
          assigned: 0,
          inUse: 0,
          maintenance: 0,
          outOfService: 0,
          byCategory: {}
        }
      },
      emergencies: {
        active: [],
        recent: [],
        stats: {
          total: 0,
          unprocessed: 0,
          inProgress: 0,
          completed: 0,
          critical: 0,
          byCategory: {},
          byPriority: {}
        }
      },
      assignments: {
        active: [],
        total: 0
      },
      performance: {
        averageResponseTime: 'N/A',
        activeResponders: 0,
        totalDispatchers: 0,
        systemLoad: 0.1,
        uptime: 'N/A'
      },
      summary: {
        totalResources: 0,
        availableResources: 0,
        activeEmergencies: 0,
        criticalEmergencies: 0,
        resourceUtilization: 0,
        systemStatus: 'maintenance'
      }
    };

    return NextResponse.json({
      success: false,
      data: mockData,
      error: 'Database connection error',
      message: 'Dashboard is running in fallback mode. Some features may be unavailable.'
    }, { status: 503 });
  }
}
