import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/app/generated/prisma";
import { MessageSource, LocationSource, MessageCategory, Priority, MessageStatus } from "@/types";
import { geocodingService } from "@/lib/geocoding";
import DataService from "@/lib/data-service";

const prisma = new PrismaClient();
async function classifyWithCerebras(rawContent: string): Promise<{
  category: MessageCategory;
  priority: Priority;
  confidence: number;
}> {
  try {
    const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CEREBRAS_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'DisasterMgmt/1.0'
      },
      body: JSON.stringify({
        model: "llama-4-scout-17b-16e-instruct",  // Fast, efficient model for classification
        messages: [
          {
            role: "system",
            content: `You are an emergency classification AI. Analyze emergency reports and classify them quickly and accurately.

CATEGORIES: RESCUE, MEDICAL, FOOD, SHELTER, WATER, INFORMATION, FALSE_ALARM
PRIORITIES: LOW, MEDIUM, HIGH, CRITICAL, LIFE_THREATENING

Respond in this exact JSON format:
{
  "category": "CATEGORY_NAME",
  "priority": "PRIORITY_LEVEL",
  "confidence": 0.95,
  "reasoning": "brief explanation"
}`
          },
          {
            role: "user",
            content: `Classify this emergency report: "${rawContent}"`
          }
        ],
        max_tokens: 200,
        temperature: 0.1, // Low temperature for consistent classification
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`Cerebras API failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
      throw new Error('Invalid Cerebras API response');
    }

    const classification = JSON.parse(result.choices[0].message.content);
    
    return {
      category: classification.category as MessageCategory,
      priority: classification.priority as Priority,
      confidence: classification.confidence || 0.8
    };
  } catch (error) {
    console.error('Cerebras classification failed:', error);
    // Fallback to keyword-based classification
    return fallbackClassification(rawContent);
  }
}

/**
 * LLAMA ACTION GENERATION via OpenRouter
 * 
 * Why LLaMA (Meta Llama-3.1-70B via OpenRouter)?
 * - Superior reasoning and planning capabilities for complex action generation
 * - Excellent at structured, detailed response planning
 * - Better context understanding for nuanced emergency scenarios
 * - Advanced instruction following for specific emergency protocols
 * - Higher token capacity for detailed action plans
 * 
 * Purpose: Generate comprehensive, actionable emergency response plans with specific steps,
 * resource requirements, and impact assessments based on the classified emergency type
 */
async function generateActionWithLLaMA(rawContent: string, category: MessageCategory, priority: Priority): Promise<{
  actionSteps: string;
  resourcesNeeded: string;
  estimatedCount: number;
}> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://disaster-mgmt.vercel.app',
        'X-Title': 'Disaster Management AI Copilot'
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-70b-instruct", // Large model for complex reasoning
        messages: [
          {
            role: "system",
            content: `You are an expert emergency response coordinator with 20+ years of experience in disaster management. Your role is to create detailed, actionable emergency response plans that save lives and minimize damage.

EMERGENCY RESPONSE PROTOCOL:
- Generate specific, time-sensitive action steps
- Calculate exact resource requirements
- Estimate affected population accurately
- Consider safety protocols and risk mitigation
- Prioritize life-saving actions first

Format your response with these exact sections:
ACTION STEPS:
[Numbered list of specific actions with timeframes]

RESOURCES NEEDED:
[Detailed breakdown of personnel, equipment, and supplies]

ESTIMATED COUNT:
[Number of people potentially affected - be realistic]

SAFETY CONSIDERATIONS:
[Critical safety measures for responders]`
          },
          {
            role: "user",
            content: `EMERGENCY SITUATION ANALYSIS:
Report: "${rawContent}"
Category: ${category}
Priority: ${priority}

Generate a comprehensive emergency response plan. Consider the urgency level and type of emergency. Be specific about timing, quantities, and personnel needed. This plan will be used by actual emergency responders - lives depend on its accuracy.`
          }
        ],
        max_tokens: 1200,
        temperature: 0.1, // Low temperature for consistent, reliable plans
        top_p: 0.9
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
      throw new Error('Invalid OpenRouter API response');
    }
    
    return parseActionResponse(result.choices[0].message.content, category);
  } catch (error) {
    console.error('LLaMA action generation failed:', error);
    return generateFallbackAction(category, priority);
  }
}

function fallbackClassification(content: string): {
  category: MessageCategory;
  priority: Priority;
  confidence: number;
} {
  const lowerContent = content.toLowerCase();
  
  // Simple keyword-based classification
  if (lowerContent.includes('trapped') || lowerContent.includes('rescue')) {
    return { category: MessageCategory.RESCUE, priority: Priority.CRITICAL, confidence: 0.7 };
  }
  if (lowerContent.includes('injured') || lowerContent.includes('medical') || lowerContent.includes('ambulance')) {
    return { category: MessageCategory.MEDICAL, priority: Priority.HIGH, confidence: 0.7 };
  }
  if (lowerContent.includes('fire') || lowerContent.includes('burning')) {
    return { category: MessageCategory.RESCUE, priority: Priority.CRITICAL, confidence: 0.8 };
  }
  if (lowerContent.includes('food') || lowerContent.includes('hungry')) {
    return { category: MessageCategory.FOOD, priority: Priority.MEDIUM, confidence: 0.6 };
  }
  if (lowerContent.includes('shelter') || lowerContent.includes('homeless')) {
    return { category: MessageCategory.SHELTER, priority: Priority.MEDIUM, confidence: 0.6 };
  }
  
  return { category: MessageCategory.INFORMATION, priority: Priority.LOW, confidence: 0.4 };
}

function parseActionResponse(text: string, category: MessageCategory): {
  actionSteps: string;
  resourcesNeeded: string;
  estimatedCount: number;
} {
  let actionSteps = '';
  let resourcesNeeded = '';
  let estimatedCount = 1;

  try {
    // Extract ACTION STEPS section
    const actionMatch = text.match(/ACTION STEPS?:?\s*([\s\S]*?)(?:RESOURCES NEEDED|ESTIMATED COUNT|SAFETY CONSIDERATIONS|$)/i);
    if (actionMatch) {
      actionSteps = actionMatch[1].trim();
    } else {
      // Fallback: look for numbered lists at the beginning
      const numberedSteps = text.match(/^\d+\.\s+.*$/gm);
      if (numberedSteps && numberedSteps.length > 0) {
        actionSteps = numberedSteps.slice(0, 8).join('\n').trim(); // Limit to first 8 steps
      }
    }

    // Extract RESOURCES NEEDED section
    const resourceMatch = text.match(/RESOURCES NEEDED:?\s*([\s\S]*?)(?:ESTIMATED COUNT|SAFETY CONSIDERATIONS|ACTION STEPS|$)/i);
    if (resourceMatch) {
      resourcesNeeded = resourceMatch[1].trim();
    } else {
      // Enhanced fallback: look for resource keywords with context
      const resourcePatterns = [
        /(\d+)\s+(?:ambulances?|fire trucks?|police cars?)/gi,
        /(\d+)\s+(?:paramedics?|firefighters?|officers?|personnel)/gi,
        /(?:medical supplies|rescue equipment|communication equipment)/gi
      ];
      
      const foundResources: string[] = [];
      resourcePatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
          foundResources.push(...matches);
        }
      });
      
      if (foundResources.length > 0) {
        resourcesNeeded = foundResources.slice(0, 10).join(', ');
      }
    }

    // Extract ESTIMATED COUNT with better parsing
    const countMatch = text.match(/ESTIMATED COUNT:?\s*(\d+)/i) || 
                      text.match(/(\d+)\s+(?:people|persons|individuals|casualties|affected)/i) ||
                      text.match(/affecting\s+(?:approximately\s+)?(\d+)/i);
    
    if (countMatch) {
      estimatedCount = parseInt(countMatch[1]);
    } else {
      // Category-based estimation if no number found
      const categoryEstimates = {
        [MessageCategory.RESCUE]: 5,
        [MessageCategory.MEDICAL]: 3,
        [MessageCategory.FOOD]: 20,
        [MessageCategory.SHELTER]: 15,
        [MessageCategory.WATER]: 25,
        [MessageCategory.INFORMATION]: 1,
        [MessageCategory.FALSE_ALARM]: 0
      };
      estimatedCount = categoryEstimates[category] || 1;
    }

    // Clean up extracted text - preserve formatting but remove excessive whitespace
    actionSteps = actionSteps
      .replace(/^\s*[-•*]\s*/gm, '') // Remove bullet points
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Normalize multiple newlines
      .trim();
    
    resourcesNeeded = resourcesNeeded
      .replace(/^\s*[-•*]\s*/gm, '')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();

    // Ensure we have meaningful content
    if (!actionSteps || actionSteps.length < 20) {
      actionSteps = generateFallbackActionSteps(category);
    }
    if (!resourcesNeeded || resourcesNeeded.length < 10) {
      resourcesNeeded = generateFallbackResources(category);
    }

  } catch (error) {
    console.error('Error parsing LLaMA response:', error);
    // Use fallback generation
    const fallback = generateFallbackAction(category, Priority.MEDIUM);
    return fallback;
  }

  return { 
    actionSteps: actionSteps || "Emergency response protocol initiated", 
    resourcesNeeded: resourcesNeeded || "Standard emergency response resources", 
    estimatedCount: Math.max(0, estimatedCount) 
  };
}

function generateFallbackActionSteps(category: MessageCategory): string {
  const steps = {
    [MessageCategory.RESCUE]: "1. Dispatch rescue team immediately\n2. Secure perimeter and assess safety\n3. Establish communication with trapped individuals\n4. Begin systematic search and extraction",
    [MessageCategory.MEDICAL]: "1. Dispatch ambulance and paramedic team\n2. Establish triage area\n3. Provide immediate medical aid\n4. Transport to nearest hospital",
    [MessageCategory.FOOD]: "1. Assess food shortage severity\n2. Contact local food banks and suppliers\n3. Set up emergency food distribution point\n4. Coordinate volunteer support",
    [MessageCategory.SHELTER]: "1. Open emergency shelter facilities\n2. Register displaced individuals\n3. Provide basic necessities\n4. Coordinate with social services",
    [MessageCategory.WATER]: "1. Deploy emergency water supply\n2. Test water quality and safety\n3. Set up distribution points\n4. Coordinate infrastructure repair",
    [MessageCategory.INFORMATION]: "1. Verify information accuracy\n2. Update public safety announcements\n3. Coordinate with media outlets\n4. Monitor situation development",
    [MessageCategory.FALSE_ALARM]: "1. Confirm false alarm status\n2. Stand down emergency resources\n3. Update incident records\n4. Review reporting protocols"
  };
  return steps[category] || steps[MessageCategory.INFORMATION];
}

function generateFallbackResources(category: MessageCategory): string {
  const resources = {
    [MessageCategory.RESCUE]: "2 fire trucks, 1 ambulance, 6 firefighters, rescue equipment, communication devices",
    [MessageCategory.MEDICAL]: "2 ambulances, 4 paramedics, medical supplies, stretchers, communication equipment",
    [MessageCategory.FOOD]: "Food supplies, transportation vehicles, volunteers, distribution equipment",
    [MessageCategory.SHELTER]: "Emergency shelter space, bedding, basic supplies, registration materials",
    [MessageCategory.WATER]: "Water trucks, purification equipment, containers, testing supplies",
    [MessageCategory.INFORMATION]: "Communication equipment, personnel, verification resources",
    [MessageCategory.FALSE_ALARM]: "Minimal resources for verification and documentation"
  };
  return resources[category] || resources[MessageCategory.INFORMATION];
}

function generateFallbackAction(category: MessageCategory, priority: Priority): {
  actionSteps: string;
  resourcesNeeded: string;
  estimatedCount: number;
} {
  const actions: Record<MessageCategory, { steps: string; resources: string; count: number }> = {
    [MessageCategory.RESCUE]: {
      steps: "1. Dispatch rescue team immediately\n2. Secure the area\n3. Assess structural safety\n4. Begin extraction procedures",
      resources: "2 fire trucks, 1 ambulance, rescue equipment, 6 firefighters",
      count: 3
    },
    [MessageCategory.MEDICAL]: {
      steps: "1. Dispatch ambulance immediately\n2. Send paramedics\n3. Prepare hospital for incoming patients\n4. Establish triage if multiple casualties",
      resources: "2 ambulances, 4 paramedics, medical supplies",
      count: 2
    },

    [MessageCategory.FOOD]: {
      steps: "1. Contact local food bank\n2. Organize food distribution\n3. Set up distribution point\n4. Coordinate volunteers",
      resources: "Food supplies, volunteers, transportation",
      count: 10
    },
    [MessageCategory.SHELTER]: {
      steps: "1. Open emergency shelter\n2. Provide temporary accommodation\n3. Register displaced persons\n4. Coordinate with social services",
      resources: "Emergency shelter, bedding, basic supplies",
      count: 5
    },
    [MessageCategory.WATER]: {
      steps: "1. Provide emergency water supply\n2. Test water quality\n3. Set up distribution points\n4. Repair infrastructure if needed",
      resources: "Water trucks, purification equipment, containers",
      count: 15
    },
    [MessageCategory.INFORMATION]: {
      steps: "1. Verify information\n2. Update public announcements\n3. Coordinate with media\n4. Monitor situation",
      resources: "Communication equipment, staff",
      count: 1
    },
    [MessageCategory.FALSE_ALARM]: {
      steps: "1. Verify false alarm status\n2. Stand down resources\n3. Update records\n4. Monitor for related reports",
      resources: "Minimal resources required",
      count: 0
    }
  };

  const action = actions[category] || actions[MessageCategory.INFORMATION];
  return {
    actionSteps: action.steps,
    resourcesNeeded: action.resources,
    estimatedCount: action.count
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate required fields
    const { rawContent, source, authorName, authorContact, latitude, longitude, address } = body;
    
    if (!rawContent || !source) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: rawContent and source" },
        { status: 400 }
      );
    }

    // Validate source enum
    if (!Object.values(MessageSource).includes(source)) {
      return NextResponse.json(
        { success: false, error: "Invalid message source" },
        { status: 400 }
      );
    }

    // Special handling for voice calls
    const isVoiceCall = source === MessageSource.PHONE_CALL;
    if (isVoiceCall) {
      console.log(`📞 [VOICE-PROCESSING] Processing voice call from ${authorContact || 'unknown number'}`);
    }

    // Determine location source
    let locationSource: LocationSource | undefined;
    if (latitude && longitude) {
      locationSource = LocationSource.GPS;
    } else if (address) {
      locationSource = LocationSource.USER_PROVIDED;
    }
    console.log("ocagtion", locationSource);
    

    // Enhanced location processing with geocoding
    let finalLatitude = latitude ? parseFloat(latitude) : undefined;
    let finalLongitude = longitude ? parseFloat(longitude) : undefined;
    let finalAddress = address;
    let finalLocationSource = locationSource;

    // If we don't have coordinates but have an address, try to geocode it
    if (!finalLatitude && !finalLongitude && address) {
      console.log(`🗺️ [GEOCODING] Attempting to geocode address: ${address}`);
      try {
        const geocodeResult = await geocodingService.geocodeAddress({ 
          address: address, 
          source: 'user_provided' 
        });
        
        if (geocodeResult) {
          finalLatitude = geocodeResult.latitude;
          finalLongitude = geocodeResult.longitude;
          finalAddress = geocodeResult.address; // Use the standardized address
          finalLocationSource = LocationSource.AI_INFERRED;
          console.log(`✅ [GEOCODING] Successfully geocoded: ${finalLatitude}, ${finalLongitude}`);
        }
      } catch (error) {
        console.error('❌ [GEOCODING] Failed to geocode address:', error);
      }
    }

    // If we still don't have location info, try to extract it from the message content
    if (!finalLatitude && !finalLongitude && !finalAddress) {
      console.log(`🗺️ [LOCATION-EXTRACTION] Attempting to extract location from message content`);
      try {
        const extractedLocation = await geocodingService.extractLocationFromText(rawContent);
        
        if (extractedLocation) {
          finalLatitude = extractedLocation.latitude;
          finalLongitude = extractedLocation.longitude;
          finalAddress = extractedLocation.address;
          finalLocationSource = LocationSource.AI_INFERRED;
          console.log(`✅ [LOCATION-EXTRACTION] Successfully extracted: ${finalAddress} (${finalLatitude}, ${finalLongitude})`);
        }
      } catch (error) {
        console.error('❌ [LOCATION-EXTRACTION] Failed to extract location:', error);
      }
    }

    // Step 1: Create initial emergency message with enhanced location data
    const emergencyMessage = await prisma.emergencyMessage.create({
      data: {
        rawContent,
        source,
        sourceId: body.sourceId,
        authorName,
        authorContact,
        latitude: finalLatitude,
        longitude: finalLongitude,
        address: finalAddress,
        locationSource: finalLocationSource,
        status: MessageStatus.UNPROCESSED,
      },
    });
    console.log("Emergenyc Message", emergencyMessage);
    console.log(`Processing emergency message: ${emergencyMessage.id}`);

    // Step 2: AI Classification with Cerebras
    const classification = await classifyWithCerebras(rawContent);
    
    // Update message with classification
    await prisma.emergencyMessage.update({
      where: { id: emergencyMessage.id },
      data: {
        category: classification.category,
        priority: classification.priority,
        confidence: classification.confidence,
        status: MessageStatus.AI_CLASSIFIED,
        processedAt: new Date(),
      },
    });

    console.log(`Message ${emergencyMessage.id} classified as ${classification.category} with ${classification.priority} priority`);

    // Step 3: Action generation with LLaMA
    const actionData = await generateActionWithLLaMA(rawContent, classification.category, classification.priority);
    
    // Final update with action steps
    const finalMessage = await prisma.emergencyMessage.update({
      where: { id: emergencyMessage.id },
      data: {
        actionSteps: actionData.actionSteps,
        resourcesNeeded: actionData.resourcesNeeded,
        estimatedCount: actionData.estimatedCount,
        status: MessageStatus.ACTION_GENERATED,
      },
    });

    console.log(`Action generated for message ${emergencyMessage.id}: ${actionData.actionSteps.substring(0, 100)}...`);

    // Step 4: Create conversation for ongoing updates
    const conversation = await prisma.conversation.create({
      data: {
        title: `Emergency: ${classification.category} - ${rawContent.substring(0, 50)}...`,
        status: 'ACTIVE',
        currentActions: actionData.actionSteps,
      }
    });

    // Link emergency message to conversation
    await prisma.emergencyMessage.update({
      where: { id: emergencyMessage.id },
      data: {
        conversationId: conversation.id
      }
    });

    // Add initial AI message to conversation
    await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        content: `🚨 **Emergency Report Processed**\n\n**Classification:** ${classification.category} (${classification.priority} priority)\n**Confidence:** ${(classification.confidence * 100).toFixed(1)}%\n\n**Initial Action Plan:**\n${actionData.actionSteps}\n\n**Resources Needed:** ${actionData.resourcesNeeded}\n**Estimated People Affected:** ${actionData.estimatedCount}\n\n💬 **You can now send updates about this emergency and I'll adjust the action plan accordingly.**`,
        messageType: 'ACTION_PLAN',
        senderId: null, // AI message
        triggersUpdate: false,
        aiProcessed: true
      }
    });

    console.log(`Conversation ${conversation.id} created for emergency ${emergencyMessage.id}`);

    // Step 5: Check available resources before assigning responders
    console.log(`🚛 [RESOURCE-CHECK] Checking available resources for ${classification.category}/${classification.priority} emergency`);
    const emergencyAssignedResources = await assignResourcesForEmergency(
      conversation.id,
      classification.category,
      classification.priority,
      actionData.resourcesNeeded || ''
    );

    // Create system message about resource assignment  
    await createResourceAssignmentMessage(
      conversation.id,
      emergencyAssignedResources,
      classification.category,
      classification.priority
    );

    // Step 6: Auto-assign to responders based on priority
    if (classification.priority === Priority.CRITICAL || classification.priority === Priority.LIFE_THREATENING) {
      const availableResponder = await prisma.user.findFirst({
        where: {
          role: 'RESPONDER',
          // Add logic to find available responders
        },
      });

      if (availableResponder) {
        await prisma.emergencyMessage.update({
          where: { id: emergencyMessage.id },
          data: {
            assignedTo: availableResponder.id,
            status: MessageStatus.ASSIGNED,
          },
        });
        console.log(`Critical message ${emergencyMessage.id} auto-assigned to responder ${availableResponder.id}`);
      }
    }

    // Resources already assigned in Step 5 above

    return NextResponse.json({
      success: true,
      data: {
        ...finalMessage,
        conversationId: conversation.id, // Add conversation ID for frontend redirect
        classification: {
          category: classification.category,
          priority: classification.priority,
          confidence: classification.confidence,
        },
        actions: {
          steps: actionData.actionSteps,
          resources: actionData.resourcesNeeded,
          estimatedCount: actionData.estimatedCount,
        },
        resourceAssignment: {
          assigned: emergencyAssignedResources,
          status: emergencyAssignedResources.length > 0 ? 'ASSIGNED' : 'NONE_AVAILABLE'
        }
      },
      message: "Emergency report processed successfully with AI classification and action generation."
    });

  } catch (error) {
    console.error("Error processing emergency message:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error",
        message: "Failed to process emergency report. Please try again."
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Auto-assign available resources based on emergency category and priority
 */
async function assignResourcesForEmergency(
  conversationId: string,
  category: MessageCategory,
  priority: Priority,
  resourcesNeeded: string
): Promise<string[]> {
  try {
    console.log(`🚛 [AUTO-RESOURCE] Starting resource assignment for ${category}/${priority} emergency`);

    // Use DataService to assign resources based on emergency category and priority
    const dataService = DataService.getInstance();
    
    // Determine how many resources to assign based on priority
    const resourceCount = getResourceCountForPriority(priority);
    console.log(`� [AUTO-RESOURCE] Assigning ${resourceCount} resources for ${priority} priority emergency`);

    // Get appropriate resource types for this emergency category
    const resourceTypes = getResourceTypesForCategory(category);
    console.log(`🏷️ [AUTO-RESOURCE] Looking for resource types: ${resourceTypes.join(', ')}`);

    const assignedResources: string[] = [];

    // Try to assign resources from different categories for comprehensive response
    for (const resourceType of resourceTypes) {
      try {
        const assignments = await dataService.assignResourcesByType(
          resourceType,
          Math.min(resourceCount, 2), // Limit per type to avoid over-assignment
          conversationId,
          `Emergency: ${category} (${priority})`
        );

        if (assignments.length > 0) {
          assignedResources.push(...assignments.map(r => r.name));
          console.log(`✅ [AUTO-RESOURCE] Assigned ${assignments.length} ${resourceType} resources`);
        }
      } catch (error) {
        console.error(`❌ [AUTO-RESOURCE] Failed to assign ${resourceType} resources:`, error);
        continue; // Try next resource type
      }
    }

    if (assignedResources.length === 0) {
      console.log(`⚠️ [AUTO-RESOURCE] No resources could be assigned for ${category} emergency`);
    } else {
      console.log(`� [AUTO-RESOURCE] Successfully assigned ${assignedResources.length} total resources: ${assignedResources.join(', ')}`);
    }

    return assignedResources;

  } catch (error) {
    console.error('❌ [AUTO-RESOURCE] Error in resource assignment:', error);
    return [];
  }
}

/**
 * Get resource count based on emergency priority
 */
function getResourceCountForPriority(priority: Priority): number {
  switch (priority) {
    case Priority.LIFE_THREATENING: return 4;
    case Priority.CRITICAL: return 3;
    case Priority.HIGH: return 2;
    case Priority.MEDIUM: return 1;
    case Priority.LOW: return 1;
    default: return 1;
  }
}

/**
 * Get appropriate resource types for emergency category
 */
function getResourceTypesForCategory(category: MessageCategory): string[] {
  switch (category) {
    case MessageCategory.RESCUE:
      return ['Fire Truck', 'Ambulance', 'Rescue Equipment'];
    case MessageCategory.MEDICAL:
      return ['Ambulance', 'Medical Supplies', 'Personnel'];
    case MessageCategory.FOOD:
      return ['Truck', 'Personnel', 'Food Supplies'];
    case MessageCategory.SHELTER:
      return ['Emergency Shelter', 'Personnel', 'Basic Supplies'];
    case MessageCategory.WATER:
      return ['Water Truck', 'Personnel', 'Water Supplies']; 
    case MessageCategory.INFORMATION:
      return ['Communication Device', 'Personnel'];
    case MessageCategory.FALSE_ALARM:
      return []; // No resources needed for false alarms
    default:
      return ['Personnel']; // Default to personnel
  }
}

/**
 * Get resource category requirements based on emergency type
 */
function getResourceRequirementsForEmergency(category: MessageCategory, priority: Priority): string[] {
  const baseRequirements: Record<MessageCategory, string[]> = {
    RESCUE: ['PERSONNEL', 'VEHICLE', 'EQUIPMENT'],
    MEDICAL: ['PERSONNEL', 'VEHICLE', 'EQUIPMENT'],
    FOOD: ['PERSONNEL', 'SUPPLY'],
    SHELTER: ['PERSONNEL', 'FACILITY', 'SUPPLY'],
    WATER: ['PERSONNEL', 'SUPPLY'],
    INFORMATION: [],
    FALSE_ALARM: []
  };

  let requirements = baseRequirements[category] || [];

  // Add additional resources for high-priority emergencies
  if (priority === Priority.CRITICAL || priority === Priority.LIFE_THREATENING) {
    if (category === MessageCategory.RESCUE || category === MessageCategory.MEDICAL) {
      requirements = [...requirements, 'FACILITY']; // Add hospital/medical facility
    }
  }

  return requirements;
}

/**
 * Prioritize resource assignment based on emergency priority
 */
function prioritizeResourceAssignment(availableResources: any[], priority: Priority): any[] {
  const maxResources = priority === Priority.CRITICAL || priority === Priority.LIFE_THREATENING ? 5 : 
                      priority === Priority.HIGH ? 3 : 2;

  // Sort resources by capacity (higher capacity first) and take the top ones
  return availableResources
    .sort((a, b) => (b.capacity || 0) - (a.capacity || 0))
    .slice(0, maxResources);
}

/**
 * Create system message about resource assignment
 */
async function createResourceAssignmentMessage(
  conversationId: string,
  assignedResources: string[],
  category: MessageCategory,
  priority: Priority
) {
  if (assignedResources.length === 0) {
    await prisma.chatMessage.create({
      data: {
        conversationId,
        content: `⚠️ **Resource Assignment**\n\nNo resources were automatically assigned for this ${category} emergency.\n\n**Reason:** No available resources matching the emergency requirements, or this emergency type doesn't require automatic resource assignment.\n\n💡 **Next Steps:** Dispatchers can manually assign resources as needed.`,
        messageType: 'RESOURCE_UPDATE',
        senderId: null,
        aiProcessed: true
      }
    });
  } else {
    await prisma.chatMessage.create({
      data: {
        conversationId,
        content: `🚛 **Resources Auto-Assigned**\n\nThe following resources have been automatically assigned to this ${priority} priority ${category} emergency:\n\n${assignedResources.map(resource => `• ${resource}`).join('\n')}\n\n✅ **Status:** Resources are now en route or being prepared for deployment.\n\n💬 **Updates:** Resource status will be updated as the situation progresses.`,
        messageType: 'RESOURCE_UPDATE',
        senderId: null,
        aiProcessed: true
      }
    });
  }
}