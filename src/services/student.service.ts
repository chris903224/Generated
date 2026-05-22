// services/student.service.ts

import type { Student, StudentFormData } from '../types/student.types';

// In-memory storage (will be replaced by API later)
let students: Student[] = [];

// Generate unique ID
function generateId(): string {
  return 'STU-' + Date.now() + '-' + Math.random().toString(36).substr(2, 8);
}

// Generate PHINMA ID
function generatePhinmaId(): string {
  const num = students.length + 2600;
  return 'PH-' + String(num).padStart(5, '0');
}

export const StudentService = {
  // ============================================
  // GETTERS
  // ============================================
  
  getAllStudents(): Student[] {
    return [...students];
  },

  getStudentById(id: string): Student | undefined {
    return students.find(s => s.id === id);
  },

  getStudentByPhinmaId(phinmaId: string): Student | undefined {
    return students.find(s => s.phinmaId === phinmaId);
  },

  getStudentByControlNumber(controlNumber: string): Student | undefined {
    // Add this method for compatibility with admin side
    return students.find(s => s.phinmaId === controlNumber);
  },

  getStudentByStudentId(studentId: string): Student | undefined {
    // Add this method for compatibility with admin side
    return students.find(s => s.id === studentId);
  },

  getTotalCount(): number {
    return students.length;
  },

  getStats(): { total: number; completed: number; pending: number; notCompleted: number; hk: number; continuingOS: number } {
    const total = students.length;
    const completed = students.filter(s => s.remarks === 'COMPLETED').length;
    const pending = students.filter(s => s.remarks === 'PENDING').length;
    const notCompleted = students.filter(s => s.remarks === 'NOT COMPLETED').length;
    const hk = students.filter(s => s.endorsement === 'Endorsement for OJT - HK Duty').length;
    const continuingOS = students.filter(s => s.endorsement === 'Endorsed as Continuing OS').length;
    
    return { total, completed, pending, notCompleted, hk, continuingOS };
  },

  // ============================================
  // CRUD OPERATIONS
  // ============================================
  
  addStudent(formData: StudentFormData): Student {
    if (!formData.name || !formData.name.trim()) {
      throw new Error('Student name is required');
    }
    
    const newStudent: Student = {
      id: generateId(),
      phinmaId: generatePhinmaId(),
      name: formData.name.trim(),
      course: formData.course || 'BSIT',
      year: formData.year || 'YEAR 1',
      supportType: formData.supportType || 'FRESHMEN OS',
      remarks: formData.remarks || 'PENDING',
      endorsement: formData.endorsement || 'Not Continuing OS',
      dataSheet: formData.dataSheet || 'Encoded',
      duties: formData.duties || 'Regular Duty Assigned'
    };
    
    students.push(newStudent);
    return newStudent;
  },

  updateStudent(id: string, formData: Partial<StudentFormData>): Student | null {
    const index = students.findIndex(s => s.id === id);
    if (index === -1) return null;
    
    const updatedStudent: Student = {
      ...students[index],
      name: formData.name?.trim() || students[index].name,
      course: formData.course || students[index].course,
      year: formData.year || students[index].year,
      supportType: formData.supportType || students[index].supportType,
      remarks: formData.remarks || students[index].remarks,
      endorsement: formData.endorsement || students[index].endorsement,
      dataSheet: formData.dataSheet || students[index].dataSheet,
      duties: formData.duties || students[index].duties
    };
    
    students[index] = updatedStudent;
    return updatedStudent;
  },

  deleteStudent(id: string): boolean {
    const index = students.findIndex(s => s.id === id);
    if (index === -1) return false;
    students.splice(index, 1);
    return true;
  },

  deleteAllStudents(): void {
    students = [];
  },

  // ============================================
  // SEARCH & FILTER
  // ============================================
  
  searchStudents(query: string): Student[] {
    if (!query || query.trim() === '') {
      return [...students];
    }
    
    const lowerQuery = query.toLowerCase().trim();
    return students.filter(s => 
      s.name.toLowerCase().includes(lowerQuery) ||
      s.course.toLowerCase().includes(lowerQuery) ||
      s.phinmaId.toLowerCase().includes(lowerQuery)
    );
  },

  filterByRemarks(remarks: string): Student[] {
    if (!remarks) return [...students];
    return students.filter(s => s.remarks === remarks);
  },

  filterByCourse(course: string): Student[] {
    if (!course) return [...students];
    return students.filter(s => s.course === course);
  },

  getHKStudents(): Student[] {
    return students.filter(s => s.endorsement === 'Endorsement for OJT - HK Duty');
  },

  // ============================================
  // VALIDATION
  // ============================================
  
  validateStudentData(formData: StudentFormData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!formData.name || !formData.name.trim()) {
      errors.push('Name is required');
    }
    
    return { isValid: errors.length === 0, errors };
  },

  // ============================================
  // RESET
  // ============================================
  
  reset(): void {
    students = [];
  },

  count(): number {
    return students.length;
  }
};

// Add default export for compatibility
export default StudentService;