'use client';

import { useEffect, useState } from 'react';
import { ResourceCategory, ResourceStatus } from '@/types';
import ResourceMap from '@/components/ResourceMap';
import LocationTest from '@/components/LocationTest';

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

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<ResourceStatus | 'ALL'>('ALL');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard');
      const result = await response.json();
      
      if (result.success) {
        setDashboardData(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearAllEmergencies = async () => {
    try {
      const response = await fetch('/api/dashboard', {
        method: 'DELETE'
      });
      const result = await response.json();
      
      if (result.success) {
        await fetchDashboardData(); // Refresh data
        alert('All emergencies cleared successfully');
      } else {
        alert('Failed to clear emergencies: ' + result.error);
      }
    } catch (err) {
      alert('Network error occurred while clearing emergencies');
      console.error('Clear emergencies error:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const filteredResources = dashboardData?.resources.list.filter(resource => {
    if (selectedCategory !== 'ALL' && resource.category !== selectedCategory) return false;
    if (selectedStatus !== 'ALL' && resource.status !== selectedStatus) return false;
    return true;
  }) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md">
          <h2 className="text-red-800 text-xl font-semibold mb-2">Error Loading Dashboard</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-800';
      case 'ASSIGNED': return 'bg-yellow-100 text-yellow-800';
      case 'IN_USE': return 'bg-red-100 text-red-800';
      case 'MAINTENANCE': return 'bg-gray-100 text-gray-800';
      case 'OUT_OF_SERVICE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'PERSONNEL': return '👨‍⚕️';
      case 'VEHICLE': return '🚑';
      case 'EQUIPMENT': return '🔧';
      case 'FACILITY': return '🏥';
      case 'SUPPLY': return '📦';
      default: return '❓';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Emergency Management Dashboard</h1>
              <p className="text-gray-600">Resource monitoring and emergency coordination</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={clearAllEmergencies}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Clear All Emergencies
              </button>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  autoRefresh 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                }`}
              >
                Auto Refresh: {autoRefresh ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={fetchDashboardData}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Now
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">🚨</span>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Active Emergencies</h3>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.emergencies.stats.active}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Available Resources</h3>
                <p className="text-2xl font-bold text-green-600">
                  {dashboardData.resources.stats.available}/{dashboardData.resources.stats.total}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-2xl">⚡</span>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Resource Utilization</h3>
                <p className="text-2xl font-bold text-yellow-600">{dashboardData.performance.resourceUtilization}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-2xl">⏱️</span>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Avg Response Time</h3>
                <p className="text-2xl font-bold text-purple-600">{dashboardData.performance.responseTime.toFixed(1)}m</p>
              </div>
            </div>
          </div>
        </div>

        {/* Test Emergency Creation */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">🧪 Test Nearest Resource Assignment</h2>
            <p className="text-sm text-gray-600 mt-1">Create a test emergency using your location to see nearest resource assignment in action</p>
          </div>
          <div className="p-6">
            <LocationTest onEmergencyCreated={() => fetchDashboardData()} />
          </div>
        </div>

        {/* Resource and Emergency Map */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Resource Locations & Active Emergencies</h2>
            <p className="text-sm text-gray-600 mt-1">Real-time view of resource positions and emergency locations</p>
          </div>
          <div className="p-6">
            <ResourceMap 
              resources={dashboardData.resources.list}
              emergencies={dashboardData.emergencies.active}
              className="h-96"
            />
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Resource Categories</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {Object.entries(dashboardData.resources.stats.byCategory).map(([category, stats]: [string, any]) => (
                <div key={category} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{getCategoryIcon(category)}</span>
                    <span className="text-sm font-medium text-gray-600">{category}</span>
                  </div>
                  <div className="space-y-1 text-sm text-black ">
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span className="font-semibold">{stats.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Available:</span>
                      <span className="text-green-600 font-semibold">{stats.available}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>In Use:</span>
                      <span className="text-red-600 font-semibold">{stats.assigned + stats.inUse}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resources List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">All Resources</h2>
              <div className="flex space-x-4 text-black">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as ResourceCategory | 'ALL')}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="ALL">All Categories</option>
                  <option value="PERSONNEL">Personnel</option>
                  <option value="VEHICLE">Vehicles</option>
                  <option value="EQUIPMENT">Equipment</option>
                  <option value="FACILITY">Facilities</option>
                  <option value="SUPPLY">Supplies</option>
                </select>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as ResourceStatus | 'ALL')}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="IN_USE">In Use</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="OUT_OF_SERVICE">Out of Service</option>
                </select>
              </div>
            </div>
          </div>
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignment</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredResources.map((resource) => (
                  <tr key={resource.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{getCategoryIcon(resource.category)}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{resource.name}</div>
                          <div className="text-sm text-gray-500">ID: {resource.id.slice(-8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{resource.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{resource.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(resource.status)}`}>
                        {resource.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{resource.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {resource.currentAssignment ? (
                        <div>
                          <div className="text-sm font-medium text-blue-600">Active Assignment</div>
                          <div className="text-xs text-gray-500">
                            {resource.currentAssignment.emergency?.description?.slice(0, 50)}...
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">No assignment</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredResources.length === 0 && (
            <div className="text-center py-12">
              <span className="text-gray-500">No resources match the selected filters</span>
            </div>
          )}
        </div>

        {/* Active Emergencies */}
        {dashboardData.emergencies.active.length > 0 && (
          <div className="bg-white rounded-lg shadow mt-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Active Emergencies</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboardData.emergencies.active.map((emergency) => (
                  <div key={emergency.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">{emergency.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        emergency.priority === 'CRITICAL' || emergency.priority === 'LIFE_THREATENING' 
                          ? 'bg-red-100 text-red-800' 
                          : emergency.priority === 'HIGH' 
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {emergency.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{emergency.description}</p>
                    <p className="text-sm text-gray-500 mb-2">📍 {emergency.location}</p>
                    {emergency.assignedResources.length > 0 && (
                      <div className="text-sm">
                        <span className="font-medium">Assigned Resources:</span>
                        <ul className="mt-1 space-y-1">
                          {emergency.assignedResources.map((resource: any) => (
                            <li key={resource.id} className="text-gray-600">
                              • {resource.name} ({resource.category})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
          {autoRefresh && ' • Auto-refreshing every 30 seconds'}
        </div>
      </div>
    </div>
  );
}
