import { NextRequest, NextResponse } from "next/server";
import { VoiceStatusComponents, VoiceStatusConfiguration } from "@/types";

export async function GET(req: NextRequest) {
  const status = {
    timestamp: new Date().toISOString(),
    service: 'Voice Integration Status',
    components: {
      database: { status: 'unknown' as const, message: '' },
      openrouter: { status: 'unknown' as const, message: '' },
      cerebras: { status: 'unknown' as const, message: '' },
      twilio: { status: 'unknown' as const, message: '' },
      webhooks: { status: 'unknown' as const, message: '' }
    } as VoiceStatusComponents,
    endpoints: {
      incoming: `${process.env.NEXT_PUBLIC_APP_URL}/api/voice/incoming`,
      webhook: `${process.env.NEXT_PUBLIC_APP_URL}/api/voice/webhook`,
      complete: `${process.env.NEXT_PUBLIC_APP_URL}/api/voice/complete`,
      test: `${process.env.NEXT_PUBLIC_APP_URL}/api/voice/test`
    },
    configuration: {
      hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
      hasCerebrasKey: !!process.env.CEREBRAS_API_KEY,
      hasTwilioSid: !!process.env.TWILIO_ACCOUNT_SID,
      hasTwilioToken: !!process.env.TWILIO_AUTH_TOKEN,
      hasTwilioNumber: !!process.env.TWILIO_PHONE_NUMBER,
      hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL
    } as VoiceStatusConfiguration
  };

  try {
    const { PrismaClient } = await import("@/app/generated/prisma");
    const prisma = new PrismaClient();
    await prisma.voiceCall.findFirst();
    await prisma.$disconnect();
    status.components.database = { status: 'healthy' as const, message: 'Database connection successful' };
  } catch (error) {
    status.components.database = { 
      status: 'error' as const, 
      message: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }

  // Check OpenRouter API
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://disaster-mgmt.vercel.app',
          'X-Title': 'Disaster Management Voice Processing'
        }
      });
      
      if (response.ok) {
        status.components.openrouter = { status: 'healthy' as const, message: 'OpenRouter API accessible' };
      } else {
        status.components.openrouter = { status: 'warning' as const, message: `OpenRouter API returned ${response.status}` };
      }
    } catch (error) {
      status.components.openrouter = { status: 'error' as const, message: 'OpenRouter API not accessible' };
    }
  } else {
    status.components.openrouter = { status: 'warning' as const, message: 'OpenRouter API key not configured' };
  }

  // Check Cerebras API
  if (process.env.CEREBRAS_API_KEY) {
    status.components.cerebras = { status: 'configured' as const, message: 'Cerebras API key present' };
  } else {
    status.components.cerebras = { status: 'warning' as const, message: 'Cerebras API key not configured' };
  }

  // Check Twilio configuration
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    status.components.twilio = { status: 'configured' as const, message: 'Twilio credentials present' };
  } else {
    status.components.twilio = { status: 'warning' as const, message: 'Twilio credentials not fully configured' };
  }

  // Check webhook URLs
  if (process.env.NEXT_PUBLIC_APP_URL) {
    status.components.webhooks = { status: 'configured' as const, message: 'Webhook URLs configured' };
  } else {
    status.components.webhooks = { status: 'warning' as const, message: 'App URL not configured for webhooks' };
  }

  // Determine overall status
  const hasErrors = Object.values(status.components).some(comp => comp.status === 'error');
  const hasWarnings = Object.values(status.components).some(comp => comp.status === 'warning');
  
  const overallStatus = hasErrors ? 'error' : hasWarnings ? 'warning' : 'healthy';

  return NextResponse.json({
    status: overallStatus,
    ...status,
    recommendations: getRecommendations(status.components, status.configuration)
  });
}

function getRecommendations(components: VoiceStatusComponents, config: VoiceStatusConfiguration): string[] {
  const recommendations: string[] = [];

  if (!config.hasOpenRouterKey) {
    recommendations.push('Set OPENROUTER_API_KEY environment variable for voice transcription');
  }
  
  if (!config.hasCerebrasKey) {
    recommendations.push('Set CEREBRAS_API_KEY environment variable for emergency classification');
  }
  
  if (!config.hasTwilioSid || !config.hasTwilioToken) {
    recommendations.push('Configure Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)');
  }
  
  if (!config.hasAppUrl) {
    recommendations.push('Set NEXT_PUBLIC_APP_URL for webhook configuration');
  }
  
  if (components.database.status === 'error') {
    recommendations.push('Fix database connection issues');
  }

  if (recommendations.length === 0) {
    recommendations.push('All components configured correctly! Configure Twilio phone number webhooks to start receiving calls.');
  }

  return recommendations;
}
