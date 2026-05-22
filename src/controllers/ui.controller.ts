import { escapeHtml, getRemarksBadge, getEndorsementTag, getDutiesTag } from '../utils/formatters';
import type { UserProfile } from '../types';

export class UIController {
  private dom: any = {};

  constructor() {
    this.dom = {
      // Login Form Elements
      ctrlInput: document.getElementById('controlNum'),
      idInput: document.getElementById('studentId'),
      ctrlStatus: document.getElementById('ctrlStatus'),
      idStatus: document.getElementById('idStatus'),
      ctrlError: document.getElementById('controlError'),
      idError: document.getElementById('idError'),
      nextBtn: document.getElementById('nextBtn'),
      resetBtn: document.getElementById('resetBtn'),
      stepLogin: document.getElementById('stepLogin'),
      stepProfile: document.getElementById('stepProfile'),
      mainCard: document.getElementById('mainCard'),
      
      // Profile Display Elements
      dispName: document.getElementById('dispName'),
      tblName: document.getElementById('tblName'),
      tblCourse: document.getElementById('tblCourse'),
      tblYear: document.getElementById('tblYear'),
      tblSection: document.getElementById('tblSection'),
      tblControl: document.getElementById('tblControl'),
      tblStudentId: document.getElementById('tblStudentId'),
      tblHours: document.getElementById('tblHours'),        // ADDED
      tblStatus: document.getElementById('tblStatus'),
      
      // Table Elements
      tableBody: document.getElementById('tableBody'),
      rowCount: document.getElementById('rowCount'),
      
      // Modal Elements
      modal: document.getElementById('guidelinesModal'),
      closeModalBtn: document.getElementById('closeModalBtn'),
      proceedBtn: document.getElementById('proceedBtn'),
      
      // Theme Elements
      themeToggle: document.getElementById('themeToggleBtn'),
      fabIcon: document.getElementById('fabIcon')
    };
  }

  populateProfile(user: UserProfile): void {
    if (this.dom.dispName) this.dom.dispName.textContent = user.fullName;
    if (this.dom.tblName) this.dom.tblName.textContent = user.fullName;
    if (this.dom.tblCourse) this.dom.tblCourse.textContent = user.course;
    if (this.dom.tblYear) this.dom.tblYear.textContent = user.yearLevel;
    if (this.dom.tblSection) this.dom.tblSection.textContent = user.section;
    if (this.dom.tblControl) this.dom.tblControl.textContent = user.controlNumber;
    if (this.dom.tblStudentId) this.dom.tblStudentId.textContent = user.studentId;
    if (this.dom.tblHours) this.dom.tblHours.textContent = user.hours || '0 hrs';        // ADDED
    if (this.dom.tblStatus) this.dom.tblStatus.textContent = user.status;
  }

