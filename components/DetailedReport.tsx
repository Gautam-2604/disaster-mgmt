'use client';

import { useState, useEffect } from 'react';

interface LatestReport {
  data?: {
    classification?: {
      priority?: string;
      category?: string;
    };
    status?: string;
    conversationId?: string;
  };
}

interface ActiveReport {
  id: string;
  category: string;
  priority: string;
  location: string;
  timeElapsed: string;
  resourcesAssigned: string[];
}

interface DetailedReportProps {
  latestReport?: LatestReport;
  onRefresh?: () => void;
}

interface ReportStats {
  totalReports: number;
  activeReports: number;
  resolvedReports: number;
  criticalReports: number;
  resourcesDeployed: {
    personnel: number;
    vehicles: number;
    equipment: number;
  };
  responseTime: {
    average: number;
    fastest: number;
  };
}

export default function DetailedReport({ latestReport, onRefresh }: DetailedReportProps) {
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [activeReports, setActiveReports] = useState<ActiveReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReportStats();
  }, [latestReport]);

  const fetchReportStats = async () => {
    try {
      // Mock data for now - in real app, fetch from API
      setStats({
        totalReports: 127,
        activeReports: 8,
        resolvedReports: 119,
        criticalReports: 3,
        resourcesDeployed: {
          personnel: 45,
          vehicles: 12,
          equipment: 28
        },
        responseTime: {
          average: 4.2,
          fastest: 1.8
        }
      });

      setActiveReports([
        {
          id: '1',
          category: 'FIRE',
          priority: 'CRITICAL',
          location: 'Downtown Block 5',
          timeElapsed: '15 min',
          resourcesAssigned: ['Fire Dept Unit 3', 'Ambulance 7', 'Police Unit 12']
        },
        {
          id: '2',
          category: 'RESCUE',
          priority: 'HIGH',
          location: 'Highway 101 Mile 45',
          timeElapsed: '32 min',
          resourcesAssigned: ['Rescue Team Alpha', 'Medical Unit 2']
        },
        {
          id: '3',
          category: 'FLOOD',
          priority: 'MEDIUM',
          location: 'Riverside District',
          timeElapsed: '1.2 hrs',
          resourcesAssigned: ['Flood Response Team', 'Evacuation Bus 4']
        }
      ]);
    } catch (error) {
      console.error('Failed to fetch report stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
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
      case 'RESCUE': return '🚑';
      case 'MEDICAL': return '🏥';
      case 'FIRE': return '🔥';
      case 'FLOOD': return '🌊';
      case 'EARTHQUAKE': return '🌍';
      default: return '⚠️';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 h-full">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">System Overview</h2>
        <button
          onClick={onRefresh}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Latest Report */}
      {latestReport && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">🆕 Latest Report</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(latestReport.data?.classification?.priority || 'MEDIUM')}`}>
                {latestReport.data?.classification?.priority || 'Processing...'}
              </span>
              <span className="text-sm text-gray-600">
                {latestReport.data?.classification?.category || 'Analyzing...'}
              </span>
            </div>
            <p className="text-sm text-gray-700">
              Status: <span className="font-medium">{latestReport.data?.status || 'Processing'}</span>
            </p>
            {latestReport.data?.conversationId && (
              <button
                onClick={() => window.location.href = `/chat/${latestReport.data?.conversationId}`}
                className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
              >
                View Chat →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Statistics */}
      {stats && (
        <div className="space-y-6">
          {/* Overview Stats */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">📊 System Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.totalReports}</div>
                <div className="text-sm text-blue-700">Total Reports</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.resolvedReports}</div>
                <div className="text-sm text-green-700">Resolved</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.activeReports}</div>
                <div className="text-sm text-orange-700">Active</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{stats.criticalReports}</div>
                <div className="text-sm text-red-700">Critical</div>
              </div>
            </div>
          </div>

          {/* Resources Deployed */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">🚛 Resources Deployed</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span>👥</span>
                  <span className="text-sm font-medium">Personnel</span>
                </div>
                <span className="font-bold text-blue-600">{stats.resourcesDeployed.personnel}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span>🚗</span>
                  <span className="text-sm font-medium">Vehicles</span>
                </div>
                <span className="font-bold text-green-600">{stats.resourcesDeployed.vehicles}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span>🛠️</span>
                  <span className="text-sm font-medium">Equipment</span>
                </div>
                <span className="font-bold text-purple-600">{stats.resourcesDeployed.equipment}</span>
              </div>
            </div>
          </div>

          {/* Response Time */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">⏱️ Response Performance</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium">Average Response Time</span>
                <span className="font-bold text-blue-600">{stats.responseTime.average} min</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium">Fastest Response</span>
                <span className="font-bold text-green-600">{stats.responseTime.fastest} min</span>
              </div>
            </div>
          </div>

          {/* Active Reports */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">🔥 Active Emergencies</h3>
            <div className="space-y-3">
              {activeReports.map((report) => (
                <div key={report.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span>{getCategoryIcon(report.category)}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(report.priority)}`}>
                        {report.priority}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{report.timeElapsed}</span>
                  </div>
                  
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    📍 {report.location}
                  </div>
                  
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">Resources:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {report.resourcesAssigned.map((resource: string, index: number) => (
                        <span key={index} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                          {resource}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Performance */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">🤖 AI Performance</h3>
            <div className="space-y-3">
              <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Cerebras Classification</span>
                  <span className="text-green-600 font-bold">98.7%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{width: '98.7%'}}></div>
                </div>
              </div>
              
              <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">LLaMA Action Planning</span>
                  <span className="text-blue-600 font-bold">96.3%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{width: '96.3%'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
