import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';
import { CreateChatMessage, MessageType } from '@/types';

const prisma = new PrismaClient();


export async function POST(request: NextRequest) {
  console.log('🚀 [CHAT] Starting chat message processing...');
  
  try {
    const body: CreateChatMessage = await request.json();
    const { conversationId, content, messageType = MessageType.TEXT, triggersUpdate = false } = body;
    
    console.log(`📝 [CHAT] New message received:`, {
      conversationId: conversationId.slice(-8),
      messageType,
      contentLength: content.length,
      triggersUpdate
    });

    if (!conversationId || !content) {
      console.log('❌ [CHAT] Missing required fields');
      return NextResponse.json(
        { success: false, error: 'Conversation ID and content are required' },
        { status: 400 }
      );
    }

    console.log(`🔍 [CHAT] Fetching conversation: ${conversationId.slice(-8)}`);
    // Verify conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        emergencyMessage: true,
        participants: true
      }
    });

    if (!conversation) {
      console.log('❌ [CHAT] Conversation not found');
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    console.log(`✅ [CHAT] Conversation found: ${conversation.title}`);

    console.log('💾 [CHAT] Creating chat message in database...');
    // Create the chat message
    const chatMessage = await prisma.chatMessage.create({
      data: {
        conversationId,
        content,
        messageType,
        triggersUpdate: false, // Will be set by Cerebras analysis 
        senderId: null, // TODO: Get from auth context when implementing auth
        aiProcessed: false
      },
      include: {
        sender: true,
        conversation: true
      }
    });

    console.log(`✅ [CHAT] Chat message created: ${chatMessage.id.slice(-8)}`);

    // ALWAYS process with AI - Cerebras determines if LLaMA is needed
    console.log('🤖 [CHAT] Starting AI processing pipeline...');
    processMessageWithAI(conversationId, chatMessage.id, content).catch((error) => {
      console.error('❌ [CHAT] AI processing failed:', error);
    });

    const response = {
      success: true,
      data: chatMessage
    };

    console.log('✅ [CHAT] Chat message response sent successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('Chat message creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    );
  }
}


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    const messages = await prisma.chatMessage.findMany({
      where: { conversationId },
      include: {
        sender: true
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({
      success: true,
      data: messages
    });

  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

async function processMessageWithAI(conversationId: string, messageId: string, content: string) {
  console.log(`🧠 [AI-PIPELINE] Starting AI analysis for message: ${messageId.slice(-8)}`);
  
  try {
    console.log(`🔍 [AI-PIPELINE] Fetching conversation data...`);
    // Get conversation with current action plan
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        emergencyMessage: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 10 // Last 10 messages for context
        }
      }
    });

    if (!conversation || !conversation.emergencyMessage?.[0]) {
      console.log('❌ [AI-PIPELINE] Conversation or emergency message not found');
      return;
    }

    const emergencyMessage = conversation.emergencyMessage[0];
    console.log(`✅ [AI-PIPELINE] Emergency context loaded: ${emergencyMessage.category}/${emergencyMessage.priority}`);

    // PRIORITY CHECK: Detect "done done" completion pattern
    const normalizedContent = content.toLowerCase().trim();
    const donePattern = /\b(done\s+done|done\sdone|done\.?\s*done)\b/i;
    
    if (donePattern.test(normalizedContent)) {
      console.log('🏁 [COMPLETION-DETECTED] "Done done" pattern detected, completing emergency...');
      
      try {
        // Call completion API
        const completionResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'}/api/chat/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId,
            completedBy: null, // TODO: Add user ID when auth is implemented
            reason: 'Emergency marked as completed by responder'
          })
        });

        if (completionResponse.ok) {
          console.log('✅ [COMPLETION-DETECTED] Emergency completed successfully');
          
          // Mark this message as processed
          await prisma.chatMessage.update({
            where: { id: messageId },
            data: { 
              triggersUpdate: false,
              aiProcessed: true
            }
          });
          
          return; // Skip further AI processing
        } else {
          console.error('❌ [COMPLETION-DETECTED] Failed to complete emergency');
        }
      } catch (completionError) {
        console.error('❌ [COMPLETION-DETECTED] Error completing emergency:', completionError);
      }
    }

    // STEP 1: CEREBRAS ANALYSIS - Should this message trigger updates?
    console.log('🚀 [CEREBRAS] Starting Cerebras analysis to determine if update needed...');
    const cerebrasAnalysis = await analyzeMessageWithCerebras(
      content, 
      conversation.currentActions || '',
      emergencyMessage,
      conversation.messages
    );
    
    console.log(`🚀 [CEREBRAS] Analysis complete:`, {
      requiresUpdate: cerebrasAnalysis.requiresUpdate,
      reasoning: cerebrasAnalysis.reasoning.substring(0, 100) + '...'
    });

    // Mark message as processed by Cerebras
    await prisma.chatMessage.update({
      where: { id: messageId },
      data: { 
        triggersUpdate: cerebrasAnalysis.requiresUpdate,
        aiProcessed: !cerebrasAnalysis.requiresUpdate // If no update needed, fully processed
      }
    });

    // STEP 2: LLAMA ACTION GENERATION (if Cerebras says update needed)
    if (cerebrasAnalysis.requiresUpdate) {
     
      
      const updatedPlan = await generateUpdatedActionPlan(
        emergencyMessage,
        conversation.currentActions || '',
        content,
        conversation.messages
      );

      console.log(updatedPlan, "Updated plan ki maa ki aankh");
      

      console.log(`🧠 [LLAMA] New action plan generated:`, {
        changesCount: updatedPlan.changes.length,
        newActionsLength: typeof updatedPlan.newActions === 'string' ? updatedPlan.newActions.length : 'N/A'
      });

      let actionPlanString: string = '';
      if (typeof updatedPlan.newActions === 'string') {
        actionPlanString = updatedPlan.newActions;
      } else if (Array.isArray(updatedPlan.newActions)) {
        // Handle array of objects - convert to formatted string
        actionPlanString = updatedPlan.newActions.map((item: unknown, index: number) => {
          if (typeof item === 'object' && item !== null) {
            return Object.entries(item).map(([key, value]) => `${key}: ${value}`).join('\n');
          }
          return `${index + 1}. ${item}`;
        }).join('\n\n');
      } else if (typeof updatedPlan.newActions === 'object' && updatedPlan.newActions !== null) {
        // Handle single object - convert to formatted string
        actionPlanString = Object.entries(updatedPlan.newActions)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');
      } else {
        actionPlanString = String(updatedPlan.newActions);
      }
      
      if (actionPlanString !== updatedPlan.newActions) {
        console.log('🔧 [LLAMA] Converted newActions object to string:', actionPlanString.substring(0, 100) + '...');
      }
      
      

      // Update conversation with new action plan
      console.log('💾 [DATABASE] Updating conversation with new action plan...');
      
      
      
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { currentActions: actionPlanString }
      });

      // Update the emergency message with new actions and status
      console.log('💾 [DATABASE] Updating emergency message status...');
      
      // Convert resourcesNeeded to string if it's an array
      let resourcesString: string | null = null;
      if (Array.isArray(updatedPlan.resourcesNeeded)) {
        resourcesString = updatedPlan.resourcesNeeded.join(', ');
        console.log('🔧 [DATABASE] Converted resourcesNeeded array to string:', resourcesString);
      } else if (typeof updatedPlan.resourcesNeeded === 'string') {
        resourcesString = updatedPlan.resourcesNeeded;
      } else {
        resourcesString = emergencyMessage.resourcesNeeded || null;
      }
      
      await prisma.emergencyMessage.update({
        where: { id: emergencyMessage.id },
        data: {
          actionSteps: actionPlanString,
          resourcesNeeded: resourcesString,
          status: 'IN_PROGRESS', // Update status to reflect active management
          processedAt: new Date()
        }
      });

      // Post AI response message
      console.log('💬 [DATABASE] Creating AI response message...');
      const aiResponseMessage = await prisma.chatMessage.create({
        data: {
          conversationId,
          content: `🤖 **Action Plan Updated by AI**\n\n**Cerebras Analysis:** ${cerebrasAnalysis.reasoning}\n\n**Changes Made:**\n${updatedPlan.changes.map((c: string) => `• ${c}`).join('\n')}\n\n**LLaMA Reasoning:** ${updatedPlan.reasoning}\n\n**🎯 Updated Action Plan:**\n${actionPlanString}`,
          messageType: MessageType.ACTION_PLAN,
          senderId: null, // AI message
          triggersUpdate: false,
          aiProcessed: true
        }
      });

      console.log(`✅ [AI-PIPELINE] Complete! AI response posted: ${aiResponseMessage.id.slice(-8)}`);
    } else {
      console.log('ℹ️ [AI-PIPELINE] Cerebras determined no action plan update needed');
    }

    // Mark original message as fully processed
    await prisma.chatMessage.update({
      where: { id: messageId },
      data: { aiProcessed: true }
    });

    console.log(`✅ [AI-PIPELINE] Message processing complete for: ${messageId.slice(-8)}`);

  } catch (error) {
    console.error('❌ [AI-PIPELINE] Processing failed:', error);
    
    // Mark message as processed with error
    await prisma.chatMessage.update({
      where: { id: messageId },
      data: { aiProcessed: true }
    }).catch(() => {}); // Ignore secondary errors
  }
}





