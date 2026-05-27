/**
 * VeriStud Student Portal - Main Entry Point
 * TypeScript-based student identity verification system with Supabase
 * Full Security: Anti-F12, Anti-right click, Anti-inspect, Anti-console
 * Input Validation: Student ID only (Control Number optional)
 * Performance Optimized: 60 FPS on mobile devices
 * FIXED: Mobile session validation and data display
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
// PERFORMANCE OPTIMIZATIONS
// ============================================

// Cache for frequently used data
let cachedStudentData: UserProfile[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 60000; // 1 minute

// Debounce function to limit rapid inputs
function debounce(func: Function, wait: number): (...args: any[]) => void {
  let timeout: number;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function for scroll/resize events
function throttle(func: Function, limit: number): (...args: any[]) => void {
  let inThrottle: boolean;
  return function executedFunction(...args: any[]) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
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

  // 5. Clear console logs in production
  if (window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')) {
    console.log = function() {};
    console.info = function() {};
    console.warn = function() {};
    console.error = function() {};
  }

  // 6. Add meta tags to prevent caching
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
}

// ============================================
// INPUT VALIDATION (Numbers and Dash only - Student ID only required)
// ============================================

function validateInput(input: string): boolean {
  const pattern = /^[0-9\-]+$/;
  return pattern.test(input);
}

function formatInput(input: string): string {
  return input.trim().replace(/[^0-9\-]/g, '');
}

// ============================================
// MAIN APPLICATION CLASS
// ============================================

class VeriStudApp {
  private ui: UIController;
  private auth: AuthController;
  private isInitialized: boolean = false;
  private abortController: AbortController | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor() {
    this.ui = new UIController();
    this.auth = new AuthController(this.ui);
  }

  /**
   * Initialize the application
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('🚀 VeriStud Student Portal Initializing...');
    
    // FIX: Clear invalid session data on mobile
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      console.log('📱 Mobile device detected');
      const storedUser = sessionStorage.getItem('veristud_user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          // Check if stored user data is invalid
          if (!user.fullName || user.fullName === '—' || user.fullName === '') {
            console.log('⚠️ Invalid session detected on mobile, clearing...');
            sessionStorage.removeItem('veristud_user');
            localStorage.removeItem('veristud_user');
          }
        } catch (e) {
          console.error('Error parsing stored user:', e);
          sessionStorage.removeItem('veristud_user');
        }
      }
    }
    
    // Initialize security first
    initSecurity();
    
    // Setup input validators with debouncing
    this.setupInputValidators();
    
    // Test Supabase connection (non-blocking)
    this.testSupabaseConnection().catch(console.error);
    
    // Setup all event listeners
    this.setupEventListeners();
    
    // Check for existing session (with caching)
    await this.checkExistingSession();
    
    // Setup theme
    this.setupTheme();
    
    // Setup performance optimizations
    this.setupPerformanceOptimizations();
    
    // Force mobile data visibility
    if (isMobile) {
      this.forceMobileDataVisibility();
    }
    
    this.isInitialized = true;
    console.log('✅ VeriStud App successfully initialized');
  }

  /**
   * Force visibility of data on mobile
   */
  private forceMobileDataVisibility(): void {
    setTimeout(() => {
      const dataTable = document.querySelector('.data-table');
      if (dataTable) {
        (dataTable as HTMLElement).style.display = 'block';
        (dataTable as HTMLElement).style.visibility = 'visible';
        (dataTable as HTMLElement).style.opacity = '1';
      }
      
      const dataRows = document.querySelectorAll('.data-row');
      dataRows.forEach(row => {
        (row as HTMLElement).style.display = 'flex';
        (row as HTMLElement).style.visibility = 'visible';
      });
      
      console.log(`📱 Force visibility: ${dataRows.length} data rows found`);
    }, 200);
  }

  /**
   * Setup input validators with debouncing
   */
  private setupInputValidators(): void {
    const studentIdInput = document.getElementById('studentId') as HTMLInputElement;
    
    // Student ID validation (REQUIRED field)
    const debouncedValidateId = debounce((input: HTMLInputElement) => {
      const rawValue = input.value;
      if (rawValue === '') {
        input.classList.add('input-error');
        this.showInputError('id', 'Student ID is required');
      } else if (!validateInput(rawValue)) {
        input.classList.add('input-error');
        this.showInputError('id', 'Only numbers and dash (-) are allowed');
      } else {
        input.classList.remove('input-error');
        this.clearInputError('id');
      }
    }, 150);
    
    if (studentIdInput) {
      studentIdInput.addEventListener('input', (e) => {
        const input = e.target as HTMLInputElement;
        debouncedValidateId(input);
      });
      
      studentIdInput.addEventListener('blur', (e) => {
        const input = e.target as HTMLInputElement;
        input.value = formatInput(input.value);
      });
    }
  }

  /**
   * Show input error message
   */
  private showInputError(field: 'id', message: string): void {
    const errorElement = document.getElementById('idError');
    const inputElement = document.getElementById('studentId') as HTMLInputElement;
    
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
  private clearInputError(field: 'id'): void {
    const errorElement = document.getElementById('idError');
    const inputElement = document.getElementById('studentId') as HTMLInputElement;
    
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
      const { error } = await supabase.from('students').select('count', { count: 'exact', head: true });
      if (error) {
        console.error('❌ Supabase connection failed:', error.message);
      } else {
        console.log('✅ Supabase connection successful');
      }
    } catch (error) {
      console.error('❌ Supabase connection error:', error);
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    const loginHandler = () => {
      // Get student ID (REQUIRED)
      let studentId = this.getStudentIdValue();
      
      // Validate Student ID is required
      if (!studentId) {
        this.showInputError('id', 'Student ID is required');
        this.ui.shakeCard();
        return;
      }
      
      // Validate Student ID format if not empty
      if (studentId && !validateInput(studentId)) {
        this.showInputError('id', 'Only numbers and dash (-) are allowed');
        this.ui.shakeCard();
        return;
      }
      
      // Format inputs
      studentId = formatInput(studentId);
      
      // Use requestAnimationFrame for smooth transition
      requestAnimationFrame(() => {
        this.auth.login(studentId, '');
      });
    };

    const resetHandler = () => {
      requestAnimationFrame(() => {
        this.ui.resetForm();
        this.ui.showLogin();
      });
    };

    this.ui.setupEventListeners(loginHandler, resetHandler);
  }

  /**
   * Check existing session with validation
   */
  private async checkExistingSession(): Promise<void> {
    const currentUser = this.auth.getCurrentUser();
    
    console.log('🔍 Checking existing session...', currentUser);
    
    // VALIDATE: Check if user data is valid
    const isValidUser = currentUser && 
                        currentUser.fullName && 
                        currentUser.fullName !== '—' &&
                        currentUser.fullName !== '';
    
    if (isValidUser) {
      console.log('✅ Valid session found for:', currentUser.fullName);
      this.ui.populateProfile(currentUser);
      this.ui.showProfile();
      await this.loadTableDataOptimized();
      
      // Force visibility on mobile
      if (window.innerWidth <= 768) {
        setTimeout(() => {
          this.forceMobileDataVisibility();
        }, 100);
      }
    } else {
      // Clear invalid session
      console.log('⚠️ Invalid session detected, clearing...');
      if (currentUser) {
        console.warn('Invalid user data:', currentUser);
      }
      this.auth.logout();
      this.ui.resetForm();
      this.ui.showLogin();
    }
  }

  /**
   * Load table data with caching and AbortController
   */
  private async loadTableDataOptimized(): Promise<void> {
    const now = Date.now();
    
    // Use cache if available
    if (cachedStudentData.length > 0 && (now - lastFetchTime) < CACHE_DURATION) {
      this.ui.renderTable(cachedStudentData);
      return;
    }
    
    // Cancel previous request if exists
    if (this.abortController) {
      this.abortController.abort();
    }
    
    this.abortController = new AbortController();
    const timeoutId = setTimeout(() => this.abortController?.abort(), 15000);
    
    try {
      const students = await StudentService.getAllStudents();
      clearTimeout(timeoutId);
      
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
      
      cachedStudentData = userProfiles;
      lastFetchTime = now;
      
      // Use requestAnimationFrame for smooth rendering
      requestAnimationFrame(() => {
        this.ui.renderTable(userProfiles);
      });
    } catch (error) {
      console.error('Failed to load table data:', error);
      this.ui.renderTable([]);
    }
  }

  /**
   * Setup performance optimizations
   */
  private setupPerformanceOptimizations(): void {
    // Throttled resize handler
    const handleResize = throttle(() => {
      // Handle resize if needed
      if (window.innerWidth <= 768) {
        this.forceMobileDataVisibility();
      }
    }, 100);
    
    window.addEventListener('resize', handleResize);
    
    // Use Intersection Observer for lazy loading images
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.getAttribute('data-src');
            if (src) {
              img.src = src;
              img.removeAttribute('data-src');
            }
            imageObserver.unobserve(img);
          }
        });
      });
      
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  /**
   * Setup theme
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
   * Get student ID value (REQUIRED)
   */
  private getStudentIdValue(): string {
    const input = document.getElementById('studentId') as HTMLInputElement;
    return input?.value?.trim() || '';
  }

  /**
   * Get application version
   */
  public getVersion(): string {
    return '2.0.0';
  }

  /**
   * Get application name
   */
  public getAppName(): string {
    return 'VeriStud Student Portal';
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    this.isInitialized = false;
  }
}

// ============================================
// START APPLICATION
// ============================================

const app = new VeriStudApp();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    app.initialize().catch(console.error);
  });
} else {
  app.initialize().catch(console.error);
}

if (import.meta.env.DEV) {
  (window as any).__VERISTUD_APP__ = app;
}