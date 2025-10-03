import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

/**
 * POST /api/chat/complete
 * Complete an emergency conversation - release resources and mark as resolved
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, completedBy, reason } = body;

    console.log('🏁 [EMERGENCY-COMPLETE] Starting emergency completion:', { conversationId, reason });

    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    // Get conversation with all related resources
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        assignedResources: {
          include: {
            type: true
          }
        },
        emergencyMessage: true
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const assignedResources = conversation.assignedResources;
    console.log(`🔍 [EMERGENCY-COMPLETE] Found ${assignedResources.length} assigned resources`);

    // Start transaction to complete the emergency
    const result = await prisma.$transaction(async (tx) => {
      // 1. Release all assigned resources
      if (assignedResources.length > 0) {
        await tx.resource.updateMany({
          where: { 
            id: { in: assignedResources.map(r => r.id) },
            assignedToConversationId: conversationId
          },
          data: { 
            status: 'AVAILABLE',
            assignedToConversationId: null,
            assignedAt: null
          }
        });

        // Update assignment records to COMPLETED
        await tx.resourceAssignment.updateMany({
          where: {
            resourceId: { in: assignedResources.map(r => r.id) },
            conversationId,
            status: { in: ['ASSIGNED', 'DEPLOYED', 'ACTIVE'] }
          },
          data: {
            status: 'COMPLETED',
            completedAt: new Date()
          }
        });
      }

      // 2. Update conversation status to RESOLVED
      await tx.conversation.update({
        where: { id: conversationId },
        data: { 
          status: 'RESOLVED',
          currentActions: 'Emergency completed successfully. All resources have been released.'
        }
      });

      // 3. Update emergency message status to COMPLETED
      if (conversation.emergencyMessage.length > 0) {
        await tx.emergencyMessage.updateMany({
          where: { conversationId },
          data: { 
            status: 'COMPLETED',
            processedAt: new Date()
          }
        });
      }

      return { releasedResourcesCount: assignedResources.length };
    });

    // 4. Create completion message
    const completionMessage = assignedResources.length > 0 
      ? `🎉 **Emergency Completed Successfully**\n\n✅ Status: **RESOLVED**\n🚛 Released Resources: **${assignedResources.length}**\n\nResources returned to available status:\n${assignedResources.map(r => `• ${r.name} (${r.type.name})`).join('\n')}\n\n${reason ? `Completion reason: ${reason}` : 'Emergency has been successfully resolved.'}`
      : `🎉 **Emergency Completed Successfully**\n\n✅ Status: **RESOLVED**\n\n${reason ? `Completion reason: ${reason}` : 'Emergency has been successfully resolved.'}`;

    await prisma.chatMessage.create({
      data: {
        conversationId,
        content: completionMessage,
        messageType: 'SYSTEM',
        senderId: completedBy || null,
        aiProcessed: true
      }
    });

    console.log(`✅ [EMERGENCY-COMPLETE] Emergency ${conversationId} completed successfully. Released ${result.releasedResourcesCount} resources.`);

    return NextResponse.json({
      success: true,
      data: {
        conversationId,
        status: 'RESOLVED',
        releasedResourcesCount: result.releasedResourcesCount,
        message: 'Emergency completed successfully'
      }
    });

  } catch (error) {
    console.error('❌ [EMERGENCY-COMPLETE] Error completing emergency:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to complete emergency',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