interface EmergencyContext {
  category: string | null;
  priority: string | null;
  rawContent: string;
  address?: string | null;
  estimatedCount?: number | null;
  resourcesNeeded?: string | null;
}

interface RecentMessage {
  messageType: string;
  content: string;
  createdAt: Date;
  sender?: {
    name: string;
  } | null;
}

async function analyzeMessageWithCerebras(
  messageContent: string, 
  currentPlan: string, 
  emergencyContext: EmergencyContext,
  recentMessages: RecentMessage[]
): Promise<{ requiresUpdate: boolean; reasoning: string }> {
  console.log('🚀 [CEREBRAS] Preparing context for analysis...');
  
  try {
    const conversationHistory = recentMessages
      .slice(0, 5) // Last 5 messages for context
      .filter(m => m.messageType !== MessageType.ACTION_PLAN)
      .map(m => `${m.sender?.name || 'User'}: ${m.content}`)
      .join('\n');

        const prompt = `You are CRISIS COMMAND - an advanced emergency response AI that analyzes chat messages to determine if the action plan needs updating.

🚨 EMERGENCY CONTEXT:
- Type: ${emergencyContext.category} (${emergencyContext.priority} priority)
- Original Report: ${emergencyContext.rawContent}
- Location: ${emergencyContext.address || 'Unknown'}
- People Affected: ${emergencyContext.estimatedCount || 'Unknown'}

📋 CURRENT ACTION PLAN:
${currentPlan}

💬 RECENT CONVERSATION:
${conversationHistory}

🔍 NEW MESSAGE TO ANALYZE:
"${messageContent}"

ANALYSIS GUIDELINES:
🔄 UPDATE REQUIRED for messages containing:
- New information about the emergency situation
- Changes in resource requirements or availability
- Location/access changes or new hazards
- Significant status updates or complications
- Changes in people count or evacuation needs
- New safety concerns or environmental factors

⚡ NO UPDATE NEEDED for messages that are:
- Simple acknowledgments ("ok", "got it", "understood")
- Progress confirmations ("resource dispatched", "en route")
- General questions or clarifications
- Status confirmations without new information
- Completion signals ("done", "finished", "resolved")
- Emotional support or reassurance messages

🎯 RESPOND WITH JSON ONLY:
{
  "requiresUpdate": true/false,
  "reasoning": "Concise explanation focusing on whether new actionable information was provided that changes the emergency response strategy"
}`;

    console.log('🚀 [CEREBRAS] Sending analysis request...');
    const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CEREBRAS_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'system',
            content: 'You are an expert emergency response coordinator AI. Analyze messages to determine if action plans need updates. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [CEREBRAS] API error:', response.status, errorText);
      throw new Error(`Cerebras API failed: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    console.log("result ka bra size", result);
    
    console.log('✅ [CEREBRAS] Raw :', content);
    console.log('✅ [CEREBRAS] Raw response received:', content?.substring(0, 200) + '...');
    
    if (!content) {
      console.log('⚠️ [CEREBRAS] No content in response, defaulting to no update');
      return { requiresUpdate: false, reasoning: 'No response content from Cerebras' };
    }
    console.log("Teri maa ka content cerebras ki maa ka bra", content);
    try {
      // Extract JSON from markdown code blocks if present
      let jsonContent = content;
      if (content.includes('```json')) {
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonContent = jsonMatch[1].trim();
          console.log('🔧 [CEREBRAS] Extracted JSON from markdown:', jsonContent);
        }
      } else if (content.includes('```')) {
        // Handle generic code blocks
        const codeMatch = content.match(/```\s*([\s\S]*?)\s*```/);
        if (codeMatch) {
          jsonContent = codeMatch[1].trim();
          console.log('🔧 [CEREBRAS] Extracted content from code block:', jsonContent);
        }
      }
      
      const parsed = JSON.parse(jsonContent);
      console.log('✅ [CEREBRAS] Successfully parsed response:', parsed);
      return parsed;
    } catch (parseError) {
      console.error('❌ [CEREBRAS] JSON parse error:', parseError);
      console.log('🔧 [CEREBRAS] Raw content that failed to parse:', content);
      return { requiresUpdate: false, reasoning: 'Failed to parse Cerebras response' };
    }

  } catch (error) {
    console.error('❌ [CEREBRAS] Analysis error:', error);
    return { requiresUpdate: false, reasoning: 'Cerebras analysis failed' };
  }
}





