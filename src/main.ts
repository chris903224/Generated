/**
 * VeriStud Student Portal - Main Entry Point
 * TypeScript-based student identity verification system with Supabase
 */

import { UIController } from './controllers/ui.controller';
import { AuthController } from './controllers/auth.controller';
import { supabase, StudentService } from './services/supabase.service';

// ============================================
// TYPES
// ============================================

export interface UserProfile {
  fullName: string;
  course: string;
  yearLevel: string;
  section: string;
  controlNumber: string;
  studentId: string;
  supportType: string;
  remarks: string;
  endorsement: string;
  dataSheet: string;
  duties: string;
  hours: string;
  status: string;
}

// ============================================
// MAIN APPLICATION CLASS
// ============================================

/**
 * Initialize and bootstrap the application
 */
class VeriStudApp {
  private ui: UIController;
  private auth: AuthController;
  private isInitialized: boolean = false;

  constructor() {
    this.ui = new UIController();
    this.auth = new AuthController(this.ui);
  }

  /**
   * Initialize the application
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('VeriStud App already initialized');
      return;
    }

    console.log('🚀 VeriStud Student Portal Initializing...');
    
    // Test Supabase connection
    await this.testSupabaseConnection();
    
    // Setup all event listeners
    this.setupEventListeners();
    
    // Check for existing session
    await this.checkExistingSession();
    
    // Setup theme
    this.setupTheme();
    
    this.isInitialized = true;
    console.log('✅ VeriStud App successfully initialized');
  }

  /**
   * Test Supabase connection
   */
  private async testSupabaseConnection(): Promise<void> {
    try {
      const { data, error } = await supabase.from('students').select('count', { count: 'exact', head: true });
      if (error) {
        console.error('❌ Supabase connection failed:', error.message);
      } else {
        console.log('✅ Supabase connected successfully');
      }
    } catch (error) {
      console.error('❌ Supabase connection error:', error);
    }
  }

  /**
   * Setup all event listeners for the application
   */
  private setupEventListeners(): void {
    // Login handler
    const loginHandler = () => {
      const controlNumber = this.getControlNumberValue();
      const studentId = this.getStudentIdValue();
      this.auth.login(controlNumber, studentId);
    };

    // Logout handler
    const logoutHandler = () => {
      this.auth.logout();
    };

    // Reset handler for login form
    const resetHandler = () => {
      this.ui.resetForm();
      this.ui.showLogin();
    };

    // Setup UI event listeners
    this.ui.setupEventListeners(loginHandler, resetHandler);
  }

  /**
   * Check if user has an existing session
   */
  private async checkExistingSession(): Promise<void> {
    const currentUser = this.auth.getCurrentUser();
    if (currentUser) {
      console.log('📋 Existing session found for:', currentUser.fullName);
      this.ui.populateProfile(currentUser);
      this.ui.showProfile();
      
      // Load table data from Supabase
      await this.loadTableData();
    }
  }

  /**
   * Load table data from Supabase
   */
  private async loadTableData(): Promise<void> {
    try {
      const students = await StudentService.getAllStudents();
      console.log('📊 Loaded', students.length, 'students from database');
      
      // Convert to UserProfile format with hours included
      const userProfiles: UserProfile[] = students.map(s => ({
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
      }));
      
      this.ui.renderTable(userProfiles);
    } catch (error) {
      console.error('Failed to load table data:', error);
      this.ui.renderTable([]);
    }
  }

  /**
   * Setup theme (light/dark mode)
   */
  private setupTheme(): void {
    const savedTheme = localStorage.getItem('veristud_theme');
    const isDark = savedTheme === 'dark';
    const themeIcon = document.getElementById('fabIcon');
    
    if (isDark) {
      document.body.classList.add('black-theme');
      document.body.classList.remove('white-theme');
      if (themeIcon) themeIcon.textContent = '☀️';
    } else {
      document.body.classList.add('white-theme');
      document.body.classList.remove('black-theme');
      if (themeIcon) themeIcon.textContent = '🌙';
    }
  }

  /**
   * Get control number input value
   */
  private getControlNumberValue(): string {
    const input = document.getElementById('controlNum') as HTMLInputElement;
    return input?.value?.trim() || '';
  }

  /**
   * Get student ID input value
   */
  private getStudentIdValue(): string {
    const input = document.getElementById('studentId') as HTMLInputElement;
    return input?.value?.trim() || '';
  }

  /**
   * Get application version
   */
  public getVersion(): string {
    return '1.0.0';
  }

  /**
   * Get application name
   */
  public getAppName(): string {
    return 'VeriStud Student Portal';
  }
}

// ============================================
// START APPLICATION
// ============================================

// Create and initialize the application instance
const app = new VeriStudApp();

// Start the application when DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    app.initialize().catch(console.error);
  });
} else {
  // DOM is already loaded
  app.initialize().catch(console.error);
}

// Expose app instance for debugging (development only)
if (import.meta.env.DEV) {
  (window as any).__VERISTUD_APP__ = app;
  console.log('🐛 Debug mode enabled. Access app via window.__VERISTUD_APP__');
}