  renderTable(students: UserProfile[]): void {
    if (!this.dom.tableBody) return;
    
    if (!students || students.length === 0) {
      if (this.dom.rowCount) this.dom.rowCount.textContent = 'Showing 0 entries';
      this.dom.tableBody.innerHTML = '<tr><td colspan="11" style="text-align:center; padding:40px;">No data available</td></tr>';  // UPDATED colspan to 11
      return;
    }
    
    if (this.dom.rowCount) this.dom.rowCount.textContent = `Showing ${students.length} of ${students.length} entries`;
    
    let html = '';
    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      html += '<tr>';
      html += '<td><code>' + escapeHtml(s.studentId) + '</code></td>';
      html += '<td><code>' + escapeHtml(s.controlNumber) + '</code></td>';
      html += '<td><strong>' + escapeHtml(s.fullName) + '</strong></td>';
      html += '<td>' + escapeHtml(s.course) + '</td>';
      html += '<td>' + escapeHtml(s.yearLevel) + '</td>';
      html += '<td>' + escapeHtml(s.supportType) + '</td>';
      html += '<td>' + getRemarksBadge(s.remarks) + '</td>';
      html += '<td>' + getEndorsementTag(s.endorsement) + '</td>';
      html += '<td>' + escapeHtml(s.dataSheet) + '</td>';
      html += '<td>' + getDutiesTag(s.duties) + '</td>';
      html += '<td><span class="hours-badge">' + escapeHtml(s.hours || '0 hrs') + '</span></td>';  // ADDED
      html += '</tr>';
    }
    this.dom.tableBody.innerHTML = html;
  }

  setFieldError(field: 'ctrl' | 'id', message: string): void {
    if (field === 'ctrl') {
      if (this.dom.ctrlError) this.dom.ctrlError.textContent = '⚠ ' + message;
      if (this.dom.ctrlStatus) {
        this.dom.ctrlStatus.textContent = '✗';
        this.dom.ctrlStatus.style.color = '#c0392b';
      }
      if (this.dom.ctrlInput) this.dom.ctrlInput.style.borderColor = '#c0392b';
    } else {
      if (this.dom.idError) this.dom.idError.textContent = '⚠ ' + message;
      if (this.dom.idStatus) {
        this.dom.idStatus.textContent = '✗';
        this.dom.idStatus.style.color = '#c0392b';
      }
      if (this.dom.idInput) this.dom.idInput.style.borderColor = '#c0392b';
    }
  }

  setFieldSuccess(field: 'ctrl' | 'id'): void {
    if (field === 'ctrl') {
      if (this.dom.ctrlStatus) {
        this.dom.ctrlStatus.textContent = '✓';
        this.dom.ctrlStatus.style.color = '#3A7D52';
      }
      if (this.dom.ctrlInput) this.dom.ctrlInput.style.borderColor = '#3A7D52';
    } else {
      if (this.dom.idStatus) {
        this.dom.idStatus.textContent = '✓';
        this.dom.idStatus.style.color = '#3A7D52';
      }
      if (this.dom.idInput) this.dom.idInput.style.borderColor = '#3A7D52';
    }
  }

  clearErrors(): void {
    if (this.dom.ctrlError) this.dom.ctrlError.textContent = '';
    if (this.dom.idError) this.dom.idError.textContent = '';
    if (this.dom.ctrlStatus) this.dom.ctrlStatus.textContent = '';
    if (this.dom.idStatus) this.dom.idStatus.textContent = '';
  }

  resetForm(): void {
    if (this.dom.ctrlInput) this.dom.ctrlInput.value = '';
    if (this.dom.idInput) this.dom.idInput.value = '';
    this.clearErrors();
    if (this.dom.ctrlInput) this.dom.ctrlInput.style.borderColor = '';
    if (this.dom.idInput) this.dom.idInput.style.borderColor = '';
  }

  shakeCard(): void {
    if (!this.dom.mainCard) return;
    this.dom.mainCard.classList.remove('shake');
    void this.dom.mainCard.offsetWidth;
    this.dom.mainCard.classList.add('shake');
    setTimeout(() => {
      if (this.dom.mainCard) this.dom.mainCard.classList.remove('shake');
    }, 420);
  }

  showProfile(): void {
    if (this.dom.stepLogin) this.dom.stepLogin.classList.add('hidden');
    if (this.dom.stepProfile) {
      this.dom.stepProfile.classList.remove('hidden');
      this.dom.stepProfile.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  showLogin(): void {
    if (this.dom.stepProfile) this.dom.stepProfile.classList.add('hidden');
    if (this.dom.stepLogin) this.dom.stepLogin.classList.remove('hidden');
  }

  closeModal(): void {
    if (this.dom.modal) this.dom.modal.classList.add('hidden');
    if (this.dom.ctrlInput) this.dom.ctrlInput.focus();
  }

  toggleTheme(): void {
    const isDark = document.body.classList.contains('black-theme');
    
    if (isDark) {
      // Switch to light theme
      document.body.classList.remove('black-theme');
      document.body.classList.add('white-theme');
      localStorage.setItem('veristud_theme', 'light');
      if (this.dom.fabIcon) this.dom.fabIcon.textContent = '🌙';
    } else {
      // Switch to dark theme
      document.body.classList.remove('white-theme');
      document.body.classList.add('black-theme');
      localStorage.setItem('veristud_theme', 'dark');
      if (this.dom.fabIcon) this.dom.fabIcon.textContent = '☀️';
    }
    
    console.log('Theme toggled:', isDark ? '→ Light' : '→ Dark');
  }

  setupEventListeners(loginHandler: () => void, resetHandler: () => void): void {
    // Next button (Login)
    if (this.dom.nextBtn) {
      this.dom.nextBtn.addEventListener('click', (e: Event) => {
        e.preventDefault();
        loginHandler();
      });
    }
    
    // Reset button (Verify Another Account)
    if (this.dom.resetBtn) {
      this.dom.resetBtn.addEventListener('click', (e: Event) => {
        e.preventDefault();
        resetHandler();
      });
    }
    
    // Enter key on inputs
    const handleEnter = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        loginHandler();
      }
    };
    
    if (this.dom.ctrlInput) this.dom.ctrlInput.addEventListener('keydown', handleEnter);
    if (this.dom.idInput) this.dom.idInput.addEventListener('keydown', handleEnter);
    
    // Clear errors on input
    if (this.dom.ctrlInput) {
      this.dom.ctrlInput.addEventListener('input', () => {
        if (this.dom.ctrlError) this.dom.ctrlError.textContent = '';
        if (this.dom.ctrlStatus) this.dom.ctrlStatus.textContent = '';
        if (this.dom.ctrlInput) this.dom.ctrlInput.style.borderColor = '';
      });
    }
    
    if (this.dom.idInput) {
      this.dom.idInput.addEventListener('input', () => {
        if (this.dom.idError) this.dom.idError.textContent = '';
        if (this.dom.idStatus) this.dom.idStatus.textContent = '';
        if (this.dom.idInput) this.dom.idInput.style.borderColor = '';
      });
    }
    
    // Modal close events
    if (this.dom.closeModalBtn) {
      this.dom.closeModalBtn.addEventListener('click', () => this.closeModal());
    }
    
    if (this.dom.proceedBtn) {
      this.dom.proceedBtn.addEventListener('click', () => this.closeModal());
    }
    
    if (this.dom.modal) {
      this.dom.modal.addEventListener('click', (e: Event) => {
        if (e.target === this.dom.modal) this.closeModal();
      });
    }
    
    // Theme toggle button
    if (this.dom.themeToggle) {
      this.dom.themeToggle.addEventListener('click', () => this.toggleTheme());
    }
  }
}