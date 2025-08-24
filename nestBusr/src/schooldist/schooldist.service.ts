import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parse/sync';

export interface SchoolDist {
  SchoolDistId: number;
  Name: string;  // county name
  State: string; // state code, e.g., 'CA'
}

export interface SchoolDistContact {
  SchoolDistId: number;
  FirstName: string;
  LastName: string;
  Phone: string;
  Email: string;
  Title: string;
}

@Injectable()
export class SchoolDistService implements OnModuleInit {
  private schoolDists: SchoolDist[] = [];
  private schoolDistContacts: SchoolDistContact[] = [];
  private readonly contactsPath = path.join(process.cwd(), 'uploads', 'SchoolDist.csv');

  async onModuleInit() {
    try {
      const csvPath = path.join(__dirname, '..', '..', 'uploads', 'SchoolDist.csv');
      console.log('Loading CSV from:', csvPath);
      
      const fileContent = fs.readFileSync(csvPath, 'utf-8');
      const records = csv.parse(fileContent, {
        columns: true,
        skip_empty_lines: true
      });

      this.schoolDists = records.map(record => ({
        SchoolDistId: parseInt(record.SchoolDistId),
        Name: record.Name,
        State: record.State
      }));

      // Load contacts data
      const contactsPath = path.join(__dirname, '..', '..', 'uploads', 'SchoolDistContacts.csv');
      if (fs.existsSync(contactsPath)) {
        const contactsContent = fs.readFileSync(contactsPath, 'utf-8');
        const contactRecords = csv.parse(contactsContent, {
          columns: true,
          skip_empty_lines: true
        });

        this.schoolDistContacts = contactRecords.map(record => ({
          SchoolDistId: parseInt(record.SchoolDistId),
          FirstName: record.FirstName,
          LastName: record.LastName,
          Phone: record.Phone,
          Email: record.Email,
          Title: record.Title
        }));
      }

      console.log(`Loaded ${this.schoolDists.length} school districts`);
      console.log(`Loaded ${this.schoolDistContacts.length} school district contacts`);
      console.log('Available states:', this.getStates());
    } catch (error) {
      console.error('Error loading CSV files:', error);
      throw error;
    }
  }

  async getStates(): Promise<string[]> {
    try {
      const contactsContent = await fs.promises.readFile(this.contactsPath, 'utf-8');
      const records = csv.parse(contactsContent, {
        columns: true,
        skip_empty_lines: true
      });
      
      const states = new Set<string>();
      records.forEach(record => {
        if (record.State) {
          states.add(record.State);
        }
      });
      
      return Array.from(states).sort();
    } catch (error) {
      console.error('Error reading states:', error);
      return [];
    }
  }

  async getCounties(state: string): Promise<string[]> {
    try {
      const contactsContent = await fs.promises.readFile(this.contactsPath, 'utf-8');
      const records = csv.parse(contactsContent, {
        columns: true,
        skip_empty_lines: true
      });

      const counties = new Set<string>();
      records.forEach(record => {
        if (record.State === state && record.Name) {
          counties.add(record.Name);
        }
      });

      return Array.from(counties).sort();
    } catch (error) {
      console.error('Error reading counties:', error);
      return [];
    }
  }

  getContactsBySchoolDistId(schoolDistId: number): SchoolDistContact[] {
    const contacts = this.schoolDistContacts.filter(contact => contact.SchoolDistId === schoolDistId);
    if (contacts.length === 0) {
      throw new NotFoundException(`No contacts found for school district ID: ${schoolDistId}`);
    }
    return contacts;
  }

  getSchoolDistIdByNameAndState(name: string, state: string): number {
    const schoolDist = this.schoolDists.find(sd => sd.Name === name && sd.State === state);
    if (!schoolDist) {
      throw new NotFoundException(`School district not found for name: ${name} and state: ${state}`);
    }
    return schoolDist.SchoolDistId;
  }
}
