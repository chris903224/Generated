// admin.main.ts - FULL COMPLETE VERSION WITH DATABASE ONLY
// NO HARDCODED ADMIN DATA - LAHAT GALING SA SUPABASE DATABASE

import { supabase } from './services/supabase.service';
import { AdminStudentController } from './controllers/admin.student.controller';
import { AdminUIController } from './controllers/admin.ui.controller';
import { StudentService } from './services/supabase.service';
import { ExcelImporter, DB_FIELDS } from './utils/excel-importer';
import { AdminService } from './services/admin.service';

declare global {
  interface Window {
    switchPage: (page: string, filterRemarks?: string, filterCourse?: string) => void;
  }
}

declare const Chart: any;

// Chart instances
let statusChart: any = null;
let courseChart: any = null;
let yearChart: any = null;
let trendChart: any = null;
let endorseChart: any = null;
let dutyChart: any = null;
let supportChart: any = null;
let hkCourseChart: any = null;
let hkDutyChart: any = null;
let weeklyChart: any = null;
let topCoursesChart: any = null;

// App version
const APP_VERSION = "v3.2.0";

// Colors
const colors = {
  green: '#10b981', amber: '#fbbf24', rose: '#f43f5e', blue: '#3b82f6',
  teal: '#14b8a6', purple: '#8b5cf6', emerald: '#34d399', orange: '#f97316',
  pink: '#ec4899', cyan: '#06b6d4', lime: '#84cc16', violet: '#a855f7',
  indigo: '#6366f1', red: '#ef4444', yellow: '#eab308', gray: '#6b7280', slate: '#94a3b8'
};

// All 17 Courses
const ALL_COURSES = [
  { code: 'BSN', name: 'BS Nursing', short: 'Nursing' },
  { code: 'BSMLS', name: 'BS Medical Lab Sciences', short: 'MedTech' },
  { code: 'BSPSY', name: 'BS Psychology', short: 'Psych' },
  { code: 'BSRADTECH', name: 'BS Radiologic Technology', short: 'RadTech' },
  { code: 'BSRESPT', name: 'BS Respiratory Therapy', short: 'Respiratory' },
  { code: 'BSPHARM', name: 'BS Pharmacy', short: 'Pharmacy' },
  { code: 'BSPT', name: 'BS Physical Therapy', short: 'PT' },
  { code: 'BSIT', name: 'BS Information Technology', short: 'IT' },
  { code: 'BSA', name: 'BS Accountancy', short: 'Accountancy' },
  { code: 'BSBA-MM', name: 'BSBA Marketing Management', short: 'BSBA-MM' },
  { code: 'BSBA-FM', name: 'BSBA Financial Management', short: 'BSBA-FM' },
  { code: 'BSHM', name: 'BS Hospitality Management', short: 'HM' },
  { code: 'BSTM', name: 'BS Tourism Management', short: 'Tourism' },
  { code: 'BSCRIM', name: 'BS Criminology', short: 'Crim' },
  { code: 'BEED', name: 'Bachelor of Elementary Education', short: 'BEEd' },
  { code: 'BSED', name: 'Bachelor of Secondary Education', short: 'BSEd' }
];

const courseColors = [
  '#10b981', '#3b82f6', '#fbbf24', '#f43f5e', '#8b5cf6',
  '#14b8a6', '#f97316', '#ec4899', '#06b6d4', '#84cc16',
  '#a855f7', '#eab308', '#ef4444', '#6b7280', '#94a3b8',
  '#1e3a5f', '#2ecc71'
];

type ToastType = 'success' | 'error' | 'info' | 'warning';

// ============================================
// SESSION SECURITY & PERSISTENCE
// ============================================

const SESSION_TIMEOUT = 8 * 60 * 60 * 1000;
const STORAGE_KEYS = {
  LOGGED_IN: 'admin_logged_in',
  LOGIN_TIME: 'admin_login_time',
  LOGIN_METHOD: 'login_method',
  ADMIN_NAME: 'admin_name',
  ADMIN_USERNAME: 'admin_username',
  ADMIN_EMAIL: 'admin_email',
  ADMIN_ID: 'admin_id',
  SESSION_ID: 'admin_session_id',
  APP_VERSION: 'admin_app_version'
};

function generateSessionId(): string {
  return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16);
}

function clearSessionData(): void {
  sessionStorage.removeItem(STORAGE_KEYS.LOGGED_IN);
  sessionStorage.removeItem(STORAGE_KEYS.LOGIN_TIME);
  sessionStorage.removeItem(STORAGE_KEYS.LOGIN_METHOD);
  sessionStorage.removeItem(STORAGE_KEYS.ADMIN_NAME);
  sessionStorage.removeItem(STORAGE_KEYS.ADMIN_USERNAME);
  sessionStorage.removeItem(STORAGE_KEYS.ADMIN_EMAIL);
  sessionStorage.removeItem(STORAGE_KEYS.ADMIN_ID);
  sessionStorage.removeItem(STORAGE_KEYS.SESSION_ID);
}

function isSessionValid(): boolean {
  const isLoggedIn = sessionStorage.getItem(STORAGE_KEYS.LOGGED_IN) === 'true';
  const loginTime = sessionStorage.getItem(STORAGE_KEYS.LOGIN_TIME);
  
  if (!isLoggedIn) return false;
  
  if (loginTime) {
    const elapsed = Date.now() - parseInt(loginTime);
    if (elapsed > SESSION_TIMEOUT) {
      clearSessionData();
      return false;
    }
  }
  return true;
}

function refreshSession(): void {
  if (isSessionValid()) {
    sessionStorage.setItem(STORAGE_KEYS.LOGIN_TIME, Date.now().toString());
  }
}

function checkAppVersionAndLogout(): void {
  const storedVersion = localStorage.getItem(STORAGE_KEYS.APP_VERSION);
  const currentVersion = APP_VERSION;
  
  if (storedVersion && storedVersion !== currentVersion) {
    console.log('⚠️ App version changed - logging out...');
    showToast('info', 'App Updated', 'Please login again to continue');
    clearSessionData();
    forceLogout();
  } else if (!storedVersion) {
    localStorage.setItem(STORAGE_KEYS.APP_VERSION, currentVersion);
  }
}

let inactivityTimer: number | null = null;
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

function resetInactivityTimer(): void {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
  }
  if (isSessionValid()) {
    inactivityTimer = setTimeout(() => {
      showToast('info', 'Session Expired', 'Logged out due to inactivity');
      forceLogout();
    }, INACTIVITY_TIMEOUT) as unknown as number;
  }
}

function trackUserActivity(): void {
  const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click', 'mousemove'];
  events.forEach(event => {
    document.addEventListener(event, () => {
      if (isSessionValid()) {
        refreshSession();
        resetInactivityTimer();
      }
    });
  });
}

// ============================================
// PROFILE MODAL FUNCTIONS (USING DATABASE)
// ============================================

async function initProfileModal(): Promise<void> {
  const userPill = document.getElementById('userPill');
  const profileModal = document.getElementById('profileModal');
  const closeProfileModal = document.getElementById('closeProfileModal');
  const closeProfileModalBtn = document.getElementById('closeProfileModalBtn');
  const loginMethod = sessionStorage.getItem(STORAGE_KEYS.LOGIN_METHOD);
  const adminId = sessionStorage.getItem(STORAGE_KEYS.ADMIN_ID);
  
  if (!userPill || !profileModal || !adminId) return;
  
  const admin = await AdminService.getAdminById(adminId);
  if (!admin) return;
  
  const updateProfileDisplay = () => {
    const credentialsDiv = document.getElementById('credentialsProfileInfo');
    const magicLinkDiv = document.getElementById('magicLinkProfileInfo');
    const loginBadge = document.getElementById('loginMethodBadge');
    
    if (loginMethod === 'credentials') {
      if (credentialsDiv) credentialsDiv.style.display = 'block';
      if (magicLinkDiv) magicLinkDiv.style.display = 'none';
      if (loginBadge) {
        loginBadge.textContent = 'Username & Password';
        loginBadge.className = 'login-badge credentials';
      }
      
      const initials = admin.name.charAt(0);
      document.getElementById('credInitials')!.textContent = initials;
      document.getElementById('credFullName')!.textContent = admin.name;
      document.getElementById('credUsername')!.textContent = admin.username || '';
      document.getElementById('credRole')!.textContent = admin.role;
      document.getElementById('credLastLogin')!.textContent = admin.last_login ? new Date(admin.last_login).toLocaleString() : 'First login';
    } else {
      if (credentialsDiv) credentialsDiv.style.display = 'none';
      if (magicLinkDiv) magicLinkDiv.style.display = 'block';
      if (loginBadge) {
        loginBadge.textContent = 'Magic Link (PHINMA Email)';
        loginBadge.className = 'login-badge magiclink';
      }
      
      const initials = admin.name.split(' ').map(n => n[0]).join('');
      document.getElementById('magicInitials')!.textContent = initials;
      document.getElementById('magicFullName')!.textContent = admin.name;
      document.getElementById('magicEmail')!.textContent = admin.email;
      document.getElementById('magicRole')!.textContent = admin.role;
      document.getElementById('magicLastLogin')!.textContent = admin.last_login ? new Date(admin.last_login).toLocaleString() : 'First login';
    }
  };
  
  userPill.addEventListener('click', () => {
    updateProfileDisplay();
    profileModal.style.display = 'flex';
  });
  
  const closeModal = () => {
    profileModal.style.display = 'none';
  };
  
  if (closeProfileModal) closeProfileModal.addEventListener('click', closeModal);
  if (closeProfileModalBtn) closeProfileModalBtn.addEventListener('click', closeModal);
  
  profileModal.addEventListener('click', (e) => {
    if (e.target === profileModal) closeModal();
  });
}

// ============================================
// ANALYTICS PAGE - EXPORT FUNCTIONS
// ============================================

function initAnalyticsExportButtons(): void {
  const exportPDFBtn = document.getElementById('exportPDFBtn');
  if (exportPDFBtn) {
    exportPDFBtn.addEventListener('click', () => exportAnalyticsAsPDF());
  }
  
  const exportAnalyticsExcelBtn = document.getElementById('exportAnalyticsExcelBtn');
  if (exportAnalyticsExcelBtn) {
    exportAnalyticsExcelBtn.addEventListener('click', () => exportAnalyticsToExcel());
  }
  
  const printAnalyticsBtn = document.getElementById('printAnalyticsBtn');
  if (printAnalyticsBtn) {
    printAnalyticsBtn.addEventListener('click', () => printAnalyticsReport());
  }
}

async function exportAnalyticsToExcel(): Promise<void> {
  showToast('info', 'Preparing export...', 'Fetching analytics data');
  try {
    const students = await StudentService.getAllStudents();
    const exportData = students.map((student: any) => ({
      'Student ID': student.student_id || '',
      'Control Number': student.control_number || '',
      'Full Name': student.full_name || '',
      'Course': student.course || '',
      'Year Level': student.year_level || '',
      'Section': student.section || '',
      'Support Type': student.support_type || '',
      'Remarks': student.remarks || '',
      'Endorsement': student.endorsement || '',
      'Duties': student.duties || '',
      'Hours': student.hours || '',
      'Status': student.status || '',
      'Date Completed': student.updated_at ? new Date(student.updated_at).toLocaleDateString() : ''
    }));
    ExcelImporter.exportToExcel(exportData, 'analytics_report');
    showToast('success', 'Export Complete', `Exported ${exportData.length} records`);
  } catch (error: any) {
    showToast('error', 'Export Failed', error.message);
  }
}

