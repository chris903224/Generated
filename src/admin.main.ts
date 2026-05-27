// admin.main.ts - FULL CORRECTED VERSION

import { supabase } from './services/supabase.service';
import { AdminStudentController } from './controllers/admin.student.controller';
import { AdminUIController } from './controllers/admin.ui.controller';
import { StudentService } from './services/supabase.service';
import { ExcelImporter, DB_FIELDS } from './utils/excel-importer';

// Declare Chart from CDN
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

// App version
const APP_VERSION = "v3.0.0";

// Colors
const colors = {
  green: '#10b981',
  amber: '#fbbf24',
  rose: '#f43f5e',
  blue: '#3b82f6',
  teal: '#14b8a6',
  purple: '#8b5cf6',
  emerald: '#34d399',
  orange: '#f97316',
  pink: '#ec4899',
  cyan: '#06b6d4',
  lime: '#84cc16',
  violet: '#a855f7',
  indigo: '#6366f1',
  red: '#ef4444',
  yellow: '#eab308',
  gray: '#6b7280',
  slate: '#94a3b8'
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

type ToastType = 'success' | 'error' | 'info';

// ============================================
// SECURITY MEASURES
// ============================================

function initSecurity(): void {
  // 1. Disable Right Click
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  });

  // 2. Disable Keyboard Shortcuts (F12, Ctrl+Shift+I, etc.)
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

  console.log('✅ Security fully initialized');
}

// ============================================
// PERFORMANCE OPTIMIZATIONS
// ============================================

// Cache for students data
let cachedStudents: any[] = [];
let lastStudentsFetch = 0;
const STUDENTS_CACHE_DURATION = 30000; // 30 seconds

// Pagination variables
let currentPage = 1;
const rowsPerPage = 50;
let totalFilteredStudents: any[] = [];

// Debounce function
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
// VERSION CHECK
// ============================================

function checkAppVersion(): void {
  const storedVersion = sessionStorage.getItem('app_version');
  
  if (!storedVersion) {
    sessionStorage.setItem('app_version', APP_VERSION);
    return;
  }
  
  if (storedVersion !== APP_VERSION) {
    const loginTime = sessionStorage.getItem('admin_login_time');
    if (loginTime) {
      const elapsed = Date.now() - parseInt(loginTime);
      if (elapsed < 10000) {
        sessionStorage.setItem('app_version', APP_VERSION);
        return;
      }
    }
    forceLogout();
  }
}

// ============================================
// FORCE LOGOUT
// ============================================

async function forceLogout(): Promise<void> {
  sessionStorage.clear();
  localStorage.clear();
  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.error('Signout error:', e);
  }
  window.location.href = '/admin-login.html?t=' + Date.now();
}

// ============================================
// VALIDATE SESSION
// ============================================

async function validateSession(): Promise<boolean> {
  const isLoggedIn = sessionStorage.getItem('admin_logged_in') === 'true';
  const loginMethod = sessionStorage.getItem('login_method');
  const loginTime = sessionStorage.getItem('admin_login_time');
  
  if (!isLoggedIn) return false;
  
  if (loginTime) {
    const elapsed = Date.now() - parseInt(loginTime);
    const eightHours = 8 * 60 * 60 * 1000;
    if (elapsed > eightHours) {
      await forceLogout();
      return false;
    }
  }
  
  if (loginMethod === 'credentials') return true;
  
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
// TOAST FUNCTION - UPPER RIGHT CORNER
// ============================================

function dismissToast(toast: HTMLElement): void {
  toast.classList.add('toast-exit');
  toast.addEventListener('animationend', () => toast.remove());
}

function showToast(type: ToastType, title: string, description?: string): void {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = '';
  if (type === 'success') {
    icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
  } else if (type === 'error') {
    icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
  } else {
    icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
  }
  
  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-body">
      <p class="toast-title">${title}</p>
      ${description ? `<p class="toast-desc">${description}</p>` : ''}
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
    closeBtn.addEventListener('click', () => dismissToast(toast));
  }
  
  setTimeout(() => dismissToast(toast), 5000);
}

