import { NextRequest, NextResponse } from "next/server";

/**
 * Test endpoint for voice-to-text functionality
 * Useful for testing transcription without making actual Twilio calls
 */
export async function POST(req: NextRequest) {
  try {
    const { audioUrl, testMode = true, customText } = await req.json();

    console.log('🧪 [VOICE-TEST] Testing voice transcription');

    if (testMode) {
      // Simulate voice call processing for testing
      const mockTranscription = customText || "Help! There's a fire at 123 Main Street. Two people are trapped on the second floor. We need immediate assistance!";
      
      // Process through emergency pipeline
      const emergencyData = {
        rawContent: mockTranscription,
        source: 'PHONE_CALL',
        sourceId: `test_call_${Date.now()}`,
        authorName: 'Test Caller',
        authorContact: '+1234567890',
        address: '123 Main Street',
        metadata: {
          testMode: true,
          simulatedCall: true
        }
      };

      // Call the reports endpoint
      const processResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emergencyData)
      });

      if (!processResponse.ok) {
        throw new Error(`Emergency processing failed: ${processResponse.status}`);
      }

      const result = await processResponse.json();

      return NextResponse.json({
        success: true,
        data: {
          transcription: mockTranscription,
          confidence: 0.95,
          emergencyId: result.data?.id,
          conversationId: result.data?.conversationId,
          classification: result.data?.classification,
          resourcesAssigned: result.data?.resourceAssignment?.assigned || [],
          testMode: true
        },
        message: 'Voice call simulation completed successfully'
      });
    }

    // If not test mode and audioUrl provided, attempt real transcription
    if (audioUrl) {
      // This would be used for testing with actual audio files
      return NextResponse.json({
        success: false,
        error: 'Real audio transcription not implemented in test endpoint',
        message: 'Use test mode or actual Twilio webhook for audio processing'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Missing required parameters',
      message: 'Provide audioUrl or enable testMode'
    }, { status: 400 });

  } catch (error) {
    console.error('❌ [VOICE-TEST] Test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET endpoint to provide test instructions
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    message: 'Voice-to-Text Test Endpoint',
    usage: {
      method: 'POST',
      body: {
        testMode: true, // Set to true for simulation
        audioUrl: 'optional_audio_file_url' // For future real audio testing
      }
    },
    example: {
      curl: `curl -X POST ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/voice/test \\
  -H "Content-Type: application/json" \\
  -d '{"testMode": true}'`
    },
    simulatedScenario: {
      transcription: 'Emergency fire scenario with trapped people',
      expectedCategory: 'RESCUE',
      expectedPriority: 'CRITICAL'
    }
  });
}