function exportAnalyticsAsPDF(): void {
  showToast('info', 'Preparing PDF...', 'Generating report');
  const analyticsPage = document.getElementById('analyticsPage');
  if (!analyticsPage) return;
  
  const printContent = analyticsPage.cloneNode(true) as HTMLElement;
  const style = document.createElement('style');
  style.textContent = `
    @media print {
      body * { visibility: hidden; }
      .print-area, .print-area * { visibility: visible; }
      .print-area { position: absolute; top: 0; left: 0; width: 100%; padding: 20px; }
      .no-print { display: none !important; }
      canvas { max-width: 100%; height: auto; }
      .stat-card, .chart-card, .table-card { break-inside: avoid; }
    }
  `;
  printContent.classList.add('print-area');
  printContent.insertBefore(style, printContent.firstChild);
  
  const buttons = printContent.querySelectorAll('.btn-outline, .analytics-btn');
  buttons.forEach(btn => btn.classList.add('no-print'));
  
  document.body.appendChild(printContent);
  setTimeout(() => {
    window.print();
    setTimeout(() => {
      if (printContent.parentElement) printContent.remove();
    }, 100);
  }, 100);
  showToast('success', 'PDF Ready', 'Print dialog opened');
}

function printAnalyticsReport(): void {
  showToast('info', 'Preparing Print...', 'Opening print dialog');
  const analyticsPage = document.getElementById('analyticsPage');
  if (!analyticsPage) return;
  
  const originalTitle = document.title;
  document.title = 'PHINMA SIS - Analytics Report';
  
  const printContent = analyticsPage.cloneNode(true) as HTMLElement;
  const style = document.createElement('style');
  style.textContent = `
    @media print {
      .sidebar, .topbar, .theme-fab, .sidebar-toggle, 
      .btn-outline, .analytics-btn, .modal-backdrop,
      .no-print, .controls-bar, .import-tabs { display: none !important; }
      body { margin: 0; padding: 20px; background: white; }
      .print-container { max-width: 100%; margin: 0 auto; }
      .stat-card, .chart-card, .table-card { break-inside: avoid; box-shadow: none; border: 1px solid #ddd; }
      canvas { max-width: 100%; height: auto; }
    }
  `;
  
  const printContainer = document.createElement('div');
  printContainer.className = 'print-container';
  printContainer.appendChild(style);
  printContainer.appendChild(printContent);
  document.body.appendChild(printContainer);
  
  setTimeout(() => {
    window.print();
    setTimeout(() => {
      if (printContainer.parentElement) printContainer.remove();
      document.title = originalTitle;
    }, 100);
  }, 100);
}

// ============================================
// SECURITY MEASURES
// ============================================

function initSecurity(): void {
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener('keydown', (e) => {
    const key = e.key;
    const ctrl = e.ctrlKey;
    const shift = e.shiftKey;
    if (key === 'F12' || (ctrl && shift && key === 'I') || (ctrl && shift && key === 'J') ||
        (ctrl && shift && key === 'C') || (ctrl && shift && key === 'K') || (ctrl && key === 'u') ||
        (ctrl && key === 's') || (ctrl && key === 'p') || key === 'PrintScreen') {
      e.preventDefault();
      return false;
    }
  });
  
  window.addEventListener('dragstart', (e) => e.preventDefault());
  document.addEventListener('selectstart', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return true;
    e.preventDefault();
    return false;
  });

  if (window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')) {
    console.log = function() {};
    console.info = function() {};
    console.warn = function() {};
    console.error = function() {};
  }

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
// TOAST NOTIFICATION
// ============================================

let toastQueue: Array<{type: ToastType, title: string, description?: string}> = [];
let isToastShowing = false;

function showToast(type: ToastType, title: string, description?: string): void {
  toastQueue.push({ type, title, description });
  if (!isToastShowing) processToastQueue();
}

function processToastQueue(): void {
  if (toastQueue.length === 0) {
    isToastShowing = false;
    return;
  }
  isToastShowing = true;
  const { type, title, description } = toastQueue.shift()!;
  showToastDirect(type, title, description);
  setTimeout(() => processToastQueue(), 500);
}