// ============================================
// HELPER FUNCTIONS FOR TABLE RENDERING
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
// OPTIMIZED TABLE RENDERING WITH PAGINATION
// ============================================

async function renderCompletionTableOptimized(searchTerm: string = '', page: number = 1): Promise<void> {
  const tbody = document.getElementById('completionTbody');
  const rowCount = document.getElementById('rowCount');
  
  if (!tbody) return;
  
  // Fetch with caching
  const now = Date.now();
  if (cachedStudents.length === 0 || (now - lastStudentsFetch) > STUDENTS_CACHE_DURATION) {
    cachedStudents = await StudentService.getAllStudents();
    lastStudentsFetch = now;
  }
  
  // Filter
  let filtered = cachedStudents;
  if (searchTerm) {
    filtered = cachedStudents.filter(s => 
      s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.course?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.student_id?.includes(searchTerm)
    );
  }
  
  totalFilteredStudents = filtered;
  if (rowCount) rowCount.textContent = `${filtered.length} entries`;
  
  // Pagination
  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pageStudents = filtered.slice(start, end);
  
  if (pageStudents.length === 0) {
    tbody.innerHTML = `<tr><td colspan="13" style="text-align:center; padding:60px;">No students found</td></tr>`;
    updatePaginationControls(filtered.length, page);
    return;
  }
  
  // Render rows
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
  const paginationContainer = document.getElementById('paginationControls');
  
  if (!paginationContainer) {
    const panelFoot = document.querySelector('.panel-foot');
    if (panelFoot && !document.getElementById('paginationControls')) {
      const container = document.createElement('div');
      container.id = 'paginationControls';
      container.className = 'pagination-controls';
      panelFoot.appendChild(container);
    }
  }
  
  const container = document.getElementById('paginationControls');
  if (!container) return;
  
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }
  
  let paginationHtml = '<div class="pagination">';
  paginationHtml += `<button class="page-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>← Prev</button>`;
  paginationHtml += `<span class="page-info">Page ${currentPage} of ${totalPages}</span>`;
  paginationHtml += `<button class="page-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>Next →</button>`;
  paginationHtml += '</div>';
  
  container.innerHTML = paginationHtml;
  
  document.querySelectorAll('.page-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const page = parseInt((e.target as HTMLElement).getAttribute('data-page') || '1');
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        const searchInput = document.getElementById('searchInput') as HTMLInputElement;
        renderCompletionTableOptimized(searchInput?.value || '', page);
      }
    });
  });
}

// Debounced search
const debouncedSearch = debounce((value: string) => {
  renderCompletionTableOptimized(value, 1);
}, 300);

// ============================================
// EXPORT TO EXCEL
// ============================================

async function exportToExcel(): Promise<void> {
  showToast('info', 'Preparing export...', 'Fetching data from database');
  
  try {
    const { data: students, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    if (!students || students.length === 0) {
      showToast('error', 'No data to export', 'The table is empty');
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
      'Created At': new Date(student.created_at).toLocaleDateString()
    }));
    
    ExcelImporter.exportToExcel(exportData, 'students_export');
    showToast('success', 'Export complete', `${exportData.length} records exported`);
    
  } catch (error: any) {
    console.error('Export error:', error);
    showToast('error', 'Export failed', error.message);
  }
}

// ============================================
// DELETE ALL STUDENTS
// ============================================

async function deleteAllStudents(): Promise<void> {
  const confirmBtn = document.getElementById('confirmDeleteAllBtn') as HTMLButtonElement;
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Deleting...';
  }
  
  showToast('info', 'Deleting all students...', 'Please wait');
  
  try {
    const { data: students, error } = await supabase
      .from('students')
      .select('id');
    
    if (error) throw error;
    
    const totalCount = students.length;
    
    if (totalCount === 0) {
      showToast('info', 'No students to delete', 'Database is already empty');
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
      
      const { error: deleteError } = await supabase
        .from('students')
        .delete()
        .in('id', ids);
      
      if (deleteError) throw deleteError;
      deleted += batch.length;
    }
    
    showToast('success', 'Delete complete!', `${deleted} students deleted.`);
    
    // Clear cache and refresh
    cachedStudents = [];
    if (studentController) {
      await studentController.refreshAllTables();
      await initCharts();
    }
    
    const modal = document.getElementById('deleteAllModal');
    if (modal) (modal as HTMLElement).style.display = 'none';
    
  } catch (error: any) {
    console.error('Delete error:', error);
    showToast('error', 'Delete failed', error.message);
  } finally {
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Delete All Students';
    }
  }
}

