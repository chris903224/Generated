// controllers/admin.student.controller.ts - FULL CORRECTED VERSION

import { StudentService } from '../services/supabase.service';
import { 
  escapeHtml, 
  getRemarksBadge, 
  getEndorsementTag, 
  getDutiesTag, 
  updateStats 
} from '../utils/admin.formatters';
import type { Student } from '../services/supabase.service';

export class AdminStudentController {
  private currentEditId: string | null = null;

  constructor() {
    this.setupEventListeners();
  }

  // ============================================
  // RENDER METHODS WITH ROW NUMBERING
  // ============================================

  async renderCompletionTable(searchTerm: string = ''): Promise<void> {
    const students = await StudentService.searchStudents(searchTerm);
    const tbody = document.getElementById('completionTbody');
    const rowCount = document.getElementById('rowCount');
    
    if (!tbody) return;
    if (rowCount) rowCount.textContent = `${students.length} entries`;
    
    if (students.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="13" style="text-align:center; padding:60px 20px;">
          <div style="font-size: 48px; margin-bottom: 16px;">📋</div>
          <h3>No Students Yet</h3>
          <p>Click "Add Student" to get started</p>
        </td>
      </tr>
      `;
      await this.updateStatsDisplay();
      return;
    }
    
    let html = '';
    let counter = 1;
    
    for (const student of students) {
      html += `
        <tr data-id="${student.id}" class="clickable-row" style="cursor:pointer;">
          <td style="text-align:center; font-weight:600; color:var(--accent);">${counter}</td>
          <td><code>${escapeHtml(student.student_id)}</code></td>
          <td><code>${escapeHtml(student.control_number)}</code></td>
          <td><strong>${escapeHtml(student.full_name)}</strong></td>
          <td>${escapeHtml(student.course)}</td>
          <td>${escapeHtml(student.year_level)}</td>
          <td>${escapeHtml(student.support_type)}</td>
          <td>${getRemarksBadge(student.remarks)}</td>
          <td>${getEndorsementTag(student.endorsement)}</td>
          <td>${escapeHtml(student.data_sheet)}</td>
          <td>${getDutiesTag(student.duties)}</td>
          <td><span class="hours-badge">${escapeHtml(student.hours || '0 hrs')}</span></td>
          <td class="action-buttons">
            <button class="action-btn edit-btn" data-id="${student.id}" title="Edit">✏️ Edit</button>
            <button class="action-btn delete-btn" data-id="${student.id}" data-name="${escapeHtml(student.full_name)}" title="Delete">🗑️ Delete</button>
          </td>
        </tr>
      `;
      counter++;
    }
    tbody.innerHTML = html;
    await this.updateStatsDisplay();
  }

  async renderHKTable(searchTerm: string = ''): Promise<void> {
    const hkStudents = await StudentService.getHKStudents();
    const filtered = hkStudents.filter(s => 
      s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.student_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const tbody = document.getElementById('hkTbody');
    const rowCount = document.getElementById('hkRowCount');
    const hkTot = document.getElementById('hkTot');
    const hkOjt = document.getElementById('hkOjt');
    
    if (!tbody) return;
    if (rowCount) rowCount.textContent = `${filtered.length} entries`;
    if (hkTot) hkTot.textContent = hkStudents.length.toString();
    if (hkOjt) hkOjt.textContent = hkStudents.length.toString();
    
    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:40px;">No HK Endorsed Students</td></tr>`;
      return;
    }
    
    let html = '';
    let counter = 1;
    
    for (const student of filtered) {
      html += `
        <tr data-id="${student.id}" class="clickable-row" style="cursor:pointer;">
          <td style="text-align:center; font-weight:600; color:var(--accent);">${counter}</td>
          <td><code>${escapeHtml(student.student_id)}</code></td>
          <td><code>${escapeHtml(student.control_number)}</code></td>
          <td><strong>${escapeHtml(student.full_name)}</strong></td>
          <td>${escapeHtml(student.course)}</td>
          <td>${escapeHtml(student.year_level)}</td>
          <td>${getEndorsementTag(student.endorsement)}</td>
          <td>${getDutiesTag(student.duties)}</td>
          <td><span class="hours-badge">${escapeHtml(student.hours || '0 hrs')}</span></td>
          <td class="action-buttons">
            <button class="action-btn edit-btn" data-id="${student.id}">✏️ Edit</button>
            <button class="action-btn delete-btn" data-id="${student.id}" data-name="${escapeHtml(student.full_name)}">🗑️ Delete</button>
          </td>
        </tr>
      `;
      counter++;
    }
    tbody.innerHTML = html;
  }

