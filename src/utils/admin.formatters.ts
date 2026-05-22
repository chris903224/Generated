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
  // Update stat numbers
  const s0 = document.getElementById('s0');
  const s1 = document.getElementById('s1');
  const s2 = document.getElementById('s2');
  const s3 = document.getElementById('s3');
  const s4 = document.getElementById('s4');
  
  if (s0) s0.textContent = total.toString();
  if (s1) s1.textContent = completed.toString();
  if (s2) s2.textContent = pending.toString();
  if (s3) {
    const notCompleted = total - completed - pending;
    s3.textContent = notCompleted.toString();
  }
  if (s4) s4.textContent = hk.toString();
  
  // Update percentages
  const compPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const pendPercent = total > 0 ? Math.round((pending / total) * 100) : 0;
  const notPercent = total > 0 ? Math.round(((total - completed - pending) / total) * 100) : 0;
  
  const d1 = document.getElementById('d1');
  const d2 = document.getElementById('d2');
  const d3 = document.getElementById('d3');
  
  if (d1) d1.textContent = `${compPercent}%`;
  if (d2) d2.textContent = `${pendPercent}%`;
  if (d3) d3.textContent = `${notPercent}%`;
  
  // Update progress bars
  const sb1 = document.getElementById('sb1');
  const sb2 = document.getElementById('sb2');
  const sb3 = document.getElementById('sb3');
  const sb4 = document.getElementById('sb4');
  
  if (sb1) sb1.style.width = `${compPercent}%`;
  if (sb2) sb2.style.width = `${pendPercent}%`;
  if (sb3) sb3.style.width = `${notPercent}%`;
  if (sb4 && total > 0) sb4.style.width = `${(hk / total) * 100}%`;
  
  // Update live badge
  const liveBadge = document.getElementById('liveBadgeText');
  if (liveBadge) liveBadge.textContent = `${total} Students`;
  
  // Update completion percentage chip
  const compPct = document.getElementById('compPct');
  if (compPct) compPct.textContent = `${compPercent}% Done`;
  
  // Update donut center
  const donutNum = document.getElementById('donutNum');
  if (donutNum) donutNum.textContent = total.toString();
}

// ============================================
// TABLE ROW GENERATORS
// ============================================

export function generateCompletionRow(student: any): string {
  return `
    <tr data-id="${student.id}">
      <td><code class="student-id">${escapeHtml(student.control_number || student.phinmaId || student.id)}</code></td>
      <td><strong>${escapeHtml(student.full_name || student.name)}</strong></td>
      <td>${escapeHtml(student.course)}</td>
      <td>${escapeHtml(formatYearLevel(student.year_level || student.year))}</td>
      <td class="support-text">${escapeHtml(student.support_type || student.supportType)}</td>
      <td>${getRemarksBadge(student.remarks)}</td>
      <td>${getEndorsementTag(student.endorsement)}</td>
      <td>${escapeHtml(student.data_sheet || student.dataSheet)}</td>
      <td>${getDutiesTag(student.duties)}</td>
    </tr>
  `;
}

export function generateHKRow(student: any): string {
  return `
    <tr data-id="${student.id}">
      <td><code class="student-id">${escapeHtml(student.control_number || student.phinmaId || student.id)}</code></td>
      <td><strong>${escapeHtml(student.full_name || student.name)}</strong></td>
      <td>${escapeHtml(student.course)}</td>
      <td>${escapeHtml(formatYearLevel(student.year_level || student.year))}</td>
      <td>${getEndorsementTag(student.endorsement)}</td>
      <td>${getDutiesTag(student.duties)}</td>
      <td><button class="act-btn edit-btn" data-id="${student.id}">Edit</button></td>
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
// GENERATE UNIQUE ID
// ============================================

export function generateUniqueId(prefix: string = 'STU'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}`;
}

export function generateControlNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CN-${year}-${random}`;
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