// controllers/admin.ui.controller.ts - FIXED VERSION

import { supabase } from '../services/supabase.service';

// Use global Chart from CDN (no local import)
declare const Chart: any;

export class AdminUIController {
  private dom: any = {};
  private trendChart: any = null;

  constructor() {
    this.initializeDom();
    this.setupTheme();
  }

  private initializeDom(): void {
    this.dom = {
      sidebar: document.getElementById('sidebar'),
      themeBtn: document.getElementById('themeBtn'),
      logoutBtn: document.getElementById('logoutBtn'),
      editModal: document.getElementById('editModal'),
      logoutModal: document.getElementById('logoutModal'),
      closeLogout: document.getElementById('closeLogout'),
      stayBtn: document.getElementById('stayBtn'),
      doLogout: document.getElementById('doLogout'),
      addStudentBtn: document.getElementById('addStudentBtn'),
      viewAllBtn: document.getElementById('viewAllBtn')
    };
  }

  private setupTheme(): void {
    const savedTheme = localStorage.getItem('admin_theme');
    const isDark = savedTheme === 'dark';
    if (isDark) {
      document.body.classList.add('dark');
    }
  }

  toggleTheme(): void {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem('admin_theme', isDark ? 'dark' : 'light');
  }

  showLogoutModal(): void {
    if (this.dom.logoutModal) {
      this.dom.logoutModal.style.display = 'flex';
    }
  }

  hideLogoutModal(): void {
    if (this.dom.logoutModal) {
      this.dom.logoutModal.style.display = 'none';
    }
  }

  handleLogout(): void {
    localStorage.removeItem('admin_logged_in');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_email');
    localStorage.removeItem('admin_user_id');
    localStorage.removeItem('admin_login_time');
    
    supabase.auth.signOut().then(() => {
      setTimeout(() => {
        window.location.replace('/admin-login.html');
      }, 100);
    }).catch(() => {
      window.location.replace('/admin-login.html');
    });
  }

  // FIXED: Updated parameter type to match admin.main.ts
  setupEventListeners(studentController: any, switchPageCallback: (page: string, filterRemarks?: string, filterCourse?: string) => void): void {
    if (this.dom.themeBtn) {
      this.dom.themeBtn.addEventListener('click', () => this.toggleTheme());
    }
    
    if (this.dom.logoutBtn) {
      this.dom.logoutBtn.addEventListener('click', (e: Event) => {
        e.preventDefault();
        this.showLogoutModal();
      });
    }
    
    if (this.dom.closeLogout) {
      this.dom.closeLogout.addEventListener('click', () => this.hideLogoutModal());
    }
    
    if (this.dom.stayBtn) {
      this.dom.stayBtn.addEventListener('click', () => this.hideLogoutModal());
    }
    
    if (this.dom.doLogout) {
      this.dom.doLogout.addEventListener('click', () => this.handleLogout());
    }
    
    if (this.dom.addStudentBtn) {
      this.dom.addStudentBtn.addEventListener('click', () => {
        studentController.openAddModal();
      });
    }
    
    if (this.dom.viewAllBtn) {
      this.dom.viewAllBtn.addEventListener('click', () => {
        switchPageCallback('completion');
      });
    }
    
    if (this.dom.editModal) {
      this.dom.editModal.addEventListener('click', (e: Event) => {
        if (e.target === this.dom.editModal) {
          studentController.closeModal();
        }
      });
    }
    
    if (this.dom.logoutModal) {
      this.dom.logoutModal.addEventListener('click', (e: Event) => {
        if (e.target === this.dom.logoutModal) {
          this.hideLogoutModal();
        }
      });
    }
  }

  setActiveNav(page: string): void {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.classList.remove('active');
      if (item.getAttribute('data-page') === page) {
        item.classList.add('active');
      }
    });
  }

  showPage(pageId: string): void {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
      page.classList.remove('active');
    });
    
    const activePage = document.getElementById(pageId);
    if (activePage) {
      activePage.classList.add('active');
    }
  }

  updatePageTitle(title: string, subtitle: string): void {
    const pageTitle = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');
    
    if (pageTitle) pageTitle.textContent = title;
    if (pageSubtitle) pageSubtitle.textContent = subtitle;
  }

  // ============================================
  // MONTHLY COMPLETION TREND CHART
  // ============================================

  async renderMonthlyTrendChart(): Promise<void> {
    const canvas = document.getElementById('trendChart') as HTMLCanvasElement;
    if (!canvas) {
      console.log('Trend chart canvas not found');
      return;
    }

    if (this.trendChart) {
      this.trendChart.destroy();
      this.trendChart = null;
    }

    const { data: students, error } = await supabase
      .from('students')
      .select('remarks, created_at, updated_at');

    if (error || !students) {
      console.error('Error fetching students:', error);
      return;
    }

    const months = [
      { name: 'Jun', year: 2026, month: 5 },
      { name: 'Jul', year: 2026, month: 6 },
      { name: 'Aug', year: 2026, month: 7 },
      { name: 'Sep', year: 2026, month: 8 },
      { name: 'Oct', year: 2026, month: 9 },
      { name: 'Nov', year: 2026, month: 10 },
      { name: 'Dec', year: 2026, month: 11 },
      { name: 'Jan', year: 2027, month: 0 },
      { name: 'Feb', year: 2027, month: 1 },
      { name: 'Mar', year: 2027, month: 2 },
      { name: 'Apr', year: 2027, month: 3 },
      { name: 'May', year: 2027, month: 4 }
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

      return { month: monthInfo.name, completed, pending, notCompleted };
    });

    this.trendChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: monthlyData.map(d => d.month),
        datasets: [
          {
            label: 'Completed',
            data: monthlyData.map(d => d.completed),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          },
          {
            label: 'Pending',
            data: monthlyData.map(d => d.pending),
            borderColor: '#fbbf24',
            backgroundColor: 'rgba(245, 158, 11, 0.05)',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointBackgroundColor: '#fbbf24',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          },
          {
            label: 'Not Completed',
            data: monthlyData.map(d => d.notCompleted),
            borderColor: '#f43f5e',
            backgroundColor: 'rgba(239, 68, 68, 0.05)',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointBackgroundColor: '#f43f5e',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              boxWidth: 10,
              padding: 15,
              font: { size: 11, family: 'DM Sans', weight: 'normal' as const }
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.05)' },
            title: {
              display: true,
              text: 'Number of Students',
              font: { size: 10, family: 'DM Sans' }
            },
            ticks: { stepSize: 1, precision: 0, font: { size: 10 } }
          },
          x: {
            grid: { display: false },
            ticks: { font: { size: 10, weight: 'normal' as const } }
          }
        }
      }
    });

    console.log('Monthly trend chart rendered with', students.length, 'students');
  }

  async refreshAllCharts(students: any[], hkStudents: any[]): Promise<void> {
    await this.renderMonthlyTrendChart();
  }
}