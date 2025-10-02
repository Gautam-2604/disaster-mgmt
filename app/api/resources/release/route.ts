import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

/**
 * POST /api/resources/release
 * Release resources from a conversation/incident (mark as completed)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, resourceIds, completedBy, notes } = body;

    console.log('🔄 [RESOURCE-RELEASE] Releasing resources:', { conversationId, resourceIds, completedBy });

    if (!conversationId || !resourceIds || !Array.isArray(resourceIds) || resourceIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Conversation ID and resource IDs are required' },
        { status: 400 }
      );
    }

    // Check if conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Start transaction to release resources
    const result = await prisma.$transaction(async (tx) => {
      // Update resource status back to AVAILABLE
      const updatedResources = await tx.resource.updateMany({
        where: { 
          id: { in: resourceIds },
          assignedToConversationId: conversationId
        },
        data: { 
          status: 'AVAILABLE',
          assignedToConversationId: null,
          assignedAt: null
        }
      });

      // Update assignment records to COMPLETED
      const completedAssignments = await tx.resourceAssignment.updateMany({
        where: {
          resourceId: { in: resourceIds },
          conversationId,
          status: { in: ['ASSIGNED', 'DEPLOYED', 'ACTIVE'] }
        },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });

      // Get resource details for the message
      const resources = await tx.resource.findMany({
        where: { id: { in: resourceIds } },
        include: {
          type: true
        }
      });

      return { updatedResources, completedAssignments, resources };
    });

    // Create system message about resource release
    await prisma.chatMessage.create({
      data: {
        conversationId,
        content: `✅ **Resources Released**\n\nThe following resources have been released and are now available:\n${result.resources.map(r => `• ${r.name} (${r.type.name})`).join('\n')}\n\n${notes ? `Notes: ${notes}` : 'Resources successfully completed their assignment.'}`,
        messageType: 'RESOURCE_UPDATE',
        senderId: completedBy || null,
        aiProcessed: true
      }
    });

    console.log(`✅ [RESOURCE-RELEASE] Released ${resourceIds.length} resources from conversation ${conversationId}`);

    return NextResponse.json({
      success: true,
      data: {
        releasedCount: resourceIds.length,
        message: `Successfully released ${resourceIds.length} resources`
      }
    });

  } catch (error) {
    console.error('❌ [RESOURCE-RELEASE] Error releasing resources:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to release resources',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
