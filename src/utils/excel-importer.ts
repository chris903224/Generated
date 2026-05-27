// src/utils/excel-importer.ts - FULL VERSION (Simple random control number)

import * as XLSX from 'xlsx';
import { supabase } from '../services/supabase.service';

export interface ImportResult {
  success: boolean;
  message: string;
  imported: number;
  failed: number;
  errors: string[];
  duplicates: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  mappedData: any;
}

export const DB_FIELDS = [
  { field: 'student_id', label: 'Student ID', required: false },
  { field: 'full_name', label: 'Full Name', required: true },
  { field: 'control_number', label: 'Control Number', required: false },
  { field: 'course', label: 'Course', required: false },
  { field: 'year_level', label: 'Year Level', required: false },
  { field: 'section', label: 'Section', required: false },
  { field: 'support_type', label: 'Support Type', required: false },
  { field: 'remarks', label: 'Remarks', required: false },
  { field: 'endorsement', label: 'Endorsement', required: false },
  { field: 'data_sheet', label: 'Data Sheet', required: false },
  { field: 'duties', label: 'Duties', required: false },
  { field: 'hours', label: 'Hours', required: false }
];

export class ExcelImporter {
  
  // ============================================
  // PARSE EXCEL FILE
  // ============================================
  
  static async parseExcelFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  }
  
  static async getHeaders(file: File): Promise<string[]> {
    const data = await this.parseExcelFile(file);
    if (data.length === 0) return [];
    return Object.keys(data[0]);
  }
  
  // ============================================
  // GENERATE RANDOM 6-DIGIT CONTROL NUMBER
  // ============================================
  
  static generateControlNumber(): string {
    // Simple random 6-digit number (100000 to 999999)
    const random = Math.floor(Math.random() * 900000) + 100000;
    return random.toString();
  }
  
  // ============================================
  // DETERMINE SUPPORT TYPE BASED ON YEAR LEVEL
  // ============================================
  
  static determineSupportType(yearLevel: string, existingSupportType?: string): string {
    if (existingSupportType && existingSupportType !== '') {
      return existingSupportType;
    }
    
    const year = yearLevel?.toUpperCase() || '';
    
    if (year === 'YEAR 1' || year === '1ST YEAR' || year === '1ST' || year === 'FIRST YEAR' || year === '1') {
      return 'FRESHMEN OS';
    } else {
      return 'UPPERCLASSMEN OS';
    }
  }
  
  // ============================================
  // VALIDATE ROW - WITH CONTROL NUMBER DETECTION
  // ============================================
  
  static validateRow(row: any, headers: string[]): ValidationResult {
    const errors: string[] = [];
    
    // Find columns
    let nameColumn = '';
    let studentIdColumn = '';
    let controlNumberColumn = '';
    let courseColumn = '';
    let yearColumn = '';
    let sectionColumn = '';
    let supportTypeColumn = '';
    let remarksColumn = '';
    let endorsementColumn = '';
    let dataSheetColumn = '';
    let dutiesColumn = '';
    let hoursColumn = '';
    
    for (const header of headers) {
      const lowerHeader = header.toLowerCase();
      if (lowerHeader.includes('name') || lowerHeader === 'name') {
        nameColumn = header;
      }
      if (lowerHeader.includes('student') && (lowerHeader.includes('id') || lowerHeader.includes('number'))) {
        studentIdColumn = header;
      }
      if (lowerHeader.includes('control') || lowerHeader.includes('control number') || lowerHeader === 'control_number') {
        controlNumberColumn = header;
      }
      if (lowerHeader.includes('course')) {
        courseColumn = header;
      }
      if (lowerHeader.includes('year')) {
        yearColumn = header;
      }
      if (lowerHeader.includes('section')) {
        sectionColumn = header;
      }
      if (lowerHeader.includes('support')) {
        supportTypeColumn = header;
      }
      if (lowerHeader.includes('remark')) {
        remarksColumn = header;
      }
      if (lowerHeader.includes('endorse')) {
        endorsementColumn = header;
      }
      if (lowerHeader.includes('data') || lowerHeader.includes('sheet')) {
        dataSheetColumn = header;
      }
      if (lowerHeader.includes('dutie')) {
        dutiesColumn = header;
      }
      if (lowerHeader.includes('hour')) {
        hoursColumn = header;
      }
    }
    
    // If no name column found, try the first column
    if (!nameColumn && headers.length > 0) {
      nameColumn = headers[0];
    }
    
    // Extract FULL NAME (REQUIRED)
    let fullName = nameColumn ? (row[nameColumn]?.toString().trim() || '') : '';
    
    if (!fullName && Object.keys(row).length > 0) {
      const firstKey = Object.keys(row)[0];
      fullName = row[firstKey]?.toString().trim() || '';
    }
    
    if (!fullName) {
      errors.push('Full Name is required');
      fullName = 'MISSING_NAME';
    }
    
    // Student ID - leave blank if none
    let studentId = studentIdColumn ? (row[studentIdColumn]?.toString().trim() || '') : '';
    
    // CONTROL NUMBER - use from Excel if exists
    let controlNumber = controlNumberColumn ? (row[controlNumberColumn]?.toString().trim() || '') : '';
    
    // Optional fields
    let course = courseColumn ? (row[courseColumn]?.toString().trim() || '') : '';
    let yearLevel = yearColumn ? (row[yearColumn]?.toString().trim() || '') : '';
    let section = sectionColumn ? (row[sectionColumn]?.toString().trim() || '') : '';
    let supportType = supportTypeColumn ? (row[supportTypeColumn]?.toString().trim() || '') : '';
    let remarks = remarksColumn ? (row[remarksColumn]?.toString().trim() || '') : 'PENDING';
    let endorsement = endorsementColumn ? (row[endorsementColumn]?.toString().trim() || '') : 'Endorsement for OJT - HK Duty';
    let dataSheet = dataSheetColumn ? (row[dataSheetColumn]?.toString().trim() || '') : 'Encoded';
    let duties = dutiesColumn ? (row[dutiesColumn]?.toString().trim() || '') : '';
    let hours = hoursColumn ? (row[hoursColumn]?.toString().trim() || '') : '0';
    
    // Normalize year level if present
    if (yearLevel) {
      const normalized = this.normalizeYearLevel(yearLevel);
      if (normalized) yearLevel = normalized;
    }
    
    // Normalize course if present
    if (course) {
      const normalized = this.normalizeCourse(course);
      if (normalized) course = normalized;
    }
    
    const mappedData = {
      student_id: studentId || '',
      full_name: fullName,
      course: course,
      year_level: yearLevel,
      section: section,
      support_type: supportType,
      remarks: remarks,
      endorsement: endorsement,
      data_sheet: dataSheet,
      duties: duties,
      hours: hours,
      control_number: controlNumber
    };
    
    return {
      isValid: errors.length === 0,
      errors: errors,
      mappedData: mappedData
    };
  }
  
  static normalizeYearLevel(value: any): string | null {
    if (!value) return null;
    
    const str = value.toString().toUpperCase().trim();
    
    if (str === 'YEAR 1' || str === '1ST YEAR' || str === '1ST' || str === '1' || str === 'FIRST YEAR') {
      return 'YEAR 1';
    }
    if (str === 'YEAR 2' || str === '2ND YEAR' || str === '2ND' || str === '2' || str === 'SECOND YEAR') {
      return 'YEAR 2';
    }
    if (str === 'YEAR 3' || str === '3RD YEAR' || str === '3RD' || str === '3' || str === 'THIRD YEAR') {
      return 'YEAR 3';
    }
    if (str === 'YEAR 4' || str === '4TH YEAR' || str === '4TH' || str === '4' || str === 'FOURTH YEAR') {
      return 'YEAR 4';
    }
    
    return null;
  }
  
  static normalizeCourse(value: any): string | null {
    if (!value) return null;
    
    const str = value.toString().toUpperCase().trim();
    
    const courseMap: Record<string, string> = {
      'BSN': 'BSN', 'BS NURSING': 'BSN', 'NURSING': 'BSN',
      'BSMLS': 'BSMLS', 'BS MLS': 'BSMLS', 'MEDICAL TECHNOLOGY': 'BSMLS', 'MEDTECH': 'BSMLS',
      'BSPSY': 'BSPSY', 'BS PSYCHOLOGY': 'BSPSY', 'PSYCHOLOGY': 'BSPSY', 'PSYCH': 'BSPSY',
      'BSRADTECH': 'BSRADTECH', 'BS RADTECH': 'BSRADTECH', 'RADIOLOGIC TECHNOLOGY': 'BSRADTECH',
      'BSRESPT': 'BSRESPT', 'BS RESPIRATORY': 'BSRESPT', 'RESPIRATORY THERAPY': 'BSRESPT',
      'BSPHARM': 'BSPHARM', 'BS PHARMACY': 'BSPHARM', 'PHARMACY': 'BSPHARM',
      'BSPT': 'BSPT', 'BS PHYSICAL THERAPY': 'BSPT', 'PHYSICAL THERAPY': 'BSPT', 'PT': 'BSPT',
      'BSIT': 'BSIT', 'BS IT': 'BSIT', 'INFORMATION TECHNOLOGY': 'BSIT', 'IT': 'BSIT',
      'BSA': 'BSA', 'BS ACCOUNTANCY': 'BSA', 'ACCOUNTANCY': 'BSA',
      'BSBA': 'BSBA', 'BSBA-MM': 'BSBA-MM', 'BSBA MARKETING': 'BSBA-MM',
      'BSBA-FM': 'BSBA-FM', 'BSBA FINANCIAL': 'BSBA-FM',
      'BSHM': 'BSHM', 'BS HOSPITALITY': 'BSHM', 'HOSPITALITY MANAGEMENT': 'BSHM', 'HM': 'BSHM',
      'BSTM': 'BSTM', 'BS TOURISM': 'BSTM', 'TOURISM MANAGEMENT': 'BSTM', 'TOURISM': 'BSTM',
      'BSCRIM': 'BSCRIM', 'BS CRIMINOLOGY': 'BSCRIM', 'CRIMINOLOGY': 'BSCRIM', 'CRIM': 'BSCRIM',
      'BEED': 'BEED', 'BEEd': 'BEED', 'ELEMENTARY EDUCATION': 'BEED',
      'BSED': 'BSED', 'BSEd': 'BSED', 'SECONDARY EDUCATION': 'BSED'
    };
    
    for (const [key, val] of Object.entries(courseMap)) {
      if (str === key || str.includes(key)) {
        return val;
      }
    }
    
    return null;
  }
  
  // ============================================
  // PREPARE STUDENTS FOR INSERTION
  // ============================================
  
  static async prepareStudentsForInsert(validRows: any[]): Promise<any[]> {
    const students = [];
    
    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      
      // Use control number from Excel if exists, otherwise generate random
      let controlNumber = row.mappedData.control_number;
      if (!controlNumber || controlNumber === '') {
        controlNumber = this.generateControlNumber();
      }
      
      const supportType = this.determineSupportType(
        row.mappedData.year_level, 
        row.mappedData.support_type
      );
      
      students.push({
        student_id: row.mappedData.student_id || '',
        full_name: row.mappedData.full_name,
        course: row.mappedData.course || '',
        year_level: row.mappedData.year_level || '',
        section: row.mappedData.section || '',
        support_type: supportType,
        remarks: row.mappedData.remarks || 'PENDING',
        endorsement: 'Endorsement for OJT - HK Duty',
        data_sheet: row.mappedData.data_sheet || 'Encoded',
        duties: row.mappedData.duties || '',
        hours: row.mappedData.hours || '0',
        control_number: controlNumber,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    return students;
  }
  
  // ============================================
  // BULK INSERT STUDENTS
  // ============================================
  
  static async bulkInsertStudents(students: any[]): Promise<{ imported: number; errors: string[] }> {
    let imported = 0;
    const errors: string[] = [];
    const batchSize = 100;
    
    console.log(`📥 Starting import of ${students.length} students...`);
    
    for (let i = 0; i < students.length; i += batchSize) {
      const batch = students.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('students')
        .insert(batch);
      
      if (error) {
        console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} error:`, error.message);
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      } else {
        imported += batch.length;
        console.log(`📊 Progress: ${imported}/${students.length} imported`);
      }
    }
    
    console.log(`✅ Import completed: ${imported} imported, ${errors.length} batches failed`);
    return { imported, errors };
  }
  
  // ============================================
  // DOWNLOAD TEMPLATE
  // ============================================
  
  static downloadTemplate(): void {
    const template = [
      { 
        'Full Name': 'Juan Dela Cruz',
        'Student ID': '2025-00001',
        'Control Number': '123456',
        'Course': 'BSIT',
        'Year Level': 'YEAR 1'
      },
      { 
        'Full Name': 'Maria Santos',
        'Student ID': '2025-00002',
        'Control Number': '789012',
        'Course': 'BSN',
        'Year Level': 'YEAR 2'
      }
    ];
    
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Student Template');
    
    const instructions = [
      { Field: 'Full Name', Description: 'Complete name of student', Required: 'Yes', Note: 'e.g., Juan Dela Cruz' },
      { Field: 'Student ID', Description: 'Student ID number', Required: 'No', Note: 'Leave blank to auto-generate' },
      { Field: 'Control Number', Description: '6-digit number for duties', Required: 'No', Note: 'Leave blank to auto-generate random' },
      { Field: 'Course', Description: 'Program code', Required: 'No', Note: 'BSN, BSIT, BSA, BSHM, etc.' },
      { Field: 'Year Level', Description: 'Year level', Required: 'No', Note: 'YEAR 1, YEAR 2, YEAR 3, YEAR 4' }
    ];
    
    const ws2 = XLSX.utils.json_to_sheet(instructions);
    XLSX.utils.book_append_sheet(wb, ws2, 'Instructions');
    
    XLSX.writeFile(wb, 'student_import_template.xlsx');
  }
  
  // ============================================
  // EXPORT TO EXCEL
  // ============================================
  
  static exportToExcel(data: any[], filename: string = 'export'): void {
    if (!data || data.length === 0) return;
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
  }
  
  // ============================================
  // IMPORT FROM URL
  // ============================================
  
  static async importFromUrl(url: string): Promise<File> {
    try {
      let downloadUrl = url;
      
      if (url.includes('drive.google.com')) {
        const fileIdMatch = url.match(/\/d\/(.+?)\/|id=(.+?)(&|$)/);
        if (fileIdMatch) {
          const fileId = fileIdMatch[1] || fileIdMatch[2];
          downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        }
      }
      
      if (url.includes('1drv.ms') || url.includes('onedrive.live.com')) {
        downloadUrl = url.replace('/edit?', '/download?');
      }
      
      if (url.includes('dropbox.com')) {
        downloadUrl = url.replace('?dl=0', '?dl=1');
      }
      
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const fileName = url.split('/').pop()?.split('?')[0] || 'imported_file.xlsx';
      return new File([blob], fileName, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    } catch (error: any) {
      throw new Error(`Failed to import from URL: ${error.message}`);
    }
  }
  
  // ============================================
  // IMPORT FROM GOOGLE SHEET
  // ============================================
  
  static async importFromGoogleSheet(sheetUrl: string): Promise<File> {
    try {
      let fileId = '';
      const patterns = [
        /\/d\/([a-zA-Z0-9_-]+)/,
        /spreadsheets\/d\/([a-zA-Z0-9_-]+)/,
        /key=([a-zA-Z0-9_-]+)/
      ];
      
      for (const pattern of patterns) {
        const match = sheetUrl.match(pattern);
        if (match) {
          fileId = match[1];
          break;
        }
      }
      
      if (!fileId) {
        throw new Error('Could not extract Google Sheet ID');
      }
      
      const exportUrl = `https://docs.google.com/spreadsheets/d/${fileId}/export?format=xlsx`;
      const response = await fetch(exportUrl);
      if (!response.ok) {
        throw new Error(`Failed to export sheet: ${response.status}`);
      }
      
      const blob = await response.blob();
      return new File([blob], `google_sheet_${fileId}.xlsx`, { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
    } catch (error: any) {
      throw new Error(`Google Sheet import failed: ${error.message}`);
    }
  }
}