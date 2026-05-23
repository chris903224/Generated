// services/supabase.service.ts

import { createClient } from '@supabase/supabase-js';

// ============================================
// SUPABASE CLIENT INITIALIZATION
// ============================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('Missing VITE_SUPABASE_URL environment variable');
}
if (!supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// ============================================
// TYPES / INTERFACES
// ============================================

export interface Student {
  id: string;
  control_number: string;
  student_id: string;
  full_name: string;
  course: string;
  year_level: string;
  section: string | null;
  support_type: string;
  remarks: string;
  endorsement: string;
  data_sheet: string;
  duties: string;
  hours: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface StudentFormData {
  control_number?: string;
  student_id?: string;
  full_name: string;
  course: string;
  year_level: string;
  section: string;
  support_type: string;
  remarks: string;
  endorsement: string;
  data_sheet: string;
  duties: string;
  hours?: string;
  status: string;
}

export interface Stats {
  total: number;
  completed: number;
  pending: number;
  notCompleted: number;
  hk: number;
  continuingOS: number;
}

// ============================================
// ONE-TIME MAGIC LINK STORAGE
// ============================================

const USED_LINKS_KEY = 'used_magic_links';
const LINK_EXPIRY_KEY = 'magic_link_expires_at';

const MagicLinkManager = {
  getUsedLinks(): string[] {
    const used = localStorage.getItem(USED_LINKS_KEY);
    return used ? JSON.parse(used) : [];
  },

  addUsedLink(token: string): void {
    const usedLinks = this.getUsedLinks();
    usedLinks.push(token);
    if (usedLinks.length > 100) {
      usedLinks.shift();
    }
    localStorage.setItem(USED_LINKS_KEY, JSON.stringify(usedLinks));
  },

  isLinkUsed(token: string): boolean {
    const usedLinks = this.getUsedLinks();
    return usedLinks.includes(token);
  },

  isLinkExpired(): boolean {
    const expiresAt = localStorage.getItem(LINK_EXPIRY_KEY);
    if (!expiresAt) return true;
    return new Date() > new Date(expiresAt);
  },

  storeLinkExpiration(): void {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    localStorage.setItem(LINK_EXPIRY_KEY, expiresAt.toISOString());
  },

  clearExpiredLinks(): void {
    if (this.isLinkExpired()) {
      localStorage.removeItem(USED_LINKS_KEY);
      localStorage.removeItem(LINK_EXPIRY_KEY);
    }
  },

  generateToken(): string {
    return crypto.randomUUID() + '-' + Date.now();
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const getRedirectUrl = (token: string): string => {
  const isProduction = window.location.hostname !== 'localhost' && 
                       window.location.hostname !== '127.0.0.1';
  
  if (isProduction) {
    // Force production URL
    return `https://generatedcontrolnumbers.vercel.app/admin-callback.html?token=${token}`;
  } else {
    // Local development
    return `${window.location.origin}/admin-callback.html?token=${token}`;
  }
};

// ============================================
// STUDENT SERVICE
// ============================================

export const StudentService = {
  // ============================================
  // GETTERS
  // ============================================

  async getAllStudents(): Promise<Student[]> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching students:', error);
      return [];
    }
    return data || [];
  },

  async getStudentById(id: string): Promise<Student | null> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching student by ID:', error);
      return null;
    }
    return data;
  },

  async getStudentByCredentials(controlNumber: string, studentId: string): Promise<Student | null> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('control_number', controlNumber)
      .eq('student_id', studentId)
      .single();
    
    if (error) {
      console.error('Error finding student by credentials:', error);
      return null;
    }
    return data;
  },

  async getStudentByControlNumber(controlNumber: string): Promise<Student | null> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('control_number', controlNumber)
      .single();
    
    if (error) return null;
    return data;
  },

  async getStudentByStudentId(studentId: string): Promise<Student | null> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('student_id', studentId)
      .single();
    
    if (error) return null;
    return data;
  },

  async getTotalCount(): Promise<number> {
    const { count, error } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });
    
    if (error) return 0;
    return count || 0;
  },

  async getStats(): Promise<Stats> {
    const { data, error } = await supabase.from('students').select('remarks, endorsement');
    
    if (error) {
      console.error('Error getting stats:', error);
      return { total: 0, completed: 0, pending: 0, notCompleted: 0, hk: 0, continuingOS: 0 };
    }
    
    const total = data.length;
    const completed = data.filter(s => s.remarks === 'COMPLETED').length;
    const pending = data.filter(s => s.remarks === 'PENDING').length;
    const notCompleted = data.filter(s => s.remarks === 'NOT COMPLETED').length;
    const hk = data.filter(s => s.endorsement === 'Endorsement for OJT - HK Duty').length;
    const continuingOS = data.filter(s => s.endorsement === 'Endorsed as Continuing OS').length;
    
    return { total, completed, pending, notCompleted, hk, continuingOS };
  },

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  async addStudent(student: StudentFormData): Promise<Student | null> {
    const newStudent = {
      ...student,
      hours: student.hours || '0 hrs'
    };
    
    const { data, error } = await supabase
      .from('students')
      .insert([newStudent])
      .select()
      .single();
    
    if (error) {
      console.error('Error adding student:', error);
      return null;
    }
    return data;
  },

  async updateStudent(id: string, updates: Partial<StudentFormData>): Promise<Student | null> {
    const { data, error } = await supabase
      .from('students')
      .update({
        ...updates,
        hours: updates.hours || '0 hrs',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating student:', error);
      return null;
    }
    return data;
  },

  async deleteStudent(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting student:', error);
      return false;
    }
    return true;
  },

  async deleteAllStudents(): Promise<boolean> {
    const { error } = await supabase
      .from('students')
      .delete()
      .neq('id', '');
    
    if (error) {
      console.error('Error deleting all students:', error);
      return false;
    }
    return true;
  },

  // ============================================
  // SEARCH & FILTER
  // ============================================

  async searchStudents(query: string): Promise<Student[]> {
    if (!query || query.trim() === '') {
      return this.getAllStudents();
    }
    
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .or(`full_name.ilike.%${query}%,course.ilike.%${query}%,student_id.ilike.%${query}%,control_number.ilike.%${query}%`)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error searching students:', error);
      return [];
    }
    return data || [];
  },

  async filterByRemarks(remarks: string): Promise<Student[]> {
    if (!remarks) return this.getAllStudents();
    
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('remarks', remarks)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error filtering by remarks:', error);
      return [];
    }
    return data || [];
  },

  async filterByCourse(course: string): Promise<Student[]> {
    if (!course) return this.getAllStudents();
    
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('course', course)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error filtering by course:', error);
      return [];
    }
    return data || [];
  },

  async filterByEndorsement(endorsement: string): Promise<Student[]> {
    if (!endorsement) return this.getAllStudents();
    
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('endorsement', endorsement)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error filtering by endorsement:', error);
      return [];
    }
    return data || [];
  },

  async filterByYearLevel(yearLevel: string): Promise<Student[]> {
    if (!yearLevel) return this.getAllStudents();
    
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('year_level', yearLevel)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error filtering by year level:', error);
      return [];
    }
    return data || [];
  },

  async filterBySupportType(supportType: string): Promise<Student[]> {
    if (!supportType) return this.getAllStudents();
    
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('support_type', supportType)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error filtering by support type:', error);
      return [];
    }
    return data || [];
  },

  async getHKStudents(): Promise<Student[]> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('endorsement', 'Endorsement for OJT - HK Duty')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error getting HK students:', error);
      return [];
    }
    return data || [];
  },

  async getStudentsByCourse(course: string): Promise<Student[]> {
    return this.filterByCourse(course);
  },

  async getStudentsByYear(year: string): Promise<Student[]> {
    return this.filterByYearLevel(year);
  },

  // ============================================
  // BULK OPERATIONS
  // ============================================

  async addMultipleStudents(studentsData: StudentFormData[]): Promise<Student[]> {
    const addedStudents: Student[] = [];
    for (const data of studentsData) {
      const newStudent = await this.addStudent(data);
      if (newStudent) addedStudents.push(newStudent);
    }
    return addedStudents;
  },

  async deleteMultipleStudents(ids: string[]): Promise<number> {
    let deletedCount = 0;
    for (const id of ids) {
      const success = await this.deleteStudent(id);
      if (success) deletedCount++;
    }
    return deletedCount;
  },

  async importStudents(importedStudents: StudentFormData[]): Promise<number> {
    let addedCount = 0;
    for (const student of importedStudents) {
      const exists = await this.getStudentByControlNumber(student.control_number || '');
      if (!exists) {
        const newStudent = await this.addStudent(student);
        if (newStudent) addedCount++;
      }
    }
    return addedCount;
  },

  async exportStudents(): Promise<string> {
    const students = await this.getAllStudents();
    return JSON.stringify(students, null, 2);
  },

  // ============================================
  // VALIDATION
  // ============================================

  async isControlNumberExists(controlNumber: string): Promise<boolean> {
    const student = await this.getStudentByControlNumber(controlNumber);
    return student !== null;
  },

  async isStudentIdExists(studentId: string): Promise<boolean> {
    const student = await this.getStudentByStudentId(studentId);
    return student !== null;
  },

  validateStudentData(formData: StudentFormData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!formData.full_name || !formData.full_name.trim()) {
      errors.push('Student name is required');
    }
    
    if (formData.full_name && formData.full_name.length > 100) {
      errors.push('Name is too long (max 100 characters)');
    }
    
    if (formData.course && formData.course.length > 50) {
      errors.push('Course name is too long (max 50 characters)');
    }
    
    return { isValid: errors.length === 0, errors };
  },

  // ============================================
  // RESET / CLEAR
  // ============================================

  async reset(): Promise<void> {
    await this.deleteAllStudents();
  },

  async count(): Promise<number> {
    return this.getTotalCount();
  },

  async all(): Promise<Student[]> {
    return this.getAllStudents();
  }
};

