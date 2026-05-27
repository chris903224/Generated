// utils/admin.formatters.ts - FULL VERSION (NO CN- PREFIX)

// ============================================
// HTML ESCAPE
// ============================================

export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ============================================
// BADGE GENERATORS
// ============================================

export function getRemarksBadge(remarks: string): string {
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

export function getEndorsementTag(endorsement: string): string {
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

export function getDutiesTag(duties: string): string {
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
// YEAR LEVEL FORMATTER
// ============================================

export function formatYearLevel(year: string): string {
  const yearMap: Record<string, string> = {
    'YEAR 1': '1st Year',
    'YEAR 2': '2nd Year',
    'YEAR 3': '3rd Year',
    'YEAR 4': '4th Year',
    '1st Year': 'YEAR 1',
    '2nd Year': 'YEAR 2',
    '3rd Year': 'YEAR 3',
    '4th Year': 'YEAR 4'
  };
  return yearMap[year] || year;
}

export function getYearLevelForSelect(year: string): string {
  const yearMap: Record<string, string> = {
    'YEAR 1': 'YEAR 1',
    'YEAR 2': 'YEAR 2',
    'YEAR 3': 'YEAR 3',
    'YEAR 4': 'YEAR 4',
    '1st Year': 'YEAR 1',
    '2nd Year': 'YEAR 2',
    '3rd Year': 'YEAR 3',
    '4th Year': 'YEAR 4'
  };
  return yearMap[year] || 'YEAR 1';
}

// ============================================
// STATS UPDATE
// ============================================

export function updateStats(
  total: number, 
  completed: number, 
  pending: number, 
  hk: number
): void {
  const notCompleted = total - completed - pending;
  
  const totalEl = document.getElementById('totalStudents');
  const completedEl = document.getElementById('completedCount');
  const pendingEl = document.getElementById('pendingCount');
  const notCompletedEl = document.getElementById('notCompletedCount');
  const hkEl = document.getElementById('hkEndorsedCount');
  
  if (totalEl) totalEl.textContent = total.toString();
  if (completedEl) completedEl.textContent = completed.toString();
  if (pendingEl) pendingEl.textContent = pending.toString();
  if (notCompletedEl) notCompletedEl.textContent = notCompleted.toString();
  if (hkEl) hkEl.textContent = hk.toString();
  
  const completedPct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const pendingPct = total > 0 ? Math.round((pending / total) * 100) : 0;
  const notCompletedPct = total > 0 ? Math.round((notCompleted / total) * 100) : 0;
  const hkPct = total > 0 ? Math.round((hk / total) * 100) : 0;
  
  const completedPctEl = document.getElementById('completedPct');
  const pendingPctEl = document.getElementById('pendingPct');
  const notCompletedPctEl = document.getElementById('notCompletedPct');
  
  if (completedPctEl) completedPctEl.innerHTML = `${completedPct}% <span class="trend-arrow up">↑</span>`;
  if (pendingPctEl) pendingPctEl.textContent = `${pendingPct}%`;
  if (notCompletedPctEl) notCompletedPctEl.innerHTML = `${notCompletedPct}% <span class="trend-arrow down">↓</span>`;
  
  const completedBar = document.getElementById('completedBar');
  const pendingBar = document.getElementById('pendingBar');
  const notCompletedBar = document.getElementById('notCompletedBar');
  const hkBar = document.getElementById('hkBar');
  
  if (completedBar) completedBar.style.width = `${completedPct}%`;
  if (pendingBar) pendingBar.style.width = `${pendingPct}%`;
  if (notCompletedBar) notCompletedBar.style.width = `${notCompletedPct}%`;
  if (hkBar && total > 0) hkBar.style.width = `${hkPct}%`;
  
  const liveBadge = document.getElementById('liveBadgeText');
  if (liveBadge) liveBadge.textContent = `${total} Students`;
  
  const compPct = document.getElementById('compPct');
  if (compPct) compPct.textContent = `${completedPct}% Done`;
  
  const donutNum = document.getElementById('donutNum');
  if (donutNum) donutNum.textContent = total.toString();
  
  const hkTot = document.getElementById('hkTot');
  const hkOjt = document.getElementById('hkOjt');
  if (hkTot) hkTot.textContent = hk.toString();
  if (hkOjt) hkOjt.textContent = hk.toString();
}

// ============================================
// TABLE ROW GENERATORS
// ============================================

export function generateCompletionRow(student: any): string {
  return `
    <tr data-id="${student.id}">
      <td><code class="student-id">${escapeHtml(student.student_id || student.control_number || student.id)}</code></td>
      <td><code class="student-id">${escapeHtml(student.control_number || student.phinmaId || student.id)}</code></td>
      <td><strong>${escapeHtml(student.full_name || student.name)}</strong></td>
      <td>${escapeHtml(student.course)}</td>
      <td>${escapeHtml(formatYearLevel(student.year_level || student.year))}</td>
      <td class="support-text">${escapeHtml(student.support_type || student.supportType)}</td>
      <td>${getRemarksBadge(student.remarks)}</td>
      <td>${getEndorsementTag(student.endorsement)}</td>
      <td>${escapeHtml(student.data_sheet || student.dataSheet)}</td>
      <td>${getDutiesTag(student.duties)}</td>
      <td><span class="hours-badge">${escapeHtml(student.hours || '0 hrs')}</span></td>
      <td>
        <button class="action-btn edit-btn" data-id="${student.id}" title="Edit">✏️ Edit</button>
        <button class="action-btn delete-btn" data-id="${student.id}" data-name="${escapeHtml(student.full_name || student.name)}" title="Delete">🗑️ Delete</button>
       </td>
    </tr>
  `;
}

export function generateHKRow(student: any): string {
  return `
    <tr data-id="${student.id}">
      <td><code>${escapeHtml(student.student_id || student.control_number)}</code></td>
      <td><code>${escapeHtml(student.control_number)}</code></td>
      <td><strong>${escapeHtml(student.full_name)}</strong></td>
      <td>${escapeHtml(student.course)}</td>
      <td>${escapeHtml(formatYearLevel(student.year_level))}</td>
      <td>${getEndorsementTag(student.endorsement)}</td>
      <td>${getDutiesTag(student.duties)}</td>
      <td><span class="hours-badge">${escapeHtml(student.hours || '0 hrs')}</span></td>
      <td>
        <button class="action-btn edit-btn" data-id="${student.id}">✏️ Edit</button>
        <button class="action-btn delete-btn" data-id="${student.id}" data-name="${escapeHtml(student.full_name)}">🗑️ Delete</button>
       </td>
    </tr>
  `;
}

export function generateRecentRow(student: any): string {
  return `
    <tr>
      <td><strong>${escapeHtml(student.full_name || student.name)}</strong></td>
      <td>${escapeHtml(student.course)}</td>
      <td>${escapeHtml(formatYearLevel(student.year_level || student.year))}</td>
      <td>${getRemarksBadge(student.remarks)}</td>
      <td>${getDutiesTag(student.duties)}</td>
      <td>${getEndorsementTag(student.endorsement)}</td>
      <td><span class="hours-badge">${escapeHtml(student.hours || '0 hrs')}</span></td>
    </tr>
  `;
}

// ============================================
// FORM VALIDATORS
// ============================================

export function validateStudentForm(formData: {
  name: string;
  course: string;
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  
  if (!formData.name || !formData.name.trim()) {
    errors.name = 'Student name is required';
  }
  
  if (formData.name && formData.name.length > 100) {
    errors.name = 'Name is too long (max 100 characters)';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// ============================================
// GENERATE UNIQUE ID & CONTROL NUMBER (NO CN- PREFIX)
// ============================================

export function generateUniqueId(prefix: string = 'STU'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}`;
}

// FIXED: No CN- prefix, number only
export function generateControlNumber(): string {
  const random = Math.floor(Math.random() * 900000) + 100000;
  return random.toString(); // Returns 6-digit number only, e.g., "883101"
}

// ============================================
// DATE FORMATTERS
// ============================================

export function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ============================================
// TRUNCATE TEXT
// ============================================

export function truncateText(text: string, maxLength: number = 50): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// ============================================
// EXPORT DEFAULT
// ============================================

export default {
  escapeHtml,
  getRemarksBadge,
  getEndorsementTag,
  getDutiesTag,
  formatYearLevel,
  getYearLevelForSelect,
  updateStats,
  generateCompletionRow,
  generateHKRow,
  generateRecentRow,
  validateStudentForm,
  generateUniqueId,
  generateControlNumber,
  formatDate,
  truncateText
};