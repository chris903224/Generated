// controllers/auth.controller.ts - FULL CORRECTED VERSION
// Student ID is REQUIRED, Control Number is OPTIONAL

import { StudentService } from '../services/supabase.service';
import type { UserProfile } from '../types';

export class AuthController {
  private currentUser: UserProfile | null = null;

  constructor(private ui: any) {}

  /**
   * Login with Student ID (required) and Control Number (optional)
   * @param studentId - Student ID (required)
   * @param controlNumber - Control Number (optional)
   */
  async login(studentId: string, controlNumber: string = ''): Promise<boolean> {
    this.ui.clearErrors();

    let hasError = false;
    
    // Student ID is REQUIRED
    if (!studentId) {
      this.ui.setFieldError('id', 'Student ID is required');
      hasError = true;
    }
    
    // Control Number is OPTIONAL - no error if empty
    // Only validate format if provided
    if (controlNumber && controlNumber.length > 0) {
      // Optional: Add format validation here if needed
    }
    
    if (hasError) {
      this.ui.shakeCard();
      return false;
    }

    try {
      // Search by Student ID first (primary)
      let student = await StudentService.getStudentByStudentId(studentId);
      
      // If found by Student ID and control number is provided, verify it matches
      if (student && controlNumber && controlNumber.length > 0) {
        if (student.control_number !== controlNumber) {
          // Control number provided but doesn't match - optional verification failed
          this.ui.setFieldError('ctrl', 'Control number does not match');
          this.ui.shakeCard();
          return false;
        }
      }
      
      // If not found by Student ID, try searching by Control Number (fallback)
      if (!student && controlNumber && controlNumber.length > 0) {
        student = await StudentService.getStudentByControlNumber(controlNumber);
        // If found by control number, verify Student ID matches
        if (student && student.student_id !== studentId) {
          this.ui.setFieldError('id', 'Student ID does not match');
          this.ui.shakeCard();
          return false;
        }
      }
      
      if (student) {
        this.currentUser = {
          fullName: student.full_name,
          course: student.course,
          yearLevel: student.year_level,
          section: student.section || '',
          controlNumber: student.control_number,
          studentId: student.student_id,
          supportType: student.support_type,
          remarks: student.remarks,
          endorsement: student.endorsement,
          dataSheet: student.data_sheet,
          duties: student.duties,
          hours: student.hours || '0 hrs',
          status: student.status
        };
        
        this.ui.setFieldSuccess('id');
        if (controlNumber) this.ui.setFieldSuccess('ctrl');
        this.ui.populateProfile(this.currentUser);
        
        // Load all students for the table view
        const allStudents = await StudentService.getAllStudents();
        this.ui.renderTable(allStudents.map(s => ({
          fullName: s.full_name,
          course: s.course,
          yearLevel: s.year_level,
          section: s.section || '',
          controlNumber: s.control_number,
          studentId: s.student_id,
          supportType: s.support_type,
          remarks: s.remarks,
          endorsement: s.endorsement,
          dataSheet: s.data_sheet,
          duties: s.duties,
          hours: s.hours || '0 hrs',             
          status: s.status
        })));
        
        this.ui.showProfile();
        return true;
      } else {
        // No student found with the provided credentials
        this.ui.setFieldError('id', 'Student ID not found');
        if (controlNumber) this.ui.setFieldError('ctrl', 'Invalid credentials');
        this.ui.shakeCard();
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      this.ui.setFieldError('id', 'Connection error');
      this.ui.setFieldError('ctrl', 'Please try again');
      this.ui.shakeCard();
      return false;
    }
  }

  logout(): void {
    this.currentUser = null;
    this.ui.resetForm();
    this.ui.showLogin();
  }

  getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }
}