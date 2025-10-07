'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ConversationItem {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  emergencyMessage?: {
    category: string;
    priority: string;
    rawContent: string;
    estimatedCount?: number;
  }[];
}

export default function ConversationList() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/chat/conversations');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setConversations(result.data || []);
      } else {
        console.error('API error:', result.error);
        setConversations([]);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
      case 'LIFE_THREATENING':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'RESCUE':
        return '🚑';
      case 'MEDICAL':
        return '🏥';
      case 'FIRE':
        return '🔥';
      case 'FLOOD':
        return '🌊';
      case 'EARTHQUAKE':
        return '🌍';
      case 'FOOD':
        return '🍞';
      case 'SHELTER':
        return '🏠';
      default:
        return '⚠️';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'RESOLVED':
        return 'bg-gray-100 text-gray-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="h-full bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Previous Reports</h2>
          <div className="animate-pulse bg-gray-200 h-6 w-16 rounded-full"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-12"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white rounded-lg shadow-lg p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Previous Reports</h2>
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
          {conversations.length} reports
        </span>
      </div>

      {conversations.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="font-medium text-gray-700 mb-1">No previous reports found</h3>
          <p className="text-sm">Submit your first emergency report to get started</p>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700">
              💡 Reports will appear here after submission and AI processing
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3 h-full overflow-y-auto p-4">
          {conversations.map((conversation) => {
            const emergency = conversation.emergencyMessage?.[0];
            return (
              <Link
                key={conversation.id}
                href={`/chat/${conversation.id}`}
                className="block p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 hover:border-blue-200 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {emergency && (
                      <>
                        <span className="text-base sm:text-lg">{getCategoryIcon(emergency.category)}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(emergency.priority)} ${emergency.priority === 'CRITICAL' ? 'priority-critical' : ''}`}>
                          {emergency.priority}
                        </span>
                      </>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(conversation.status)}`}>
                    {conversation.status}
                  </span>
                </div>

                <h3 className="font-medium text-gray-900 mb-1 line-clamp-1 text-sm sm:text-base">
                  {conversation.title}
                </h3>

                {emergency && (
                  <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2 leading-relaxed">
                    {emergency.rawContent}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {new Date(conversation.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  {emergency?.estimatedCount && (
                    <span className="bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      ~{emergency.estimatedCount} affected
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={fetchConversations}
          disabled={isLoading}
          className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg 
            className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isLoading ? 'Refreshing...' : 'Refresh Reports'}
        </button>
      </div>
    </div>
  );
}