function showToastDirect(type: ToastType, title: string, description?: string): void {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  
  const toastId = 'toast_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  const toast = document.createElement('div');
  toast.id = toastId;
  toast.className = `toast toast-${type}`;
  
  let icon = '';
  if (type === 'success') {
    icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
  } else if (type === 'error') {
    icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
  } else if (type === 'warning') {
    icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4M12 17h.01"/><path d="M12 3L2 20h20L12 3z"/></svg>';
  } else {
    icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
  }
  
  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-body">
      <p class="toast-title">${escapeHtml(title)}</p>
      ${description ? `<p class="toast-desc">${escapeHtml(description)}</p>` : ''}
    </div>
    <button class="toast-close" aria-label="Dismiss">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  `;
  
  container.appendChild(toast);
  
  const closeBtn = toast.querySelector('.toast-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dismissToastElement(toast);
    });
  }
  
  setTimeout(() => {
    if (document.getElementById(toastId)) dismissToastElement(toast);
  }, 4000);
}

function dismissToastElement(toast: HTMLElement): void {
  toast.classList.add('toast-exit');
  toast.addEventListener('animationend', () => {
    if (toast.parentElement) toast.remove();
  });
  setTimeout(() => {
    if (toast.parentElement) toast.remove();
  }, 300);
}

// ============================================
// COLOR THEME PICKER WITH DATABASE PERSISTENCE
// ============================================

function getCurrentAdminId(): string | null {
  return sessionStorage.getItem(STORAGE_KEYS.ADMIN_ID);
}

async function saveAdminThemeToDatabase(theme: string): Promise<void> {
  const adminId = getCurrentAdminId();
  if (!adminId) {
    localStorage.setItem('admin_color_theme', theme);
    return;
  }
  
  try {
    await AdminService.updateThemePreference(adminId, theme);
    console.log('✅ Theme saved to database for admin:', adminId);
  } catch (error) {
    console.error('Failed to save theme to database:', error);
    localStorage.setItem('admin_color_theme', theme);
  }
}

async function loadAdminThemeFromDatabase(): Promise<string | null> {
  const adminId = getCurrentAdminId();
  if (!adminId) {
    return localStorage.getItem('admin_color_theme');
  }
  
  try {
    const admin = await AdminService.getAdminById(adminId);
    if (admin && admin.theme_preference) {
      return admin.theme_preference;
    }
  } catch (error) {
    console.error('Failed to load theme from database:', error);
  }
  
  return localStorage.getItem('admin_color_theme');
}

async function initColorThemePicker(): Promise<void> {
  const themePickerBtn = document.getElementById('themePickerBtn');
  const themePickerModal = document.getElementById('themePickerModal');
  const closeThemePicker = document.getElementById('closeThemePicker');
  const cancelThemePicker = document.getElementById('cancelThemePicker');
  const applyThemeBtn = document.getElementById('applyThemeBtn');
  
  if (!themePickerBtn) return;
  
  const savedTheme = await loadAdminThemeFromDatabase();
  let selectedColor = savedTheme || 'green';
  applyColorTheme(selectedColor);
  
  themePickerBtn.addEventListener('click', () => {
    if (themePickerModal) {
      themePickerModal.style.display = 'flex';
      updateSelectedHighlight(selectedColor);
    }
  });
  
  const closeModal = () => {
    if (themePickerModal) themePickerModal.style.display = 'none';
  };
  
  if (closeThemePicker) closeThemePicker.addEventListener('click', closeModal);
  if (cancelThemePicker) cancelThemePicker.addEventListener('click', closeModal);
  if (themePickerModal) {
    themePickerModal.addEventListener('click', (e) => {
      if (e.target === themePickerModal) closeModal();
    });
  }
  
  document.querySelectorAll('.color-theme-option').forEach(option => {
    option.addEventListener('click', () => {
      const color = option.getAttribute('data-color');
      if (color) {
        selectedColor = color;
        updateSelectedHighlight(selectedColor);
      }
    });
  });
  
  if (applyThemeBtn) {
    applyThemeBtn.addEventListener('click', async () => {
      applyColorTheme(selectedColor);
      await saveAdminThemeToDatabase(selectedColor);
      localStorage.setItem('admin_color_theme', selectedColor);
      closeModal();
      showToast('success', 'Theme Applied', `Theme changed to ${selectedColor}`);
      setTimeout(() => initCharts(), 100);
    });
  }
}

function applyColorTheme(color: string): void {
  document.body.classList.remove(
    'color-theme-green', 'color-theme-cream', 'color-theme-white',
    'color-theme-yellow', 'color-theme-orange', 'color-theme-purple',
    'color-theme-gray', 'color-theme-lightblack', 'color-theme-dark'
  );
  document.body.classList.remove('dark');
  document.body.classList.add(`color-theme-${color}`);
  
  if (color === 'dark' || color === 'lightblack') {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.classList.add('dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.classList.remove('dark');
  }
}

function updateSelectedHighlight(selected: string): void {
  document.querySelectorAll('.color-theme-option').forEach(option => {
    const color = option.getAttribute('data-color');
    if (color === selected) {
      option.classList.add('active');
    } else {
      option.classList.remove('active');
    }
  });
}

// ============================================
// PERFORMANCE OPTIMIZATIONS
// ============================================

let cachedStudents: any[] = [];
let lastStudentsFetch = 0;
const STUDENTS_CACHE_DURATION = 30000;
const rowsPerPage = 50;

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

// ============================================
// LOADING SCREEN
// ============================================

const loadingScreen = document.getElementById('loadingScreen');
const adminContent = document.getElementById('adminContent');

function showLoadingScreen(): void {
  if (loadingScreen) (loadingScreen as HTMLElement).style.display = 'flex';
  if (adminContent) adminContent.classList.remove('visible');
}

function hideLoadingScreen(): void {
  if (loadingScreen) (loadingScreen as HTMLElement).style.display = 'none';
  if (adminContent) adminContent.classList.add('visible');
}

// ============================================
// VERSION CHECK & SESSION
// ============================================

async function forceLogout(): Promise<void> {
  clearSessionData();
  localStorage.removeItem(STORAGE_KEYS.APP_VERSION);
  try {
    await supabase.auth.signOut();
  } catch (e) {}
  window.location.href = '/admin-login.html?t=' + Date.now();
}

async function validateSession(): Promise<boolean> {
  if (!isSessionValid()) {
    await forceLogout();
    return false;
  }
  const loginMethod = sessionStorage.getItem(STORAGE_KEYS.LOGIN_METHOD);
  if (loginMethod === 'credentials') {
    refreshSession();
    return true;
  }
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      await forceLogout();
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getRemarksBadge(remarks: string): string {
  const map: Record<string, { class: string; icon: string; text: string }> = {
    'COMPLETED': { class: 'badge-ok', icon: '✓', text: 'Completed' },
    'PENDING': { class: 'badge-pd', icon: '⏳', text: 'Pending' },
    'NOT COMPLETED': { class: 'badge-no', icon: '✗', text: 'Not Completed' },
    'CONTINUOUS TRAINING': { class: 'badge-ct', icon: '↻', text: 'Cont. Training' }
  };
  const badge = map[remarks];
  if (badge) {
    return `<span class="badge ${badge.class}">${badge.icon} ${badge.text}</span>`;
  }
  return `<span class="badge">${escapeHtml(remarks)}</span>`;
}

function getEndorsementTag(endorsement: string): string {
  const map: Record<string, { class: string; icon: string; text: string }> = {
    'Endorsement for OJT - HK Duty': { class: 'etag-hk', icon: '✈️', text: 'OJT-HK' },
    'Endorsed as Continuing OS': { class: 'etag-os', icon: '🔄', text: 'Cont. OS' },
    'Not Continuing OS': { class: 'etag-no', icon: '✗', text: 'Not Cont.' },
    'Graduate of 25-26': { class: 'etag-grad', icon: '🎓', text: 'Graduate' }
  };
  const tag = map[endorsement];
  if (tag) {
    return `<span class="etag ${tag.class}">${tag.icon} ${tag.text}</span>`;
  }
  return `<span class="etag">${escapeHtml(endorsement)}</span>`;
}

function getDutiesTag(duties: string): string {
  const map: Record<string, { class: string; icon: string; text: string }> = {
    'Regular Duty Assigned': { class: 'dtag-reg', icon: '📋', text: 'Regular' },
    'Advance Duties': { class: 'dtag-adv', icon: '⭐', text: 'Advance' },
    'No Longer with OS': { class: 'dtag-none', icon: '🚫', text: 'No Longer' },
    'NO GC Assignment': { class: 'dtag-nogc', icon: '📵', text: 'No GC' }
  };
  const tag = map[duties];
  if (tag) {
    return `<span class="dtag ${tag.class}">${tag.icon} ${tag.text}</span>`;
  }
  return `<span class="dtag">${escapeHtml(duties)}</span>`;
}

// ============================================
// TABLE RENDERING
// ============================================

async function renderCompletionTableOptimized(searchTerm: string = '', page: number = 1): Promise<void> {
  const tbody = document.getElementById('completionTbody');
  const rowCount = document.getElementById('rowCount');
  if (!tbody) return;
  
  const now = Date.now();
  if (cachedStudents.length === 0 || (now - lastStudentsFetch) > STUDENTS_CACHE_DURATION) {
    cachedStudents = await StudentService.getAllStudents();
    lastStudentsFetch = now;
  }
  
  let filtered = cachedStudents;
  if (searchTerm) {
    filtered = cachedStudents.filter(s => 
      s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.course?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.student_id?.includes(searchTerm)
    );
  }
  
  if (rowCount) rowCount.textContent = `${filtered.length} entries`;
  
  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pageStudents = filtered.slice(start, end);
  
  if (pageStudents.length === 0) {
    tbody.innerHTML = `<tr><td colspan="13" style="text-align:center; padding:60px;">No students found</td></tr>`;
    updatePaginationControls(filtered.length, page);
    return;
  }
  
  let html = '';
  let counter = start + 1;
  
  for (const student of pageStudents) {
    html += `
      <tr data-id="${student.id}" class="clickable-row" style="cursor:pointer;">
        <td style="text-align:center; font-weight:600;">${counter++}</td>
        <td><code>${escapeHtml(student.student_id || '')}</code></td>
        <td><code>${escapeHtml(student.control_number || '')}</code></td>
        <td><strong>${escapeHtml(student.full_name || '')}</strong></td>
        <td>${escapeHtml(student.course || '')}</td>
        <td>${escapeHtml(student.year_level || '')}</td>
        <td>${escapeHtml(student.support_type || '')}</td>
        <td>${getRemarksBadge(student.remarks)}</td>
        <td>${getEndorsementTag(student.endorsement)}</td>
        <td>${escapeHtml(student.data_sheet || '')}</td>
        <td>${getDutiesTag(student.duties)}</td>
        <td><span class="hours-badge">${escapeHtml(student.hours || '0 hrs')}</span></td>
        <td class="action-buttons">
          <button class="action-btn edit-btn" data-id="${student.id}">✏️ Edit</button>
          <button class="action-btn delete-btn" data-id="${student.id}" data-name="${escapeHtml(student.full_name || '')}">🗑️ Delete</button>
        </td>
      </tr>
    `;
  }
  
  tbody.innerHTML = html;
  updatePaginationControls(filtered.length, page);
}

function updatePaginationControls(total: number, currentPage: number): void {
  const totalPages = Math.ceil(total / rowsPerPage);
  let container = document.getElementById('paginationControls');
  
  if (!container) {
    const panelFoot = document.querySelector('.panel-foot');
    if (panelFoot) {
      container = document.createElement('div');
      container.id = 'paginationControls';
      container.className = 'pagination-controls';
      panelFoot.appendChild(container);
    }
  }
  
  container = document.getElementById('paginationControls');
  if (!container) return;
  
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }
  
  container.innerHTML = `
    <div class="pagination">
      <button class="page-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>← Prev</button>
      <span class="page-info">Page ${currentPage} of ${totalPages}</span>
      <button class="page-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>Next →</button>
    </div>
  `;
  
  container.querySelectorAll('.page-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const page = parseInt((e.target as HTMLElement).getAttribute('data-page') || '1');
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        const searchInput = document.getElementById('searchInput') as HTMLInputElement;
        renderCompletionTableOptimized(searchInput?.value || '', page);
      }
    });
  });
}

const debouncedSearch = debounce((value: string) => {
  renderCompletionTableOptimized(value, 1);
}, 300);

// ============================================
// ANALYTICS PAGE - DYNAMIC
// ============================================

async function initAnalyticsPage(): Promise<void> {
  const students = await StudentService.getAllStudents();
  const completed = students.filter(s => s.remarks === 'COMPLETED').length;
  const total = students.length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  const completionRateElem = document.getElementById('analyticsCompletionRate');
  const monthlyProgressElem = document.getElementById('analyticsMonthlyProgress');
  if (completionRateElem) completionRateElem.textContent = `${completionRate}%`;
  if (monthlyProgressElem) monthlyProgressElem.textContent = completed.toString();
  
  const weeklyData = await getWeeklyCompletionData(students);
  const weeklyCanvas = document.getElementById('weeklyChart') as HTMLCanvasElement;
  if (weeklyCanvas) {
    if (weeklyChart) weeklyChart.destroy();
    weeklyChart = new Chart(weeklyCanvas, {
      type: 'line',
      data: {
        labels: weeklyData.labels,
        datasets: [{
          label: 'Completions',
          data: weeklyData.values,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          tension: 0.3,
          fill: true
        }]
      },
      options: { responsive: true, maintainAspectRatio: true }
    });
  }
  
  const courseCounts: Record<string, number> = {};
  students.forEach(s => {
    const course = s.course || 'Other';
    courseCounts[course] = (courseCounts[course] || 0) + 1;
  });
  const topCourses = Object.entries(courseCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  
  const coursesCanvas = document.getElementById('topCoursesChart') as HTMLCanvasElement;
  if (coursesCanvas) {
    if (topCoursesChart) topCoursesChart.destroy();
    topCoursesChart = new Chart(coursesCanvas, {
      type: 'bar',
      data: {
        labels: topCourses.map(c => c[0]),
        datasets: [{
          label: 'Students',
          data: topCourses.map(c => c[1]),
          backgroundColor: ['#10b981', '#34d399', '#6ee7b7', '#059669', '#047857'],
          borderRadius: 8
        }]
      },
      options: { responsive: true, maintainAspectRatio: true, indexAxis: 'y' }
    });
  }
  
  await loadRecentActivity(students);
}

async function getWeeklyCompletionData(students: any[]): Promise<{labels: string[], values: number[]}> {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const values = [0, 0, 0, 0, 0, 0, 0];
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  
  students.forEach(student => {
    if (student.remarks === 'COMPLETED' && student.updated_at) {
      const date = new Date(student.updated_at);
      if (date >= sevenDaysAgo) {
        values[date.getDay()]++;
      }
    }
  });
  return { labels: days, values };
}

async function loadRecentActivity(students: any[]): Promise<void> {
  const tbody = document.getElementById('recentActivityTbody');
  if (!tbody) return;
  
  const recent = students
    .filter(s => s.remarks === 'COMPLETED' && s.updated_at)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 10);
  
  if (recent.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:40px;">No recent activity<\/td><\/tr>`;
    return;
  }
  
  let html = '';
  for (const student of recent) {
    const date = new Date(student.updated_at).toLocaleDateString('en-PH');
    html += `
      <tr>
        <td>${date}<\/td>
        <td><strong>${escapeHtml(student.full_name || 'N/A')}<\/strong><\/td>
        <td>${escapeHtml(student.course || 'N/A')}<\/td>
        <td>Completed Requirements<\/td>
        <td><span class="badge-ok">✓ Completed<\/span><\/td>
      </tr>
    `;
  }
  tbody.innerHTML = html;
}

// ============================================
// CHART FUNCTIONS
// ============================================

async function initMonthlyTrendChart(): Promise<void> {
  const canvas = document.getElementById('trendChart') as HTMLCanvasElement;
  if (!canvas) return;
  const { data: students } = await supabase.from('students').select('remarks, created_at, updated_at').limit(500);
  if (!students) return;
  
  const months = [
    { name: 'M', year: 2026, month: 4, full: 'May 2026' },
    { name: 'J', year: 2026, month: 5, full: 'Jun 2026' },
    { name: 'J', year: 2026, month: 6, full: 'Jul 2026' },
    { name: 'A', year: 2026, month: 7, full: 'Aug 2026' },
    { name: 'S', year: 2026, month: 8, full: 'Sep 2026' },
    { name: 'O', year: 2026, month: 9, full: 'Oct 2026' },
    { name: 'N', year: 2026, month: 10, full: 'Nov 2026' },
    { name: 'D', year: 2026, month: 11, full: 'Dec 2026' },
    { name: 'J', year: 2027, month: 0, full: 'Jan 2027' },
    { name: 'F', year: 2027, month: 1, full: 'Feb 2027' },
    { name: 'M', year: 2027, month: 2, full: 'Mar 2027' },
    { name: 'A', year: 2027, month: 3, full: 'Apr 2027' }
  ];
  
  const monthlyData = months.map(monthInfo => {
    const startDate = new Date(monthInfo.year, monthInfo.month, 1);
    const endDate = new Date(monthInfo.year, monthInfo.month + 1, 0);
    endDate.setHours(23, 59, 59, 999);
    const completed = students.filter((s: any) => s.remarks === 'COMPLETED' && s.updated_at && new Date(s.updated_at) >= startDate && new Date(s.updated_at) <= endDate).length;
    const pending = students.filter((s: any) => s.remarks === 'PENDING' && s.created_at && new Date(s.created_at) >= startDate && new Date(s.created_at) <= endDate).length;
    const notCompleted = students.filter((s: any) => s.remarks === 'NOT COMPLETED' && s.updated_at && new Date(s.updated_at) >= startDate && new Date(s.updated_at) <= endDate).length;
    return { month: monthInfo.name, fullMonth: monthInfo.full, completed, pending, notCompleted };
  });
  
  if (trendChart) trendChart.destroy();
  const maxValue = Math.max(...monthlyData.flatMap(d => [d.completed, d.pending, d.notCompleted]));
  const yAxisMax = maxValue === 0 ? 5 : maxValue + Math.ceil(maxValue * 0.2);
  
  trendChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: monthlyData.map(d => d.month),
      datasets: [
        { label: '✅ Completed', data: monthlyData.map(d => d.completed), borderColor: colors.green, backgroundColor: 'rgba(16, 185, 129, 0.05)', borderWidth: 2, tension: 0.3, fill: true, pointRadius: 3 },
        { label: '⏳ Pending', data: monthlyData.map(d => d.pending), borderColor: colors.amber, backgroundColor: 'rgba(245, 158, 11, 0.05)', borderWidth: 2, tension: 0.3, fill: true, pointRadius: 3 },
        { label: '❌ Not Completed', data: monthlyData.map(d => d.notCompleted), borderColor: colors.rose, backgroundColor: 'rgba(239, 68, 68, 0.05)', borderWidth: 2, tension: 0.3, fill: true, pointRadius: 3 }
      ]
    },
    options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true, max: yAxisMax } } }
  });
}

