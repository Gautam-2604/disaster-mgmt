'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MessageType, ConversationStatus, ParticipantRole } from '@/types';

interface ChatMessage {
  id: string;
  conversationId: string;
  senderId?: string;
  content: string;
  messageType: string;
  triggersUpdate: boolean;
  aiProcessed: boolean;
  sender?: {
    id: string;
    name: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Conversation {
  id: string;
  title: string;
  status: string;
  currentActions?: string;
  emergencyMessage?: any[];
}

interface ChatPageProps {
  params: Promise<{ id: string }>;
}

export default function ChatPage({ params }: ChatPageProps) {
  const router = useRouter();
  const [conversationId, setConversationId] = useState<string>('');
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function getParams() {
      const resolvedParams = await params;
      setConversationId(resolvedParams.id);
    }
    getParams();
  }, [params]);

  useEffect(() => {
    if (conversationId) {
      loadConversation();
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversation = async () => {
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}`);
      const result = await response.json();

      if (result.success) {
        setConversation(result.data.conversation);
        setMessages(result.data.messages);
      } else {
        console.error('Failed to load conversation:', result.error);
        router.push('/');
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    const messageContent = newMessage;
    setNewMessage('');

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          content: messageContent,
          messageType: MessageType.TEXT, // Every message is now processed by AI
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Reload conversation immediately to show the new message
        await loadConversation();
        
        // Wait a bit longer for AI processing, then reload again
        setTimeout(() => {
          loadConversation();
        }, 5000); // Wait 5 seconds for full AI pipeline processing
      } else {
        console.error('Failed to send message:', result.error);
        alert('Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Network error. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageIcon = (messageType: string) => {
    switch (messageType) {
      case 'ACTION_PLAN':
        return '🤖';
      case 'STATUS_UPDATE':
        return '📊';
      case 'RESOURCE_UPDATE':
        return '🚛';
      case 'LOCATION_UPDATE':
        return '📍';
      case 'SYSTEM':
        return '⚙️';
      default:
        return '💬';
    }
  };

  const getPriorityColor = () => {
    if (!conversation?.emergencyMessage?.[0]) return 'bg-gray-100';
    
    const priority = conversation.emergencyMessage[0].priority;
    switch (priority) {
      case 'CRITICAL':
      case 'LIFE_THREATENING':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading emergency conversation...</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Conversation Not Found</h1>
          <p className="text-gray-600 mb-4">The emergency conversation you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back to Reports
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{conversation.title}</h1>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor()}`}>
                  {conversation.emergencyMessage?.[0]?.priority || 'Unknown'} Priority
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  conversation.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                  conversation.status === 'RESOLVED' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {conversation.status}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-500">
              Emergency ID: {conversation.emergencyMessage?.[0]?.id?.slice(-8) || 'N/A'}
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" title="Live Updates"></div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          {/* Messages List */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderId ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-3xl ${
                  message.senderId 
                    ? 'bg-blue-600 text-white rounded-l-lg rounded-tr-lg' 
                    : 'bg-white text-gray-900 rounded-r-lg rounded-tl-lg shadow-sm border'
                } px-4 py-3`}>
                  {/* Message Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">
                        {getMessageIcon(message.messageType)}
                      </span>
                      <span className={`text-xs font-medium ${
                        message.senderId ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {message.senderId ? (message.sender?.name || 'You') : 'AI Assistant'}
                      </span>
                      {message.triggersUpdate && (
                        <span className={`px-2 py-1 rounded text-xs ${
                          message.senderId 
                            ? 'bg-blue-500 text-blue-100' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {message.aiProcessed ? '✅ Processed' : '⏳ Processing...'}
                        </span>
                      )}
                    </div>
                    <span className={`text-xs ${
                      message.senderId ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatTimestamp(message.createdAt)}
                    </span>
                  </div>
                  
                  {/* Message Content */}
                  <div className={`${
                    message.messageType === 'ACTION_PLAN' ? 'prose prose-sm' : ''
                  }`}>
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t bg-white px-4 py-4">
            <form onSubmit={sendMessage} className="space-y-3">
              {/* AI Processing Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <div className="text-blue-600">🤖</div>
                  <div className="text-sm text-blue-800">
                    <strong>AI-Powered Chat:</strong> Every message is analyzed by Cerebras to determine if action plans need updates
                  </div>
                </div>
              </div>

              {/* Message Input */}
              <div className="flex space-x-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Send updates, ask questions, or coordinate the emergency response..."
                  rows={3}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-black"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isSending}
                  className={`px-6 py-2 rounded-md font-medium self-end ${
                    !newMessage.trim() || isSending
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  } transition-colors`}
                >
                  {isSending ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    '🧠 Send'
                  )}
                </button>
              </div>

              {/* Help Text */}
              <div className="text-xs text-gray-500 space-y-1">
                <p>💡 <strong>Smart AI Processing:</strong> Cerebras analyzes every message to determine if action plans need updates</p>
                <p>� <strong>Auto-Updates:</strong> When important changes are detected, LLaMA generates new action plans automatically</p>
                <p>⚡ <strong>Real-time:</strong> Emergency status and resources are updated based on your messages</p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
