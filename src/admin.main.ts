// admin.main.ts

import { supabase } from './services/supabase.service';
import { AdminStudentController } from './controllers/admin.student.controller';
import { AdminUIController } from './controllers/admin.ui.controller';
import { StudentService } from './services/supabase.service';

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

// All 15 Courses with display names
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
  { code: 'BSBA', name: 'BS Business Administration', short: 'Bus Admin' },
  { code: 'BSHM', name: 'BS Hospitality Management', short: 'HM' },
  { code: 'BSTM', name: 'BS Tourism Management', short: 'Tourism' },
  { code: 'BSCRIM', name: 'BS Criminology', short: 'Crim' },
  { code: 'BEED', name: 'Bachelor of Elementary Education', short: 'BEEd' },
  { code: 'BSED', name: 'Bachelor of Secondary Education', short: 'BSEd' }
];

// Color palette for 15 courses
const courseColors = [
  '#10b981', '#3b82f6', '#fbbf24', '#f43f5e', '#8b5cf6',
  '#14b8a6', '#f97316', '#ec4899', '#06b6d4', '#84cc16',
  '#a855f7', '#eab308', '#ef4444', '#6b7280', '#94a3b8'
];

// Valid admin usernames for credentials login
const VALID_ADMIN_USERNAMES = ['AdminAnthony', 'AdminRonan', 'AdminJay', 'AdminLeimark', 'AdminAllain'];

// ============================================
// ADMIN DISPLAY NAME
// ============================================

function getAdminName(): string {
  const loginMethod = localStorage.getItem('login_method');
  const adminName = localStorage.getItem('admin_name');
  const adminEmail = localStorage.getItem('admin_email');
  
  // Credentials login (Username/Password)
  if (loginMethod === 'credentials' && adminName) {
    return adminName;
  }
  
  // Magic link login
  if (loginMethod === 'magiclink' && adminEmail) {
    const emailName = adminEmail.split('@')[0];
    return emailName.charAt(0).toUpperCase() + emailName.slice(1);
  }
  
  return 'Admin User';
}

function getAdminInitials(): string {
  const name = getAdminName();
  return name.charAt(0).toUpperCase();
}

function updateAdminDisplay(): void {
  const nameSpan = document.getElementById('adminNameDisplay');
  const initialsSpan = document.getElementById('adminInitials');
  const userName = getAdminName();
  const userInitials = getAdminInitials();
  
  if (nameSpan) {
    nameSpan.textContent = userName;
  }
  
  if (initialsSpan) {
    initialsSpan.textContent = userInitials;
  }
}

// ============================================
// AUTHENTICATION HELPER FUNCTIONS
// ============================================

function clearAuthData(): void {
  localStorage.removeItem('admin_logged_in');
  localStorage.removeItem('admin_user');
  localStorage.removeItem('admin_email');
  localStorage.removeItem('admin_user_id');
  localStorage.removeItem('admin_login_time');
  localStorage.removeItem('login_method');
  localStorage.removeItem('admin_name');
  localStorage.removeItem('admin_username');
}

function redirectToLogin(): void {
  if (!window.location.pathname.includes('admin-login.html') && 
      !window.location.pathname.includes('admin-callback.html')) {
    window.location.replace('/admin-login.html');
  }
}

// ============================================
// AUTHENTICATION CHECK WITH SECURITY
// ============================================

async function checkAdminAuth(): Promise<boolean> {
  const loginMethod = localStorage.getItem('login_method');
  const isLoggedIn = localStorage.getItem('admin_logged_in') === 'true';
  const loginTime = localStorage.getItem('admin_login_time');
  const adminUsername = localStorage.getItem('admin_username');
  
  // Check session expiry (8 hours)
  if (loginTime) {
    const elapsed = Date.now() - parseInt(loginTime);
    const eightHours = 8 * 60 * 60 * 1000;
    if (elapsed > eightHours) {
      console.log('⏰ Session expired');
      clearAuthData();
      redirectToLogin();
      return false;
    }
  }
  
  // Credentials login - validate stored data
  if (loginMethod === 'credentials' && isLoggedIn && adminUsername) {
    // Verify the username is still valid
    if (VALID_ADMIN_USERNAMES.includes(adminUsername)) {
      console.log(`✅ Credentials login verified: ${adminUsername}`);
      // Refresh login time
      localStorage.setItem('admin_login_time', Date.now().toString());
      return true;
    } else {
      console.log('❌ Invalid credentials stored');
      clearAuthData();
      redirectToLogin();
      return false;
    }
  }
  
  // Magic link login - check Supabase session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!isLoggedIn || !session) {
    clearAuthData();
    redirectToLogin();
    return false;
  }
  
  // Refresh login time for magic link
  localStorage.setItem('admin_login_time', Date.now().toString());
  return true;
}

// ============================================
// SECURITY MEASURES
// ============================================

function initSecurity(): void {
  // Disable right click
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  
  // Disable keyboard shortcuts
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
        (ctrl && key === 's')) {
      e.preventDefault();
      return false;
    }
  });
  
  // Disable drag and drop
  window.addEventListener('dragstart', (e) => e.preventDefault());
  
  // Disable text selection on non-input elements
  document.addEventListener('selectstart', (e) => {
    if (!(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
      e.preventDefault();
    }
  });
  
  console.log('✅ Security initialized');
}

// ============================================
// MONTHLY TREND CHART
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

// ============================================
// COURSE CHART
// ============================================

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

// ============================================
// STATUS CHART
// ============================================

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

// ============================================
// YEAR CHART
// ============================================

