'use client';

import { useState } from 'react';
import ConversationList from '@/components/ConversationList';
import ReportingForm from '@/components/ReportingForm';
import DetailedReport from '@/components/DetailedReport';

export default function Home() {
  const [latestReport, setLatestReport] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleReportSubmitted = (response: any) => {
    setLatestReport(response);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
              🚨 Emergency Response Command Center
            </h1>
            <p className="text-base sm:text-lg text-gray-600 mb-6 max-w-3xl mx-auto">
              AI-Powered Disaster Management & Real-Time Coordination System
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-6">
              <span className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium border border-blue-300 shadow-sm">
                🚀 Cerebras Ultra-Fast Classification
              </span>
              <span className="bg-gradient-to-r from-green-100 to-green-200 text-green-800 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium border border-green-300 shadow-sm">
                🧠 LLaMA-3.1-70B Action Planning
              </span>
              <span className="bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium border border-purple-300 shadow-sm">
                💬 Real-Time Chat Updates
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Three Column Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          {/* Left Column - Previous Conversations */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <div className="sticky top-6">
              <ConversationList key={refreshTrigger} />
            </div>
          </div>

          {/* Center Column - Reporting Form */}
          <div className="lg:col-span-5 order-1 lg:order-2">
            <ReportingForm onReportSubmitted={handleReportSubmitted} />
          </div>

          {/* Right Column - Detailed Report */}
          <div className="lg:col-span-4 order-3 lg:order-3">
            <div className="sticky top-6">
              <DetailedReport 
                latestReport={latestReport} 
                onRefresh={handleRefresh}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-8 lg:mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
              <span className="flex items-center gap-1">
                <span className="text-yellow-500">⚡</span>
                Two-stage AI pipeline for emergency response
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1">
                <span className="text-blue-500">🔄</span>
                Real-time updates and coordination
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1">
                <span className="text-green-500">📊</span>
                Comprehensive resource tracking
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium text-green-600">System Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