  async renderRecentTable(): Promise<void> {
    const students = await StudentService.getAllStudents();
    const recent = students.slice(0, 10);
    const tbody = document.getElementById('recentTbody');
    
    if (!tbody) return;
    
    if (recent.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:40px;">No recent records</td></tr>`;
      return;
    }
    
    let html = '';
    let counter = 1;
    
    for (const student of recent) {
      html += `
        <tr data-id="${student.id}" class="clickable-row" style="cursor:pointer;">
          <td style="text-align:center; font-weight:600; color:var(--accent);">${counter}</td>
          <td><strong>${escapeHtml(student.full_name)}</strong></td>
          <td>${escapeHtml(student.course)}</td>
          <td>${escapeHtml(student.year_level)}</td>
          <td>${getRemarksBadge(student.remarks)}</td>
          <td>${getDutiesTag(student.duties)}</td>
          <td>${getEndorsementTag(student.endorsement)}</td>
          <td><span class="hours-badge">${escapeHtml(student.hours || '0 hrs')}</span></td>
        </tr>
      `;
      counter++;
    }
    tbody.innerHTML = html;
  }

  async updateStatsDisplay(): Promise<void> {
    const stats = await StudentService.getStats();
    updateStats(stats.total, stats.completed, stats.pending, stats.hk);
  }

  // ============================================
  // REFRESH ALL TABLES
  // ============================================

  async refreshAllTables(): Promise<void> {
    const searchInput = (document.getElementById('searchInput') as HTMLInputElement)?.value || '';
    const hkSearch = (document.getElementById('hkSearch') as HTMLInputElement)?.value || '';
    await this.renderCompletionTable(searchInput);
    await this.renderHKTable(hkSearch);
    await this.renderRecentTable();
    await this.updateStatsDisplay();
  }

  // ============================================
  // CONTROL NUMBER
  // ============================================

  async getNextControlNumber(): Promise<string> {
    const existingStudents = await StudentService.getAllStudents();
    let maxNumber = 0;
    
    for (const student of existingStudents) {
      let num = student.control_number;
      if (num && num.startsWith('CN-')) {
        num = num.replace('CN-', '');
      }
      const parsed = parseInt(num);
      if (!isNaN(parsed) && parsed > maxNumber) {
        maxNumber = parsed;
      }
    }
    
    const nextNum = (maxNumber + 1).toString().padStart(6, '0');
    return `CN-${nextNum}`;
  }

  async previewNextControlNumber(): Promise<void> {
    const nextNumber = await this.getNextControlNumber();
    const input = document.getElementById('eControlNumber') as HTMLInputElement;
    if (input) input.value = nextNumber;
  }

  // ============================================
  // DELETE STUDENT
  // ============================================

  async deleteStudent(id: string, name: string): Promise<void> {
    if (confirm(`Delete "${name}"? This cannot be undone.`)) {
      const success = await StudentService.deleteStudent(id);
      if (success) {
        await this.refreshAllTables();
        this.showToast(`${name} deleted.`, 'success');
      } else {
        this.showToast('Delete failed.', 'error');
      }
    }
  }

  // ============================================
  // TOAST NOTIFICATION - TOP RIGHT CORNER
  // ============================================

