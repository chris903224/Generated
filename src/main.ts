/**
 * VeriStud Student Portal - Main Entry Point
 * TypeScript-based student identity verification system with Supabase
 * Full Security: Anti-F12, Anti-right click, Anti-inspect, Anti-console
 * Input Validation: Only numbers and dash (-) allowed for Control Number and Student ID
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
// SECURITY MEASURES (FULL)
// ============================================

function initSecurity(): void {
  // 1. Disable Right Click
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  });

  // 2. Disable Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    const key = e.key;
    const ctrl = e.ctrlKey;
    const shift = e.shiftKey;
    
    if (key === 'F12' || 
        (ctrl && shift && key === 'I') ||
        (ctrl && shift && key === 'J') ||
        (ctrl && shift && key === 'C') ||
        (ctrl && shift && key === 'K') ||
        (ctrl && key === 'u') ||
        (ctrl && key === 's') ||
        (ctrl && key === 'p') ||
        key === 'PrintScreen') {
      e.preventDefault();
      return false;
    }
  });

  // 3. Disable Drag and Drop
  window.addEventListener('dragstart', (e) => {
    e.preventDefault();
    return false;
  });

  // 4. Disable Text Selection on non-input elements
  document.addEventListener('selectstart', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return true;
    }
    e.preventDefault();
    return false;
  });

  // 5. Disable Copy/Paste on non-input elements
  document.addEventListener('copy', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return true;
    }
    e.preventDefault();
    return false;
  });

  document.addEventListener('cut', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return true;
    }
    e.preventDefault();
    return false;
  });

  document.addEventListener('paste', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return true;
    }
    e.preventDefault();
    return false;
  });

  // 6. Clear console logs in production
  if (window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')) {
    console.log = function() {};
    console.info = function() {};
    console.warn = function() {};
    console.error = function() {};
  }

  // 7. Add meta tags to prevent caching
  const metaNoCache = document.createElement('meta');
  metaNoCache.httpEquiv = 'Cache-Control';
  metaNoCache.content = 'no-cache, no-store, must-revalidate';
  document.head.appendChild(metaNoCache);
  
  const metaPragma = document.createElement('meta');
  metaPragma.httpEquiv = 'Pragma';
  metaPragma.content = 'no-cache';
  document.head.appendChild(metaPragma);
  
  const metaExpires = document.createElement('meta');
  metaExpires.httpEquiv = 'Expires';
  metaExpires.content = '0';
  document.head.appendChild(metaExpires);

  console.log('✅ Security fully initialized on student portal');
}

// ============================================
// INPUT VALIDATION (Numbers and Dash only)
// ============================================

function validateInput(input: string): boolean {
  // Only allow numbers, dash (-), and optional plus sign
  // Pattern: digits, dashes, and spaces (trimmed later)
  const pattern = /^[0-9\-]+$/;
  return pattern.test(input);
}

function formatInput(input: string): string {
  // Remove any leading/trailing spaces and keep only valid characters
  return input.trim().replace(/[^0-9\-]/g, '');
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
    
    // Initialize security first
    initSecurity();
    
    // Setup input validators
    this.setupInputValidators();
    
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
   * Setup input validators for Control Number and Student ID
   */
  private setupInputValidators(): void {
    const controlInput = document.getElementById('controlNum') as HTMLInputElement;
    const studentIdInput = document.getElementById('studentId') as HTMLInputElement;
    
    if (controlInput) {
      // Validate on input
      controlInput.addEventListener('input', (e) => {
        const input = e.target as HTMLInputElement;
        const rawValue = input.value;
        
        if (!validateInput(rawValue) && rawValue !== '') {
          // Show error styling
          input.classList.add('input-error');
          this.showInputError('ctrl', 'Only numbers and dash (-) are allowed');
        } else {
          input.classList.remove('input-error');
          this.clearInputError('ctrl');
        }
      });
      
      // Format on blur
      controlInput.addEventListener('blur', (e) => {
        const input = e.target as HTMLInputElement;
        input.value = formatInput(input.value);
      });
    }
    
    if (studentIdInput) {
      // Validate on input
      studentIdInput.addEventListener('input', (e) => {
        const input = e.target as HTMLInputElement;
        const rawValue = input.value;
        
        if (!validateInput(rawValue) && rawValue !== '') {
          input.classList.add('input-error');
          this.showInputError('id', 'Only numbers and dash (-) are allowed');
        } else {
          input.classList.remove('input-error');
          this.clearInputError('id');
        }
      });
      
      // Format on blur
      studentIdInput.addEventListener('blur', (e) => {
        const input = e.target as HTMLInputElement;
        input.value = formatInput(input.value);
      });
    }
  }

  /**
   * Show input error message
   */
  private showInputError(field: 'ctrl' | 'id', message: string): void {
    const errorElement = field === 'ctrl' 
      ? document.getElementById('controlError')
      : document.getElementById('idError');
    
    const inputElement = field === 'ctrl'
      ? document.getElementById('controlNum') as HTMLInputElement
      : document.getElementById('studentId') as HTMLInputElement;
    
    if (errorElement) {
      errorElement.textContent = `⚠ ${message}`;
      errorElement.style.color = '#c0392b';
    }
    
    if (inputElement) {
      inputElement.style.borderColor = '#c0392b';
    }
  }

  /**
   * Clear input error message
   */
  private clearInputError(field: 'ctrl' | 'id'): void {
    const errorElement = field === 'ctrl'
      ? document.getElementById('controlError')
      : document.getElementById('idError');
    
    const inputElement = field === 'ctrl'
      ? document.getElementById('controlNum') as HTMLInputElement
      : document.getElementById('studentId') as HTMLInputElement;
    
    if (errorElement) {
      errorElement.textContent = '';
    }
    
    if (inputElement) {
      inputElement.style.borderColor = '';
    }
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
    // Login handler with validation
    const loginHandler = () => {
      let controlNumber = this.getControlNumberValue();
      let studentId = this.getStudentIdValue();
      
      // Validate inputs before login
      if (!validateInput(controlNumber) && controlNumber !== '') {
        this.showInputError('ctrl', 'Only numbers and dash (-) are allowed');
        this.ui.shakeCard();
        return;
      }
      
      if (!validateInput(studentId) && studentId !== '') {
        this.showInputError('id', 'Only numbers and dash (-) are allowed');
        this.ui.shakeCard();
        return;
      }
      
      // Clean the inputs
      controlNumber = formatInput(controlNumber);
      studentId = formatInput(studentId);
      
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