interface ActionPlanResult {
  newActions: string | object | unknown[];
  resourcesNeeded?: string | string[];
  changes: string[];
  reasoning: string;
  statusUpdate?: string;
}

async function generateUpdatedActionPlan(
  emergencyMessage: EmergencyContext, 
  currentPlan: string, 
  newInfo: string, 
  recentMessages: RecentMessage[]
): Promise<ActionPlanResult> {
  console.log('🧠 [LLAMA] Starting action plan generation...');
  console.log(`🧠 [LLAMA] Context:`, {
    emergencyType: emergencyMessage.category,
    priority: emergencyMessage.priority,
    currentPlanLength: currentPlan.length,
    newInfoLength: newInfo.length,
    messageCount: recentMessages.length
  });
  
  try {
    console.log('🧠 [LLAMA] Preparing conversation history...');
    const conversationHistory = recentMessages
      .filter(m => m.messageType !== MessageType.ACTION_PLAN)
      .map(m => `[${m.createdAt}] ${m.sender?.name || 'AI'}: ${m.content}`)
      .join('\n');
    
    console.log(`🧠 [LLAMA] History prepared: ${conversationHistory.length} characters`);

    const prompt = `You are an emergency response coordinator updating an action plan based on new information.

ORIGINAL EMERGENCY:
${emergencyMessage.rawContent}

CURRENT ACTION PLAN:
${currentPlan}

RECENT CONVERSATION:
${conversationHistory}

NEW UPDATE:
${newInfo}

Create an updated action plan. Respond with JSON only:
{
  "newActions": "detailed updated action plan",
  "resourcesNeeded": "updated list of required resources",
  "changes": ["list of specific changes made"],
  "reasoning": "why these changes were necessary",
  "statusUpdate": "current status of the emergency response"
}`;

    console.log('🧠 [LLAMA] Sending request to OpenRouter...');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'http://localhost:3000',
        'X-Title': 'Emergency Response AI'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-70b-instruct',
        messages: [
          {
            role: 'system',
            content: 'You are an expert emergency response coordinator. Generate clear, actionable plans based on evolving situations. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.3
      })
    });

    console.log(`🧠 [LLAMA] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [LLAMA] API error:', errorText);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    console.log(`🧠 [LLAMA] Raw response received:`, content?.substring(0, 200) + '...');

    if (!content) {
      console.error('❌ [LLAMA] No response content');
      throw new Error('No response content from LLaMA');
    }
    console.log("Teri maa ka content", content);
    
    // Extract JSON from markdown code blocks if present
    let jsonContent = content;
    if (content.includes('```json')) {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1].trim();
        console.log('🔧 [LLAMA] Extracted JSON from markdown:', jsonContent);
      }
    } else if (content.includes('```')) {
      // Handle generic code blocks
      const codeMatch = content.match(/```\s*([\s\S]*?)\s*```/);
      if (codeMatch) {
        jsonContent = codeMatch[1].trim();
        console.log('🔧 [LLAMA] Extracted content from code block:', jsonContent);
      }
    }
    
    const parsed = JSON.parse(jsonContent);
    console.log(`✅ [LLAMA] Successfully parsed action plan:`, {
      changesCount: parsed.changes?.length || 0,
      newActionsLength: parsed.newActions?.length || 0,
      hasResources: !!parsed.resourcesNeeded
    });

    return parsed;

  } catch (error) {
    console.error('❌ [LLAMA] Action plan update error:', error);
    console.log('🔧 [LLAMA] Falling back to previous plan');
    return {
      newActions: currentPlan,
      changes: ['Failed to update plan - using previous version'],
      reasoning: 'AI processing error occurred',
      resourcesNeeded: 'Unknown - processing error',
      statusUpdate: 'Error in AI processing'
    };
  }
}
