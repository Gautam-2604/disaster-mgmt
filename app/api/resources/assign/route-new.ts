import { NextRequest, NextResponse } from 'next/server';
import DataService from '@/lib/data-service';

export async function POST(request: NextRequest) {
  try {
    const { resourceId, conversationId, assignedBy } = await request.json();

    if (!resourceId || !conversationId) {
      return NextResponse.json(
        { success: false, error: 'Resource ID and Conversation ID are required' },
        { status: 400 }
      );
    }

    console.log(`🔧 [ASSIGN] Assigning resource ${resourceId} to conversation ${conversationId}`);

    const dataService = DataService.getInstance();
    const success = await dataService.assignResource(resourceId, conversationId, assignedBy || 'system');

    if (success) {
      console.log(`✅ [ASSIGN] Resource assigned successfully`);
      return NextResponse.json({ 
        success: true, 
        message: 'Resource assigned successfully' 
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to assign resource' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ [ASSIGN] Error assigning resource:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to assign resource',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
