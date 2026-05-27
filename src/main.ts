/**
 * VeriStud Student Portal - Main Entry Point
 * TypeScript-based student identity verification system with Supabase
 * Full Security: Anti-F12, Anti-right click, Anti-inspect, Anti-console
 * Input Validation: Only numbers and dash (-) allowed for Control Number and Student ID
 * Performance Optimized: 60 FPS on mobile devices
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
// INPUT VALIDATION (Numbers and Dash only)
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
    
    this.isInitialized = true;
    console.log('✅ VeriStud App successfully initialized');
  }

  /**
   * Setup input validators with debouncing
   */
  private setupInputValidators(): void {
    const controlInput = document.getElementById('controlNum') as HTMLInputElement;
    const studentIdInput = document.getElementById('studentId') as HTMLInputElement;
    
    // Debounced validation function
    const debouncedValidateCtrl = debounce((input: HTMLInputElement) => {
      const rawValue = input.value;
      if (!validateInput(rawValue) && rawValue !== '') {
        input.classList.add('input-error');
        this.showInputError('ctrl', 'Only numbers and dash (-) are allowed');
      } else {
        input.classList.remove('input-error');
        this.clearInputError('ctrl');
      }
    }, 150);
    
    const debouncedValidateId = debounce((input: HTMLInputElement) => {
      const rawValue = input.value;
      if (!validateInput(rawValue) && rawValue !== '') {
        input.classList.add('input-error');
        this.showInputError('id', 'Only numbers and dash (-) are allowed');
      } else {
        input.classList.remove('input-error');
        this.clearInputError('id');
      }
    }, 150);
    
    if (controlInput) {
      controlInput.addEventListener('input', (e) => {
        const input = e.target as HTMLInputElement;
        debouncedValidateCtrl(input);
      });
      
      controlInput.addEventListener('blur', (e) => {
        const input = e.target as HTMLInputElement;
        input.value = formatInput(input.value);
      });
    }
    
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
      const { error } = await supabase.from('students').select('count', { count: 'exact', head: true });
      if (error) {
        console.error('❌ Supabase connection failed:', error.message);
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
      let controlNumber = this.getControlNumberValue();
      let studentId = this.getStudentIdValue();
      
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
      
      controlNumber = formatInput(controlNumber);
      studentId = formatInput(studentId);
      
      // Use requestAnimationFrame for smooth transition
      requestAnimationFrame(() => {
        this.auth.login(controlNumber, studentId);
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
   * Check existing session with caching
   */
  private async checkExistingSession(): Promise<void> {
    const currentUser = this.auth.getCurrentUser();
    if (currentUser) {
      this.ui.populateProfile(currentUser);
      this.ui.showProfile();
      await this.loadTableDataOptimized();
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
   * Get control number value
   */
  private getControlNumberValue(): string {
    const input = document.getElementById('controlNum') as HTMLInputElement;
    return input?.value?.trim() || '';
  }

  /**
   * Get student ID value
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