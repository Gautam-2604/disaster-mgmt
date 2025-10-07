import { PrismaClient } from '@/app/generated/prisma';
import { 
  SimpleResource,
  ResourceStatus, 
  ResourceCategory,
  AssignmentStatus,
  EmergencyData,
  DashboardStats,
  MessageCategory,
  Priority
} from '@/types';

class DataService {
  private static instance: DataService;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient();
  }

  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  async getAllResources(): Promise<SimpleResource[]> {
    try {
      const resources = await this.prisma.resource.findMany({
        include: {
          type: true,
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
                      address: true,
                      latitude: true,
                      longitude: true
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

      return resources.map(resource => ({
        id: resource.id,
        name: resource.name,
        category: resource.type.category as ResourceCategory,
        type: resource.type.name,
        status: resource.status as ResourceStatus,
        location: resource.location || 'Base Station',
        latitude: resource.latitude || undefined,
        longitude: resource.longitude || undefined,
        capabilities: [],
        currentAssignment: resource.assignments[0] ? {
          conversationId: resource.assignments[0].conversationId,
          assignedAt: resource.assignments[0].assignedAt,
          status: resource.assignments[0].status as AssignmentStatus,
          emergency: resource.assignments[0].conversation.emergencyMessage[0] ? {
            id: resource.assignments[0].conversation.emergencyMessage[0].id,
            category: resource.assignments[0].conversation.emergencyMessage[0].category || 'INFORMATION',
            priority: resource.assignments[0].conversation.emergencyMessage[0].priority || 'LOW',
            description: resource.assignments[0].conversation.emergencyMessage[0].rawContent,
            location: resource.assignments[0].conversation.emergencyMessage[0].address || 'Unknown',
            coordinates: {
              lat: resource.assignments[0].conversation.emergencyMessage[0].latitude || 0,
              lng: resource.assignments[0].conversation.emergencyMessage[0].longitude || 0
            }
          } : undefined
        } : undefined
      }));
    } catch (error) {
      console.error('❌ Error fetching resources:', error);
      return this.getMockResources();
    }
  }

  async assignResource(resourceId: string, conversationId: string, assignedBy: string): Promise<boolean> {
    try {
      console.log(`🔄 [ASSIGN] Starting assignment of resource ${resourceId} to conversation ${conversationId}`);

      await this.prisma.resource.update({
        where: { id: resourceId },
        data: { 
          status: 'ASSIGNED',
          assignedToConversationId: conversationId,
          assignedAt: new Date()
        }
      });
      console.log(`✅ [ASSIGN] Resource ${resourceId} status updated to ASSIGNED`);

      try {
        await this.prisma.conversation.update({
          where: { id: conversationId },
          data: {
            assignedResources: {
              connect: { id: resourceId }
            }
          }
        });
        console.log(`✅ [ASSIGN] Conversation ${conversationId} linked to resource ${resourceId}`);
      } catch (conversationError) {
        console.warn(`⚠️ [ASSIGN] Could not link conversation ${conversationId} to resource ${resourceId}, but resource is still assigned`);

      }

      if (assignedBy && assignedBy !== 'system' && assignedBy !== 'system-test') {
        try {
          await this.prisma.resourceAssignment.create({
            data: {
              resourceId,
              conversationId,
              assignedBy,
              status: 'ASSIGNED',
              assignedAt: new Date(),
            }
          });
          console.log(`✅ [ASSIGN] Assignment record created for user ${assignedBy}`);
        } catch (assignmentError) {
          console.warn(`⚠️ [ASSIGN] Could not create assignment record for user ${assignedBy}, but resource is still assigned`);
          // Don't fail the entire assignment if record creation fails
        }
      } else {
        console.log(`📋 [ASSIGN] System assignment - skipping assignment record creation for resource ${resourceId}`);
      }

      console.log(`🎯 [ASSIGN] Successfully assigned resource ${resourceId} to conversation ${conversationId}`);
      return true;

    } catch (error) {
      console.error('❌ [ASSIGN] Critical error assigning resource:', error);
      if (error instanceof Error) {
        console.error('❌ [ASSIGN] Error details:', error.message);
      }
      
      return false;
    }
  }

  async releaseResource(resourceId: string): Promise<boolean> {
    try {
      await this.prisma.$transaction(async (tx) => {
        const resource = await tx.resource.findUnique({
          where: { id: resourceId },
          include: { type: true }
        });

        if (!resource) {
          throw new Error(`Resource ${resourceId} not found`);
        }

        const activeAssignments = await tx.resourceAssignment.findMany({
          where: {
            resourceId,
            status: { in: ['ASSIGNED', 'DEPLOYED', 'ACTIVE'] }
          }
        });

        await tx.resource.update({
          where: { id: resourceId },
          data: { 
            status: 'AVAILABLE',
            assignedToConversationId: null,
            assignedAt: null
          }
        });

        // Update assignment status to completed
        await tx.resourceAssignment.updateMany({
          where: {
            resourceId,
            status: { in: ['ASSIGNED', 'DEPLOYED', 'ACTIVE'] }
          },
          data: {
            status: 'COMPLETED',
            completedAt: new Date()
          }
        });

        for (const assignment of activeAssignments) {
          await tx.conversation.update({
            where: { id: assignment.conversationId },
            data: {
              assignedResources: {
                disconnect: { id: resourceId }
              }
            }
          });
        }

        console.log(`✅ Resource ${resource.name} (${resource.type.name}) released and now available`);
      });

      return true;
    } catch (error) {
      console.error('❌ Error releasing resource:', error);
      return false;
    }
  }

  async updateResourceStatus(resourceId: string, status: ResourceStatus): Promise<boolean> {
    try {
      await this.prisma.resource.update({
        where: { id: resourceId },
        data: { status }
      });

      console.log(`✅ Resource ${resourceId} status updated to ${status}`);
      return true;
    } catch (error) {
      console.error('❌ Error updating resource status:', error);
      return false;
    }
  }

  async getActiveEmergencies(): Promise<EmergencyData[]> {
    try {
      const conversations = await this.prisma.conversation.findMany({
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
              createdAt: true
            }
          },
          assignedResources: {
            include: {
              type: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return conversations.map(conv => ({
        id: conv.id,
        title: conv.title,
        category: (conv.emergencyMessage[0]?.category as MessageCategory) || MessageCategory.INFORMATION,
        priority: (conv.emergencyMessage[0]?.priority as Priority) || Priority.LOW,
        description: conv.emergencyMessage[0]?.rawContent || 'No description',
        location: conv.emergencyMessage[0]?.address || 'Unknown location',
        coordinates: {
          lat: conv.emergencyMessage[0]?.latitude || 0,
          lng: conv.emergencyMessage[0]?.longitude || 0
        },
        status: conv.status as 'ACTIVE' | 'RESOLVED' | 'CLOSED',
        assignedResources: conv.assignedResources.map(resource => ({
          id: resource.id,
          name: resource.name,
          type: resource.type.name,
          category: resource.type.category as ResourceCategory
        })),
        createdAt: conv.emergencyMessage[0]?.createdAt || conv.createdAt,
        lastUpdated: conv.lastUpdated
      }));
    } catch (error) {
      console.error('❌ Error fetching active emergencies:', error);
      return [];
    }
  }

  async clearAllEmergencies(): Promise<boolean> {
    try {
      console.log('🧹 Clearing all emergencies and releasing resources...');

      console.log('📋 Step 1: Releasing assigned resources...');
      await this.prisma.resource.updateMany({
        where: {
          status: { in: ['ASSIGNED', 'IN_USE'] }
        },
        data: {
          status: 'AVAILABLE',
          assignedToConversationId: null,
          assignedAt: null
        }
      });
      console.log('✅ Resources released');

      // Step 2: Delete all resource assignments (to avoid foreign key constraints)
      console.log('📋 Step 2: Deleting resource assignments...');
      await this.prisma.resourceAssignment.deleteMany({});
      console.log('✅ Resource assignments deleted');

      // Step 3: Delete all chat messages
      console.log('📋 Step 3: Deleting chat messages...');
      await this.prisma.chatMessage.deleteMany({});
      console.log('✅ Chat messages deleted');

      // Step 4: Delete conversation participants
      console.log('📋 Step 4: Deleting conversation participants...');
      await this.prisma.conversationParticipant.deleteMany({});
      console.log('✅ Conversation participants deleted');

      // Step 5: Delete all conversations
      console.log('📋 Step 5: Deleting conversations...');
      await this.prisma.conversation.deleteMany({});
      console.log('✅ Conversations deleted');

      // Step 6: Delete all emergency messages
      console.log('📋 Step 6: Deleting emergency messages...');
      await this.prisma.emergencyMessage.deleteMany({});
      console.log('✅ Emergency messages deleted');

      console.log('🎉 All emergencies cleared and resources released successfully');
      return true;
    } catch (error) {
      console.error('❌ Error clearing emergencies:', error);
      if (error instanceof Error) {
        console.error('❌ Error details:', error.message);
      }
      return false;
    }
  }


  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const resources = await this.getAllResources();
      const emergencies = await this.getActiveEmergencies();

      const resourceStats = {
        total: resources.length,
        available: resources.filter(r => r.status === 'AVAILABLE').length,
        assigned: resources.filter(r => r.status === 'ASSIGNED').length,
        inUse: resources.filter(r => r.status === 'IN_USE').length,
        maintenance: resources.filter(r => r.status === 'MAINTENANCE').length,
        outOfService: resources.filter(r => r.status === 'OUT_OF_SERVICE').length,
        byCategory: resources.reduce((acc: Record<string, { total: number; available: number; assigned: number; inUse: number }>, resource) => {
          const category = resource.category;
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

      const emergencyStats = {
        active: emergencies.length,
        byPriority: emergencies.reduce((acc: Record<string, number>, emergency) => {
          const priority = emergency.priority;
          acc[priority] = (acc[priority] || 0) + 1;
          return acc;
        }, {}),
        byCategory: emergencies.reduce((acc: Record<string, number>, emergency) => {
          const category = emergency.category;
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {})
      };

      return {
        resources: resourceStats,
        emergencies: emergencyStats,
        performance: {
          responseTime: 0, // Calculate from actual data
          resolutionRate: 0, // Calculate from actual data
          resourceUtilization: Math.round((resourceStats.assigned + resourceStats.inUse) / resourceStats.total * 100)
        }
      };
    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error);
      return this.getMockDashboardStats();
    }
  }


  private getMockResources(): SimpleResource[] {
    return [
      {
        id: 'mock-1',
        name: 'Ambulance Unit A-01',
        category: ResourceCategory.VEHICLE,
        type: 'Emergency Ambulance',
        status: ResourceStatus.AVAILABLE,
        location: 'Central Station',
        capabilities: ['medical_transport', 'emergency_care']
      },
      {
        id: 'mock-2',
        name: 'Fire Truck F-12',
        category: ResourceCategory.VEHICLE,
        type: 'Fire Engine',
        status: ResourceStatus.AVAILABLE,
        location: 'Fire Station 2',
        capabilities: ['fire_suppression', 'rescue_operations']
      },
      {
        id: 'mock-3',
        name: 'EMT Sarah Johnson',
        category: ResourceCategory.PERSONNEL,
        type: 'Emergency Medical Technician',
        status: ResourceStatus.AVAILABLE,
        location: 'Central Station',
        capabilities: ['emergency_medical_care', 'patient_transport']
      }
    ];
  }

  private getMockDashboardStats(): DashboardStats {
    return {
      resources: {
        total: 40,
        available: 35,
        assigned: 3,
        inUse: 2,
        maintenance: 0,
        outOfService: 0,
        byCategory: {
          PERSONNEL: { total: 15, available: 13, assigned: 2, inUse: 0 },
          VEHICLES: { total: 12, available: 10, assigned: 1, inUse: 1 },
          EQUIPMENT: { total: 8, available: 7, assigned: 0, inUse: 1 },
          FACILITIES: { total: 3, available: 3, assigned: 0, inUse: 0 },
          SUPPLIES: { total: 2, available: 2, assigned: 0, inUse: 0 }
        }
      },
      emergencies: {
        active: 0,
        byPriority: {},
        byCategory: {}
      },
      performance: {
        responseTime: 4.2,
        resolutionRate: 94,
        resourceUtilization: 12
      }
    };
  }

  // Assign multiple resources by type for emergency response
  async assignResourcesByType(
    resourceType: string, 
    count: number, 
    conversationId: string, 
    assignedBy: string = 'system'
  ): Promise<SimpleResource[]> {
    try {
      console.log(`🔍 [ASSIGN-BY-TYPE] Looking for ${count} ${resourceType} resources`);

      // Find available resources of the specified type
      const availableResources = await this.prisma.resource.findMany({
        where: {
          status: 'AVAILABLE',
          OR: [
            { type: { name: { contains: resourceType, mode: 'insensitive' } } },
            { name: { contains: resourceType, mode: 'insensitive' } }
          ]
        },
        include: { type: true },
        take: count,
        orderBy: { createdAt: 'asc' } // First in, first assigned
      });

      if (availableResources.length === 0) {
        console.log(`⚠️ [ASSIGN-BY-TYPE] No available ${resourceType} resources found`);
        return [];
      }

      console.log(`🎯 [ASSIGN-BY-TYPE] Found ${availableResources.length} available ${resourceType} resources`);

      const assignedResources: SimpleResource[] = [];

      // Assign each resource individually with error handling
      for (const resource of availableResources) {
        try {
          const success = await this.assignResource(resource.id, conversationId, assignedBy);
          if (success) {
            assignedResources.push({
              id: resource.id,
              name: resource.name,
              category: resource.type.category as ResourceCategory,
              type: resource.type.name,
              status: 'ASSIGNED' as ResourceStatus,
              location: resource.location || 'Base Station',
              capabilities: [],
              currentAssignment: {
                conversationId,
                assignedAt: new Date(),
                status: 'ASSIGNED' as AssignmentStatus,
                emergency: undefined // Will be populated later if needed
              }
            });
            console.log(`✅ [ASSIGN-BY-TYPE] Successfully assigned ${resource.name}`);
          } else {
            console.warn(`⚠️ [ASSIGN-BY-TYPE] Failed to assign ${resource.name} (returned false)`);
          }
        } catch (error) {
          console.error(`❌ [ASSIGN-BY-TYPE] Failed to assign ${resource.name}:`, error);
          // Continue with next resource instead of stopping entire process
          continue;
        }

        // Add small delay between assignments to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const successRate = (assignedResources.length / availableResources.length * 100).toFixed(1);
      console.log(`🏁 [ASSIGN-BY-TYPE] Assignment complete: ${assignedResources.length}/${availableResources.length} resources assigned (${successRate}% success rate)`);
      
      return assignedResources;

    } catch (error) {
      console.error(`❌ [ASSIGN-BY-TYPE] Critical error in resource assignment process:`, error);
      return [];
    }
  }

  // Calculate distance between two coordinates using Haversine formula
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Find and assign nearest available resources based on emergency location and resource requirements
  async assignNearestResources(
    emergencyLat: number,
    emergencyLng: number,
    conversationId: string,
    resourceRequirements: {
      category?: ResourceCategory;
      type?: string;
      count?: number;
      maxDistance?: number; // in kilometers
    }[] = [],
    assignedBy: string = 'system'
  ): Promise<{
    success: boolean;
    assignedResources: SimpleResource[];
    unavailableRequirements: string[];
    totalDistance: number;
  }> {
    try {
      console.log(`🎯 [NEAREST-ASSIGN] Finding nearest resources for emergency at (${emergencyLat}, ${emergencyLng})`);

      // If no specific requirements, assign default emergency response resources
      if (resourceRequirements.length === 0) {
        resourceRequirements = [
          { category: ResourceCategory.VEHICLE, type: 'Ambulance', count: 1, maxDistance: 15 },
          { category: ResourceCategory.PERSONNEL, type: 'Emergency Medical Technician', count: 1, maxDistance: 20 },
          { category: ResourceCategory.EQUIPMENT, type: 'Medical Kit', count: 1, maxDistance: 25 }
        ];
        console.log(`📋 [NEAREST-ASSIGN] Using default resource requirements`);
      }

      const assignedResources: SimpleResource[] = [];
      const unavailableRequirements: string[] = [];
      let totalDistance = 0;

      // Get all available resources with coordinates
      const allAvailableResources = await this.prisma.resource.findMany({
        where: {
          status: 'AVAILABLE',
          latitude: { not: null },
          longitude: { not: null }
        },
        include: { type: true },
        orderBy: { createdAt: 'asc' }
      });

      console.log(`🔍 [NEAREST-ASSIGN] Found ${allAvailableResources.length} available resources with coordinates`);

      for (const requirement of resourceRequirements) {
        console.log(`🎯 [NEAREST-ASSIGN] Processing requirement: ${requirement.category || 'ANY'} ${requirement.type || 'ANY'} (${requirement.count || 1} needed)`);

        // Filter resources based on requirement
        const filteredResources = allAvailableResources.filter(resource => {
          if (requirement.category && resource.type.category !== requirement.category) return false;
          if (requirement.type && !resource.type.name.toLowerCase().includes(requirement.type.toLowerCase())) return false;
          return true;
        });

        // Calculate distances and sort by proximity
        const resourcesWithDistance = filteredResources.map(resource => ({
          resource,
          distance: this.calculateDistance(
            emergencyLat, 
            emergencyLng, 
            resource.latitude!, 
            resource.longitude!
          )
        })).sort((a, b) => a.distance - b.distance);

        // Filter by maximum distance if specified
        if (requirement.maxDistance) {
          const beforeFilter = resourcesWithDistance.length;
          resourcesWithDistance.splice(0, resourcesWithDistance.length, 
            ...resourcesWithDistance.filter(item => item.distance <= requirement.maxDistance!)
          );
          console.log(`📏 [NEAREST-ASSIGN] Filtered by max distance ${requirement.maxDistance}km: ${beforeFilter} -> ${resourcesWithDistance.length} resources`);
        }

        const countNeeded = requirement.count || 1;
        const availableForAssignment = resourcesWithDistance.slice(0, countNeeded);

        if (availableForAssignment.length < countNeeded) {
          const reqDescription = `${requirement.category || 'ANY'} ${requirement.type || 'ANY'} (${countNeeded} needed, ${availableForAssignment.length} available)`;
          unavailableRequirements.push(reqDescription);
          console.log(`⚠️ [NEAREST-ASSIGN] Insufficient resources: ${reqDescription}`);
        }

        // Assign available resources
        for (const { resource, distance } of availableForAssignment) {
          try {
            const success = await this.assignResource(resource.id, conversationId, assignedBy);
            if (success) {
              const assignedResource: SimpleResource = {
                id: resource.id,
                name: resource.name,
                category: resource.type.category as ResourceCategory,
                type: resource.type.name,
                status: 'ASSIGNED' as ResourceStatus,
                location: resource.location || 'Base Station',
                latitude: resource.latitude || undefined,
                longitude: resource.longitude || undefined,
                capabilities: [],
                currentAssignment: {
                  conversationId,
                  assignedAt: new Date(),
                  status: 'ASSIGNED' as AssignmentStatus,
                  emergency: undefined
                }
              };
              
              assignedResources.push(assignedResource);
              totalDistance += distance;
              
              // Remove from available list to prevent double assignment
              const index = allAvailableResources.findIndex(r => r.id === resource.id);
              if (index > -1) {
                allAvailableResources.splice(index, 1);
              }
              
              console.log(`✅ [NEAREST-ASSIGN] Assigned ${resource.name} (${distance.toFixed(2)}km away)`);
            } else {
              console.warn(`⚠️ [NEAREST-ASSIGN] Failed to assign ${resource.name} (assignment returned false)`);
            }
          } catch (error) {
            console.error(`❌ [NEAREST-ASSIGN] Error assigning ${resource.name}:`, error);
          }
        }
      }

      const successRate = resourceRequirements.length > 0 ? 
        ((resourceRequirements.length - unavailableRequirements.length) / resourceRequirements.length * 100).toFixed(1) : '100';

      console.log(`🏁 [NEAREST-ASSIGN] Assignment complete: ${assignedResources.length} resources assigned, ${unavailableRequirements.length} requirements unfulfilled (${successRate}% success rate)`);
      console.log(`📏 [NEAREST-ASSIGN] Total travel distance: ${totalDistance.toFixed(2)}km`);

      return {
        success: assignedResources.length > 0,
        assignedResources,
        unavailableRequirements,
        totalDistance: parseFloat(totalDistance.toFixed(2))
      };

    } catch (error) {
      console.error(`❌ [NEAREST-ASSIGN] Critical error in nearest resource assignment:`, error);
      return {
        success: false,
        assignedResources: [],
        unavailableRequirements: ['System error occurred during assignment'],
        totalDistance: 0
      };
    }
  }
}

export default DataService;
