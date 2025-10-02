import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';
import { ConversationResponse, ConversationStatus, ParticipantRole } from '@/types';

const prisma = new PrismaClient();


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        emergencyMessage: true,
        participants: {
          include: {
            user: true
          }
        },
        messages: {
          include: {
            sender: true
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const response = {
      success: true,
      data: {
        conversation,
        messages: conversation.messages,
        participants: conversation.participants
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Get conversation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}


export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const { status } = await request.json();

    if (!Object.values(ConversationStatus).includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    const updatedConversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: { status },
      include: {
        emergencyMessage: true,
        participants: {
          include: {
            user: true
          }
        },
        messages: {
          include: {
            sender: true
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        conversation: updatedConversation,
        messages: updatedConversation.messages,
        participants: updatedConversation.participants
      }
    });

  } catch (error) {
    console.error('Update conversation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update conversation' },
      { status: 500 }
    );
  }
}
