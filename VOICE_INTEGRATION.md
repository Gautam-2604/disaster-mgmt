# Voice-to-Text Emergency Integration

This document explains how to set up and use the voice-to-text emergency reporting system with Twilio integration.

## Overview

The system allows emergency callers to report incidents via voice calls, which are automatically:
1. **Recorded** by Twilio
2. **Transcribed** using OpenRouter's Whisper model
3. **Classified** using Cerebras AI
4. **Processed** through the existing emergency response pipeline
5. **Resources dispatched** automatically based on emergency type and priority

## API Endpoints

### 1. `/api/voice/incoming` - Twilio Voice Webhook
**Purpose**: Handles incoming voice calls and returns TwiML instructions
- **Method**: POST (Twilio webhook)
- **Response**: TwiML XML for call handling
- **Features**: 
  - Plays greeting message
  - Records up to 5 minutes of audio
  - Provides clear instructions to caller

### 2. `/api/voice/webhook` - Recording Processing Webhook
**Purpose**: Processes completed voice recordings
- **Method**: POST (Twilio webhook)
- **Features**:
  - Downloads audio from Twilio
  - Transcribes using OpenRouter Whisper
  - Processes through emergency pipeline
  - Creates conversation and assigns resources

### 3. `/api/voice/complete` - Call Completion Handler
**Purpose**: Final call handling and goodbye message
- **Method**: POST (Twilio webhook)
- **Response**: TwiML XML with completion message

## Technology Stack

### Voice-to-Text Processing
- **Primary**: OpenRouter Whisper Large V3
  - High accuracy for emergency calls
  - Handles background noise well
  - Fast processing for urgent situations
  - Free tier available

- **Fallback**: Development mode message
  - Used when API keys not available
  - Allows system testing without full setup

### AI Processing Chain
1. **Transcription**: OpenRouter Whisper → Text
2. **Classification**: Cerebras Llama → Category/Priority
3. **Action Planning**: OpenRouter LLaMA-3.1-70B → Response plan
4. **Resource Assignment**: Automated based on emergency type

## Setup Instructions

### 1. Environment Variables
Add these to your `.env` file:

```bash
# AI API Keys
OPENROUTER_API_KEY="your_openrouter_api_key_here"
CEREBRAS_API_KEY="your_cerebras_api_key_here"

# Twilio Configuration
TWILIO_ACCOUNT_SID="your_twilio_account_sid_here"
TWILIO_AUTH_TOKEN="your_twilio_auth_token_here"
TWILIO_PHONE_NUMBER="your_twilio_phone_number_here"

# Application URL (for webhooks)
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
```

### 2. Twilio Configuration

#### Purchase Phone Number
1. Go to Twilio Console → Phone Numbers
2. Buy a phone number for your emergency hotline
3. Note the number in your `.env` file

#### Configure Webhooks
1. In Twilio Console, go to your phone number settings
2. Set the webhook URL for incoming calls:
   ```
   https://your-app.vercel.app/api/voice/incoming
   ```
3. Set HTTP method to `POST`

#### Recording Configuration
The system automatically configures recording with these settings:
- **Max Length**: 300 seconds (5 minutes)
- **Timeout**: 10 seconds of silence
- **Finish Key**: Any key press ends recording
- **Status Callback**: `/api/voice/webhook`

### 3. Database Migration
The system includes a `VoiceCall` model to track all voice interactions:

```bash
npx prisma migrate dev --name add_voice_call_model
npx prisma generate
```

### 4. API Key Setup

#### OpenRouter (for Whisper and LLaMA)
1. Sign up at https://openrouter.ai/
2. Get API key from dashboard
3. Add credits or use free tier
4. Models used:
   - `openai/whisper-large-v3` (transcription)
   - `meta-llama/llama-3.1-70b-instruct` (action planning)

#### Cerebras (for classification)
1. Sign up at https://cerebras.ai/
2. Get API key from dashboard
3. Model used: `llama-4-scout-17b-16e-instruct`

## Call Flow

### 1. Incoming Call
```
Caller dials → Twilio → /api/voice/incoming
                    ↓
              TwiML Response (greeting + record)
```

### 2. Recording Processing
```
Recording complete → Twilio → /api/voice/webhook
                           ↓
                     Audio download + transcription
                           ↓
                     Emergency processing pipeline
                           ↓
                     Resource assignment + conversation creation
```

### 3. Call Completion
```
Recording done → Twilio → /api/voice/complete
                      ↓
               Final message + hangup
```

