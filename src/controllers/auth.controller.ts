import { StudentService } from '../services/supabase.service';
import type { UserProfile } from '../types';

export class AuthController {
  private currentUser: UserProfile | null = null;

  constructor(private ui: any) {}

  async login(controlNumber: string, studentId: string): Promise<boolean> {
    this.ui.clearErrors();

    let hasError = false;
    if (!controlNumber) {
      this.ui.setFieldError('ctrl', 'Control number is required');
      hasError = true;
    }
    if (!studentId) {
      this.ui.setFieldError('id', 'Student ID is required');
      hasError = true;
    }
    if (hasError) {
      this.ui.shakeCard();
      return false;
    }

    try {
      const student = await StudentService.getStudentByCredentials(controlNumber, studentId);
      
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
          hours: student.hours || '0 hrs',        // ADDED
          status: student.status
        };
        
        this.ui.setFieldSuccess('ctrl');
        this.ui.setFieldSuccess('id');
        this.ui.populateProfile(this.currentUser);
        
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
        this.ui.setFieldError('ctrl', 'Invalid credentials');
        this.ui.setFieldError('id', 'Control number or Student ID not found');
        this.ui.shakeCard();
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      this.ui.setFieldError('ctrl', 'Connection error');
      this.ui.setFieldError('id', 'Please try again');
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