// ============================================
// EXCEL IMPORT FUNCTIONS
// ============================================

let excelData: any[] = [];
let currentMapping: Record<string, string> = {};
let previewRows: any[] = [];
let studentController: AdminStudentController | null = null;

function showImportStep(step: 'upload' | 'map' | 'preview' | 'result'): void {
  const steps = ['importStepUpload', 'importStepMap', 'importStepPreview', 'importStepResult'];
  steps.forEach(s => {
    const el = document.getElementById(s);
    if (el) (el as HTMLElement).style.display = 'none';
  });
  
  const stepMap: Record<string, string> = {
    'upload': 'importStepUpload',
    'map': 'importStepMap',
    'preview': 'importStepPreview',
    'result': 'importStepResult'
  };
  
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

// ============================================
// HANDLE FILE UPLOAD - OPTIMIZED
// ============================================

async function handleFileUpload(file: File): Promise<void> {
  if (!file.name.match(/\.(xlsx|xls)$/)) {
    showToast('error', 'Invalid file', 'Please select an Excel file');
    return;
  }
  
  showToast('info', 'Processing file...', 'Please wait');
  
  try {
    const data = await ExcelImporter.parseExcelFile(file);
    const headers = Object.keys(data[0]);
    
    console.log('📋 Detected headers:', headers);
    console.log('📊 Total rows:', data.length);
    
    const validRows: any[] = [];
    const invalidRows: any[] = [];
    
    // Process in chunks to avoid blocking UI
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
    
    console.log(`✅ Valid rows: ${validRows.length}`);
    console.log(`❌ Invalid rows: ${invalidRows.length}`);
    
    if (validRows.length === 0) {
      showToast('error', 'No valid rows found', 'Please check your Excel format');
      return;
    }
    
    const studentsToInsert = await ExcelImporter.prepareStudentsForInsert(validRows);
    const result = await ExcelImporter.bulkInsertStudents(studentsToInsert);
    
    showToast('success', 'Import complete!', `${result.imported} students imported, ${invalidRows.length} failed`);
    
    // Clear cache and refresh
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
    console.error('Import error:', error);
    showToast('error', 'Import failed', error.message);
  }
}

// ============================================
// HANDLE URL IMPORT
// ============================================

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
        console.log('✅ Converted to export URL:', fileUrl);
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
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const blob = await response.blob();
    const file = new File([blob], 'imported_file.xlsx', { type: blob.type });
    
    await handleFileUpload(file);
    
  } catch (error: any) {
    console.error('URL import error:', error);
    showToast('error', 'Failed', 'Make sure the file is publicly accessible');
  }
}

function downloadTemplate(): void {
  ExcelImporter.downloadTemplate();
  showToast('success', 'Template downloaded', 'Check your downloads folder');
}

