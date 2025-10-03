'use client';

import { useState, useEffect } from 'react';
import { MessageSource, MessageCategory, Priority } from '@/types';

interface LocationTestProps {
  onEmergencyCreated?: (data: any) => void;
}

export default function LocationTest({ onEmergencyCreated }: LocationTestProps) {
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emergencyType, setEmergencyType] = useState<MessageCategory>(MessageCategory.MEDICAL);
  const [priority, setPriority] = useState<Priority>(Priority.HIGH);
  const [description, setDescription] = useState('');

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      // Fallback to Rourkela coordinates
      setLocation({ lat: 22.2604, lng: 84.8536 });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationError('');
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationError(`Location access denied: ${error.message}`);
        // Fallback to Rourkela coordinates
        setLocation({ lat: 22.2604, lng: 84.8536 });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const createTestEmergency = async () => {
    if (!location) {
      alert('Location not available. Please try again.');
      return;
    }

    setIsSubmitting(true);
    try {
      const emergencyData = {
        rawContent: description || `Test ${emergencyType.toLowerCase()} emergency in Rourkela area`,
        source: MessageSource.MANUAL_ENTRY,
        authorName: 'Test User',
        latitude: location.lat,
        longitude: location.lng,
        address: 'Rourkela, Odisha, India'
      };

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emergencyData)
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('Emergency created successfully:', result);
        onEmergencyCreated?.(result);
        alert(`Emergency created successfully! ${result.data?.assignedResourcesCount || 0} resources assigned.`);
        setDescription('');
      } else {
        console.error('Failed to create emergency:', result);
        alert(`Failed to create emergency: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating emergency:', error);
      alert('Network error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4">🚨 Test Emergency Report</h3>
      
      {/* Location Status */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-700 mb-2">📍 Current Location</h4>
        {location ? (
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-sm text-green-700">
              <strong>Coordinates:</strong> {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </p>
            <p className="text-xs text-green-600 mt-1">
              {locationError ? `Fallback: ${locationError}` : 'Location detected successfully'}
            </p>
          </div>
        ) : (
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-sm text-yellow-700">Getting location...</p>
            <button 
              onClick={getCurrentLocation}
              className="text-xs text-blue-600 hover:text-blue-800 mt-1"
            >
              Retry location access
            </button>
          </div>
        )}
      </div>

      {/* Emergency Type */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Emergency Type
        </label>
        <select
          value={emergencyType}
          onChange={(e) => setEmergencyType(e.target.value as MessageCategory)}
          className="w-full p-2 border border-gray-300 rounded-md text-gray-900"
        >
          <option value={MessageCategory.MEDICAL}>Medical Emergency</option>
          <option value={MessageCategory.RESCUE}>Rescue Operation</option>
          <option value={MessageCategory.FOOD}>Food Emergency</option>
          <option value={MessageCategory.WATER}>Water Emergency</option>
          <option value={MessageCategory.SHELTER}>Shelter Needed</option>
        </select>
      </div>

      {/* Priority */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Priority Level
        </label>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          className="w-full p-2 border border-gray-300 rounded-md text-gray-900"
        >
          <option value={Priority.LOW}>Low</option>
          <option value={Priority.MEDIUM}>Medium</option>
          <option value={Priority.HIGH}>High</option>
          <option value={Priority.CRITICAL}>Critical</option>
          <option value={Priority.LIFE_THREATENING}>Life Threatening</option>
        </select>
      </div>

      {/* Description */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description (Optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the emergency situation..."
          className="w-full p-2 border border-gray-300 rounded-md text-gray-900"
          rows={3}
        />
      </div>

      {/* Submit Button */}
      <button
        onClick={createTestEmergency}
        disabled={!location || isSubmitting}
        className={`w-full py-2 px-4 rounded-md font-medium ${
          !location || isSubmitting
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-red-600 text-white hover:bg-red-700'
        }`}
      >
        {isSubmitting ? 'Creating Emergency...' : 'Create Test Emergency'}
      </button>

      <p className="text-xs text-gray-500 mt-2 text-center">
        This will create a test emergency and automatically assign nearest available resources
      </p>
    </div>
  );
}
