const { PrismaClient } = require('../app/generated/prisma');

const prisma = new PrismaClient();

async function updateCoordinates() {
  try {
    console.log('🗺️ Updating resource coordinates to be closer to emergency location...');
    
    // Define updated coordinates around emergency area (22.253° N, 84.908° E)
    const coordinateUpdates = [
      // Personnel
      { identifier: 'EMT-001', lat: 22.270, lng: 84.900 },
      { identifier: 'EMT-002', lat: 22.250, lng: 84.920 },
      { identifier: 'EMT-003', lat: 22.260, lng: 84.910 },
      { identifier: 'RESCUE-01', lat: 22.280, lng: 84.890 },
      { identifier: 'RESCUE-02', lat: 22.240, lng: 84.930 },
      { identifier: 'COORD-01', lat: 22.260, lng: 84.910 },
      { identifier: 'COORD-02', lat: 22.255, lng: 84.915 },
      
      // Vehicles  
      { identifier: 'AMB-001', lat: 22.270, lng: 84.900 },
      { identifier: 'AMB-002', lat: 22.250, lng: 84.920 },
      { identifier: 'FIRE-001', lat: 22.260, lng: 84.910 },
      { identifier: 'SAR-001', lat: 22.290, lng: 84.880 },
      { identifier: 'SAR-002', lat: 22.230, lng: 84.930 },
      
      // Equipment
      { identifier: 'MEDKIT-001', lat: 22.280, lng: 84.910 },
      { identifier: 'MEDKIT-002', lat: 22.280, lng: 84.910 },
      { identifier: 'MEDKIT-003', lat: 22.280, lng: 84.910 },
      { identifier: 'MEDKIT-004', lat: 22.240, lng: 84.910 },
      { identifier: 'MEDKIT-005', lat: 22.240, lng: 84.910 },
      { identifier: 'RESCUE-KIT-01', lat: 22.260, lng: 84.920 },
      { identifier: 'RESCUE-KIT-02', lat: 22.260, lng: 84.900 },
      { identifier: 'RESCUE-KIT-03', lat: 22.260, lng: 84.910 },
      
      // Supplies
      { identifier: 'FOOD-001', lat: 22.250, lng: 84.890 },
      { identifier: 'FOOD-002', lat: 22.250, lng: 84.890 },
      { identifier: 'FOOD-003', lat: 22.250, lng: 84.890 },
      { identifier: 'FOOD-004', lat: 22.250, lng: 84.890 },
      { identifier: 'FOOD-005', lat: 22.275, lng: 84.920 },
      { identifier: 'FOOD-006', lat: 22.275, lng: 84.920 },
      { identifier: 'FOOD-007', lat: 22.275, lng: 84.920 },
      { identifier: 'FOOD-008', lat: 22.275, lng: 84.920 },
      { identifier: 'FOOD-009', lat: 22.260, lng: 84.880 },
      { identifier: 'FOOD-010', lat: 22.260, lng: 84.880 },
      { identifier: 'WATER-001', lat: 22.285, lng: 84.905 },
      { identifier: 'WATER-002', lat: 22.235, lng: 84.915 },
      { identifier: 'WATER-003', lat: 22.265, lng: 84.935 },
      { identifier: 'WATER-004', lat: 22.245, lng: 84.885 },
      { identifier: 'WATER-005', lat: 22.270, lng: 84.895 },
      
      // Facilities
      { identifier: 'SHELTER-01', lat: 22.270, lng: 84.900 },
      { identifier: 'SHELTER-02', lat: 22.240, lng: 84.920 },
      { identifier: 'SHELTER-03', lat: 22.280, lng: 84.930 },
      { identifier: 'MEDSTATION-01', lat: 22.275, lng: 84.910 },
      { identifier: 'MEDSTATION-02', lat: 22.245, lng: 84.910 }
    ];

    console.log(`📍 Updating coordinates for ${coordinateUpdates.length} resources...`);
    
    for (const update of coordinateUpdates) {
      try {
        await prisma.resource.updateMany({
          where: { identifier: update.identifier },
          data: {
            latitude: update.lat,
            longitude: update.lng
          }
        });
        console.log(`✅ Updated ${update.identifier} to (${update.lat}, ${update.lng})`);
      } catch (error) {
        console.warn(`⚠️ Could not update ${update.identifier}:`, error.message);
      }
    }

    console.log('🎯 Coordinate update complete!');
    
    // Verify some distances
    const sampleResource = await prisma.resource.findFirst({
      where: { 
        identifier: 'FIRE-001',
        latitude: { not: null },
        longitude: { not: null }
      }
    });
    
    if (sampleResource) {
      const emergencyLat = 22.253;
      const emergencyLng = 84.908;
      
      // Calculate distance using Haversine formula
      const R = 6371; // Earth radius in km
      const dLat = (sampleResource.latitude - emergencyLat) * (Math.PI / 180);
      const dLng = (sampleResource.longitude - emergencyLng) * (Math.PI / 180);
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
                Math.cos(emergencyLat * (Math.PI / 180)) * Math.cos(sampleResource.latitude * (Math.PI / 180)) * 
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      console.log(`📏 Distance from emergency (22.253, 84.908) to ${sampleResource.name} (${sampleResource.latitude}, ${sampleResource.longitude}): ${distance.toFixed(2)}km`);
    }

  } catch (error) {
    console.error('❌ Error updating coordinates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCoordinates();