// ============================================
// DELETE ALL BUTTON INITIALIZATION
// ============================================

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
    const { count } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });
    
    if (deleteCount) deleteCount.textContent = count?.toString() || '0';
    (deleteModal as HTMLElement).style.display = 'flex';
    
    if (confirmCheckbox) confirmCheckbox.checked = false;
    if (confirmDeleteAllBtn) confirmDeleteAllBtn.disabled = true;
  });
  
  if (confirmCheckbox) {
    confirmCheckbox.addEventListener('change', () => {
      if (confirmDeleteAllBtn) {
        confirmDeleteAllBtn.disabled = !confirmCheckbox.checked;
      }
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
  
  if (confirmDeleteAllBtn) {
    confirmDeleteAllBtn.addEventListener('click', deleteAllStudents);
  }
}

// ============================================
// INIT EXCEL IMPORT
// ============================================

function initExcelImport(): void {
  console.log('📊 Initializing Excel Import...');
  
  setTimeout(() => {
    const importBtn = document.getElementById('importExcelBtn');
    const importModal = document.getElementById('importModal');
    const exportBtn = document.getElementById('exportExcelBtn');
    
    if (!importBtn || !importModal) {
      console.warn('Import elements not found, retrying...');
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
    
    if (exportBtn) {
      exportBtn.addEventListener('click', exportToExcel);
    }
    
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
    
    if (downloadTemplateBtn) {
      downloadTemplateBtn.addEventListener('click', downloadTemplate);
    }
    
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
    
    if (fetchUrlBtn) {
      fetchUrlBtn.addEventListener('click', handleUrlImport);
    }
    
    console.log('✅ Excel Import initialized successfully');
  }, 200);
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
// ADMIN DISPLAY
// ============================================

function getAdminName(): string {
  const loginMethod = sessionStorage.getItem('login_method');
  const adminName = sessionStorage.getItem('admin_name');
  const adminEmail = sessionStorage.getItem('admin_email');
  
  if (loginMethod === 'credentials' && adminName) return adminName;
  if (loginMethod === 'magiclink' && adminEmail) {
    return adminEmail.split('@')[0].charAt(0).toUpperCase() + adminEmail.split('@')[0].slice(1);
  }
  return 'Admin User';
}

function getAdminInitials(): string {
  return getAdminName().charAt(0).toUpperCase();
}

function updateAdminDisplay(): void {
  const nameSpan = document.getElementById('adminNameDisplay');
  const initialsSpan = document.getElementById('adminInitials');
  if (nameSpan) nameSpan.textContent = getAdminName();
  if (initialsSpan) initialsSpan.textContent = getAdminInitials();
}

// ============================================
// CHART FUNCTIONS
// ============================================

async function initMonthlyTrendChart(): Promise<void> {
  const canvas = document.getElementById('trendChart') as HTMLCanvasElement;
  if (!canvas) return;

  const { data: students, error } = await supabase
    .from('students')
    .select('remarks, created_at, updated_at')
    .limit(500);

  if (error || !students) return;

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

    const completed = students.filter((s: any) => {
      if (s.remarks !== 'COMPLETED') return false;
      const completedDate = s.updated_at ? new Date(s.updated_at) : null;
      return completedDate && completedDate >= startDate && completedDate <= endDate;
    }).length;

    const pending = students.filter((s: any) => {
      if (s.remarks !== 'PENDING') return false;
      const createdDate = s.created_at ? new Date(s.created_at) : null;
      return createdDate && createdDate >= startDate && createdDate <= endDate;
    }).length;

    const notCompleted = students.filter((s: any) => {
      if (s.remarks !== 'NOT COMPLETED') return false;
      const updatedDate = s.updated_at ? new Date(s.updated_at) : null;
      return updatedDate && updatedDate >= startDate && updatedDate <= endDate;
    }).length;

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
        {
          label: '✅ Completed',
          data: monthlyData.map(d => d.completed),
          borderColor: colors.green,
          backgroundColor: 'rgba(16, 185, 129, 0.05)',
          borderWidth: 2,
          tension: 0.3,
          fill: true,
          pointRadius: 3,
          pointBackgroundColor: colors.green,
          pointBorderColor: '#fff',
          pointBorderWidth: 1
        },
        {
          label: '⏳ Pending',
          data: monthlyData.map(d => d.pending),
          borderColor: colors.amber,
          backgroundColor: 'rgba(245, 158, 11, 0.05)',
          borderWidth: 2,
          tension: 0.3,
          fill: true,
          pointRadius: 3,
          pointBackgroundColor: colors.amber,
          pointBorderColor: '#fff',
          pointBorderWidth: 1
        },
        {
          label: '❌ Not Completed',
          data: monthlyData.map(d => d.notCompleted),
          borderColor: colors.rose,
          backgroundColor: 'rgba(239, 68, 68, 0.05)',
          borderWidth: 2,
          tension: 0.3,
          fill: true,
          pointRadius: 3,
          pointBackgroundColor: colors.rose,
          pointBorderColor: '#fff',
          pointBorderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 8, font: { size: 10 } } },
        tooltip: { mode: 'index', intersect: false, callbacks: { title: (ctx: any) => monthlyData[ctx[0].dataIndex].fullMonth } }
      },
      scales: {
        y: { beginAtZero: true, max: yAxisMax, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { stepSize: maxValue <= 10 ? 1 : Math.ceil(maxValue / 5), precision: 0, font: { size: 9 } } },
        x: { grid: { display: false }, ticks: { font: { size: 9, weight: 'bold' } } }
      }
    }
  });
}