// ============================================
// ADMIN AUTH SERVICE (ONE-TIME MAGIC LINK)
// ============================================

export const AdminAuthService = {
  /**
   * Send magic link to email (ONE-TIME USE ONLY)
   */
  async sendMagicLink(email: string): Promise<{ success: boolean; message: string }> {
    try {
      // Clear expired links first
      MagicLinkManager.clearExpiredLinks();
      
      // Generate unique token for this magic link
      const token = MagicLinkManager.generateToken();
      
      // Get the correct redirect URL based on environment
      const redirectUrl = getRedirectUrl(token);
      
      console.log('Sending magic link to:', email);
      console.log('Redirect URL:', redirectUrl);
      
      // Send magic link with forced redirect URL
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            magic_link_token: token,
            sent_at: new Date().toISOString()
          }
        }
      });
      
      if (error) {
        console.error('Magic link error:', error);
        return { success: false, message: error.message };
      }
      
      // Store token and expiration for this link
      MagicLinkManager.storeLinkExpiration();
      
      return { 
        success: true, 
        message: '🔐 One-time magic link sent! Check your email. This link can only be used once and expires in 24 hours.' 
      };
    } catch (error: any) {
      console.error('Send magic link exception:', error);
      return { success: false, message: error.message || 'Failed to send magic link' };
    }
  },

  /**
   * Handle callback from magic link (ONE-TIME USE VALIDATION)
   */
  async handleCallback(): Promise<{ success: boolean; message: string }> {
    try {
      // Get the URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      
      console.log('Handling callback with token:', token);
      
      // Check if link is expired
      if (MagicLinkManager.isLinkExpired()) {
        return { 
          success: false, 
          message: '❌ This magic link has expired. Please request a new one.' 
        };
      }
      
      // Check if token exists and hasn't been used
      if (token) {
        if (MagicLinkManager.isLinkUsed(token)) {
          return { 
            success: false, 
            message: '⚠️ This magic link has already been used. Please request a new one for security purposes.' 
          };
        }
        
        // Mark this token as used
        MagicLinkManager.addUsedLink(token);
      }
      
      // Get the session from Supabase
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        console.error('Callback error:', error);
        return { success: false, message: 'Failed to authenticate. Please try again.' };
      }
      
      // Store admin session info
      localStorage.setItem('admin_logged_in', 'true');
      localStorage.setItem('admin_email', session.user.email || '');
      localStorage.setItem('admin_user_id', session.user.id);
      localStorage.setItem('admin_login_time', new Date().toISOString());
      
      console.log('Admin logged in:', session.user.email);
      
      return { success: true, message: '✅ Successfully logged in!' };
    } catch (error: any) {
      console.error('Handle callback error:', error);
      return { success: false, message: error.message || 'Authentication failed' };
    }
  },

  /**
   * Check if admin is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();
    const adminLoggedIn = localStorage.getItem('admin_logged_in') === 'true';
    return !!(session && adminLoggedIn);
  },

  /**
   * Get current admin user
   */
  async getCurrentAdmin(): Promise<any> {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  /**
   * Get admin email
   */
  getAdminEmail(): string | null {
    return localStorage.getItem('admin_email');
  },

  /**
   * Logout admin
   */
  async logout(): Promise<void> {
    await supabase.auth.signOut();
    localStorage.removeItem('admin_logged_in');
    localStorage.removeItem('admin_email');
    localStorage.removeItem('admin_user_id');
    localStorage.removeItem('admin_login_time');
    localStorage.removeItem('used_magic_links');
    localStorage.removeItem('magic_link_expires_at');
    window.location.href = '/admin-login.html';
  },

  /**
   * Check if current session is valid
   */
  async validateSession(): Promise<boolean> {
    const isAuth = await this.isAuthenticated();
    if (!isAuth) {
      await this.logout();
      return false;
    }
    return true;
  }
};

// ============================================
// EXPORT DEFAULT
// ============================================

export default {
  supabase,
  StudentService,
  AdminAuthService
};