## Emergency Processing Pipeline

### Input
- **Audio file** from Twilio recording
- **Caller information** (phone number, call SID)
- **Call metadata** (duration, timestamp)

### Processing Steps
1. **Audio Transcription** (OpenRouter Whisper)
   - Download recording from Twilio
   - Convert to text with confidence score
   - Handle audio format variations

2. **Text Classification** (Cerebras)
   - Categorize emergency type (RESCUE, MEDICAL, FOOD, etc.)
   - Assign priority level (LOW to LIFE_THREATENING)
   - Generate confidence score

3. **Action Planning** (OpenRouter LLaMA)
   - Generate specific action steps
   - Identify required resources
   - Estimate affected population

4. **Resource Assignment** (Automated)
   - Match resources to emergency type
   - Assign based on priority level
   - Create deployment records

5. **Conversation Creation**
   - Link to emergency message
   - Enable follow-up updates
   - Track response progress

### Output
- **Emergency Message** record in database
- **Conversation** for ongoing updates
- **Resource assignments** for responders
- **Voice Call** record for audit trail

## Testing

### Development Testing
1. Use ngrok to expose local server:
   ```bash
   ngrok http 3000
   ```
2. Update Twilio webhook URL to ngrok URL
3. Call your Twilio number to test

### Production Testing
1. Deploy to Vercel/production
2. Update webhook URLs to production URLs
3. Test with actual emergency scenarios

## Error Handling

### Transcription Failures
- **Primary**: OpenRouter Whisper API
- **Fallback**: Development mode message
- **Logging**: All failures logged with call SID

### Processing Failures
- **Emergency pipeline**: Continues with available data
- **Resource assignment**: Graceful degradation
- **Database**: Transaction rollback on failures

### Call Handling Errors
- **TwiML errors**: Fallback to basic emergency message
- **Webhook timeouts**: Twilio automatic retries
- **Audio download**: Multiple retry attempts

## Security Considerations

### Audio Data
- **Storage**: Recordings stored on Twilio (encrypted)
- **Access**: Authenticated download only
- **Retention**: Follow local emergency service policies

### API Security
- **Webhook validation**: Verify Twilio signature
- **API keys**: Store securely in environment variables
- **Rate limiting**: Implement for API endpoints

### Privacy
- **PII handling**: Minimal collection, secure processing
- **Transcription**: Processed and stored securely
- **Caller data**: Only phone number and emergency details

## Monitoring

### Key Metrics
- **Call volume**: Incoming emergency calls
- **Transcription accuracy**: Success rates and confidence
- **Processing time**: End-to-end latency
- **Resource assignment**: Success rates

### Logging
All voice interactions are logged with:
- Call SID and phone number
- Transcription confidence
- Processing stages and timing
- Emergency classification results
- Resource assignment outcomes

### Alerts
- Transcription service failures
- High volume call spikes
- Resource assignment failures
- API rate limit approaches

## Cost Considerations

### OpenRouter
- **Whisper**: ~$0.006 per minute of audio
- **LLaMA**: ~$0.18 per 1M tokens
- **Free tier**: Available for testing

### Cerebras
- **Classification**: Very cost-effective
- **Free tier**: Available for development

### Twilio
- **Phone numbers**: ~$1/month
- **Voice minutes**: ~$0.0085 per minute
- **Recording storage**: Included

## Future Enhancements

### Multilingual Support
- Add language detection
- Support multiple languages for transcription
- Localized emergency categories

### Advanced AI Features
- Emotion detection for priority adjustment
- Background noise analysis
- Real-time transcription streaming

### Integration Improvements
- SMS follow-up capabilities
- Integration with existing emergency services
- Mobile app for responders

## Troubleshooting

### Common Issues

#### Webhook Not Receiving Calls
1. Check Twilio phone number configuration
2. Verify webhook URL is publicly accessible
3. Check HTTPS certificate validity

#### Transcription Failures
1. Verify OpenRouter API key
2. Check audio file accessibility
3. Ensure sufficient API credits

#### Database Connection Issues
1. Check DATABASE_URL environment variable
2. Verify Prisma schema is up to date
3. Run migrations if needed

#### Resource Assignment Not Working
1. Check if resources exist in database
2. Verify resource types match emergency categories
3. Run seed script if needed:
   ```bash
   node scripts/seed-resources.js
   ```

### Debug Mode
Enable verbose logging by setting:
```bash
DEBUG=voice:*
```

This will log all voice processing steps for debugging.