async function initCourseChart(students: any[]): Promise<void> {
  const canvas = document.getElementById('courseChart') as HTMLCanvasElement;
  if (!canvas) return;

  if (courseChart) courseChart.destroy();

  const courseCounts = ALL_COURSES.map(course => 
    students.filter((s: any) => s.course === course.code).length
  );

  const nonZeroCourses = ALL_COURSES.filter((_, i) => courseCounts[i] > 0);
  const nonZeroCounts = courseCounts.filter(count => count > 0);
  const nonZeroColors = nonZeroCourses.map((_, i) => courseColors[i % courseColors.length]);
  const nonZeroLabels = nonZeroCourses.map(c => c.short);

  if (nonZeroCourses.length === 0) return;

  courseChart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: nonZeroLabels,
      datasets: [{
        data: nonZeroCounts,
        backgroundColor: nonZeroColors,
        borderWidth: 0,
        hoverOffset: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '60%',
      plugins: {
        legend: { position: 'right', labels: { font: { size: 10 }, boxWidth: 10, padding: 8 } },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const label = nonZeroCourses[context.dataIndex].name;
              const value = context.raw;
              const total = nonZeroCounts.reduce((a, b) => a + b, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  });

  const courseLegend = document.getElementById('courseLegend');
  if (courseLegend) {
    const total = nonZeroCounts.reduce((a, b) => a + b, 0);
    courseLegend.innerHTML = nonZeroCourses.map((course, i) => {
      const count = nonZeroCounts[i];
      const percentage = Math.round((count / total) * 100);
      return `<div class="leg-item"><div class="leg-dot" style="background:${nonZeroColors[i]}"></div><span class="leg-label">${course.short}</span><span class="leg-count">(${count} | ${percentage}%)</span></div>`;
    }).join('');
  }
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
    data: {
      labels: ['Completed', 'Pending', 'Not Completed', 'Cont. Training'],
      datasets: [{
        data: [completed, pending, notCompleted, continuous],
        backgroundColor: [colors.green, colors.amber, colors.rose, colors.blue],
        borderWidth: 0,
        hoverOffset: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '65%',
      plugins: { legend: { display: false } }
    }
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

  const yearCounts = ['YEAR 1', 'YEAR 2', 'YEAR 3', 'YEAR 4'].map(y => 
    students.filter((s: any) => s.year_level === y).length
  );

  yearChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
      datasets: [{
        data: yearCounts,
        backgroundColor: colors.green,
        borderRadius: 8,
        barPercentage: 0.6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { stepSize: 1, precision: 0, font: { size: 10 } } } }
    }
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
    data: {
      labels: ['OJT-HK', 'Continuing', 'Not Continuing', 'Graduate'],
      datasets: [{
        data: [ojt, cont, notCont, graduate],
        backgroundColor: [colors.amber, colors.green, colors.rose, colors.blue],
        borderRadius: 8,
        barPercentage: 0.6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { stepSize: 1, precision: 0, font: { size: 10 } } } }
    }
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
    data: {
      labels: ['Regular', 'Advance', 'No Longer', 'No GC'],
      datasets: [{
        data: [regular, advance, noLonger, noGc],
        backgroundColor: [colors.green, colors.blue, colors.rose, colors.amber],
        borderRadius: 8,
        barPercentage: 0.7
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { stepSize: 1, precision: 0, font: { size: 10 } } } }
    }
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
    data: {
      labels: ['Freshmen', 'Upperclassmen', 'Transferee', 'Returning'],
      datasets: [{
        data: [freshman, upper, transferee, returning],
        backgroundColor: [colors.green, colors.teal, colors.amber, colors.purple],
        borderRadius: 8,
        barPercentage: 0.7
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { stepSize: 1, precision: 0, font: { size: 10 } } } }
    }
  });
}

async function initHkCourseChart(hkStudents: any[]): Promise<void> {
  const canvas = document.getElementById('hkCourseChart') as HTMLCanvasElement;
  if (!canvas) return;

  if (hkCourseChart) hkCourseChart.destroy();

  const hkCourseCounts = ALL_COURSES.map(course => 
    hkStudents.filter((s: any) => s.course === course.code).length
  );
  
  const nonZeroCourses = ALL_COURSES.filter((_, i) => hkCourseCounts[i] > 0);
  const nonZeroCounts = hkCourseCounts.filter(count => count > 0);
  const nonZeroColors = nonZeroCourses.map((_, i) => courseColors[i % courseColors.length]);
  const nonZeroLabels = nonZeroCourses.map(c => c.short);

  if (nonZeroCourses.length > 0) {
    hkCourseChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: nonZeroLabels,
        datasets: [{
          data: nonZeroCounts,
          backgroundColor: nonZeroColors,
          borderWidth: 0,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '60%',
        plugins: { legend: { position: 'bottom', labels: { font: { size: 9 }, boxWidth: 8 } } }
      }
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
    data: {
      labels: ['Regular Duty', 'Advance Duties'],
      datasets: [{
        data: [hkRegular, hkAdvance],
        backgroundColor: [colors.green, colors.blue],
        borderWidth: 0,
        hoverOffset: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '60%',
      plugins: { legend: { position: 'bottom', labels: { font: { size: 9 }, boxWidth: 8 } } }
    }
  });
}

async function initCharts(): Promise<void> {
  console.log('📊 Initializing charts...');
  
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
  const notCompleted = students.filter((s: any) => s.remarks === 'NOT COMPLETED').length;
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
  if (notCompletedSpan) notCompletedSpan.textContent = notCompleted.toString();
  if (hkSpan) hkSpan.textContent = hkStudents.length.toString();
  if (liveBadge) liveBadge.textContent = `${total} Students`;
}

// ============================================
// INIT PERFORMANCE OPTIMIZATIONS
// ============================================

function initPerformanceOptimizations(): void {
  // Debounce search input
  const searchInput = document.getElementById('searchInput') as HTMLInputElement;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      debouncedSearch((e.target as HTMLInputElement).value);
    });
  }
  
  // Initialize pagination container
  const panelFoot = document.querySelector('.panel-foot');
  if (panelFoot && !document.getElementById('paginationControls')) {
    const container = document.createElement('div');
    container.id = 'paginationControls';
    container.className = 'pagination-controls';
    panelFoot.appendChild(container);
  }
}

