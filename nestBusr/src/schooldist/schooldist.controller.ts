import { Controller, Get, Query, BadRequestException, Param } from '@nestjs/common';
import { SchoolDistService } from './schooldist.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('School Districts')
@Controller('schooldist')
export class SchoolDistController {
  constructor(private readonly schoolDistService: SchoolDistService) {}

  @Get('states')
  @ApiOperation({ summary: 'Get all states' })
  async getStates(): Promise<string[]> {
    return this.schoolDistService.getStates();
  }

  @Get('counties')
  @ApiOperation({ summary: 'Get counties by state' })
  @ApiQuery({ name: 'state', required: true, description: 'State name' })
  async getCounties(@Query('state') state: string): Promise<string[]> {
    console.log('GET /schooldist/counties called with state:', state);
    return this.schoolDistService.getCounties(state);
  }

  @Get('contacts/:state/:county')
  @ApiOperation({ summary: 'Get school district contacts by state and county' })
  @ApiParam({ name: 'state', required: true, description: 'State code (e.g., CA)' })
  @ApiParam({ name: 'county', required: true, description: 'County name' })
  @ApiResponse({ status: 200, description: 'List of contacts for the school district' })
  @ApiResponse({ status: 404, description: 'School district or contacts not found' })
  getContacts(
    @Param('state') state: string,
    @Param('county') county: string
  ) {
    const schoolDistId = this.schoolDistService.getSchoolDistIdByNameAndState(county, state);
    return this.schoolDistService.getContactsBySchoolDistId(schoolDistId);
  }
}
