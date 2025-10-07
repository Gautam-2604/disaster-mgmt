'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { SimpleResource, EmergencyData, ResourceCategory, ResourceStatus } from '@/types';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const Circle = dynamic(() => import('react-leaflet').then(mod => mod.Circle), { ssr: false });

// Dynamic import for Leaflet
let L: typeof import('leaflet') | null = null;

interface ResourceMapProps {
  resources: SimpleResource[];
  emergencies: EmergencyData[];
  selectedResource?: string | null;
  onResourceSelect?: (resourceId: string) => void;
  showAssignmentRadius?: boolean;
  className?: string;
}

// Icon creation function for different resource types
const createResourceIcon = (category: ResourceCategory, status: ResourceStatus) => {
  if (typeof window === 'undefined' || !L) return undefined;
  
  const getIconColor = (status: ResourceStatus) => {
    switch (status) {
      case 'AVAILABLE': return '#10B981'; // Green
      case 'ASSIGNED': return '#F59E0B'; // Yellow
      case 'IN_USE': return '#EF4444'; // Red
      case 'MAINTENANCE': return '#6B7280'; // Gray
      case 'OUT_OF_SERVICE': return '#DC2626'; // Dark Red
      default: return '#6B7280';
    }
  };

  const getIconSymbol = (category: ResourceCategory) => {
    switch (category) {
      case 'PERSONNEL': return '👨‍⚕️';
      case 'VEHICLE': return '🚑';
      case 'EQUIPMENT': return '🔧';
      case 'FACILITY': return '🏥';
      case 'SUPPLY': return '📦';
      default: return '❓';
    }
  };

  const color = getIconColor(status);
  const symbol = getIconSymbol(category);

  return new L.DivIcon({
    html: `<div style="
      background-color: ${color};
      border: 2px solid white;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">${symbol}</div>`,
    className: 'resource-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
};

const createEmergencyIcon = (priority: string) => {
  if (typeof window === 'undefined' || !L) return undefined;
  
  const getEmergencyColor = (priority: string) => {
    switch (priority.toUpperCase()) {
      case 'LIFE_THREATENING':
      case 'CRITICAL': return '#DC2626'; // Dark Red
      case 'HIGH': return '#EF4444'; // Red
      case 'MEDIUM': return '#F59E0B'; // Orange
      case 'LOW': return '#10B981'; // Green
      default: return '#6B7280'; // Gray
    }
  };

  const color = getEmergencyColor(priority);

  return new L.DivIcon({
    html: `<div style="
      background-color: ${color};
      border: 3px solid white;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      box-shadow: 0 3px 6px rgba(0,0,0,0.4);
      animation: pulse 2s infinite;
    ">🚨</div>
    <style>
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }
    </style>`,
    className: 'emergency-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
};

export default function ResourceMap({ 
  resources, 
  emergencies, 
  selectedResource,
  onResourceSelect,
  showAssignmentRadius = false,
  className = ''
}: ResourceMapProps) {
  const [isClient, setIsClient] = useState(false);
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([22.2604, 84.8536]); // Default to Rourkela, India

  useEffect(() => {
    setIsClient(true);
    
    // Load Leaflet dynamically
    import('leaflet').then((leaflet) => {
      L = leaflet;
      setIsLeafletLoaded(true);
    });
    
    // Calculate center based on available resources and emergencies
    const allPoints = [
      ...resources.filter(r => r.latitude && r.longitude).map(r => [r.latitude!, r.longitude!]),
      ...emergencies.filter(e => e.coordinates.lat && e.coordinates.lng).map(e => [e.coordinates.lat, e.coordinates.lng])
    ];

    if (allPoints.length > 0) {
      const avgLat = allPoints.reduce((sum, point) => sum + point[0], 0) / allPoints.length;
      const avgLng = allPoints.reduce((sum, point) => sum + point[1], 0) / allPoints.length;
      setMapCenter([avgLat, avgLng]);
    }
  }, [resources, emergencies]);

  if (!isClient) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg overflow-hidden border border-gray-200 ${className}`}>
      <MapContainer 
        center={mapCenter} 
        zoom={12} 
        style={{ height: '500px', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Resource Markers */}
        {isLeafletLoaded && resources
          .filter(resource => resource.latitude && resource.longitude)
          .map(resource => {
            const icon = createResourceIcon(resource.category, resource.status);
            if (!icon) return null;
            
            return (
              <Marker
                key={resource.id}
                position={[resource.latitude!, resource.longitude!]}
                icon={icon}
                eventHandlers={{
                  click: () => onResourceSelect?.(resource.id)
                }}
              >
              <Popup>
                <div className="min-w-[200px]">
                  <h3 className="font-bold text-lg mb-2">{resource.name}</h3>
                  <div className="space-y-1 text-sm">
                    <div><strong>Type:</strong> {resource.type}</div>
                    <div><strong>Category:</strong> {resource.category}</div>
                    <div><strong>Status:</strong> 
                      <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                        resource.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                        resource.status === 'ASSIGNED' ? 'bg-yellow-100 text-yellow-800' :
                        resource.status === 'IN_USE' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {resource.status}
                      </span>
                    </div>
                    <div><strong>Location:</strong> {resource.location}</div>
                    {resource.currentAssignment && (
                      <div className="mt-2 p-2 bg-blue-50 rounded">
                        <strong>Current Assignment:</strong>
                        <div className="text-xs mt-1">
                          {resource.currentAssignment.emergency?.description?.substring(0, 100)}...
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
              
              {/* Show assignment radius for selected resource */}
              {selectedResource === resource.id && showAssignmentRadius && (
                <Circle
                  center={[resource.latitude!, resource.longitude!]}
                  radius={5000} // 5km radius
                  pathOptions={{
                    color: '#3B82F6',
                    fillColor: '#3B82F6',
                    fillOpacity: 0.1,
                    weight: 2,
                    dashArray: '5, 5'
                  }}
                />
                )}
              </Marker>
            );
          })
        }
        
        {/* Emergency Markers */}
        {isLeafletLoaded && emergencies
          .filter(emergency => emergency.coordinates.lat && emergency.coordinates.lng)
          .map(emergency => {
            const icon = createEmergencyIcon(emergency.priority);
            if (!icon) return null;
            
            return (
              <Marker
                key={emergency.id}
                position={[emergency.coordinates.lat, emergency.coordinates.lng]}
                icon={icon}
              >
              <Popup>
                <div className="min-w-[250px]">
                  <h3 className="font-bold text-lg mb-2 text-red-700">{emergency.title}</h3>
                  <div className="space-y-1 text-sm">
                    <div><strong>Category:</strong> {emergency.category}</div>
                    <div><strong>Priority:</strong>
                      <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                        emergency.priority === 'LIFE_THREATENING' || emergency.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                        emergency.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                        emergency.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {emergency.priority}
                      </span>
                    </div>
                    <div><strong>Location:</strong> {emergency.location}</div>
                    <div className="mt-2">
                      <strong>Description:</strong>
                      <div className="text-xs mt-1 bg-gray-50 p-2 rounded">
                        {emergency.description}
                      </div>
                    </div>
                    {emergency.assignedResources.length > 0 && (
                      <div className="mt-2">
                        <strong>Assigned Resources:</strong>
                        <ul className="text-xs mt-1 space-y-1">
                          {emergency.assignedResources.map(resource => (
                            <li key={resource.id} className="bg-blue-50 p-1 rounded">
                              • {resource.name} ({resource.category})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  </div>
                </Popup>
              </Marker>
            );
          })
        }
      </MapContainer>
      
      {/* Map Legend */}
      <div className="bg-white p-3 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span>Available Resources</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
            <span>Assigned Resources</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span>In-Use Resources</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center text-white text-xs">🚨</div>
            <span>Active Emergencies</span>
          </div>
        </div>
      </div>
    </div>
  );
}
