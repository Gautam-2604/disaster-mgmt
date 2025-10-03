'use client';

import { useEffect, useState } from 'react';
import { ResourceCategory, ResourceStatus, MessageCategory, Priority, AssignmentStatus } from '@/types';

interface DashboardData {
  resources: {
    list: any[];
    stats: {
      total: number;
      available: number;
      assigned: number;
      inUse: number;
      maintenance: number;
      outOfService: number;
      byCategory: Record<string, any>;
    };
  };
  emergencies: {
    active: any[];
    stats: {
      active: number;
      byPriority: Record<string, number>;
      byCategory: Record<string, number>;
    };
  };
  performance: {
    responseTime: number;
    resolutionRate: number;
    resourceUtilization: number;
  };
}

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<ResourceStatus | 'ALL'>('ALL');

  useEffect(() => {
    fetchDashboardData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard');
      const result = await response.json();
      
      setDashboardData(result.data);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const filteredResources = dashboardData?.resources.items.filter(resource => {
    const categoryMatch = selectedCategory === 'ALL' || resource.type.category === selectedCategory;
    const statusMatch = selectedStatus === 'ALL' || resource.status === selectedStatus;
    return categoryMatch && statusMatch;
  }) || [];

  const getStatusColor = (status: ResourceStatus) => {
    switch (status) {
      case ResourceStatus.AVAILABLE:
        return 'text-green-600 bg-green-100';
      case ResourceStatus.ASSIGNED:
        return 'text-yellow-600 bg-yellow-100';
      case ResourceStatus.IN_USE:
        return 'text-blue-600 bg-blue-100';
      case ResourceStatus.MAINTENANCE:
        return 'text-orange-600 bg-orange-100';
      case ResourceStatus.OUT_OF_SERVICE:
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.CRITICAL:
      case Priority.LIFE_THREATENING:
        return 'text-red-600 bg-red-100';
      case Priority.HIGH:
        return 'text-orange-600 bg-orange-100';
      case Priority.MEDIUM:
        return 'text-yellow-600 bg-yellow-100';
      case Priority.LOW:
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryIcon = (category: ResourceCategory) => {
    switch (category) {
      case ResourceCategory.PERSONNEL:
        return '👥';
      case ResourceCategory.VEHICLE:
        return '🚗';
      case ResourceCategory.EQUIPMENT:
        return '🛠️';
      case ResourceCategory.FACILITY:
        return '🏢';
      case ResourceCategory.SUPPLY:
        return '📦';
      default:
        return '📋';
    }
  };

  const getEmergencyIcon = (category: MessageCategory) => {
    switch (category) {
      case MessageCategory.RESCUE:
        return '🚒';
      case MessageCategory.MEDICAL:
        return '🚑';
      case MessageCategory.FOOD:
        return '🍲';
      case MessageCategory.SHELTER:
        return '🏠';
      case MessageCategory.WATER:
        return '💧';
      case MessageCategory.INFORMATION:
        return 'ℹ️';
      default:
        return '🚨';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg font-semibold">Dashboard Error</p>
          <p className="text-gray-600 mt-2">{error || 'Failed to load dashboard data'}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Emergency Management Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Real-time resource monitoring and emergency response coordination
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                dashboardData.summary.systemStatus === 'operational' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  dashboardData.summary.systemStatus === 'operational' ? 'bg-green-500' : 'bg-yellow-500'
                } animate-pulse`}></div>
                <span>{dashboardData.summary.systemStatus === 'operational' ? 'Operational' : 'Maintenance'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🚨</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Active Emergencies</h3>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.summary.activeEmergencies}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">⚠️</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Critical Emergencies</h3>
                <p className="text-2xl font-bold text-red-600">{dashboardData.summary.criticalEmergencies}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🛠️</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Available Resources</h3>
                <p className="text-2xl font-bold text-green-600">
                  {dashboardData.summary.availableResources}/{dashboardData.summary.totalResources}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">📊</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Resource Utilization</h3>
                <p className="text-2xl font-bold text-purple-600">{dashboardData.summary.resourceUtilization}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Resource Management */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Resource Management</h2>
                  <div className="flex space-x-2">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value as ResourceCategory | 'ALL')}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="ALL">All Categories</option>
                      {Object.values(ResourceCategory).map(category => (
                        <option key={category} value={category}>
                          {getCategoryIcon(category)} {category}
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value as ResourceStatus | 'ALL')}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="ALL">All Status</option>
                      {Object.values(ResourceStatus).map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Resource Statistics */}
              <div className="p-6 border-b border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{dashboardData.resources.stats.total}</p>
                    <p className="text-sm text-gray-500">Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{dashboardData.resources.stats.available}</p>
                    <p className="text-sm text-gray-500">Available</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">{dashboardData.resources.stats.assigned}</p>
                    <p className="text-sm text-gray-500">Assigned</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{dashboardData.resources.stats.inUse}</p>
                    <p className="text-sm text-gray-500">In Use</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{dashboardData.resources.stats.maintenance}</p>
                    <p className="text-sm text-gray-500">Maintenance</p>
                  </div>
                </div>
              </div>

              {/* Resource List */}
              <div className="max-h-96 overflow-y-auto">
                {filteredResources.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No resources match the selected filters
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredResources.map((resource) => (
                      <div key={resource.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="text-2xl mr-3">{getCategoryIcon(resource.type.category)}</span>
                            <div>
                              <h3 className="text-sm font-medium text-gray-900">{resource.name}</h3>
                              <p className="text-sm text-gray-500">{resource.type.name} • {resource.location}</p>
                              {resource.assignedToConversation && (
                                <p className="text-xs text-blue-600 mt-1">
                                  Assigned to: {resource.assignedToConversation.emergencyMessage?.rawContent?.substring(0, 50)}...
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(resource.status)}`}>
                              {resource.status}
                            </span>
                            <span className="text-sm text-gray-500">Cap: {resource.capacity}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active Emergencies & System Info */}
          <div className="space-y-6">
            {/* Active Emergencies */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Active Emergencies</h2>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {dashboardData.emergencies.active.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No active emergencies
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {dashboardData.emergencies.active.map((emergency) => (
                      <div key={emergency.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start">
                            <span className="text-xl mr-3">
                              {getEmergencyIcon(emergency.emergencyMessage?.category)}
                            </span>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {emergency.emergencyMessage?.rawContent?.substring(0, 80)}...
                              </p>
                              <div className="flex items-center mt-1 space-x-2">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  getPriorityColor(emergency.emergencyMessage?.priority)
                                }`}>
                                  {emergency.emergencyMessage?.priority}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {emergency.emergencyMessage?.address || 'Location unknown'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {emergency._count.resourceAssignments} resources assigned
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* System Performance */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">System Performance</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Avg Response Time</span>
                  <span className="text-sm font-medium">{dashboardData.performance.averageResponseTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Active Responders</span>
                  <span className="text-sm font-medium">{dashboardData.performance.activeResponders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total Dispatchers</span>
                  <span className="text-sm font-medium">{dashboardData.performance.totalDispatchers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">System Load</span>
                  <span className="text-sm font-medium">{Math.round(dashboardData.performance.systemLoad * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Uptime</span>
                  <span className="text-sm font-medium text-green-600">{dashboardData.performance.uptime}</span>
                </div>
              </div>
            </div>

            {/* Resource Categories Overview */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Resources by Category</h2>
              </div>
              <div className="p-6">
                {Object.entries(dashboardData.resources.stats.byCategory).map(([category, stats]: [string, any]) => (
                  <div key={category} className="mb-4 last:mb-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{getCategoryIcon(category as ResourceCategory)}</span>
                        <span className="text-sm font-medium text-gray-900">{category}</span>
                      </div>
                      <span className="text-sm text-gray-500">{stats.available}/{stats.total}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${stats.total > 0 ? (stats.available / stats.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
