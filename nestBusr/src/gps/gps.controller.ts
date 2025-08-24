import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

interface Coords {
  lat: string | null;
  lng: string | null;
}

interface SatelliteInfo {
  id: number;
  elevation: number;
  azimuth: number;
  snr: number;
}

interface SatelliteData {
  count: number;
  signalQuality: string;
  lastUpdate: Date;
  coordinates: Coords;
  satellites: SatelliteInfo[];
}

@ApiTags('GPS')
@Controller()
export class GpsController {
  private latestCoords: Coords = { lat: null, lng: null };
  private satelliteData: SatelliteData = {
    count: 0,
    signalQuality: 'Unknown',
    lastUpdate: new Date(),
    coordinates: { lat: null, lng: null },
    satellites: []
  };

  @Get()
  @ApiOperation({ summary: 'Serve the main page' })
  getIndex(@Res() res: Response) {
    // Serve your static index.html here (or via static assets)
    return res.sendFile('index.html', { root: 'public' });
  }

  @Get('gps')
  @ApiOperation({ summary: 'Update GPS coordinates' })
  @ApiResponse({ status: 200, description: 'Coordinates updated successfully' })
  updateCoords(@Query('lat') lat: string, @Query('lng') lng: string, @Query('sats') sats: string, @Query('sat_data') satData?: string) {
    if (lat && lng) {
      console.log(`Updating coordinates - Latitude: ${lat}, Longitude: ${lng}, Satellites: ${sats || 'unknown'}`);
      this.latestCoords.lat = lat;
      this.latestCoords.lng = lng;
      
      // Update satellite data
      this.satelliteData.coordinates = { lat, lng };
      this.satelliteData.lastUpdate = new Date();
      this.satelliteData.count = sats ? parseInt(sats) : 0;
      
      // Parse satellite data if provided
      if (satData) {
        this.satelliteData.satellites = this.parseSatelliteData(satData);
        console.log(`Parsed ${this.satelliteData.satellites.length} satellites from ESP32`);
      } else {
        this.satelliteData.satellites = [];
      }
      
      // Determine signal quality based on satellite count
      if (this.satelliteData.count >= 8) {
        this.satelliteData.signalQuality = 'Excellent';
      } else if (this.satelliteData.count >= 6) {
        this.satelliteData.signalQuality = 'Good';
      } else if (this.satelliteData.count >= 4) {
        this.satelliteData.signalQuality = 'Fair';
      } else if (this.satelliteData.count >= 2) {
        this.satelliteData.signalQuality = 'Poor';
      } else {
        this.satelliteData.signalQuality = 'No Signal';
      }
      
      return { success: true, message: 'Coordinates updated', satellites: this.satelliteData.count };
    }
    return { success: false, message: 'Invalid coordinates' };
  }

  @Get('latest')
  @ApiOperation({ summary: 'Get latest GPS coordinates' })
  @ApiResponse({ status: 200, description: 'Returns the latest coordinates' })
  getLatestCoords() {
    return {
      lat: this.latestCoords.lat,
      lng: this.latestCoords.lng,
      satellites: this.satelliteData.count,
      signalQuality: this.satelliteData.signalQuality,
      lastUpdate: this.satelliteData.lastUpdate,
      satelliteDetails: this.satelliteData.satellites
    };
  }

  @Get('satellites')
  @ApiOperation({ summary: 'Get satellite constellation data' })
  @ApiResponse({ status: 200, description: 'Returns satellite information' })
  getSatelliteData() {
    return this.satelliteData;
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Serve the satellite dashboard' })
  getDashboard(@Res() res: Response) {
    return res.sendFile('dashboard.html', { root: 'public' });
  }

  private parseSatelliteData(satData: string): SatelliteInfo[] {
    try {
      const satellites: SatelliteInfo[] = [];
      const satGroups = satData.split('|');
      
      for (const group of satGroups) {
        const fields = group.split(',');
        if (fields.length === 4) {
          const [id, elevation, azimuth, snr] = fields;
          satellites.push({
            id: parseInt(id) || 0,
            elevation: parseInt(elevation) || 0,
            azimuth: parseInt(azimuth) || 0,
            snr: parseInt(snr) || 0
          });
        }
      }
      
      return satellites;
    } catch (error) {
      console.error('Error parsing satellite data:', error);
      return [];
    }
  }
}