// ============================================
// CLICKABLE ROW HANDLER - FIX FOR EDIT MODAL
// ============================================

function setupClickableRowHandler(): void {
  // Use event delegation for dynamically created rows
  document.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;
    
    // Check if click is on edit button - prevent row click
    const editBtn = target.closest('.edit-btn');
    if (editBtn) {
      e.stopPropagation();
      const id = editBtn.getAttribute('data-id');
      if (id && studentController) {
        await studentController.openEditModalWithId(id);
      }
      return;
    }
    
    // Check if click is on delete button - handled separately
    const deleteBtn = target.closest('.delete-btn');
    if (deleteBtn) {
      // Let the delete handler in studentController handle it
      return;
    }
    
    // Handle row click (clickable-row)
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
// DASHBOARD INITIALIZATION
// ============================================

function initAdminDashboard(): void {
  console.log('🚀 Initializing Admin Dashboard...');
  
  if (!document.querySelector('.nav-item[data-page]')) {
    setTimeout(initAdminDashboard, 50);
    return;
  }
  
  updateAdminDisplay();
  initMobileSidebar();
  initLogoutHandler();
  initExcelImport();
  initDeleteAllButton();
  initPerformanceOptimizations();
  
  studentController = new AdminStudentController();
  const uiController = new AdminUIController();
  
  // Setup clickable row handler for edit functionality
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
  
  function switchPage(page: string): void {
    const titles: Record<string, { title: string; subtitle: string; pageId: string }> = {
      dashboard: { title: 'Dashboard', subtitle: 'Overview', pageId: 'dashboardPage' },
      completion: { title: 'Completion', subtitle: 'Online Support tracker', pageId: 'completionPage' },
      hkdatabase: { title: 'HK Database', subtitle: 'Endorsed students', pageId: 'hkDatabasePage' },
      analytics: { title: 'Analytics', subtitle: 'Data analysis', pageId: 'analyticsPage' }
    };
    
    const config = titles[page];
    if (config) {
      uiController.showPage(config.pageId);
      uiController.updatePageTitle(config.title, config.subtitle);
      uiController.setActiveNav(page);
      
      if (page === 'completion') {
        const searchVal = (document.getElementById('searchInput') as HTMLInputElement)?.value || '';
        renderCompletionTableOptimized(searchVal, 1);
      } else if (page === 'hkdatabase') {
        studentController?.renderHKTable();
      } else if (page === 'dashboard') {
        studentController?.renderRecentTable();
        studentController?.updateStatsDisplay();
        initCharts();
        loadDashboardData();
      }
    }
  }
  
  const navItems = document.querySelectorAll('.nav-item[data-page]');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.getAttribute('data-page');
      if (page) switchPage(page);
    });
  });
  
  uiController.setupEventListeners(studentController!, switchPage);
  
  // Initial render for completion and HK tables
  renderCompletionTableOptimized('', 1);
  studentController?.renderHKTable();
  
  // Load dashboard data when page becomes visible
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
  
  // Also load immediately if dashboard is the active page
  if (document.querySelector('.nav-item.active')?.getAttribute('data-page') === 'dashboard') {
    loadDashboardData();
  }
}
// admin.main.ts - ADD THIS FUNCTION