async function initCourseChart(students: any[]): Promise<void> {
  const canvas = document.getElementById('courseChart') as HTMLCanvasElement;
  if (!canvas) return;
  if (courseChart) courseChart.destroy();
  
  const courseCounts = ALL_COURSES.map(course => students.filter((s: any) => s.course === course.code).length);
  const nonZeroCourses = ALL_COURSES.filter((_, i) => courseCounts[i] > 0);
  const nonZeroCounts = courseCounts.filter(count => count > 0);
  const nonZeroColors = nonZeroCourses.map((_, i) => courseColors[i % courseColors.length]);
  
  if (nonZeroCourses.length === 0) return;
  
  courseChart = new Chart(canvas, {
    type: 'doughnut',
    data: { labels: nonZeroCourses.map(c => c.short), datasets: [{ data: nonZeroCounts, backgroundColor: nonZeroColors, borderWidth: 0, hoverOffset: 10 }] },
    options: { responsive: true, maintainAspectRatio: true, cutout: '60%', plugins: { legend: { position: 'right', labels: { font: { size: 10 } } } } }
  });
}

async function initStatusChart(students: any[]): Promise<void> {
  const canvas = document.getElementById('statusChart') as HTMLCanvasElement;
  if (!canvas) return;
  if (statusChart) statusChart.destroy();
  
  const completed = students.filter((s: any) => s.remarks === 'COMPLETED').length;
  const pending = students.filter((s: any) => s.remarks === 'PENDING').length;
  const notCompleted = students.filter((s: any) => s.remarks === 'NOT COMPLETED').length;
  const continuous = students.filter((s: any) => s.remarks === 'CONTINUOUS TRAINING').length;
  const total = completed + pending + notCompleted + continuous;
  
  statusChart = new Chart(canvas, {
    type: 'doughnut',
    data: { labels: ['Completed', 'Pending', 'Not Completed', 'Cont. Training'], datasets: [{ data: [completed, pending, notCompleted, continuous], backgroundColor: [colors.green, colors.amber, colors.rose, colors.blue], borderWidth: 0, hoverOffset: 10 }] },
    options: { responsive: true, maintainAspectRatio: true, cutout: '65%', plugins: { legend: { display: false } } }
  });
  
  const legendElem = document.getElementById('statusLegend');
  if (legendElem) {
    legendElem.innerHTML = `
      <div class="leg-item"><div class="leg-dot" style="background:${colors.green}"></div>Completed (${completed} | ${Math.round((completed/total)*100)}%)</div>
      <div class="leg-item"><div class="leg-dot" style="background:${colors.amber}"></div>Pending (${pending} | ${Math.round((pending/total)*100)}%)</div>
      <div class="leg-item"><div class="leg-dot" style="background:${colors.rose}"></div>Not Completed (${notCompleted} | ${Math.round((notCompleted/total)*100)}%)</div>
      <div class="leg-item"><div class="leg-dot" style="background:${colors.blue}"></div>Cont. Training (${continuous} | ${Math.round((continuous/total)*100)}%)</div>
    `;
  }
}

async function initYearChart(students: any[]): Promise<void> {
  const canvas = document.getElementById('yearChart') as HTMLCanvasElement;
  if (!canvas) return;
  if (yearChart) yearChart.destroy();
  
  const yearCounts = ['YEAR 1', 'YEAR 2', 'YEAR 3', 'YEAR 4'].map(y => students.filter((s: any) => s.year_level === y).length);
  yearChart = new Chart(canvas, {
    type: 'bar',
    data: { labels: ['1st Year', '2nd Year', '3rd Year', '4th Year'], datasets: [{ data: yearCounts, backgroundColor: colors.green, borderRadius: 8, barPercentage: 0.6 }] },
    options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
  });
}

async function initEndorseChart(students: any[]): Promise<void> {
  const canvas = document.getElementById('endorseChart') as HTMLCanvasElement;
  if (!canvas) return;
  if (endorseChart) endorseChart.destroy();
  
  const ojt = students.filter((s: any) => s.endorsement === 'Endorsement for OJT - HK Duty').length;
  const cont = students.filter((s: any) => s.endorsement === 'Endorsed as Continuing OS').length;
  const notCont = students.filter((s: any) => s.endorsement === 'Not Continuing OS').length;
  const graduate = students.filter((s: any) => s.endorsement === 'Graduate of 25-26').length;
  
  endorseChart = new Chart(canvas, {
    type: 'bar',
    data: { labels: ['OJT-HK', 'Continuing', 'Not Continuing', 'Graduate'], datasets: [{ data: [ojt, cont, notCont, graduate], backgroundColor: [colors.amber, colors.green, colors.rose, colors.blue], borderRadius: 8, barPercentage: 0.6 }] },
    options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
  });
}

async function initDutyChart(students: any[]): Promise<void> {
  const canvas = document.getElementById('dutyChart') as HTMLCanvasElement;
  if (!canvas) return;
  if (dutyChart) dutyChart.destroy();
  
  const regular = students.filter((s: any) => s.duties === 'Regular Duty Assigned').length;
  const advance = students.filter((s: any) => s.duties === 'Advance Duties').length;
  const noLonger = students.filter((s: any) => s.duties === 'No Longer with OS').length;
  const noGc = students.filter((s: any) => s.duties === 'NO GC Assignment').length;
  
  dutyChart = new Chart(canvas, {
    type: 'bar',
    data: { labels: ['Regular', 'Advance', 'No Longer', 'No GC'], datasets: [{ data: [regular, advance, noLonger, noGc], backgroundColor: [colors.green, colors.blue, colors.rose, colors.amber], borderRadius: 8, barPercentage: 0.7 }] },
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } } }
  });
}

async function initSupportChart(students: any[]): Promise<void> {
  const canvas = document.getElementById('supportChart') as HTMLCanvasElement;
  if (!canvas) return;
  if (supportChart) supportChart.destroy();
  
  const freshman = students.filter((s: any) => s.support_type === 'FRESHMEN OS').length;
  const upper = students.filter((s: any) => s.support_type === 'UPPERCLASSMEN OS').length;
  const transferee = students.filter((s: any) => s.support_type === 'TRANSFEREE').length;
  const returning = students.filter((s: any) => s.support_type === 'RETURNING').length;
  
  supportChart = new Chart(canvas, {
    type: 'bar',
    data: { labels: ['Freshmen', 'Upperclassmen', 'Transferee', 'Returning'], datasets: [{ data: [freshman, upper, transferee, returning], backgroundColor: [colors.green, colors.teal, colors.amber, colors.purple], borderRadius: 8, barPercentage: 0.7 }] },
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } } }
  });
}

async function initHkCourseChart(hkStudents: any[]): Promise<void> {
  const canvas = document.getElementById('hkCourseChart') as HTMLCanvasElement;
  if (!canvas) return;
  if (hkCourseChart) hkCourseChart.destroy();
  
  const hkCourseCounts = ALL_COURSES.map(course => hkStudents.filter((s: any) => s.course === course.code).length);
  const nonZeroCourses = ALL_COURSES.filter((_, i) => hkCourseCounts[i] > 0);
  const nonZeroCounts = hkCourseCounts.filter(count => count > 0);
  const nonZeroColors = nonZeroCourses.map((_, i) => courseColors[i % courseColors.length]);
  
  if (nonZeroCourses.length > 0) {
    hkCourseChart = new Chart(canvas, {
      type: 'doughnut',
      data: { labels: nonZeroCourses.map(c => c.short), datasets: [{ data: nonZeroCounts, backgroundColor: nonZeroColors, borderWidth: 0, hoverOffset: 10 }] },
      options: { responsive: true, maintainAspectRatio: true, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { font: { size: 9 } } } } }
    });
  }
}

async function initHkDutyChart(hkStudents: any[]): Promise<void> {
  const canvas = document.getElementById('hkDutyChart') as HTMLCanvasElement;
  if (!canvas) return;
  if (hkDutyChart) hkDutyChart.destroy();
  
  const hkRegular = hkStudents.filter((s: any) => s.duties === 'Regular Duty Assigned').length;
  const hkAdvance = hkStudents.filter((s: any) => s.duties === 'Advance Duties').length;
  
  hkDutyChart = new Chart(canvas, {
    type: 'doughnut',
    data: { labels: ['Regular Duty', 'Advance Duties'], datasets: [{ data: [hkRegular, hkAdvance], backgroundColor: [colors.green, colors.blue], borderWidth: 0, hoverOffset: 10 }] },
    options: { responsive: true, maintainAspectRatio: true, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { font: { size: 9 } } } } }
  });
}

async function initCharts(): Promise<void> {
  const students = await StudentService.getAllStudents();
  const hkStudents = await StudentService.getHKStudents();
  
  await initStatusChart(students);
  await initCourseChart(students);
  await initYearChart(students);
  await initEndorseChart(students);
  await initDutyChart(students);
  await initSupportChart(students);
  await initHkCourseChart(hkStudents);
  await initHkDutyChart(hkStudents);
  await initMonthlyTrendChart();
  
  const completed = students.filter((s: any) => s.remarks === 'COMPLETED').length;
  const pending = students.filter((s: any) => s.remarks === 'PENDING').length;
  const total = students.length;
  
  const donutNum = document.getElementById('donutNum');
  const compPct = document.getElementById('compPct');
  const totalSpan = document.getElementById('s0');
  const completedSpan = document.getElementById('s1');
  const pendingSpan = document.getElementById('s2');
  const notCompletedSpan = document.getElementById('s3');
  const hkSpan = document.getElementById('s4');
  const liveBadge = document.getElementById('liveBadgeText');
  
  if (donutNum) donutNum.textContent = total.toString();
  if (compPct && total > 0) compPct.textContent = `${Math.round((completed / total) * 100)}% Done`;
  if (totalSpan) totalSpan.textContent = total.toString();
  if (completedSpan) completedSpan.textContent = completed.toString();
  if (pendingSpan) pendingSpan.textContent = pending.toString();
  if (notCompletedSpan) notCompletedSpan.textContent = (total - completed - pending).toString();
  if (hkSpan) hkSpan.textContent = hkStudents.length.toString();
  if (liveBadge) liveBadge.textContent = `${total} Students`;
}

