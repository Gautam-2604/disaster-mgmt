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

export default function Home() {
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
  const [response, setResponse] = useState<any>(null);
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
    setResponse(null);

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
        setResponse(result);
        
        // If there's a conversation ID, we'll show the chat redirect option
        if (result.data.conversationId) {
          // Show response first, then redirect after a delay
          setTimeout(() => {
            if (confirm('Emergency report processed! Would you like to continue to the live chat for updates?')) {
              window.location.href = `/chat/${result.data.conversationId}`;
            }
          }, 2000);
        }
        
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
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Emergency Report System
          </h1>
          <p className="text-lg text-gray-600">
            AI-Powered Disaster Management Copilot
          </p>
          <div className="flex justify-center items-center mt-4 space-x-4">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              🚀 Cerebras Ultra-Fast Classification
            </span>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              🧠 LLaMA-3.1-70B Action Planning
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-2 max-w-2xl mx-auto">
            Two-stage AI pipeline: Cerebras for instant emergency classification, LLaMA for comprehensive response planning
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Submit Emergency Report</h2>
            
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Describe the emergency situation in detail..."
                />
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
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      Get Current Location
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
                {isSubmitting ? 'Processing Emergency Report...' : 'Submit Emergency Report'}
              </button>
            </form>

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Response Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">AI Response</h2>
            
            {!response && !isSubmitting && (
              <div className="text-center text-gray-500 py-8">
                <div className="mb-4">
                  <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
                <p>Submit an emergency report to see AI classification and action plan</p>
              </div>
            )}

            {isSubmitting && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                <p className="text-gray-600">AI is processing your emergency report...</p>
                <div className="mt-4 space-y-2 text-sm text-gray-500">
                  <p>🚀 Stage 1: Cerebras Llama3.1-70B classifying emergency (ultra-fast)...</p>
                  <p>� Stage 2: LLaMA-3.1-70B generating comprehensive action plan...</p>
                  <p>⚡ Processing pipeline: Classification → Planning → Assignment</p>
                </div>
              </div>
            )}

            {response && (
              <div className="space-y-6">
                {/* Classification Results */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-3">🚀 Cerebras AI Classification (Stage 1)</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Category:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                        response.data.classification.category === 'RESCUE' ? 'bg-red-100 text-red-800' :
                        response.data.classification.category === 'MEDICAL' ? 'bg-orange-100 text-orange-800' :
                        response.data.classification.category === 'FOOD' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {response.data.classification.category}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Priority:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                        response.data.classification.priority === 'CRITICAL' || response.data.classification.priority === 'LIFE_THREATENING' ? 'bg-red-100 text-red-800' :
                        response.data.classification.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                        response.data.classification.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {response.data.classification.priority}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-sm">
                    <span className="font-medium">Confidence:</span>
                    <span className="ml-2">{(response.data.classification.confidence * 100).toFixed(1)}%</span>
                  </div>
                </div>

                {/* Action Plan */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-3">� LLaMA Action Plan (Stage 2)</h3>
                  
                  <div className="mb-4">
                    <h4 className="font-medium text-green-700 mb-2">Action Steps:</h4>
                    <div className="text-sm text-gray-700 whitespace-pre-line bg-white p-3 rounded border">
                      {response.data.actions.steps}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-medium text-green-700 mb-2">Resources Needed:</h4>
                    <div className="text-sm text-gray-700 bg-white p-3 rounded border">
                      {response.data.actions.resources}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-green-700 mb-2">Estimated People Affected:</h4>
                    <div className="text-sm text-gray-700 bg-white p-3 rounded border">
                      <span className="font-semibold text-lg">{response.data.actions.estimatedCount}</span> people
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">📋 Report Status</h3>
                  <div className="text-sm space-y-1 mb-4">
                    <p><span className="font-medium">ID:</span> {response.data.id}</p>
                    <p><span className="font-medium">Status:</span> 
                      <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                        {response.data.status}
                      </span>
                    </p>
                    <p><span className="font-medium">Created:</span> {new Date(response.data.createdAt).toLocaleString()}</p>
                  </div>
                  
                  {/* Chat Button */}
                  {response.data.conversationId && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-800">💬 Live Chat Available</p>
                          <p className="text-xs text-blue-600">Continue conversation and send updates</p>
                        </div>
                        <button
                          onClick={() => window.location.href = `/chat/${response.data.conversationId}`}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          Open Chat →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
