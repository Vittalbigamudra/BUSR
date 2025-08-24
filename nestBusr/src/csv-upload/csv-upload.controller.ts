import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as fastcsv from 'fast-csv';

@Controller('upload')
export class CsvUploadController {
  @Post('csv')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
      },
    }),
  }))
  async uploadCsv(@UploadedFile() file: Express.Multer.File) {
    const results: any[] = [];


    return new Promise((resolve, reject) => {
      fs.createReadStream(file.path)
        .pipe(fastcsv.parse({ headers: true }))
        .on('data', (row) => results.push(row))
        .on('end', () => {
          console.log('CSV Parsed:', results);
          resolve({ message: 'CSV uploaded and parsed', rows: results.length });
        })
        .on('error', (error) => {
          console.error('CSV Parsing error:', error);
          reject(error);
        });
    });
  }
}
// This code defines a NestJS controller for handling CSV file uploads.
// It uses the `multer` library for file handling and `fast-csv` for parsing CSV files.
// The uploaded file is stored in the `./uploads` directory with a timestamp prepended to its original name.
// The `uploadCsv` method reads the uploaded file, parses it, and logs the parsed rows.
// It returns a promise that resolves with a message and the number of rows parsed, or rejects with an error if parsing fails.
// Make sure to create the `uploads` directory in your project root before running this code.