// ============================================
// EXPORT, DELETE, IMPORT FUNCTIONS
// ============================================

async function exportToExcel(): Promise<void> {
  showToast('info', 'Preparing export...', 'Fetching data');
  try {
    const { data: students } = await supabase.from('students').select('*').order('created_at', { ascending: false });
    if (!students || students.length === 0) {
      showToast('error', 'No data to export');
      return;
    }
    const exportData = students.map((student: any) => ({
      'Student ID': student.student_id || '',
      'Control Number': student.control_number || '',
      'Full Name': student.full_name || '',
      'Course': student.course || '',
      'Year Level': student.year_level || '',
      'Section': student.section || '',
      'Support Type': student.support_type || '',
      'Remarks': student.remarks || '',
      'Endorsement': student.endorsement || '',
      'Data Sheet': student.data_sheet || '',
      'Duties': student.duties || '',
      'Hours': student.hours || '',
      'Status': student.status || ''
    }));
    ExcelImporter.exportToExcel(exportData, 'students_export');
    showToast('success', 'Export complete', `${exportData.length} records exported`);
  } catch (error: any) {
    showToast('error', 'Export failed', error.message);
  }
}

async function deleteAllStudents(): Promise<void> {
  const confirmBtn = document.getElementById('confirmDeleteAllBtn') as HTMLButtonElement;
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Deleting...';
  }
  showToast('info', 'Deleting all students...', 'Please wait');
  try {
    const { data: students } = await supabase.from('students').select('id');
    if (!students || students.length === 0) {
      showToast('info', 'No students to delete');
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Delete All Students';
      }
      return;
    }
    const batchSize = 100;
    let deleted = 0;
    for (let i = 0; i < students.length; i += batchSize) {
      const batch = students.slice(i, i + batchSize);
      const ids = batch.map((s: any) => s.id);
      await supabase.from('students').delete().in('id', ids);
      deleted += batch.length;
    }
    showToast('success', 'Delete complete!', `${deleted} students deleted.`);
    cachedStudents = [];
    if (studentController) {
      await studentController.refreshAllTables();
      await initCharts();
    }
    const modal = document.getElementById('deleteAllModal');
    if (modal) (modal as HTMLElement).style.display = 'none';
  } catch (error: any) {
    showToast('error', 'Delete failed', error.message);
  } finally {
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Delete All Students';
    }
  }
}

let studentController: AdminStudentController | null = null;

function initDeleteAllButton(): void {
  const deleteAllBtn = document.getElementById('deleteAllBtn');
  const deleteModal = document.getElementById('deleteAllModal');
  const closeDeleteModal = document.getElementById('closeDeleteModal');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const confirmDeleteAllBtn = document.getElementById('confirmDeleteAllBtn') as HTMLButtonElement;
  const confirmCheckbox = document.getElementById('confirmDeleteCheckbox') as HTMLInputElement;
  const deleteCount = document.getElementById('deleteCount');
  
  if (!deleteAllBtn || !deleteModal) return;
  
  deleteAllBtn.addEventListener('click', async () => {
    const { count } = await supabase.from('students').select('*', { count: 'exact', head: true });
    if (deleteCount) deleteCount.textContent = count?.toString() || '0';
    (deleteModal as HTMLElement).style.display = 'flex';
    if (confirmCheckbox) confirmCheckbox.checked = false;
    if (confirmDeleteAllBtn) confirmDeleteAllBtn.disabled = true;
  });
  
  if (confirmCheckbox) {
    confirmCheckbox.addEventListener('change', () => {
      if (confirmDeleteAllBtn) confirmDeleteAllBtn.disabled = !confirmCheckbox.checked;
    });
  }
  
  const closeModal = () => {
    (deleteModal as HTMLElement).style.display = 'none';
    if (confirmCheckbox) confirmCheckbox.checked = false;
    if (confirmDeleteAllBtn) confirmDeleteAllBtn.disabled = true;
  };
  
  if (closeDeleteModal) closeDeleteModal.addEventListener('click', closeModal);
  if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeModal);
  deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) closeModal();
  });
  if (confirmDeleteAllBtn) confirmDeleteAllBtn.addEventListener('click', deleteAllStudents);
}

function initExcelImport(): void {
  setTimeout(() => {
    const importBtn = document.getElementById('importExcelBtn');
    const importModal = document.getElementById('importModal');
    const exportBtn = document.getElementById('exportExcelBtn');
    if (!importBtn || !importModal) {
      setTimeout(initExcelImport, 500);
      return;
    }
    
    const closeImportModal = document.getElementById('closeImportModal');
    const closeImportResultBtn = document.getElementById('closeImportResultBtn');
    const dropZone = document.getElementById('dropZone');
    const excelFileInput = document.getElementById('excelFileInput') as HTMLInputElement;
    const downloadTemplateBtn = document.getElementById('downloadTemplateBtn');
    const fileImportTab = document.getElementById('fileImportTab');
    const urlImportTab = document.getElementById('urlImportTab');
    const fileImportSection = document.getElementById('fileImportSection');
    const urlImportSection = document.getElementById('urlImportSection');
    const fetchUrlBtn = document.getElementById('fetchUrlBtn');
    
    if (exportBtn) exportBtn.addEventListener('click', exportToExcel);
    
    importBtn.addEventListener('click', () => {
      resetImportModal();
      (importModal as HTMLElement).style.display = 'flex';
    });
    
    const closeModal = () => {
      (importModal as HTMLElement).style.display = 'none';
      resetImportModal();
    };
    
    if (closeImportModal) closeImportModal.addEventListener('click', closeModal);
    if (closeImportResultBtn) closeImportResultBtn.addEventListener('click', closeModal);
    importModal.addEventListener('click', (e) => {
      if (e.target === importModal) closeModal();
    });
    
    if (fileImportTab && urlImportTab && fileImportSection && urlImportSection) {
      fileImportTab.addEventListener('click', () => {
        fileImportTab.classList.add('active');
        urlImportTab.classList.remove('active');
        (fileImportSection as HTMLElement).style.display = 'block';
        (urlImportSection as HTMLElement).style.display = 'none';
      });
      urlImportTab.addEventListener('click', () => {
        urlImportTab.classList.add('active');
        fileImportTab.classList.remove('active');
        (fileImportSection as HTMLElement).style.display = 'none';
        (urlImportSection as HTMLElement).style.display = 'block';
      });
    }
    
    if (downloadTemplateBtn) downloadTemplateBtn.addEventListener('click', downloadTemplate);
    
    if (dropZone) {
      dropZone.addEventListener('click', () => excelFileInput?.click());
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragging');
      });
      dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragging');
      });
      dropZone.addEventListener('drop', async (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragging');
        const file = e.dataTransfer?.files[0];
        if (file) await handleFileUpload(file);
      });
    }
    
    if (excelFileInput) {
      excelFileInput.addEventListener('change', async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) await handleFileUpload(file);
      });
    }
    
    if (fetchUrlBtn) fetchUrlBtn.addEventListener('click', handleUrlImport);
  }, 200);
}

let excelData: any[] = [];
let currentMapping: Record<string, string> = {};
let previewRows: any[] = [];

function showImportStep(step: 'upload' | 'map' | 'preview' | 'result'): void {
  const steps = ['importStepUpload', 'importStepMap', 'importStepPreview', 'importStepResult'];
  steps.forEach(s => {
    const el = document.getElementById(s);
    if (el) (el as HTMLElement).style.display = 'none';
  });
  const stepMap: Record<string, string> = { 'upload': 'importStepUpload', 'map': 'importStepMap', 'preview': 'importStepPreview', 'result': 'importStepResult' };
  const activeStep = document.getElementById(stepMap[step]);
  if (activeStep) (activeStep as HTMLElement).style.display = 'block';
}

function resetImportModal(): void {
  excelData = [];
  currentMapping = {};
  previewRows = [];
  showImportStep('upload');
  const fileInput = document.getElementById('excelFileInput') as HTMLInputElement;
  if (fileInput) fileInput.value = '';
  const urlInput = document.getElementById('excelUrlInput') as HTMLInputElement;
  if (urlInput) urlInput.value = '';
}

async function handleFileUpload(file: File): Promise<void> {
  if (!file.name.match(/\.(xlsx|xls)$/)) {
    showToast('error', 'Invalid file', 'Please select an Excel file');
    return;
  }
  showToast('info', 'Processing file...', 'Please wait');
  try {
    const data = await ExcelImporter.parseExcelFile(file);
    const headers = Object.keys(data[0]);
    const validRows: any[] = [];
    const invalidRows: any[] = [];
    const chunkSize = 100;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      for (const row of chunk) {
        const validation = ExcelImporter.validateRow(row, headers);
        if (validation.isValid) {
          validRows.push(validation);
        } else {
          invalidRows.push({ errors: validation.errors });
        }
      }
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    if (validRows.length === 0) {
      showToast('error', 'No valid rows found', 'Please check your Excel format');
      return;
    }
    const studentsToInsert = await ExcelImporter.prepareStudentsForInsert(validRows);
    const result = await ExcelImporter.bulkInsertStudents(studentsToInsert);
    showToast('success', 'Import complete!', `${result.imported} students imported, ${invalidRows.length} failed`);
    cachedStudents = [];
    if (studentController) {
      await studentController.refreshAllTables();
      await initCharts();
    }
    setTimeout(() => {
      const modal = document.getElementById('importModal');
      if (modal) (modal as HTMLElement).style.display = 'none';
      resetImportModal();
    }, 2000);
  } catch (error: any) {
    showToast('error', 'Import failed', error.message);
  }
}

async function handleUrlImport(): Promise<void> {
  const urlInput = document.getElementById('excelUrlInput') as HTMLInputElement;
  let url = urlInput?.value?.trim();
  if (!url) {
    showToast('error', 'URL required', 'Please enter a URL');
    return;
  }
  showToast('info', 'Processing URL...', 'Please wait');
  try {
    let fileUrl = url;
    if (url.includes('docs.google.com/spreadsheets')) {
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (fileIdMatch) {
        const fileId = fileIdMatch[1];
        fileUrl = `https://docs.google.com/spreadsheets/d/${fileId}/export?format=xlsx`;
      } else {
        throw new Error('Invalid Google Sheets URL');
      }
    }
    if (url.includes('drive.google.com/file')) {
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (fileIdMatch) {
        const fileId = fileIdMatch[1];
        fileUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      }
    }
    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    const file = new File([blob], 'imported_file.xlsx', { type: blob.type });
    await handleFileUpload(file);
  } catch (error: any) {
    showToast('error', 'Failed', 'Make sure the file is publicly accessible');
  }
}

function downloadTemplate(): void {
  ExcelImporter.downloadTemplate();
  showToast('success', 'Template downloaded', 'Check your downloads folder');
}

// ============================================
// MOBILE SIDEBAR TOGGLE
// ============================================

