'use client';

import { useState, useEffect } from 'react';
import ConversationList from '@/components/ConversationList';
import ReportingForm from '@/components/ReportingForm';

interface ReportResponse {
  success: boolean;
  data?: {
    id: string;
    conversationId: string;
    classification: {
      category: string;
      priority: string;
      confidence: number;
    };
    actions: {
      steps: string[];
      resources: string[];
      estimatedCount: number;
    };
    resourceAssignment: {
      assigned: unknown[];
      status: string;
    };
  };
  message?: string;
  error?: string;
}

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [systemStats, setSystemStats] = useState({ emergencies: 0, resources: 0, responseTime: 0 });

  const handleReportSubmitted = (response: ReportResponse) => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Fetch system stats for dashboard
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard');
        const data = await response.json();
        if (data.success) {
          setSystemStats({
            emergencies: data.data.emergencies?.stats?.active || 0,
            resources: data.data.resources?.stats?.available || 0,
            responseTime: Math.round(Math.random() * 30 + 10) // Mock response time
          });
        }
      } catch (error) {
        console.error('Failed to fetch system stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-x-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -inset-10 opacity-20">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Header */}
      <div className="relative bg-black/20 backdrop-blur-lg border-b border-white/10 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            {/* Main Title */}
            <div className="relative inline-block">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 mb-3 drop-shadow-2xl">
                ⚡ CRISIS COMMAND
              </h1>
              <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg blur opacity-20 animate-pulse"></div>
            </div>
            
            <p className="text-base sm:text-lg text-gray-200 mb-6 max-w-3xl mx-auto font-medium leading-relaxed">
              Next-Generation AI Emergency Response System
            </p>

            {/* Live Stats Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6 max-w-2xl mx-auto">
              <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-sm border border-red-500/30 rounded-xl p-4 shadow-xl hover:shadow-red-500/20 transition-all duration-300">
                <div className="text-2xl font-bold text-red-400">{systemStats.emergencies}</div>
                <div className="text-red-200 text-xs font-medium">Active Emergencies</div>
              </div>
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-4 shadow-xl hover:shadow-blue-500/20 transition-all duration-300">
                <div className="text-2xl font-bold text-blue-400">{systemStats.resources}</div>
                <div className="text-blue-200 text-xs font-medium">Available Resources</div>
              </div>
              <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm border border-green-500/30 rounded-xl p-4 shadow-xl hover:shadow-green-500/20 transition-all duration-300">
                <div className="text-2xl font-bold text-green-400">{systemStats.responseTime}s</div>
                <div className="text-green-200 text-xs font-medium">Avg Response Time</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Modern Grid Layout */}
      <div className="relative max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-6">
          {/* Left Column - Conversations with Glass Effect */}
          <div className="lg:col-span-4 order-2 lg:order-1">
            <div className="sticky top-4">
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl overflow-hidden">
                <div className="p-4 border-b border-white/10 flex-shrink-0">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    Live Feed
                  </h3>
                </div>
                <div className="flex-1 overflow-hidden">
                  <ConversationList key={refreshTrigger} />
                </div>
              </div>
            </div>
          </div>

          {/* Center Column - Emergency Reporting */}
          <div className="lg:col-span-8 order-1 lg:order-2">
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-2xl">🆘</span>
                  Emergency Report
                </h3>
                <p className="text-gray-300 text-sm mt-1">AI-powered emergency classification</p>
              </div>
              <ReportingForm onReportSubmitted={handleReportSubmitted} />
            </div>
          </div>

          
        </div>
      </div>

      {/* Footer with Modern Design */}
      <div className="relative bg-black/20 backdrop-blur-lg border-t border-white/10 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-6 text-center sm:text-left">
              <div className="flex items-center gap-2 text-gray-300 text-sm">
                <span className="text-yellow-400">⚡</span>
                <span>AI Processing</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300 text-sm">
                <span className="text-blue-400">🔄</span>
                <span>Real-time Updates</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300 text-sm">
                <span className="text-green-400">📊</span>
                <span>Smart Analytics</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-30"></div>
              </div>
              <span className="font-semibold text-green-400 text-sm">SYSTEM OPERATIONAL</span>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
