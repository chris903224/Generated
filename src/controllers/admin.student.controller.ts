// controllers/admin.student.controller.ts

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
  // RENDER METHODS
  // ============================================

  async renderCompletionTable(searchTerm: string = ''): Promise<void> {
    const students = await StudentService.searchStudents(searchTerm);
    const tbody = document.getElementById('completionTbody');
    const rowCount = document.getElementById('rowCount');
    
    if (!tbody) return;
    if (rowCount) rowCount.textContent = `${students.length} entries`;
    
    if (students.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="12" style="text-align:center; padding:60px 20px;">
          <div style="font-size: 48px; margin-bottom: 16px;">📋</div>
          <h3>No Students Yet</h3>
          <p>Click "Add Student" to get started</p>
        </td></tr>
      `;
      await this.updateStatsDisplay();
      return;
    }
    
    let html = '';
    for (const student of students) {
      html += `
        <tr data-id="${student.id}">
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
    }
    tbody.innerHTML = html;
    await this.updateStatsDisplay();
  }

  async renderHKTable(searchTerm: string = ''): Promise<void> {
    const hkStudents = await StudentService.getHKStudents();
    const filtered = hkStudents.filter(s => 
      s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.course.toLowerCase().includes(searchTerm.toLowerCase())
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
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:40px;">No HK Endorsed Students</td></tr>`;
      return;
    }
    
    let html = '';
    for (const student of filtered) {
      html += `
        <tr data-id="${student.id}">
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
    }
    tbody.innerHTML = html;
  }

  async renderRecentTable(): Promise<void> {
    const students = await StudentService.getAllStudents();
    const recent = students.slice(0, 10);
    const tbody = document.getElementById('recentTbody');
    
    if (!tbody) return;
    
    if (recent.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:40px;">No recent records</td></tr>`;
      return;
    }
    
    let html = '';
    for (const student of recent) {
      html += `
        <tr data-id="${student.id}">
          <td><strong>${escapeHtml(student.full_name)}</strong></td>
          <td>${escapeHtml(student.course)}</td>
          <td>${escapeHtml(student.year_level)}</td>
          <td>${getRemarksBadge(student.remarks)}</td>
          <td>${getDutiesTag(student.duties)}</td>
          <td>${getEndorsementTag(student.endorsement)}</td>
          <td><span class="hours-badge">${escapeHtml(student.hours || '0 hrs')}</span></td>
        </tr>
      `;
    }
    tbody.innerHTML = html;
  }

  async updateStatsDisplay(): Promise<void> {
    const stats = await StudentService.getStats();
    updateStats(stats.total, stats.completed, stats.pending, stats.hk);
  }

  // ============================================
  // CONTROL NUMBER
  // ============================================

  async getNextControlNumber(): Promise<string> {
    const existingStudents = await StudentService.getAllStudents();
    let maxNumber = 0;
    for (const student of existingStudents) {
      const num = parseInt(student.control_number);
      if (!isNaN(num) && num > maxNumber) maxNumber = num;
    }
    return (maxNumber + 1).toString().padStart(6, '0');
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

  showToast(message: string, type: 'success' | 'error'): void {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toast.style.cssText = 'position:fixed;bottom:20px;right:20px;padding:12px 20px;border-radius:8px;z-index:9999;';
    toast.style.backgroundColor = type === 'success' ? '#10b981' : '#ef4444';
    toast.style.color = 'white';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
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

  openEditModal(id: string): Promise<void> {
    return this.openEditModalWithId(id);
  }

  private async openEditModalWithId(id: string): Promise<void> {
    const student = await StudentService.getStudentById(id);
    if (!student) return;
    
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
    
    if (eStudentId) eStudentId.value = student.student_id;
    if (eFullName) eFullName.value = student.full_name;
    if (eCourse) eCourse.value = student.course;
    if (eYearLevel) eYearLevel.value = student.year_level;
    if (eSection) eSection.value = student.section || '';
    if (eSupportType) eSupportType.value = student.support_type;
    if (eRemarks) eRemarks.value = student.remarks;
    if (eEndorsement) eEndorsement.value = student.endorsement;
    if (eDataSheet) eDataSheet.value = student.data_sheet;
    if (eDuties) eDuties.value = student.duties;
    if (eHours) eHours.value = student.hours || '0 hrs';
    if (eControlNumber) eControlNumber.value = student.control_number;
    
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
    
    const formData = {
      student_id: studentId,
      control_number: this.currentEditId ? '' : await this.getNextControlNumber(),
      full_name: fullName,
      course: courseInput?.value.trim() || 'BSIT',
      year_level: yearLevelSelect?.value || 'YEAR 1',
      section: sectionInput?.value || '',
      support_type: supportTypeSelect?.value || 'FRESHMEN OS',
      remarks: remarksSelect?.value || 'PENDING',
      endorsement: endorsementSelect?.value || 'Not Continuing OS',
      data_sheet: dataSheetSelect?.value || 'Encoded',
      duties: dutiesSelect?.value || 'Regular Duty Assigned',
      hours: hoursInput?.value || '0 hrs',
      status: 'Active'
    };
    
    if (this.currentEditId) {
      await StudentService.updateStudent(this.currentEditId, formData);
    } else {
      await StudentService.addStudent(formData);
    }
    
    this.closeModal();
    await this.refreshAllTables();
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
  }

  closeModal(): void {
    const modal = document.getElementById('editModal');
    if (modal) {
      modal.style.display = 'none';
    }
    this.currentEditId = null;
    this.clearModalForm();
  }

  async refreshAllTables(): Promise<void> {
    const searchInput = (document.getElementById('searchInput') as HTMLInputElement)?.value || '';
    const hkSearch = (document.getElementById('hkSearch') as HTMLInputElement)?.value || '';
    await this.renderCompletionTable(searchInput);
    await this.renderHKTable(hkSearch);
    await this.renderRecentTable();
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================

  setupEventListeners(): void {
    // Search input
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.renderCompletionTable((e.target as HTMLInputElement).value);
      });
    }
    
    // HK Search input
    const hkSearch = document.getElementById('hkSearch') as HTMLInputElement;
    if (hkSearch) {
      hkSearch.addEventListener('input', (e) => {
        this.renderHKTable((e.target as HTMLInputElement).value);
      });
    }
    
    // Save button
    const saveBtn = document.getElementById('saveEdit');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveStudent());
    }
    
    // Cancel button
    const cancelBtn = document.getElementById('cancelEdit');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.closeModal());
    }
    
    // X button (close)
    const closeEditBtn = document.getElementById('closeEdit');
    if (closeEditBtn) {
      closeEditBtn.addEventListener('click', () => this.closeModal());
    }
    
    // Add student button
    const addBtn = document.getElementById('addStudentBtn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.openAddModal());
    }
    
    // View All button
    const viewAllBtn = document.getElementById('viewAllBtn');
    if (viewAllBtn) {
      viewAllBtn.addEventListener('click', () => {
        // Switch to completion page
        const navItem = document.querySelector('.nav-item[data-page="completion"]') as HTMLElement;
        if (navItem) navItem.click();
      });
    }
    
    // Close modal when clicking on backdrop (gray area)
    const modal = document.getElementById('editModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal();
        }
      });
    }
    
    // Close logout modal when clicking on backdrop
    const logoutModal = document.getElementById('logoutModal');
    if (logoutModal) {
      logoutModal.addEventListener('click', (e) => {
        if (e.target === logoutModal) {
          const closeBtn = document.getElementById('closeLogout');
          if (closeBtn) closeBtn.click();
        }
      });
    }
    
    // Filter by remarks
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
    
    // Filter by course
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
    
    // Global click handler for edit/delete buttons
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      
      // Delete button
      const deleteBtn = target.closest('.delete-btn');
      if (deleteBtn) {
        const id = deleteBtn.getAttribute('data-id');
        const name = deleteBtn.getAttribute('data-name');
        if (id && name) {
          e.stopPropagation();
          this.deleteStudent(id, name);
        }
        return;
      }
      
      // Edit button
      const editBtn = target.closest('.edit-btn');
      if (editBtn) {
        const id = editBtn.getAttribute('data-id');
        if (id) {
          e.stopPropagation();
          this.openEditModalWithId(id);
        }
      }
    });
  }

  // Helper method for filtered table rendering
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
      tbody.innerHTML = `<tr><td colspan="12" style="text-align:center; padding:40px;">No matching records found.</td></tr>`;
      return;
    }
    
    let html = '';
    for (const student of filtered) {
      html += `
        <tr data-id="${student.id}">
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
    }
    tbody.innerHTML = html;
    await this.updateStatsDisplay();
  }
} 