function initMobileSidebar(): void {
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebarToggle');
  const overlay = document.getElementById('sidebarOverlay');
  if (toggleBtn && sidebar && overlay) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('open');
      overlay.classList.toggle('active');
      toggleBtn.classList.toggle('open');
      document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
    });
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
      toggleBtn.classList.remove('open');
      document.body.style.overflow = '';
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        toggleBtn.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }
}

// ============================================
// LOGOUT HANDLER
// ============================================

function initLogoutHandler(): void {
  const logoutBtn = document.getElementById('logoutBtn');
  const logoutModal = document.getElementById('logoutModal');
  const closeLogoutBtn = document.getElementById('closeLogout');
  const stayBtn = document.getElementById('stayBtn');
  const doLogoutBtn = document.getElementById('doLogout');
  if (!logoutBtn) return;
  
  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (logoutModal) (logoutModal as HTMLElement).style.display = 'flex';
  });
  
  const closeModal = () => {
    if (logoutModal) (logoutModal as HTMLElement).style.display = 'none';
  };
  
  if (closeLogoutBtn) closeLogoutBtn.addEventListener('click', closeModal);
  if (stayBtn) stayBtn.addEventListener('click', closeModal);
  if (doLogoutBtn) {
    doLogoutBtn.addEventListener('click', async () => {
      closeModal();
      await forceLogout();
    });
  }
}

// ============================================
// ADMIN DISPLAY (FROM DATABASE)
// ============================================

async function getAdminNameFromDB(): Promise<string> {
  const adminId = sessionStorage.getItem(STORAGE_KEYS.ADMIN_ID);
  if (!adminId) return 'Admin User';
  
  const admin = await AdminService.getAdminById(adminId);
  if (admin) return admin.name;
  
  const loginMethod = sessionStorage.getItem(STORAGE_KEYS.LOGIN_METHOD);
  const adminName = sessionStorage.getItem(STORAGE_KEYS.ADMIN_NAME);
  const adminEmail = sessionStorage.getItem(STORAGE_KEYS.ADMIN_EMAIL);
  
  if (loginMethod === 'credentials' && adminName) return adminName;
  if (loginMethod === 'magiclink' && adminEmail) {
    return adminEmail.split('@')[0].charAt(0).toUpperCase() + adminEmail.split('@')[0].slice(1);
  }
  return 'Admin User';
}

async function updateAdminDisplay(): Promise<void> {
  const nameSpan = document.getElementById('adminNameDisplay');
  const initialsSpan = document.getElementById('adminInitials');
  const adminName = await getAdminNameFromDB();
  if (nameSpan) nameSpan.textContent = adminName;
  if (initialsSpan) initialsSpan.textContent = adminName.charAt(0).toUpperCase();
}

// ============================================
// CLICKABLE ROW HANDLER
// ============================================

function setupClickableRowHandler(): void {
  document.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;
    const editBtn = target.closest('.edit-btn');
    if (editBtn) {
      e.stopPropagation();
      const id = editBtn.getAttribute('data-id');
      if (id && studentController) {
        await studentController.openEditModalWithId(id);
      }
      return;
    }
    const row = target.closest('.clickable-row');
    if (row) {
      const id = row.getAttribute('data-id');
      if (id && studentController) {
        e.stopPropagation();
        await studentController.openEditModalWithId(id);
      }
    }
  });
}

// ============================================
// ADMIN MANAGEMENT - DATABASE DRIVEN
// ============================================

let credentialsAdminsList: any[] = [];
let magiclinkAdminsList: any[] = [];

async function loadAdminsFromDatabase(): Promise<void> {
  try {
    const allAdmins = await AdminService.getAllAdmins();
    credentialsAdminsList = allAdmins.filter(a => a.login_method === 'credentials');
    magiclinkAdminsList = allAdmins.filter(a => a.login_method === 'magiclink');
    console.log(`✅ Loaded ${credentialsAdminsList.length} credentials admins, ${magiclinkAdminsList.length} magic link admins from database`);
  } catch (error) {
    console.error('Failed to load admins from database:', error);
  }
}

async function renderAdminManagementPage(): Promise<void> {
  await loadAdminsFromDatabase();
  
  // Update counters at the top
  const credentialsCount = document.getElementById('credentialsCount');
  const magiclinkCount = document.getElementById('magiclinkCount');
  const totalCount = document.getElementById('totalAdminsCount');
  
  if (credentialsCount) credentialsCount.textContent = credentialsAdminsList.length.toString();
  if (magiclinkCount) magiclinkCount.textContent = magiclinkAdminsList.length.toString();
  if (totalCount) totalCount.textContent = (credentialsAdminsList.length + magiclinkAdminsList.length).toString();
  
  const credentialsTbody = document.getElementById('credentialsAdminsTbody');
  const magicTbody = document.getElementById('magiclinkAdminsTbody');
  
  if (credentialsTbody) {
    let html = '';
    credentialsAdminsList.forEach((admin, index) => {
      const statusClass = admin.status === 'Active' ? 'status-active' : 'status-inactive';
      html += `
        <tr>
          <td>${index + 1}</td>
          <td><strong>${escapeHtml(admin.name)}</strong></td>
          <td><code>${escapeHtml(admin.username || '')}</code></td>
          <td>${escapeHtml(admin.role)}</td>
          <td>
            <button class="status-toggle-btn" data-id="${admin.id}" data-status="${admin.status}" style="background:none; border:none; cursor:pointer;">
              <span class="${statusClass}">● ${escapeHtml(admin.status)}</span>
            </button>
          </td>
          <td class="action-buttons">
            <button class="action-btn-sm edit-admin-btn" data-type="credentials" data-id="${admin.id}" data-name="${escapeHtml(admin.name)}" data-username="${escapeHtml(admin.username || '')}" data-role="${escapeHtml(admin.role)}" data-status="${escapeHtml(admin.status)}">✏️ Edit</button>
            <button class="action-btn-sm delete-admin-btn" data-type="credentials" data-id="${admin.id}" data-name="${escapeHtml(admin.name)}" style="color:#dc2626;">🗑️ Delete</button>
          </td>
        </tr>
      `;
    });
    credentialsTbody.innerHTML = html;
  }
  
  if (magicTbody) {
    let html = '';
    magiclinkAdminsList.forEach((admin, index) => {
      const statusClass = admin.status === 'Active' ? 'status-active' : 'status-inactive';
      html += `
        <tr>
          <td>${index + 1}</td>
          <td><strong>${escapeHtml(admin.name)}</strong></td>
          <td><code>${escapeHtml(admin.email)}</code></td>
          <td>${escapeHtml(admin.role)}</td>
          <td>
            <button class="status-toggle-btn" data-id="${admin.id}" data-status="${admin.status}" style="background:none; border:none; cursor:pointer;">
              <span class="${statusClass}">● ${escapeHtml(admin.status)}</span>
            </button>
          </td>
          <td class="action-buttons">
            <button class="action-btn-sm edit-admin-btn" data-type="magiclink" data-id="${admin.id}" data-name="${escapeHtml(admin.name)}" data-email="${escapeHtml(admin.email)}" data-role="${escapeHtml(admin.role)}" data-status="${escapeHtml(admin.status)}">✏️ Edit</button>
            <button class="action-btn-sm delete-admin-btn" data-type="magiclink" data-id="${admin.id}" data-name="${escapeHtml(admin.name)}" style="color:#dc2626;">🗑️ Delete</button>
          </td>
        </tr>
      `;
    });
    magicTbody.innerHTML = html;
  }
  
  // Attach event listeners
  attachAdminActionButtons();
  attachStatusToggleButtons();
}

function attachAdminActionButtons(): void {
  document.querySelectorAll('.edit-admin-btn').forEach(btn => {
    btn.removeEventListener('click', handleEditAdminClick);
    btn.addEventListener('click', handleEditAdminClick);
  });
  
  document.querySelectorAll('.delete-admin-btn').forEach(btn => {
    btn.removeEventListener('click', handleDeleteAdminClick);
    btn.addEventListener('click', handleDeleteAdminClick);
  });
}

function attachStatusToggleButtons(): void {
  document.querySelectorAll('.status-toggle-btn').forEach(btn => {
    btn.removeEventListener('click', handleStatusToggle);
    btn.addEventListener('click', handleStatusToggle);
  });
}

async function handleStatusToggle(event: Event): Promise<void> {
  const btn = event.currentTarget as HTMLElement;
  const id = btn.getAttribute('data-id')!;
  const currentStatus = btn.getAttribute('data-status')!;
  const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
  
  try {
    const { error } = await supabase
      .from('admin_accounts')
      .update({ status: newStatus })
      .eq('id', id);
    
    if (error) throw error;
    
    showToast('success', 'Status Updated', `Admin status changed to ${newStatus}`);
    await renderAdminManagementPage();
  } catch (error: any) {
    showToast('error', 'Update Failed', error.message);
  }
}

function handleEditAdminClick(event: Event): void {
  const btn = event.currentTarget as HTMLElement;
  const type = btn.getAttribute('data-type') as 'credentials' | 'magiclink';
  const id = btn.getAttribute('data-id')!;
  const name = btn.getAttribute('data-name')!;
  
  if (type === 'credentials') {
    const username = btn.getAttribute('data-username')!;
    const role = btn.getAttribute('data-role')!;
    const status = btn.getAttribute('data-status')!;
    showEditAdminModal(type, id, { name, username, role, status });
  } else {
    const email = btn.getAttribute('data-email')!;
    const role = btn.getAttribute('data-role')!;
    const status = btn.getAttribute('data-status')!;
    showEditAdminModal(type, id, { name, email, role, status });
  }
}

async function handleDeleteAdminClick(event: Event): Promise<void> {
  const btn = event.currentTarget as HTMLElement;
  const id = btn.getAttribute('data-id')!;
  const name = btn.getAttribute('data-name')!;
  
  showDeleteConfirmModal(async () => {
    try {
      const { error } = await supabase
        .from('admin_accounts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      showToast('success', 'Admin Deleted', `${name} removed successfully`);
      await renderAdminManagementPage();
    } catch (error: any) {
      showToast('error', 'Delete Failed', error.message);
    }
  }, name);
}

function showDeleteConfirmModal(onConfirm: () => void, name: string): void {
  let modal = document.getElementById('deleteAdminConfirmModal');
  if (!modal) {
    modal = createDeleteConfirmModal();
    document.body.appendChild(modal);
  }
  
  const modalElem = modal as HTMLElement;
  const message = modal.querySelector('#deleteAdminMessage');
  if (message) message.textContent = `Are you sure you want to delete "${name}"? This action cannot be undone.`;
  
  const confirmBtn = modal.querySelector('#confirmDeleteAdminBtn');
  const checkbox = modal.querySelector('#confirmDeleteAdminCheckbox') as HTMLInputElement;
  
  if (checkbox) checkbox.checked = false;
  if (confirmBtn) (confirmBtn as HTMLButtonElement).disabled = true;
  
  const handleConfirm = () => {
    onConfirm();
    modalElem.style.display = 'none';
    cleanup();
  };
  
  const handleCheckbox = () => {
    if (confirmBtn) (confirmBtn as HTMLButtonElement).disabled = !checkbox.checked;
  };
  
  const cleanup = () => {
    confirmBtn?.removeEventListener('click', handleConfirm);
    checkbox?.removeEventListener('change', handleCheckbox);
    closeBtn?.removeEventListener('click', closeModal);
    cancelBtn?.removeEventListener('click', closeModal);
  };
  
  const closeModal = () => {
    modalElem.style.display = 'none';
    cleanup();
  };
  
  const closeBtn = modal.querySelector('#closeDeleteAdminModal');
  const cancelBtn = modal.querySelector('#cancelDeleteAdminBtn');
  
  confirmBtn?.addEventListener('click', handleConfirm);
  checkbox?.addEventListener('change', handleCheckbox);
  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);
  
  modalElem.style.display = 'flex';
}