// ============================================
// THEME MANAGEMENT - ADD THIS
// ============================================

function initTheme(): void {
  // Check for saved theme preference
  const savedTheme = localStorage.getItem('theme');
  
  // Check system preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Apply theme
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.classList.add('dark'); // Add class for compatibility
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.classList.remove('dark');
  }
  
  // Setup theme toggle button
  const themeBtn = document.getElementById('themeBtn');
  if (themeBtn) {
    // Remove existing listeners to prevent duplicates
    const newThemeBtn = themeBtn.cloneNode(true) as HTMLElement;
    themeBtn.parentNode?.replaceChild(newThemeBtn, themeBtn);
    
    newThemeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleTheme();
    });
  }
}

function toggleTheme(): void {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  
  if (currentTheme === 'dark') {
    // Switch to light mode
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.classList.remove('dark');
    localStorage.setItem('theme', 'light');
    showToast('info', 'Light Mode', 'Switched to light theme');
  } else {
    // Switch to dark mode
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.classList.add('dark');
    localStorage.setItem('theme', 'dark');
    showToast('info', 'Dark Mode', 'Switched to dark theme');
  }
  
  // Optional: Refresh charts to match new theme colors
  setTimeout(() => {
    initCharts();
  }, 100);
}

// Call initTheme() in startApp() after initSecurity()

// ============================================
// START APPLICATION
// ============================================

async function startApp(): Promise<void> {
  console.log('🚀 Starting application...');
  showLoadingScreen();
  checkAppVersion();
  
  const isValid = await validateSession();
  if (!isValid) {
    window.location.href = '/admin-login.html?t=' + Date.now();
    return;
  }
  
  hideLoadingScreen();
  initSecurity();
  initAdminDashboard();
}

startApp();