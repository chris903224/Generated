/**
 * VeriStud Student Portal - Main Entry Point
 * TypeScript-based student identity verification system with Supabase
 * Full Security: Anti-F12, Anti-right click, Anti-inspect, Anti-console
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
    
    // F12 key
    if (key === 'F12') {
      e.preventDefault();
      return false;
    }
    // Ctrl+Shift+I (Inspect Element)
    if (ctrl && shift && key === 'I') {
      e.preventDefault();
      return false;
    }
    // Ctrl+Shift+J (Console)
    if (ctrl && shift && key === 'J') {
      e.preventDefault();
      return false;
    }
    // Ctrl+Shift+C (Inspect Element)
    if (ctrl && shift && key === 'C') {
      e.preventDefault();
      return false;
    }
    // Ctrl+Shift+K (Console - Firefox)
    if (ctrl && shift && key === 'K') {
      e.preventDefault();
      return false;
    }
    // Ctrl+U (View Source)
    if (ctrl && key === 'u') {
      e.preventDefault();
      return false;
    }
    // Ctrl+S (Save Page)
    if (ctrl && key === 's') {
      e.preventDefault();
      return false;
    }
    // Ctrl+P (Print)
    if (ctrl && key === 'p') {
      e.preventDefault();
      return false;
    }
    // Print Screen
    if (key === 'PrintScreen') {
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

  // 6. Detect DevTools Opening
  let devtoolsOpen = false;
  const element = new Image();
  
  Object.defineProperty(element, 'id', {
    get: function() {
      devtoolsOpen = true;
      document.body.innerHTML = `
        <div style="text-align:center; padding:50px; font-family: 'DM Sans', sans-serif;">
          <h1 style="color:#ef4444;">🔒 Access Denied</h1>
          <p>Developer tools detected. Please close DevTools to continue.</p>
          <button onclick="location.reload()" style="padding:10px 20px; margin-top:20px; cursor:pointer; background:#1e5c3a; color:white; border:none; border-radius:8px;">Refresh Page</button>
        </div>
      `;
    }
  });
  
  setInterval(() => {
    devtoolsOpen = false;
    console.dir(element);
    if (devtoolsOpen) {
      document.body.innerHTML = `
        <div style="text-align:center; padding:50px; font-family: 'DM Sans', sans-serif;">
          <h1 style="color:#ef4444;">🔒 Access Denied</h1>
          <p>Developer tools detected. Please close DevTools to continue.</p>
          <button onclick="location.reload()" style="padding:10px 20px; margin-top:20px; cursor:pointer; background:#1e5c3a; color:white; border:none; border-radius:8px;">Refresh Page</button>
        </div>
      `;
    }
  }, 1000);

  // 7. Detect DevTools via window size
  let devtoolsDetected = false;
  const threshold = 160;
  
  const checkDevTools = function() {
    const widthDiff = window.outerWidth - window.innerWidth;
    const heightDiff = window.outerHeight - window.innerHeight;
    
    if ((widthDiff > threshold || heightDiff > threshold) && !devtoolsDetected) {
      devtoolsDetected = true;
      document.body.innerHTML = `
        <div style="text-align:center; padding:50px; font-family: 'DM Sans', sans-serif;">
          <h1 style="color:#ef4444;">🔒 Security Violation</h1>
          <p>Developer tools detected. Access denied.</p>
          <button onclick="location.reload()" style="padding:10px 20px; margin-top:20px; cursor:pointer; background:#1e5c3a; color:white; border:none; border-radius:8px;">Refresh Page</button>
        </div>
      `;
    }
  };
  
  setInterval(checkDevTools, 1000);

  // 8. Clear console logs in production
  if (window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')) {
    console.log = function() {};
    console.info = function() {};
    console.warn = function() {};
    console.error = function() {};
  }

  // 9. Add meta tags to prevent caching
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