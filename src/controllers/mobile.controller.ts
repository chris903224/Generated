// mobile.controller.ts
// Mobile sidebar toggle & responsive behavior
// Import this in admin.main.ts: import './mobile.controller';
// OR add <script type="module" src="/src/mobile.controller.ts"></script> in index.html BEFORE admin.main.ts

export function initMobileSidebar(): void {
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebarToggle');
  const overlay = document.getElementById('sidebarOverlay');

  if (!sidebar || !toggleBtn || !overlay) {
    // Retry if DOM not ready
    requestAnimationFrame(initMobileSidebar);
    return;
  }

  function openSidebar(): void {
    sidebar!.classList.add('open');
    overlay!.classList.add('active');
    toggleBtn!.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar(): void {
    sidebar!.classList.remove('open');
    overlay!.classList.remove('active');
    toggleBtn!.classList.remove('open');
    document.body.style.overflow = '';
  }

  function isMobile(): boolean {
    return window.innerWidth <= 768;
  }

  // Toggle button click
  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (sidebar!.classList.contains('open')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });

  // Overlay click closes sidebar
  overlay.addEventListener('click', closeSidebar);

  // Close sidebar when nav item clicked on mobile
  const navItems = sidebar.querySelectorAll('.nav-item');
  navItems.forEach((link) => {
    link.addEventListener('click', () => {
      if (isMobile()) closeSidebar();
    });
  });

  // Swipe to close sidebar (touch gesture)
  let touchStartX = 0;
  let touchStartY = 0;

  sidebar.addEventListener('touchstart', (e: TouchEvent) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  sidebar.addEventListener('touchend', (e: TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY);
    // Swipe left gesture (more horizontal than vertical)
    if (deltaX < -50 && deltaY < 60 && isMobile()) {
      closeSidebar();
    }
  }, { passive: true });

  // Swipe from left edge to open sidebar
  document.addEventListener('touchstart', (e: TouchEvent) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchend', (e: TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY);
    // Swipe right from left edge (within 30px of screen edge)
    if (touchStartX <= 30 && deltaX > 60 && deltaY < 60 && isMobile()) {
      openSidebar();
    }
  }, { passive: true });

  // On resize: clean up if switching to desktop
  window.addEventListener('resize', () => {
    if (!isMobile()) {
      closeSidebar();
    }
  });

  console.log('📱 Mobile sidebar initialized');
}

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileSidebar);
} else {
  initMobileSidebar();
}