import { NextRequest, NextResponse } from "next/server";

/**
 * Twilio Voice Call Completion Handler
 * Handles what happens after a voice recording is completed
 */
export async function POST(req: NextRequest) {
  try {
    console.log('📞 [TWILIO-COMPLETE] Voice call completed');

    const formData = await req.formData();
    const callSid = formData.get('CallSid') as string;
    const recordingUrl = formData.get('RecordingUrl') as string;
    const from = formData.get('From') as string;

    console.log(`📞 [TWILIO-COMPLETE] Call ${callSid} completed with recording: ${recordingUrl}`);

    // Generate final TwiML response
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice" language="en-US">
        Thank you for your emergency report. Your call has been recorded and is being processed immediately by our AI system.
        
        Emergency responders will be dispatched based on the urgency of your situation. 
        A case number has been created and you may receive a follow-up call for additional information.
        
        If this is a life-threatening emergency and you haven't already, please also call 911.
        
        Thank you and stay safe.
    </Say>
    <Hangup/>
</Response>`;

    console.log('✅ [TWILIO-COMPLETE] Final TwiML response sent');

    return new NextResponse(twimlResponse, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });

  } catch (error) {
    console.error('❌ [TWILIO-COMPLETE] Error in call completion:', error);
    
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">
        Your emergency report has been received. Emergency services will respond appropriately.
    </Say>
    <Hangup/>
</Response>`;

    return new NextResponse(errorTwiml, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  }
}
