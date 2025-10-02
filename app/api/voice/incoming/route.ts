import { NextRequest, NextResponse } from "next/server";

/**
 * Twilio Voice Incoming Call Handler
 * Returns TwiML instructions for handling incoming emergency calls
 */
export async function POST(req: NextRequest) {
  try {
    console.log('📞 [TWILIO-VOICE] Incoming emergency call - generating TwiML response');

    // Get call information from Twilio webhook
    const formData = await req.formData();
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const callSid = formData.get('CallSid') as string;

    console.log(`📞 [TWILIO-VOICE] Call ${callSid} from ${from} to ${to}`);

    // Generate TwiML response for recording the emergency call
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice" language="en-US">
        Hello, you have reached the emergency disaster management hotline. 
        This call is being recorded and will be processed by our AI system 
        to dispatch appropriate emergency responders.
        
        Please describe your emergency situation clearly after the beep. 
        Include your location, the type of emergency, and how many people are affected.
        
        Speak for up to 5 minutes, and press any key when you're finished.
    </Say>
    <Record 
        timeout="10" 
        maxLength="300" 
        finishOnKey="any"
        transcribe="false"
        recordingStatusCallback="${process.env.NEXT_PUBLIC_APP_URL}/api/voice/webhook"
        recordingStatusCallbackMethod="POST"
        action="${process.env.NEXT_PUBLIC_APP_URL}/api/voice/complete"
        method="POST"
    />
    <Say voice="alice" language="en-US">
        I'm sorry, I didn't receive your recording. Please try calling again.
    </Say>
</Response>`;

    console.log('✅ [TWILIO-VOICE] TwiML response generated successfully');

    return new NextResponse(twimlResponse, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });

  } catch (error) {
    console.error('❌ [TWILIO-VOICE] Error generating TwiML response:', error);
    
    // Fallback TwiML response
    const fallbackTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">
        Emergency services are currently experiencing technical difficulties. 
        Please hang up and call 911 for immediate assistance.
    </Say>
</Response>`;

    return new NextResponse(fallbackTwiml, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  }
}

/**
 * Handle GET requests (for testing Twilio webhook configuration)
 */
export async function GET(req: NextRequest) {
  console.log('📞 [TWILIO-VOICE] GET request received - webhook test');
  
  return NextResponse.json({
    success: true,
    message: 'Twilio voice webhook is working',
    timestamp: new Date().toISOString()
  });
}
