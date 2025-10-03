import { NextRequest, NextResponse } from 'next/server';
import DataService from '@/lib/data-service';

/**
 * POST /api/resources/assign
 * Assign resources to a conversation/incident
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, resourceIds, assignedBy, notes } = body;

    console.log('🚀 [RESOURCE-ASSIGN] Assigning resources:', { conversationId, resourceIds, assignedBy });

    if (!conversationId || !resourceIds || !Array.isArray(resourceIds) || resourceIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Conversation ID and resource IDs are required' },
        { status: 400 }
      );
    }

    // Check if conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        emergencyMessage: {
          select: {
            category: true,
            priority: true,
            rawContent: true
          }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Check resource availability
    const resourcesCheck = await prisma.resource.findMany({
      where: {
        id: { in: resourceIds },
        status: 'AVAILABLE'
      },
      include: {
        type: true
      }
    });

    const unavailableResources = resourceIds.filter(id => 
      !resourcesCheck.find(r => r.id === id)
    );

    if (unavailableResources.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Some resources are not available',
          unavailableResources
        },
        { status: 400 }
      );
    }

    // Start transaction to assign resources
    const result = await prisma.$transaction(async (tx) => {
      // Update resource status to ASSIGNED
      const updatedResources = await tx.resource.updateMany({
        where: { id: { in: resourceIds } },
        data: { 
          status: 'ASSIGNED',
          assignedToConversationId: conversationId,
          assignedAt: new Date()
        }
      });

      // Create assignment records
      const assignments = await Promise.all(
        resourceIds.map(resourceId => 
          tx.resourceAssignment.create({
            data: {
              resourceId,
              conversationId,
              assignedBy,
              notes,
              status: 'ASSIGNED'
            },
            include: {
              resource: {
                include: {
                  type: true
                }
              }
            }
          })
        )
      );

      return { updatedResources, assignments };
    });

    // Create system message about resource assignment
    const resourceNames = result.assignments.map(a => a.resource.name).join(', ');
    await prisma.chatMessage.create({
      data: {
        conversationId,
        content: `🚛 **Resources Assigned**\n\nThe following resources have been assigned to this incident:\n${result.assignments.map(a => `• ${a.resource.name} (${a.resource.type.name})`).join('\n')}\n\n${notes ? `Notes: ${notes}` : ''}`,
        messageType: 'RESOURCE_UPDATE',
        senderId: assignedBy || null,
        aiProcessed: true
      }
    });

    console.log(`✅ [RESOURCE-ASSIGN] Assigned ${resourceIds.length} resources to conversation ${conversationId}`);

    return NextResponse.json({
      success: true,
      data: {
        assignments: result.assignments,
        message: `Successfully assigned ${resourceIds.length} resources`
      }
    });

  } catch (error) {
    console.error('❌ [RESOURCE-ASSIGN] Error assigning resources:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to assign resources',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
