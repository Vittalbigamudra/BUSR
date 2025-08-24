import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

interface Coords {
  lat: string | null;
  lng: string | null;
}

@ApiTags('GPS')
@Controller()
export class GpsController {
  private latestCoords: Coords = { lat: null, lng: null };

  @Get()
  @ApiOperation({ summary: 'Serve the main page' })
  getIndex(@Res() res: Response) {
    // Serve your static index.html here (or via static assets)
    return res.sendFile('index.html', { root: 'public' });
  }

  @Get('gps')
  @ApiOperation({ summary: 'Update GPS coordinates' })
  @ApiResponse({ status: 200, description: 'Coordinates updated successfully' })
  updateCoords(@Query('lat') lat: string, @Query('lng') lng: string) {
    if (lat && lng) {
      console.log(`Updating coordinates - Latitude: ${lat}, Longitude: ${lng}`);
      this.latestCoords.lat = lat;
      this.latestCoords.lng = lng;
      return { success: true, message: 'Coordinates updated' };
    }
    return { success: false, message: 'Invalid coordinates' };
  }

  @Get('latest')
  @ApiOperation({ summary: 'Get latest GPS coordinates' })
  @ApiResponse({ status: 200, description: 'Returns the latest coordinates' })
  getLatestCoords() {
    return this.latestCoords;
  }
}
// This code defines a NestJS controller for handling GPS coordinates.  
// It includes methods to update and retrieve the latest coordinates via HTTP GET requests.
// The `updateCoords` method updates the latest coordinates based on query parameters, while the `getLatestCoords` method returns the most recent coordinates stored in memory.
// The `getIndex` method serves a static HTML file (index.html) from the 'public' directory when the root URL is accessed.
// Make sure to have the 'public' directory with the 'index.html' file in your project root for this to work correctly.
// The controller uses the `@Res()` decorator to send the HTML file as a response.
