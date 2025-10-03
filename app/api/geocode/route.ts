import { NextRequest, NextResponse } from 'next/server';
import { geocodingService } from '@/lib/geocoding';

/**
 * POST /api/geocode
 * Geocode an address to get latitude and longitude coordinates
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, source = 'user_provided' } = body;

    if (!address || typeof address !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Address is required' },
        { status: 400 }
      );
    }

    console.log(`🗺️ [GEOCODING] Geocoding address: "${address}"`);

    const result = await geocodingService.geocodeAddress({ address, source });

    if (result) {
      console.log(`✅ [GEOCODING] Success: ${result.latitude}, ${result.longitude} (confidence: ${result.confidence})`);
      
      return NextResponse.json({
        success: true,
        data: result,
        message: 'Address geocoded successfully'
      });
    } else {
      console.log(`❌ [GEOCODING] Failed to geocode: ${address}`);
      
      return NextResponse.json({
        success: false,
        error: 'Could not geocode the provided address',
        message: 'Try providing a more specific address or check the spelling'
      }, { status: 404 });
    }

  } catch (error) {
    console.error('❌ [GEOCODING] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Geocoding service error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/geocode/reverse?lat=X&lng=Y
 * Reverse geocode coordinates to get address
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
      return NextResponse.json(
        { success: false, error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { success: false, error: 'Invalid latitude or longitude' },
        { status: 400 }
      );
    }

    console.log(`🗺️ [REVERSE-GEOCODING] Reverse geocoding: ${latitude}, ${longitude}`);

    const address = await geocodingService.reverseGeocode(latitude, longitude);

    if (address) {
      console.log(`✅ [REVERSE-GEOCODING] Success: ${address}`);
      
      return NextResponse.json({
        success: true,
        data: { address, latitude, longitude },
        message: 'Coordinates reverse geocoded successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Could not reverse geocode the provided coordinates',
        message: 'No address found for these coordinates'
      }, { status: 404 });
    }

  } catch (error) {
    console.error('❌ [REVERSE-GEOCODING] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Reverse geocoding service error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
