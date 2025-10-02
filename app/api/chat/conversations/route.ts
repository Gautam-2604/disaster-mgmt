import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

/**
 * GET /api/chat/conversations
 * Fetch all conversations with their emergency messages
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [CONVERSATIONS] Fetching all conversations...');
    
    const conversations = await prisma.conversation.findMany({
      include: {
        emergencyMessage: {
          select: {
            id: true,
            category: true,
            priority: true,
            rawContent: true,
            estimatedCount: true,
            address: true,
            status: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`✅ [CONVERSATIONS] Found ${conversations.length} conversations`);

    const response = {
      success: true,
      data: conversations.map(conversation => ({
        id: conversation.id,
        title: conversation.title,
        status: conversation.status,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        currentActions: conversation.currentActions,
        emergencyMessage: conversation.emergencyMessage,
        participantCount: conversation.participants.length,
        messageCount: conversation._count.messages,
        participants: conversation.participants
      }))
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [CONVERSATIONS] Error fetching conversations:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch conversations',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/conversations
 * Create a new conversation (if needed for future use)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, emergencyMessageId, participantIds = [] } = body;

    console.log('🚀 [CONVERSATIONS] Creating new conversation:', { title, emergencyMessageId });

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    const newConversation = await prisma.conversation.create({
      data: {
        title,
        status: 'ACTIVE',
        currentActions: '',
        // Connect emergency message if provided
        ...(emergencyMessageId && {
          emergencyMessage: {
            connect: { id: emergencyMessageId }
          }
        })
      },
      include: {
        emergencyMessage: true,
        participants: {
          include: {
            user: true
          }
        }
      }
    });

    console.log(`✅ [CONVERSATIONS] Created conversation: ${newConversation.id}`);

    return NextResponse.json({
      success: true,
      data: newConversation
    });

  } catch (error) {
    console.error('❌ [CONVERSATIONS] Error creating conversation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create conversation',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