  showToast(message: string, type: 'success' | 'error'): void {
    // Remove any existing toasts first to prevent stacking
    const existingToasts = document.querySelectorAll('.student-toast');
    existingToasts.forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    toast.className = 'student-toast';
    
    // Set text and styles - TOP RIGHT CORNER
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.top = '20px';
    toast.style.right = '20px';
    toast.style.bottom = 'auto';
    toast.style.left = 'auto';
    toast.style.backgroundColor = type === 'success' ? '#10b981' : '#ef4444';
    toast.style.color = 'white';
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '8px';
    toast.style.zIndex = '99999';
    toast.style.fontSize = '14px';
    toast.style.fontWeight = '500';
    toast.style.fontFamily = "'DM Sans', system-ui, sans-serif";
    toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    toast.style.animation = 'toastSlideInRight 0.3s ease';
    
    document.body.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      toast.style.animation = 'toastSlideOutRight 0.3s ease';
      setTimeout(() => {
        if (toast.parentElement) toast.remove();
      }, 300);
    }, 3000);
  }

  // ============================================
  // MODAL METHODS
  // ============================================

  openAddModal(): void {
    this.currentEditId = null;
    this.clearModalForm();
    this.previewNextControlNumber();
    const modal = document.getElementById('editModal');
    const modalTitle = document.querySelector('#editModalTitle');
    if (modalTitle) modalTitle.innerHTML = `➕ Add New Student`;
    if (modal) modal.style.display = 'flex';
  }

  public async openEditModalWithId(id: string): Promise<void> {
    const student = await StudentService.getStudentById(id);
    if (!student) {
      this.showToast('Student not found', 'error');
      return;
    }
    
    this.currentEditId = id;
    
    const eStudentId = document.getElementById('eStudentId') as HTMLInputElement;
    const eFullName = document.getElementById('eFullName') as HTMLInputElement;
    const eCourse = document.getElementById('eCourse') as HTMLInputElement;
    const eYearLevel = document.getElementById('eYearLevel') as HTMLSelectElement;
    const eSection = document.getElementById('eSection') as HTMLInputElement;
    const eSupportType = document.getElementById('eSupportType') as HTMLSelectElement;
    const eRemarks = document.getElementById('eRemarks') as HTMLSelectElement;
    const eEndorsement = document.getElementById('eEndorsement') as HTMLSelectElement;
    const eDataSheet = document.getElementById('eDataSheet') as HTMLSelectElement;
    const eDuties = document.getElementById('eDuties') as HTMLSelectElement;
    const eHours = document.getElementById('eHours') as HTMLInputElement;
    const eControlNumber = document.getElementById('eControlNumber') as HTMLInputElement;
    
    if (eStudentId) eStudentId.value = student.student_id || '';
    if (eFullName) eFullName.value = student.full_name || '';
    if (eCourse) eCourse.value = student.course || '';
    if (eYearLevel) eYearLevel.value = student.year_level || 'YEAR 1';
    if (eSection) eSection.value = student.section || '';
    if (eSupportType) eSupportType.value = student.support_type || 'FRESHMEN OS';
    if (eRemarks) eRemarks.value = student.remarks || 'PENDING';
    if (eEndorsement) eEndorsement.value = student.endorsement || 'Endorsement for OJT - HK Duty';
    if (eDataSheet) eDataSheet.value = student.data_sheet || 'Encoded';
    if (eDuties) eDuties.value = student.duties || 'Regular Duty Assigned';
    if (eHours) eHours.value = student.hours || '0 hrs';
    if (eControlNumber) eControlNumber.value = student.control_number || '';
    
    const modalTitle = document.querySelector('#editModalTitle');
    if (modalTitle) modalTitle.innerHTML = `✏️ Edit Student Record`;
    const modal = document.getElementById('editModal');
    if (modal) modal.style.display = 'flex';
  }

  async saveStudent(): Promise<void> {
    const studentId = (document.getElementById('eStudentId') as HTMLInputElement)?.value.trim();
    const fullName = (document.getElementById('eFullName') as HTMLInputElement)?.value.trim();
    
    if (!studentId) { alert('Student ID required'); return; }
    if (!fullName) { alert('Student name required'); return; }
    
    const courseInput = document.getElementById('eCourse') as HTMLInputElement;
    const yearLevelSelect = document.getElementById('eYearLevel') as HTMLSelectElement;
    const sectionInput = document.getElementById('eSection') as HTMLInputElement;
    const supportTypeSelect = document.getElementById('eSupportType') as HTMLSelectElement;
    const remarksSelect = document.getElementById('eRemarks') as HTMLSelectElement;
    const endorsementSelect = document.getElementById('eEndorsement') as HTMLSelectElement;
    const dataSheetSelect = document.getElementById('eDataSheet') as HTMLSelectElement;
    const dutiesSelect = document.getElementById('eDuties') as HTMLSelectElement;
    const hoursInput = document.getElementById('eHours') as HTMLInputElement;
    
    let controlNumber = '';
    if (!this.currentEditId) {
      controlNumber = await this.getNextControlNumber();
    } else {
      const existing = document.getElementById('eControlNumber') as HTMLInputElement;
      controlNumber = existing?.value || '';
    }
    
    const formData = {
      student_id: studentId,
      control_number: controlNumber,
      full_name: fullName,
      course: courseInput?.value.trim() || 'BSIT',
      year_level: yearLevelSelect?.value || 'YEAR 1',
      section: sectionInput?.value || '',
      support_type: supportTypeSelect?.value || 'FRESHMEN OS',
      remarks: remarksSelect?.value || 'PENDING',
      endorsement: endorsementSelect?.value || 'Endorsement for OJT - HK Duty',
      data_sheet: dataSheetSelect?.value || 'Encoded',
      duties: dutiesSelect?.value || 'Regular Duty Assigned',
      hours: hoursInput?.value || '0 hrs',
      status: 'Active'
    };
    
    try {
      if (this.currentEditId) {
        await StudentService.updateStudent(this.currentEditId, formData);
        this.showToast(`${fullName} updated successfully!`, 'success');
      } else {
        await StudentService.addStudent(formData);
        this.showToast(`${fullName} added successfully!`, 'success');
      }
      
      this.closeModal();
      await this.refreshAllTables();
    } catch (error) {
      this.showToast('Operation failed. Please try again.', 'error');
    }
  }

  clearModalForm(): void {
    const eStudentId = document.getElementById('eStudentId') as HTMLInputElement;
    const eFullName = document.getElementById('eFullName') as HTMLInputElement;
    const eCourse = document.getElementById('eCourse') as HTMLInputElement;
    const eSection = document.getElementById('eSection') as HTMLInputElement;
    const eHours = document.getElementById('eHours') as HTMLInputElement;
    
    if (eStudentId) eStudentId.value = '';
    if (eFullName) eFullName.value = '';
    if (eCourse) eCourse.value = '';
    if (eSection) eSection.value = '';
    if (eHours) eHours.value = '';
    
    const eYearLevel = document.getElementById('eYearLevel') as HTMLSelectElement;
    const eSupportType = document.getElementById('eSupportType') as HTMLSelectElement;
    const eRemarks = document.getElementById('eRemarks') as HTMLSelectElement;
    const eEndorsement = document.getElementById('eEndorsement') as HTMLSelectElement;
    const eDataSheet = document.getElementById('eDataSheet') as HTMLSelectElement;
    const eDuties = document.getElementById('eDuties') as HTMLSelectElement;
    
    if (eYearLevel) eYearLevel.value = 'YEAR 1';
    if (eSupportType) eSupportType.value = 'FRESHMEN OS';
    if (eRemarks) eRemarks.value = 'PENDING';
    if (eEndorsement) eEndorsement.value = 'Endorsement for OJT - HK Duty';
    if (eDataSheet) eDataSheet.value = 'Encoded';
    if (eDuties) eDuties.value = 'Regular Duty Assigned';
  }

  closeModal(): void {
    const modal = document.getElementById('editModal');
    if (modal) {
      modal.style.display = 'none';
    }
    this.currentEditId = null;
    this.clearModalForm();
  }

  // ============================================
  // EVENT LISTENERS - SIMPLE DIRECT LISTENERS
  // ============================================

  setupEventListeners(): void {
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.renderCompletionTable((e.target as HTMLInputElement).value);
      });
    }
    
    const hkSearch = document.getElementById('hkSearch') as HTMLInputElement;
    if (hkSearch) {
      hkSearch.addEventListener('input', (e) => {
        this.renderHKTable((e.target as HTMLInputElement).value);
      });
    }
    
    // MODAL BUTTONS - DIRECT LISTENERS
    const saveBtn = document.getElementById('saveEdit');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveStudent());
    }
    
    const cancelBtn = document.getElementById('cancelEdit');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.closeModal());
    }
    
    const closeEditBtn = document.getElementById('closeEdit');
    if (closeEditBtn) {
      closeEditBtn.addEventListener('click', () => this.closeModal());
    }
    
    const addBtn = document.getElementById('addStudentBtn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.openAddModal());
    }
    
    const viewAllBtn = document.getElementById('viewAllBtn');
    if (viewAllBtn) {
      viewAllBtn.addEventListener('click', () => {
        const navItem = document.querySelector('.nav-item[data-page="completion"]') as HTMLElement;
        if (navItem) navItem.click();
      });
    }
    
    // MODAL BACKDROP CLICK
    const modal = document.getElementById('editModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal();
        }
      });
    }
    
    // FILTERS
    const filterRemarks = document.getElementById('filterRemarks') as HTMLSelectElement;
    if (filterRemarks) {
      filterRemarks.addEventListener('change', async () => {
        const searchVal = searchInput?.value || '';
        const remarks = filterRemarks.value;
        if (remarks) {
          const filtered = await StudentService.filterByRemarks(remarks);
          await this.renderFilteredTable(filtered, searchVal);
        } else {
          await this.renderCompletionTable(searchVal);
        }
      });
    }
    
    const filterCourse = document.getElementById('filterCourse') as HTMLSelectElement;
    if (filterCourse) {
      filterCourse.addEventListener('change', async () => {
        const searchVal = searchInput?.value || '';
        const course = filterCourse.value;
        if (course) {
          const filtered = await StudentService.filterByCourse(course);
          await this.renderFilteredTable(filtered, searchVal);
        } else {
          await this.renderCompletionTable(searchVal);
        }
      });
    }
    
    // DELETE BUTTON HANDLER (global click delegation)
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      
      const deleteBtn = target.closest('.delete-btn');
      if (deleteBtn) {
        const id = deleteBtn.getAttribute('data-id');
        const name = deleteBtn.getAttribute('data-name');
        if (id && name) {
          e.stopPropagation();
          this.deleteStudent(id, name);
        }
      }
    });
  }

  private async renderFilteredTable(students: Student[], searchTerm: string): Promise<void> {
    const tbody = document.getElementById('completionTbody');
    const rowCount = document.getElementById('rowCount');
    
    if (!tbody) return;
    
    const filtered = students.filter(s => 
      s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.course.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (rowCount) rowCount.textContent = `${filtered.length} entries`;
    
    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="13" style="text-align:center; padding:40px;">No matching records found.</td></tr>`;
      return;
    }
    
    let html = '';
    let counter = 1;
    
    for (const student of filtered) {
      html += `
        <tr data-id="${student.id}" class="clickable-row" style="cursor:pointer;">
          <td style="text-align:center; font-weight:600; color:var(--accent);">${counter}</td>
          <td><code>${escapeHtml(student.student_id)}</code></td>
          <td><code>${escapeHtml(student.control_number)}</code></td>
          <td><strong>${escapeHtml(student.full_name)}</strong></td>
          <td>${escapeHtml(student.course)}</td>
          <td>${escapeHtml(student.year_level)}</td>
          <td>${escapeHtml(student.support_type)}</td>
          <td>${getRemarksBadge(student.remarks)}</td>
          <td>${getEndorsementTag(student.endorsement)}</td>
          <td>${escapeHtml(student.data_sheet)}</td>
          <td>${getDutiesTag(student.duties)}</td>
          <td><span class="hours-badge">${escapeHtml(student.hours || '0 hrs')}</span></td>
          <td class="action-buttons">
            <button class="action-btn edit-btn" data-id="${student.id}">✏️ Edit</button>
            <button class="action-btn delete-btn" data-id="${student.id}" data-name="${escapeHtml(student.full_name)}">🗑️ Delete</button>
          </td>
        </tr>
      `;
      counter++;
    }
    tbody.innerHTML = html;
    await this.updateStatsDisplay();
  }
}