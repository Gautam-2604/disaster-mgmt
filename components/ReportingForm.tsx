'use client';

import { useState } from 'react';
import { MessageSource } from '@/types';

interface FormData {
  rawContent: string;
  source: MessageSource;
  sourceId?: string;
  authorName?: string;
  authorContact?: string;
  latitude?: string;
  longitude?: string;
  address?: string;
}

interface ReportingFormProps {
  onReportSubmitted?: (response: any) => void;
}

export default function ReportingForm({ onReportSubmitted }: ReportingFormProps) {
  const [formData, setFormData] = useState<FormData>({
    rawContent: '',
    source: MessageSource.MANUAL_ENTRY,
    sourceId: '',
    authorName: '',
    authorContact: '',
    latitude: '',
    longitude: '',
    address: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get current location. Please enter manually or provide an address.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const submitData = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
      };

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await res.json();

      if (result.success) {
        // Notify parent component
        onReportSubmitted?.(result);
        
        // Reset form on success
        setFormData({
          rawContent: '',
          source: MessageSource.MANUAL_ENTRY,
          sourceId: '',
          authorName: '',
          authorContact: '',
          latitude: '',
          longitude: '',
          address: ''
        });

        // Show success message and redirect option
        if (result.data.conversationId) {
          setTimeout(() => {
            if (confirm('Emergency report processed! Would you like to continue to the live chat for updates?')) {
              window.location.href = `/chat/${result.data.conversationId}`;
            }
          }, 2000);
        }
      } else {
        setError(result.error || 'Failed to submit report');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Submit Emergency Report</h2>
        <div className="flex space-x-2">
          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
            🚨 Priority
          </span>
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
            🤖 AI-Powered
          </span>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Emergency Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Emergency Description *
          </label>
          <textarea
            name="rawContent"
            value={formData.rawContent}
            onChange={handleInputChange}
            required
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            placeholder="Describe the emergency situation in detail..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Be as detailed as possible - AI will analyze and create an action plan
          </p>
        </div>

        {/* Source */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Report Source *
          </label>
          <select
            name="source"
            value={formData.source}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            {Object.values(MessageSource).map((source) => (
              <option key={source} value={source}>
                {source.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Author Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reporter Name
            </label>
            <input
              type="text"
              name="authorName"
              value={formData.authorName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Your name or username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Information
            </label>
            <input
              type="text"
              name="authorContact"
              value={formData.authorContact}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Phone number or email"
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location Information
          </label>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={getCurrentLocation}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors"
              >
                📍 Get Current Location
              </button>
              <span className="text-sm text-gray-500">or enter manually below</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                step="any"
                name="latitude"
                value={formData.latitude}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Latitude"
              />
              <input
                type="number"
                step="any"
                name="longitude"
                value={formData.longitude}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Longitude"
              />
            </div>
            
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Street address or landmark"
            />
          </div>
        </div>

        {/* Source ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Source ID (Optional)
          </label>
          <input
            type="text"
            name="sourceId"
            value={formData.sourceId}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="Tweet ID, post ID, etc."
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3 px-4 rounded-md font-medium text-white ${
            isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500'
          } transition-colors`}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Processing Emergency Report...</span>
            </div>
          ) : (
            '🚨 Submit Emergency Report'
          )}
        </button>
      </form>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
            </svg>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Processing Status */}
      {isSubmitting && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="space-y-2 text-sm text-blue-700">
            <p className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>🚀 Stage 1: Cerebras Llama3.1-70B classifying emergency...</span>
            </p>
            <p className="flex items-center space-x-2">
              <div className="animate-pulse w-4 h-4 bg-blue-300 rounded-full"></div>
              <span>🧠 Stage 2: LLaMA-3.1-70B generating action plan...</span>
            </p>
            <p className="flex items-center space-x-2">
              <div className="animate-pulse w-4 h-4 bg-blue-300 rounded-full"></div>
              <span>⚡ Stage 3: Assigning resources and creating chat...</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
