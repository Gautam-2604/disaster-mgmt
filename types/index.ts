// Enums from Prisma schema
export enum UserRole {
  RESPONDER = 'RESPONDER',
  DISPATCHER = 'DISPATCHER',
  ADMIN = 'ADMIN'
}

export enum MessageSource {
  TWITTER = 'TWITTER',
  SMS = 'SMS',
  FACEBOOK = 'FACEBOOK',
  INSTAGRAM = 'INSTAGRAM',
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL',
  PHONE_CALL = 'PHONE_CALL',
  MANUAL_ENTRY = 'MANUAL_ENTRY',
  OTHER = 'OTHER'
}

export enum MessageCategory {
  RESCUE = 'RESCUE',
  MEDICAL = 'MEDICAL',
  FOOD = 'FOOD',
  SHELTER = 'SHELTER',
  WATER = 'WATER',
  INFORMATION = 'INFORMATION',
  FALSE_ALARM = 'FALSE_ALARM'
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  LIFE_THREATENING = 'LIFE_THREATENING'
}

export enum LocationSource {
  GPS = 'GPS',
  USER_PROVIDED = 'USER_PROVIDED',
  AI_INFERRED = 'AI_INFERRED',
  UNKNOWN = 'UNKNOWN'
}

export enum MessageStatus {
  UNPROCESSED = 'UNPROCESSED',
  AI_CLASSIFIED = 'AI_CLASSIFIED',
  ACTION_GENERATED = 'ACTION_GENERATED',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',  
  DUPLICATE = 'DUPLICATE',
  INVALID = 'INVALID'
}

// Chat system enums
export enum ConversationStatus {
  ACTIVE = 'ACTIVE',
  RESOLVED = 'RESOLVED',
  ESCALATED = 'ESCALATED',
  ARCHIVED = 'ARCHIVED'
}

export enum ParticipantRole {
  REPORTER = 'REPORTER',
  RESPONDER = 'RESPONDER',
  DISPATCHER = 'DISPATCHER',
  AI_ASSISTANT = 'AI_ASSISTANT',
  ADMIN = 'ADMIN'
}

export enum MessageType {
  TEXT = 'TEXT',
  STATUS_UPDATE = 'STATUS_UPDATE',
  ACTION_PLAN = 'ACTION_PLAN', 
  RESOURCE_UPDATE = 'RESOURCE_UPDATE',
  LOCATION_UPDATE = 'LOCATION_UPDATE',
  SYSTEM = 'SYSTEM'
}

// Base types
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  assignedMessages?: EmergencyMessage[];
}

export interface EmergencyMessage {
  id: string;
  rawContent: string;
  source: MessageSource;
  sourceId?: string;
  authorName?: string;
  authorContact?: string;
  
  // AI Classification (Cerebras inference)
  category?: MessageCategory;
  priority?: Priority;
  confidence?: number; // 0-1
  
  // Location data
  latitude?: number;
  longitude?: number;
  address?: string;
  locationSource?: LocationSource;
  
  // LLaMA Generated Action
  actionSteps?: string;
  resourcesNeeded?: string;
  estimatedCount?: number;
  
  // Triage & Assignment
  status: MessageStatus;
  assignedTo?: string;
  assignedUser?: User;
  
  // Chat Conversation
  conversationId?: string;
  conversation?: Conversation;
  
  // Metadata
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Chat system interfaces
export interface Conversation {
  id: string;
  title: string;
  status: ConversationStatus;
  currentActions?: string; // Latest AI-generated action plan
  lastUpdated: Date;
  
  // Relations
  emergencyMessage?: EmergencyMessage[];
  participants?: ConversationParticipant[];
  messages?: ChatMessage[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  role: ParticipantRole;
  joinedAt: Date;
  lastSeenAt: Date;
  
  // Relations
  conversation?: Conversation;
  user?: User;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId?: string; // null for AI messages
  content: string;
  messageType: MessageType;
  
  // AI Processing
  triggersUpdate: boolean; // Does this message trigger action plan update?
  aiProcessed: boolean;    // Has AI processed this update?
  
  // Relations
  conversation?: Conversation;
  sender?: User;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Create/Update types (for forms and API)
export interface CreateEmergencyMessage {
  rawContent: string;
  source: MessageSource;
  sourceId?: string;
  authorName?: string;
  authorContact?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  locationSource?: LocationSource;
}

export interface UpdateEmergencyMessage {
  category?: MessageCategory;
  priority?: Priority;
  confidence?: number;
  actionSteps?: string;
  resourcesNeeded?: string;
  estimatedCount?: number;
  status?: MessageStatus;
  assignedTo?: string;
  processedAt?: Date;
}

export interface CreateUser {
  email: string;
  name: string;
  phone?: string;
  role?: UserRole;
}

export interface UpdateUser {
  email?: string;
  name?: string;
  phone?: string;
  role?: UserRole;
}

// Dashboard and UI specific types
export interface MessageStats {
  total: number;
  unprocessed: number;
  inProgress: number;
  completed: number;
  byCategory: Record<MessageCategory, number>;
  byPriority: Record<Priority, number>;
  bySource: Record<MessageSource, number>;
}

export interface DashboardData {
  recentMessages: EmergencyMessage[];
  stats: MessageStats;
  activeResponders: User[];
  priorityMessages: EmergencyMessage[];
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Filter and search types
export interface MessageFilters {
  status?: MessageStatus[];
  category?: MessageCategory[];
  priority?: Priority[];
  source?: MessageSource[];
  assignedTo?: string;
  dateFrom?: Date;
  dateTo?: Date;
  hasLocation?: boolean;
}

export interface MessageSearchParams extends MessageFilters {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'priority' | 'status' | 'category';
  sortOrder?: 'asc' | 'desc';
}

// Location related types
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationData extends Coordinates {
  address?: string;
  source: LocationSource;
}

// AI Processing types
export interface AIClassificationResult {
  category: MessageCategory;
  priority: Priority;
  confidence: number;
  actionSteps?: string;
  resourcesNeeded?: string;
  estimatedCount?: number;
}

export interface ProcessingQueue {
  messageId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  stage: 'classification' | 'action_generation';
  error?: string;
}

// Voice Call types
export interface VoiceCall {
  id: string;
  callSid: string;
  fromNumber: string;
  toNumber: string;
  status: string;
  recordingUrl?: string;
  transcription?: string;
  transcriptionConfidence?: number;
  emergencyMessageId?: string;
  conversationId?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface VoiceCallProcessingResult {
  callSid: string;
  transcription: string;
  confidence: number;
  emergencyId?: string;
  conversationId?: string;
  classification?: {
    category: MessageCategory;
    priority: Priority;
    confidence: number;
  };
  resourcesAssigned: string[];
}

// Chat API types
export interface CreateChatMessage {
  conversationId: string;
  content: string;
  messageType?: MessageType;
  triggersUpdate?: boolean;
}

export interface ChatMessageResponse {
  success: boolean;
  data?: ChatMessage;
  error?: string;
}

export interface ConversationResponse {
  success: boolean;
  data?: {
    conversation: Conversation;
    messages: ChatMessage[];
    participants: ConversationParticipant[];
  };
  error?: string;
}

export interface UpdateActionPlanRequest {
  conversationId: string;
  newInformation: string;
  messageType: MessageType;
}

export interface UpdatedActionPlan {
  previousActions: string;
  newActions: string;
  changes: string[];
  reasoning: string;
}