function createDeleteConfirmModal(): HTMLElement {
  const modal = document.createElement('div');
  modal.id = 'deleteAdminConfirmModal';
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="modal modal-sm">
      <div class="modal-head">
        <div class="modal-title" style="color:#dc2626;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          Delete Admin
        </div>
        <button class="modal-close" id="closeDeleteAdminModal">✕</button>
      </div>
      <div class="modal-body">
        <p id="deleteAdminMessage">Are you sure you want to delete this admin?</p>
        <div style="margin-top: 16px;">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
            <input type="checkbox" id="confirmDeleteAdminCheckbox">
            <span>I understand that this action is irreversible</span>
          </label>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn-ghost" id="cancelDeleteAdminBtn">Cancel</button>
        <button class="btn-danger" id="confirmDeleteAdminBtn" disabled style="background:#dc2626;">Delete Admin</button>
      </div>
    </div>
  `;
  return modal;
}

function showEditAdminModal(type: 'credentials' | 'magiclink', id: string, adminData: any): void {
  let modal = document.getElementById('editAdminModal');
  if (!modal) {
    modal = createEditAdminModal();
    document.body.appendChild(modal);
  }
  
  const modalElem = modal as HTMLElement;
  const title = modal.querySelector('#editAdminModalTitle');
  if (title) title.textContent = `✏️ Edit ${type === 'credentials' ? 'Credentials' : 'Magic Link'} Admin`;
  
  if (type === 'credentials') {
    const nameInput = modal.querySelector('#editCredName') as HTMLInputElement;
    const usernameInput = modal.querySelector('#editCredUsername') as HTMLInputElement;
    const roleSelect = modal.querySelector('#editCredRole') as HTMLSelectElement;
    const statusSelect = modal.querySelector('#editCredStatus') as HTMLSelectElement;
    const passwordInput = modal.querySelector('#editCredPassword') as HTMLInputElement;
    const credForm = modal.querySelector('#editCredentialsForm');
    const magicForm = modal.querySelector('#editMagiclinkForm');
    
    if (credForm) credForm.classList.add('active');
    if (magicForm) magicForm.classList.remove('active');
    
    if (nameInput) nameInput.value = adminData.name;
    if (usernameInput) usernameInput.value = adminData.username;
    if (roleSelect) roleSelect.value = adminData.role;
    if (statusSelect) statusSelect.value = adminData.status;
    if (passwordInput) passwordInput.value = '';
    
    modal.setAttribute('data-edit-type', 'credentials');
    modal.setAttribute('data-edit-id', id);
    
  } else {
    const nameInput = modal.querySelector('#editMagicName') as HTMLInputElement;
    const emailInput = modal.querySelector('#editMagicEmail') as HTMLInputElement;
    const roleSelect = modal.querySelector('#editMagicRole') as HTMLSelectElement;
    const statusSelect = modal.querySelector('#editMagicStatus') as HTMLSelectElement;
    const credForm = modal.querySelector('#editCredentialsForm');
    const magicForm = modal.querySelector('#editMagiclinkForm');
    
    if (credForm) credForm.classList.remove('active');
    if (magicForm) magicForm.classList.add('active');
    
    if (nameInput) nameInput.value = adminData.name;
    if (emailInput) emailInput.value = adminData.email;
    if (roleSelect) roleSelect.value = adminData.role;
    if (statusSelect) statusSelect.value = adminData.status;
    
    modal.setAttribute('data-edit-type', 'magiclink');
    modal.setAttribute('data-edit-id', id);
  }
  
  modalElem.style.display = 'flex';
}

function createEditAdminModal(): HTMLElement {
  const modal = document.createElement('div');
  modal.id = 'editAdminModal';
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-head">
        <div class="modal-title" id="editAdminModalTitle">✏️ Edit Admin</div>
        <button class="modal-close" id="closeEditAdminModal">✕</button>
      </div>
      <div class="modal-body">
        <div id="editCredentialsForm" class="admin-edit-form active">
          <div class="form-field">
            <label>Full Name *</label>
            <input type="text" id="editCredName" class="form-input">
          </div>
          <div class="form-field">
            <label>Username *</label>
            <input type="text" id="editCredUsername" class="form-input">
          </div>
          <div class="form-field">
            <label>New Password (leave blank to keep current)</label>
            <input type="password" id="editCredPassword" class="form-input" placeholder="Enter new password">
          </div>
          <div class="form-row">
            <div class="form-field">
              <label>Role</label>
              <select id="editCredRole" class="form-select">
                <option value="Admin">Admin</option>
                <option value="Super Admin">Super Admin</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>
            <div class="form-field">
              <label>Status</label>
              <select id="editCredStatus" class="form-select">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
        
        <div id="editMagiclinkForm" class="admin-edit-form">
          <div class="form-field">
            <label>Full Name *</label>
            <input type="text" id="editMagicName" class="form-input">
          </div>
          <div class="form-field">
            <label>Email Address *</label>
            <input type="email" id="editMagicEmail" class="form-input">
          </div>
          <div class="form-row">
            <div class="form-field">
              <label>Role</label>
              <select id="editMagicRole" class="form-select">
                <option value="Admin">Admin</option>
                <option value="Super Admin">Super Admin</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>
            <div class="form-field">
              <label>Status</label>
              <select id="editMagicStatus" class="form-select">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn-ghost" id="cancelEditAdminBtn">Cancel</button>
        <button class="btn-primary" id="saveEditAdminBtn">Save Changes</button>
      </div>
    </div>
  `;
  
  const closeBtn = modal.querySelector('#closeEditAdminModal');
  const cancelBtn = modal.querySelector('#cancelEditAdminBtn');
  const saveBtn = modal.querySelector('#saveEditAdminBtn');
  
  const closeModal = () => { (modal as HTMLElement).style.display = 'none'; };
  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  
  saveBtn?.addEventListener('click', async () => {
    const type = modal.getAttribute('data-edit-type') as 'credentials' | 'magiclink';
    const id = modal.getAttribute('data-edit-id')!;
    
    if (type === 'credentials') {
      const name = (modal.querySelector('#editCredName') as HTMLInputElement)?.value.trim();
      const username = (modal.querySelector('#editCredUsername') as HTMLInputElement)?.value.trim();
      const password = (modal.querySelector('#editCredPassword') as HTMLInputElement)?.value;
      const role = (modal.querySelector('#editCredRole') as HTMLSelectElement)?.value;
      const status = (modal.querySelector('#editCredStatus') as HTMLSelectElement)?.value;
      
      if (!name || !username) {
        showToast('error', 'Missing Fields', 'Name and username are required');
        return;
      }
      
      try {
        const updateData: any = { name, username, role, status };
        if (password && password.length >= 6) {
          updateData.password = password;
        }
        await AdminService.updateAdmin(id, updateData);
        await renderAdminManagementPage();
        showToast('success', 'Admin Updated', `${name} updated successfully`);
        closeModal();
      } catch (error: any) {
        showToast('error', 'Update Failed', error.message);
      }
    } else {
      const name = (modal.querySelector('#editMagicName') as HTMLInputElement)?.value.trim();
      const email = (modal.querySelector('#editMagicEmail') as HTMLInputElement)?.value.trim();
      const role = (modal.querySelector('#editMagicRole') as HTMLSelectElement)?.value;
      const status = (modal.querySelector('#editMagicStatus') as HTMLSelectElement)?.value;
      
      if (!name || !email) {
        showToast('error', 'Missing Fields', 'Name and email are required');
        return;
      }
      
      try {
        await AdminService.updateAdmin(id, { name, email, role, status });
        await renderAdminManagementPage();
        showToast('success', 'Admin Updated', `${name} updated successfully`);
        closeModal();
      } catch (error: any) {
        showToast('error', 'Update Failed', error.message);
      }
    }
  });
  
  return modal;
}

// ============================================
// ADD ADMIN FUNCTIONALITY
// ============================================

function initAddAdminButton(): void {
  const addAdminBtn = document.getElementById('addAdminBtn');
  if (addAdminBtn) {
    addAdminBtn.addEventListener('click', showAddAdminModal);
  }
}

function showAddAdminModal(): void {
  let modal = document.getElementById('addAdminModal');
  if (!modal) {
    modal = createAddAdminModal();
    document.body.appendChild(modal);
  }
  (modal as HTMLElement).style.display = 'flex';
}