async function initYearChart(students: any[]): Promise<void> {
  const canvas = document.getElementById('yearChart') as HTMLCanvasElement;
  if (!canvas) return;

  if (yearChart) yearChart.destroy();

  const years = ['YEAR 1', 'YEAR 2', 'YEAR 3', 'YEAR 4'];
  const yearCounts = years.map(y => students.filter((s: any) => s.year_level === y).length);

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

// ============================================
// ENDORSEMENT CHART
// ============================================

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

// ============================================
// DUTY CHART
// ============================================

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

// ============================================
// SUPPORT CHART
// ============================================

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

// ============================================
// HK COURSE CHART
// ============================================

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

// ============================================
// HK DUTY CHART
// ============================================

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

// ============================================
// CHART INITIALIZATION
// ============================================

async function initCharts(): Promise<void> {
  console.log('📊 Initializing charts...');
  
  const students = await StudentService.getAllStudents();
  const hkStudents = await StudentService.getHKStudents();
  
  console.log(`📊 Found ${students.length} students, ${hkStudents.length} HK students`);
  
  await initStatusChart(students);
  await initCourseChart(students);
  await initYearChart(students);
  await initEndorseChart(students);
  await initDutyChart(students);
  await initSupportChart(students);
  await initHkCourseChart(hkStudents);
  await initHkDutyChart(hkStudents);
  await initMonthlyTrendChart();
  
  // Update UI elements
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
  
  // Update percentages and bars
  const completedPct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const pendingPct = total > 0 ? Math.round((pending / total) * 100) : 0;
  const notCompletedPct = total > 0 ? Math.round((notCompleted / total) * 100) : 0;
  const hkPct = total > 0 ? Math.round((hkStudents.length / total) * 100) : 0;
  
  const completedPctEl = document.getElementById('d1');
  const pendingPctEl = document.getElementById('d2');
  const notCompletedPctEl = document.getElementById('d3');
  const completedBar = document.getElementById('sb1');
  const pendingBar = document.getElementById('sb2');
  const notCompletedBar = document.getElementById('sb3');
  const hkBar = document.getElementById('sb4');
  
  if (completedPctEl) completedPctEl.innerHTML = `${completedPct}% <span class="trend-arrow up">↑</span>`;
  if (pendingPctEl) pendingPctEl.textContent = `${pendingPct}%`;
  if (notCompletedPctEl) notCompletedPctEl.innerHTML = `${notCompletedPct}% <span class="trend-arrow down">↓</span>`;
  if (completedBar) completedBar.style.width = `${completedPct}%`;
  if (pendingBar) pendingBar.style.width = `${pendingPct}%`;
  if (notCompletedBar) notCompletedBar.style.width = `${notCompletedPct}%`;
  if (hkBar) hkBar.style.width = `${hkPct}%`;
  
  console.log('✅ Charts initialized successfully');
}

// ============================================
// DASHBOARD INITIALIZATION
// ============================================

function initAdminDashboard(): void {
  console.log('🚀 Initializing Admin Dashboard...');
  
  // Update admin name display FIRST
  updateAdminDisplay();
  
  const studentController = new AdminStudentController();
  const uiController = new AdminUIController();
  
  function switchPage(page: string): void {
    const titles: Record<string, { title: string; subtitle: string; pageId: string }> = {
      dashboard: { title: 'Dashboard', subtitle: 'Overview of student support completion', pageId: 'dashboardPage' },
      completion: { title: 'Completion', subtitle: 'Online Support tracker — SY 26-27', pageId: 'completionPage' },
      hkdatabase: { title: 'HK Database', subtitle: 'Endorsed students for HK duty', pageId: 'hkDatabasePage' },
      analytics: { title: 'Analytics', subtitle: 'Advanced data analysis & reports', pageId: 'analyticsPage' }
    };
    
    const config = titles[page];
    if (config) {
      uiController.showPage(config.pageId);
      uiController.updatePageTitle(config.title, config.subtitle);
      uiController.setActiveNav(page);
      
      if (page === 'completion') {
        studentController.renderCompletionTable();
      } else if (page === 'hkdatabase') {
        studentController.renderHKTable();
      } else if (page === 'dashboard') {
        studentController.renderRecentTable();
        studentController.updateStatsDisplay();
        initCharts();
      }
    }
  }
  
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.getAttribute('data-page');
      if (page) switchPage(page);
    });
  });
  
  uiController.setupEventListeners(studentController, switchPage);
  
  studentController.renderCompletionTable();
  studentController.renderHKTable();
  studentController.renderRecentTable();
  initCharts();
  
  console.log('✅ Admin Dashboard initialized');
}

// ============================================
// START APPLICATION
// ============================================

async function startApp(): Promise<void> {
  console.log('🔐 Checking authentication...');
  
  const loginMethod = localStorage.getItem('login_method');
  const isLoggedIn = localStorage.getItem('admin_logged_in') === 'true';
  
  // Credentials login - bypass Supabase but with security
  if (loginMethod === 'credentials' && isLoggedIn) {
    console.log('✅ Credentials login detected, validating session...');
    const isValid = await checkAdminAuth();
    if (isValid) {
      console.log('✅ Session valid, starting dashboard...');
      initSecurity();
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAdminDashboard);
      } else {
        initAdminDashboard();
      }
    }
    return;
  }
  
  // Magic link login - check Supabase
  const isAuth = await checkAdminAuth();
  
  if (isAuth) {
    console.log('✅ Authenticated, starting dashboard...');
    initSecurity();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initAdminDashboard);
    } else {
      initAdminDashboard();
    }
  } else {
    console.log('❌ Not authenticated, redirecting to login...');
  }
}

startApp();