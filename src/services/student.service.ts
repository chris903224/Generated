// admin.main.ts (partial - chart initialization)

import { StudentService } from './services/student.service';
import Chart from 'chart.js/auto';

function initMonthlyTrendChart() {
  const ctx = document.getElementById('trendChart') as HTMLCanvasElement;
  if (!ctx) return;
  
  const trendData = StudentService.getMonthlyTrendData();
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: trendData.map(d => d.month),
      datasets: [
        {
          label: 'Completed',
          data: trendData.map(d => d.completed),
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
          data: trendData.map(d => d.pending),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.05)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: '#f59e0b',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        },
        {
          label: 'Not Completed',
          data: trendData.map(d => d.notCompleted),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.05)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: '#ef4444',
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
          labels: { usePointStyle: true, boxWidth: 8 }
        },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: 'Number of Students' } },
        x: { grid: { display: false } }
      }
    }
  });
}

// Call this after DOM loads
document.addEventListener('DOMContentLoaded', () => {
  initMonthlyTrendChart();
});