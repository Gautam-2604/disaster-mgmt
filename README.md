# ⚡ CRISIS COMMAND

> **Next-Generation AI Emergency Response System**

A cutting-edge emergency management platform that combines AI-powered classification, real-time resource management, interactive mapping, and intelligent conversation handling to revolutionize emergency response operations.

Live Link- https://disaster-mgmt-xi.vercel.app/

![Crisis Command Banner](https://img.shields.io/badge/Status-Production%20Ready-brightgreen?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.0-06B6D4?style=for-the-badge&logo=tailwindcss)

## 🌟 Key Features

### 🧠 **AI-Powered Emergency Processing**
- **Dual AI Pipeline**: Cerebras for message analysis + LLaMA for action planning
- **Smart Classification**: Automatic categorization (RESCUE, MEDICAL, FIRE, etc.)
- **Priority Assessment**: Real-time priority scoring (CRITICAL, HIGH, MEDIUM, LOW)
- **Action Generation**: Dynamic emergency response plans

### 🗺️ **Interactive Resource Mapping**
- **Real-time Map**: Leaflet-powered interactive maps showing resource locations
- **Custom Markers**: Different icons for emergency types and resource categories
- **Distance Calculation**: Haversine formula for precise nearest resource assignment
- **Location-Aware**: GPS integration for accurate emergency positioning

### 🚛 **Intelligent Resource Management**
- **Nearest Assignment**: Automatically assigns closest available resources
- **Smart Fallback**: Type-based assignment when distance filtering fails
- **Real-time Tracking**: Live resource status updates (AVAILABLE, ASSIGNED, IN_USE)
- **Multi-Category Support**: Vehicles, Personnel, Equipment, Facilities, Supplies

### 💬 **Advanced Chat System**
- **Real-time Conversations**: Live communication between responders
- **AI Integration**: Every message analyzed for action plan updates
- **"Done Done" Completion**: Automatic resource release and emergency closure
- **Message Types**: Text, status updates, resource updates, system messages

### 📞 **Voice Call Integration**
- **Twilio Integration**: Direct emergency hotline support
- **Speech-to-Text**: Automatic transcription of voice calls
- **Emergency Creation**: Calls automatically create emergency records
- **GPS Location**: Extract location data from voice calls

### 📊 **Real-time Dashboard**
- **Live Statistics**: Active emergencies, available resources, response times
- **Resource Overview**: Complete resource inventory with status tracking
- **Performance Metrics**: Response time analytics and utilization rates
- **Emergency Feed**: Live stream of active emergencies

## 🏗️ Architecture

### **Tech Stack**
```
Frontend:       Next.js 15.5.4 + TypeScript + Tailwind CSS
Backend:        Next.js API Routes + Prisma ORM
Database:       PostgreSQL (Neon)
AI Services:    Cerebras AI + Meta LLaMA
Mapping:        React Leaflet + OpenStreetMap
Voice:          Twilio Voice API
Real-time:      Server-Sent Events + Polling
```

### **Database Schema**
```
📋 Core Models:
├── EmergencyMessage    # Emergency reports and classifications
├── Conversation        # Chat conversations for each emergency
├── ChatMessage         # Individual messages in conversations
├── Resource           # Emergency resources (vehicles, personnel, etc.)
├── ResourceType       # Categories of resources
├── ResourceAssignment # Resource-to-emergency assignments
├── VoiceCall          # Twilio voice call records
└── User              # System users and responders
```

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ 
- PostgreSQL database
- Cerebras AI API key
- Twilio account (optional, for voice features)

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/Gautam-2604/disaster-mgmt.git
   cd disaster-mgmt
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create `.env.local`:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/crisis_command"
   
   # AI Services
   CEREBRAS_API_KEY="your_cerebras_api_key"
   LLAMA_API_URL="your_llama_endpoint"
   
   # Twilio (Optional)
   TWILIO_ACCOUNT_SID="your_twilio_sid"
   TWILIO_AUTH_TOKEN="your_twilio_token"
   TWILIO_PHONE_NUMBER="your_twilio_phone"
   
   # App Config
   NEXT_PUBLIC_BASE_URL="http://localhost:3000"
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run migrations
   npx prisma migrate deploy
   
   # Seed sample data
   node scripts/seed-resources.js
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🎯 Usage Guide

### **Creating Emergency Reports**

1. **Manual Entry**: Use the emergency reporting form on the homepage
2. **Voice Calls**: Call the Twilio hotline for voice-to-text emergency creation
3. **API Integration**: Submit emergencies via REST API

### **Emergency Processing Flow**

```
Emergency Reported → AI Classification → Priority Assessment → Action Plan Generation → Resource Assignment → Conversation Created → Real-time Updates → Completion via "done done" → Resources Released
```

### **Resource Management**

1. **Automatic Assignment**: Resources auto-assigned based on emergency type and location
2. **Manual Override**: Responders can manually assign/release resources
3. **Real-time Tracking**: Live status updates across the system
4. **Completion Workflow**: Type "done done" in chat to complete emergency

### **Chat Operations**

- **Message Analysis**: Every message processed by AI for relevance
- **Action Updates**: Significant messages trigger action plan updates  
- **Resource Coordination**: Built-in resource management commands
- **Emergency Completion**: "done done" pattern releases all resources

## 🛠️ API Reference

### **Emergency Management**

```typescript
// Create Emergency
POST /api/reports
{
  "content": "Fire at downtown building",
  "location": "123 Main St",
  "authorName": "John Doe",
  "authorContact": "+1234567890"
}

// Get Dashboard Data
GET /api/dashboard
// Returns: resources, emergencies, performance metrics
```

### **Chat System**

```typescript
// Send Message
POST /api/chat/messages
{
  "conversationId": "conv_123",
  "content": "Fire truck en route",
  "messageType": "STATUS_UPDATE"
}

// Complete Emergency
POST /api/chat/complete
{
  "conversationId": "conv_123",
  "reason": "Emergency resolved successfully"
}
```

### **Resource Management**

```typescript
// Assign Nearest Resources
POST /api/resources/assign-nearest
{
  "emergencyLat": 22.253,
  "emergencyLng": 84.908,
  "requirements": [
    {
      "category": "VEHICLE",
      "type": "Fire Truck",
      "count": 2,
      "maxDistance": 30
    }
  ]
}

// Release Resources
POST /api/resources/release
{
  "conversationId": "conv_123",
  "resourceIds": ["res_1", "res_2"],
  "notes": "Emergency completed"
}
```

## 🤖 AI Integration

### **Cerebras Analysis**
- **Purpose**: Determines if messages require action plan updates
- **Model**: llama-4-scout-17b-16e-instruct
- **Input**: Message content + emergency context + conversation history
- **Output**: Update requirement + reasoning

### **LLaMA Action Planning**
- **Purpose**: Generates comprehensive emergency response plans
- **Input**: Emergency details + location + resources + current situation
- **Output**: Step-by-step action plans with timelines and resource requirements

### **Smart Message Processing**
```typescript
// AI Processing Pipeline
Message → Cerebras Analysis → Update Decision → LLaMA Planning → Action Update
```

## 🗺️ Mapping System

### **Features**
- **Interactive Maps**: Zoom, pan, marker clustering
- **Custom Icons**: Emergency-specific and resource-specific markers
- **Real-time Updates**: Live resource position tracking
- **Distance Calculation**: Haversine formula for accurate measurements

### **Coordinate System**
- **Base Location**: Rourkela, India (22.253°N, 84.908°E)
- **Coverage Area**: 50km radius with smart resource distribution
- **Precision**: Sub-kilometer accuracy for resource positioning

## 📱 Mobile Responsiveness

- **Responsive Design**: Works on all device sizes
- **Touch Optimized**: Mobile-friendly interactions
- **Progressive Enhancement**: Graceful degradation for older devices
- **Performance Optimized**: Fast loading on mobile networks

## 🔧 Development

### **Project Structure**
```
crisis-command/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   ├── chat/              # Chat interface
│   └── dashboard/         # Dashboard pages
├── components/            # React components
├── lib/                   # Utility libraries
├── prisma/               # Database schema & migrations
├── scripts/              # Database seeding scripts
└── types/                # TypeScript type definitions
```

### **Key Components**

- **`ReportingForm`**: Emergency submission interface
- **`ConversationList`**: Real-time emergency feed
- **`ResourceMap`**: Interactive mapping component
- **`ChatMessage`**: Chat interface with AI integration
- **`DataService`**: Centralized data management

### **Database Migrations**

```bash
# Create new migration
npx prisma migrate dev --name your_migration_name

# Reset database (development only)
npx prisma migrate reset
```

### **Testing**

```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Test resource assignment
node scripts/test-assignment.js
```

## 🌐 Deployment

### **Environment Setup**

1. **Production Database**: Set up PostgreSQL on your cloud provider
2. **Environment Variables**: Configure all required API keys
3. **Build & Deploy**: Use Vercel, Netlify, or your preferred platform

### **Build Process**

```bash
# Production build
npm run build

# Start production server
npm start
```

### **Performance Optimization**

- **Image Optimization**: Next.js automatic image optimization
- **Code Splitting**: Automatic bundle splitting
- **Caching**: API response caching with revalidation
- **Database**: Optimized queries with Prisma

## 🔒 Security

- **Input Validation**: All inputs validated and sanitized
- **SQL Injection Protection**: Prisma ORM prevents SQL injection
- **Rate Limiting**: API endpoints protected against abuse
- **Environment Variables**: Sensitive data properly secured

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### **Development Guidelines**

- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Add proper error handling
- Write descriptive commit messages
- Test your changes thoroughly

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team** - For the amazing React framework
- **Prisma Team** - For the excellent ORM
- **Cerebras** - For AI processing capabilities
- **Twilio** - For voice communication infrastructure
- **Leaflet** - For interactive mapping solutions

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Gautam-2604/disaster-mgmt/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Gautam-2604/disaster-mgmt/discussions)
- **Email**: support@crisiscommand.dev

---

<div align="center">

**Built with ❤️ for emergency responders worldwide**

![Crisis Command](https://img.shields.io/badge/Crisis%20Command-Emergency%20Response%20System-red?style=for-the-badge)

</div>
