import { GeocodeResult, GeocodeRequest } from '@/types';

export class GeocodingService {
  private static instance: GeocodingService;

  public static getInstance(): GeocodingService {
    if (!GeocodingService.instance) {
      GeocodingService.instance = new GeocodingService();
    }
    return GeocodingService.instance;
  }

  async geocodeAddress(request: GeocodeRequest): Promise<GeocodeResult | null> {
    const { address } = request;
    
    if (!address || address.trim().length === 0) {
      return null;
    }

    // Try multiple geocoding services in order of preference
    const results = await Promise.allSettled([
      this.geocodeWithNominatim(address),
      this.geocodeWithMapbox(address),
      this.geocodeWithOpenCage(address)
    ]);

    // Return the first successful result
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        return result.value;
      }
    }

    console.warn(`❌ [GEOCODING] Failed to geocode address: ${address}`);
    return null;
  }

  /**
   * Reverse geocode coordinates to get address
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    try {
      // Try Nominatim first (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'DisasterManagement/1.0 (Emergency Response System)'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.display_name || null;
      }
    } catch (error) {
      console.error('❌ [REVERSE-GEOCODING] Error:', error);
    }

    return null;
  }

  /**
   * Extract location from emergency text using AI
   */
  async extractLocationFromText(text: string): Promise<GeocodeResult | null> {
    try {
      // Use OpenRouter to extract location information
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://disaster-mgmt.vercel.app',
          'X-Title': 'Emergency Location Extraction'
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.1-8b-instruct:free',
          messages: [
            {
              role: 'system',
              content: `You are an expert at extracting location information from emergency reports. Extract the most specific location mentioned in the text. Return only the location as a complete address or place name, nothing else. If no specific location is found, return "NO_LOCATION".`
            },
            {
              role: 'user',
              content: `Extract the location from this emergency report: "${text}"`
            }
          ],
          max_tokens: 100,
          temperature: 0.1
        })
      });

      if (response.ok) {
        const result = await response.json();
        const extractedLocation = result.choices?.[0]?.message?.content?.trim();
        
        if (extractedLocation && extractedLocation !== 'NO_LOCATION') {
          // Now geocode the extracted location
          return await this.geocodeAddress({ 
            address: extractedLocation, 
            source: 'ai_extracted' 
          });
        }
      }
    } catch (error) {
      console.error('❌ [LOCATION-EXTRACTION] Error:', error);
    }

    return null;
  }

  /**
   * Geocode using Nominatim (OpenStreetMap) - Free, no API key required
   */
  private async geocodeWithNominatim(address: string): Promise<GeocodeResult | null> {
    try {
      const encodedAddress = encodeURIComponent(address);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&addressdetails=1&limit=1`,
        {
          headers: {
            'User-Agent': 'DisasterManagement/1.0 (Emergency Response System)'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const result = data[0];
          return {
            latitude: parseFloat(result.lat),
            longitude: parseFloat(result.lon),
            address: result.display_name,
            confidence: result.importance || 0.8,
            components: {
              country: result.address?.country,
              state: result.address?.state,
              city: result.address?.city || result.address?.town || result.address?.village,
              district: result.address?.suburb || result.address?.district,
              street: result.address?.road,
              postalCode: result.address?.postcode
            }
          };
        }
      }
    } catch (error) {
      console.error('❌ [NOMINATIM] Geocoding error:', error);
    }

    return null;
  }

  /**
   * Geocode using Mapbox (if API key is available)
   */
  private async geocodeWithMapbox(address: string): Promise<GeocodeResult | null> {
    if (!process.env.MAPBOX_ACCESS_TOKEN) {
      return null;
    }

    try {
      const encodedAddress = encodeURIComponent(address);
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${process.env.MAPBOX_ACCESS_TOKEN}&limit=1`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          const feature = data.features[0];
          const [longitude, latitude] = feature.center;
          
          return {
            latitude,
            longitude,
            address: feature.place_name,
            confidence: feature.relevance || 0.9,
            components: this.parseMapboxComponents(feature.context)
          };
        }
      }
    } catch (error) {
      console.error('❌ [MAPBOX] Geocoding error:', error);
    }

    return null;
  }

  /**
   * Geocode using OpenCage (if API key is available)
   */
  private async geocodeWithOpenCage(address: string): Promise<GeocodeResult | null> {
    if (!process.env.OPENCAGE_API_KEY) {
      return null;
    }

    try {
      const encodedAddress = encodeURIComponent(address);
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${encodedAddress}&key=${process.env.OPENCAGE_API_KEY}&limit=1`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const result = data.results[0];
          
          return {
            latitude: result.geometry.lat,
            longitude: result.geometry.lng,
            address: result.formatted,
            confidence: result.confidence / 10, // OpenCage uses 0-10 scale
            components: {
              country: result.components.country,
              state: result.components.state,
              city: result.components.city,
              district: result.components.suburb || result.components.district,
              street: result.components.road,
              postalCode: result.components.postcode
            }
          };
        }
      }
    } catch (error) {
      console.error('❌ [OPENCAGE] Geocoding error:', error);
    }

    return null;
  }

  /**
   * Parse Mapbox context components
   */
  private parseMapboxComponents(context: { id: string; text: string }[]): {
    country?: string;
    state?: string;
    city?: string;
    district?: string;
    street?: string;
    postalCode?: string;
  } {
    const components: {
      country?: string;
      state?: string;
      city?: string;
      district?: string;
      street?: string;
      postalCode?: string;
    } = {};
    
    if (context) {
      context.forEach(item => {
        const type = item.id.split('.')[0];
        switch (type) {
          case 'country':
            components.country = item.text;
            break;
          case 'region':
            components.state = item.text;
            break;
          case 'place':
            components.city = item.text;
            break;
          case 'district':
            components.district = item.text;
            break;
          case 'postcode':
            components.postalCode = item.text;
            break;
        }
      });
    }

    return components;
  }
}

// Export singleton instance
export const geocodingService = GeocodingService.getInstance();