function createAddAdminModal(): HTMLElement {
  const modal = document.createElement('div');
  modal.id = 'addAdminModal';
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-head">
        <div class="modal-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"></path>
          </svg>
          Add New Admin
        </div>
        <button class="modal-close" id="closeAddAdminModal">✕</button>
      </div>
      <div class="modal-body">
        <div class="admin-type-selector">
          <button class="admin-type-btn active" data-admin-type="credentials">🔐 Credentials Admin</button>
          <button class="admin-type-btn" data-admin-type="magiclink">📧 Magic Link Admin</button>
        </div>
        
        <div id="addCredentialsForm" class="admin-add-form active">
          <div class="form-field">
            <label>Full Name *</label>
            <input type="text" id="addCredName" class="form-input" placeholder="e.g. Juan Dela Cruz">
          </div>
          <div class="form-field">
            <label>Username *</label>
            <input type="text" id="addCredUsername" class="form-input" placeholder="e.g. AdminJuan">
          </div>
          <div class="form-field">
            <label>Email *</label>
            <input type="email" id="addCredEmail" class="form-input" placeholder="email@example.com">
          </div>
          <div class="form-field">
            <label>Password *</label>
            <input type="password" id="addCredPassword" class="form-input" placeholder="Enter password">
          </div>
          <div class="form-field">
            <label>Confirm Password *</label>
            <input type="password" id="addCredConfirmPassword" class="form-input" placeholder="Confirm password">
          </div>
          <div class="form-row">
            <div class="form-field">
              <label>Role</label>
              <select id="addCredRole" class="form-select">
                <option value="Admin">Admin</option>
                <option value="Super Admin">Super Admin</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>
            <div class="form-field">
              <label>Status</label>
              <select id="addCredStatus" class="form-select">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
        
        <div id="addMagiclinkForm" class="admin-add-form">
          <div class="form-field">
            <label>Full Name *</label>
            <input type="text" id="addMagicName" class="form-input" placeholder="e.g. Juan Dela Cruz">
          </div>
          <div class="form-field">
            <label>Email Address *</label>
            <input type="email" id="addMagicEmail" class="form-input" placeholder="email@phinmaed.com">
          </div>
          <div class="form-row">
            <div class="form-field">
              <label>Role</label>
              <select id="addMagicRole" class="form-select">
                <option value="Admin">Admin</option>
                <option value="Super Admin">Super Admin</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>
            <div class="form-field">
              <label>Status</label>
              <select id="addMagicStatus" class="form-select">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn-ghost" id="cancelAddAdminBtn">Cancel</button>
        <button class="btn-primary" id="confirmAddAdminBtn">Add Admin</button>
      </div>
    </div>
  `;
  
  // Admin type switcher
  const typeBtns = modal.querySelectorAll('.admin-type-btn');
  const credForm = modal.querySelector('#addCredentialsForm');
  const magicForm = modal.querySelector('#addMagiclinkForm');
  
  typeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      typeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const type = btn.getAttribute('data-admin-type');
      if (type === 'credentials') {
        credForm?.classList.add('active');
        magicForm?.classList.remove('active');
      } else {
        credForm?.classList.remove('active');
        magicForm?.classList.add('active');
      }
    });
  });
  
  // Close modal
  const closeBtn = modal.querySelector('#closeAddAdminModal');
  const cancelBtn = modal.querySelector('#cancelAddAdminBtn');
  const closeModal = () => { (modal as HTMLElement).style.display = 'none'; };
  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  
  // Confirm add
  const confirmBtn = modal.querySelector('#confirmAddAdminBtn');
  confirmBtn?.addEventListener('click', async () => {
    const activeType = modal.querySelector('.admin-type-btn.active')?.getAttribute('data-admin-type');
    
    if (activeType === 'credentials') {
      const name = (modal.querySelector('#addCredName') as HTMLInputElement)?.value.trim();
      const username = (modal.querySelector('#addCredUsername') as HTMLInputElement)?.value.trim();
      const email = (modal.querySelector('#addCredEmail') as HTMLInputElement)?.value.trim();
      const password = (modal.querySelector('#addCredPassword') as HTMLInputElement)?.value;
      const confirmPassword = (modal.querySelector('#addCredConfirmPassword') as HTMLInputElement)?.value;
      const role = (modal.querySelector('#addCredRole') as HTMLSelectElement)?.value;
      const status = (modal.querySelector('#addCredStatus') as HTMLSelectElement)?.value;
      
      if (!name || !username || !email || !password) {
        showToast('error', 'Missing Fields', 'Please fill all required fields');
        return;
      }
      if (password !== confirmPassword) {
        showToast('error', 'Password Mismatch', 'Passwords do not match');
        return;
      }
      if (password.length < 6) {
        showToast('error', 'Weak Password', 'Password must be at least 6 characters');
        return;
      }
      
      try {
        await AdminService.createCredentialsAdmin({ name, email, username, password, role });
        await renderAdminManagementPage();
        showToast('success', 'Admin Added', `${name} added successfully`);
        closeModal();
      } catch (error: any) {
        showToast('error', 'Add Failed', error.message);
      }
    } else {
      const name = (modal.querySelector('#addMagicName') as HTMLInputElement)?.value.trim();
      const email = (modal.querySelector('#addMagicEmail') as HTMLInputElement)?.value.trim();
      const role = (modal.querySelector('#addMagicRole') as HTMLSelectElement)?.value;
      const status = (modal.querySelector('#addMagicStatus') as HTMLSelectElement)?.value;
      
      if (!name || !email) {
        showToast('error', 'Missing Fields', 'Name and email are required');
        return;
      }
      
      try {
        await AdminService.createMagicLinkAdmin({ name, email, role });
        await renderAdminManagementPage();
        showToast('success', 'Admin Added', `${name} added successfully`);
        closeModal();
      } catch (error: any) {
        showToast('error', 'Add Failed', error.message);
      }
    }
  });
  
  return modal;
}

// ============================================
// EXPORT ADMINS TO EXCEL
// ============================================

function initExportAdminsButton(): void {
  const exportAdminsBtn = document.getElementById('exportAdminsBtn');
  if (exportAdminsBtn) {
    exportAdminsBtn.addEventListener('click', exportAdminsToExcel);
  }
}

async function exportAdminsToExcel(): Promise<void> {
  showToast('info', 'Preparing export...', 'Fetching admin data');
  try {
    const admins = await AdminService.getAllAdmins();
    const exportData = admins.map((admin: any) => ({
      'Name': admin.name,
      'Username': admin.username || '',
      'Email': admin.email || '',
      'Role': admin.role,
      'Status': admin.status,
      'Login Method': admin.login_method === 'credentials' ? 'Username & Password' : 'Magic Link',
      'Theme Preference': admin.theme_preference,
      'Last Login': admin.last_login ? new Date(admin.last_login).toLocaleString() : 'Never',
      'Created At': new Date(admin.created_at).toLocaleString()
    }));
    
    ExcelImporter.exportToExcel(exportData, 'admins_export');
    showToast('success', 'Export Complete', `Exported ${exportData.length} admins`);
  } catch (error: any) {
    showToast('error', 'Export Failed', error.message);
  }
}

// ============================================
// ADMIN MANAGEMENT TABS & NAV
// ============================================

function initAdminManagementTabs(): void {
  const tabs = document.querySelectorAll('.admin-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-admin-tab');
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const credentialsPanel = document.getElementById('credentialsAdminsPanel');
      const magicPanel = document.getElementById('magiclinkAdminsPanel');
      
      if (tabName === 'credentials') {
        if (credentialsPanel) credentialsPanel.classList.add('active');
        if (magicPanel) magicPanel.classList.remove('active');
      } else {
        if (credentialsPanel) credentialsPanel.classList.remove('active');
        if (magicPanel) magicPanel.classList.add('active');
      }
    });
  });
}

function initAdminManagementNav(): void {
  const adminNavBtn = document.getElementById('adminManagementNavBtn');
  if (adminNavBtn && window.switchPage) {
    adminNavBtn.addEventListener('click', () => {
      window.switchPage('adminmanagement');
    });
  }
}

// ============================================
// INTERACTIVE STATS CARDS
// ============================================

function initInteractiveStatsCards(): void {
  const totalCard = document.getElementById('totalStudents')?.closest('.stat-card');
  if (totalCard && window.switchPage) {
    totalCard.addEventListener('click', () => window.switchPage('completion'));
  }
  
  const completedCard = document.getElementById('completedCount')?.closest('.stat-card');
  if (completedCard && window.switchPage) {
    completedCard.addEventListener('click', () => window.switchPage('completion', 'COMPLETED'));
  }
  
  const pendingCard = document.getElementById('pendingCount')?.closest('.stat-card');
  if (pendingCard && window.switchPage) {
    pendingCard.addEventListener('click', () => window.switchPage('completion', 'PENDING'));
  }
  
  const notCompletedCard = document.getElementById('notCompletedCount')?.closest('.stat-card');
  if (notCompletedCard && window.switchPage) {
    notCompletedCard.addEventListener('click', () => window.switchPage('completion', 'NOT COMPLETED'));
  }
  
  const hkCard = document.getElementById('hkEndorsedCount')?.closest('.stat-card');
  if (hkCard && window.switchPage) {
    hkCard.addEventListener('click', () => window.switchPage('hkdatabase'));
  }
}

// ============================================
// DASHBOARD INITIALIZATION
// ============================================

let uiController: AdminUIController;

async function initAdminDashboard(): Promise<void> {
  console.log('🚀 Initializing Admin Dashboard...');
  if (!document.querySelector('.nav-item[data-page]')) {
    setTimeout(initAdminDashboard, 50);
    return;
  }
  
  await updateAdminDisplay();
  await initProfileModal();
  initMobileSidebar();
  initLogoutHandler();
  initExcelImport();
  initDeleteAllButton();
  await initColorThemePicker();
  initAnalyticsExportButtons();
  initAddAdminButton();
  initExportAdminsButton();
  
  studentController = new AdminStudentController();
  uiController = new AdminUIController();
  setupClickableRowHandler();
  
  let isDashboardLoaded = false;
  
  function loadDashboardData(): void {
    if (!isDashboardLoaded) {
      studentController?.renderRecentTable();
      studentController?.updateStatsDisplay();
      initCharts();
      isDashboardLoaded = true;
    }
  }
  
  // GLOBAL SWITCH PAGE FUNCTION
  window.switchPage = (page: string, filterRemarks?: string, filterCourse?: string): void => {
    console.log('🔀 Switching to page:', page, filterRemarks ? `with filter: ${filterRemarks}` : '');
    
    const titles: Record<string, { title: string; subtitle: string; pageId: string }> = {
      dashboard: { title: 'Dashboard', subtitle: 'Overview', pageId: 'dashboardPage' },
      completion: { title: 'Completion', subtitle: 'Online Support tracker', pageId: 'completionPage' },
      hkdatabase: { title: 'HK Database', subtitle: 'Endorsed students', pageId: 'hkDatabasePage' },
      analytics: { title: 'Analytics', subtitle: 'Data analysis', pageId: 'analyticsPage' },
      adminmanagement: { title: 'Admin Management', subtitle: 'Manage system administrators', pageId: 'adminManagementPage' }
    };
    
    const config = titles[page];
    if (config) {
      uiController.showPage(config.pageId);
      uiController.updatePageTitle(config.title, config.subtitle);
      uiController.setActiveNav(page);
      
      if (page === 'completion') {
        const searchVal = (document.getElementById('searchInput') as HTMLInputElement)?.value || '';
        renderCompletionTableOptimized(searchVal, 1);
        
        if (filterRemarks) {
          setTimeout(() => {
            const remarksFilter = document.getElementById('filterRemarks') as HTMLSelectElement;
            if (remarksFilter) {
              remarksFilter.value = filterRemarks;
              remarksFilter.dispatchEvent(new Event('change'));
            }
          }, 100);
        }
      } else if (page === 'hkdatabase') {
        studentController?.renderHKTable();
      } else if (page === 'dashboard') {
        studentController?.renderRecentTable();
        studentController?.updateStatsDisplay();
        initCharts();
        loadDashboardData();
      } else if (page === 'analytics') {
        initAnalyticsPage();
        initAnalyticsExportButtons();
      } else if (page === 'adminmanagement') {
        renderAdminManagementPage();
        initAdminManagementTabs();
      }
    }
  };
  
  // Initialize Admin Management Navigation
  initAdminManagementNav();
  
  // Initialize Interactive Stats Cards
  initInteractiveStatsCards();
  
  const navItems = document.querySelectorAll('.nav-item[data-page]');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.getAttribute('data-page');
      if (page) window.switchPage(page);
    });
  });
  
  uiController.setupEventListeners(studentController!, window.switchPage);
  renderCompletionTableOptimized('', 1);
  studentController?.renderHKTable();
  
  const dashboardPage = document.getElementById('dashboardPage');
  if (dashboardPage) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadDashboardData();
          observer.disconnect();
        }
      });
    });
    observer.observe(dashboardPage);
  }
  if (document.querySelector('.nav-item.active')?.getAttribute('data-page') === 'dashboard') {
    loadDashboardData();
  }
}

// ============================================
// START APPLICATION
// ============================================

async function startApp(): Promise<void> {
  console.log('🚀 Starting application...');
  showLoadingScreen();
  
  checkAppVersionAndLogout();
  
  const isValid = await validateSession();
  if (!isValid) {
    window.location.href = '/admin-login.html?t=' + Date.now();
    return;
  }
  
  hideLoadingScreen();
  initSecurity();
  trackUserActivity();
  resetInactivityTimer();
  await initAdminDashboard();
}

startApp();