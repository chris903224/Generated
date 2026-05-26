// src/admin-login.ts
// COMPLETE VERSION - SYNCED WITH admin.main.ts

import { supabase, AdminAuthService } from './services/supabase.service';

// App version - MUST MATCH admin.main.ts
const APP_VERSION = "v2.1.1";

// ── DOM Elements ──────────────────────────────────────────────
const usernameInput = document.getElementById('adminUsername') as HTMLInputElement;
const passwordInput = document.getElementById('adminPassword') as HTMLInputElement;
const emailInput = document.getElementById('adminEmail') as HTMLInputElement;
const credentialsBtn = document.getElementById('loginWithCredentialsBtn') as HTMLButtonElement;
const magicBtn = document.getElementById('sendMagicLinkBtn') as HTMLButtonElement;
const toastRegion = document.getElementById('toastRegion') as HTMLDivElement;

// Tab elements
const tabBtns = document.querySelectorAll('.tab-btn');
const credentialsTab = document.getElementById('credentialsTab');
const magicTab = document.getElementById('magicTab');

// ── 5 ADMIN ACCOUNTS ──────────────────────────────────────────
const ADMIN_ACCOUNTS = [
  { username: 'AdminAnthony', password: 'anthony123', name: 'Anthony' },
  { username: 'AdminRonan', password: 'ronan123', name: 'Ronan' },
  { username: 'AdminJay', password: 'jay123', name: 'Jay' },
  { username: 'AdminLeimark', password: 'leimark123', name: 'Leimark' },
  { username: 'AdminAllain', password: 'allain123', name: 'Allain' }
];

// ── ONLY ALLOWED EMAILS FOR MAGIC LINK ────────────────────────────────
const ALLOWED_MAGIC_LINK_EMAILS = [
  'leda.lutrania.sjc@phinmaed.com',
  'anma.saguid.sjc@phinmaed.com', 
  'juba.libao.sjc@phinmaed.com',
  'chpe.villanueva.sjc@phinmaed.com'
];

// ── Rate limiting ───────────────────────────────────────────
let loginAttempts = 0;
const MAX_ATTEMPTS = 5;
const ATTEMPTS_KEY = 'login_attempts';
const ATTEMPTS_TIMESTAMP_KEY = 'login_attempts_timestamp';
const RESET_TIME = 60 * 60 * 1000; // 1 hour

// ── Toast durations ─────────────────────────────────────────
const TOAST_SUCCESS_TTL = 8000;
const TOAST_ERROR_TTL = 6000;
const TOAST_INFO_TTL = 6000;

// ============================================
// VERSION CHECK - CLEAR OLD SESSIONS ON DEPLOY
// ============================================

function checkAndClearOldSession(): void {
  const storedVersion = localStorage.getItem('app_version');
  if (storedVersion !== APP_VERSION) {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('app_version', APP_VERSION);
  }
}

// ============================================
// SECURITY MEASURES
// ============================================

function initSecurity(): void {
  // Disable Right Click
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  });

  // Disable F12 and other dev tools keys
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
}

// ============================================
// TOAST NOTIFICATION SYSTEM
// ============================================

type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
  title: string;
  description?: string;
  attempts?: string;
  ttl?: number;
}

const TOAST_ICONS: Record<ToastType, string> = {
  success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>`,
  error: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>`,
  info: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>`,
};

function showToast(type: ToastType, opts: ToastOptions): HTMLElement {
  const ttl = opts.ttl !== undefined ? opts.ttl
    : type === 'success' ? TOAST_SUCCESS_TTL
    : type === 'error' ? TOAST_ERROR_TTL
    : TOAST_INFO_TTL;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'status');

  toast.innerHTML = `
    <div class="toast-icon">${TOAST_ICONS[type]}</div>
    <div class="toast-body">
      <p class="toast-title">${opts.title}</p>
      ${opts.description ? `<p class="toast-desc">${opts.description}</p>` : ''}
      ${opts.attempts ? `<span class="toast-attempts">${opts.attempts}</span>` : ''}
    </div>
    <button class="toast-close" aria-label="Dismiss">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  `;

  toastRegion.prepend(toast);
  toast.querySelector('.toast-close')!.addEventListener('click', () => dismissToast(toast));

  if (ttl > 0) {
    setTimeout(() => dismissToast(toast), ttl);
  }
  return toast;
}

function dismissToast(toast: HTMLElement): void {
  if (!toast.isConnected) return;
  toast.classList.add('toast-exit');
  toast.addEventListener('animationend', () => toast.remove(), { once: true });
}

function clearToasts(): void {
  const toasts = toastRegion.querySelectorAll('.toast');
  toasts.forEach(toast => dismissToast(toast as HTMLElement));
}

// ============================================
// UI INITIALIZATION
// ============================================

function initTheme(): void {
  const html = document.documentElement;
  const stored = localStorage.getItem('portal_theme') || 'dark';
  html.setAttribute('data-theme', stored);
  
  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      localStorage.setItem('portal_theme', next);
    });
  }
}

function initTabs(): void {
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      if (tab === 'credentials') {
        credentialsTab?.classList.add('active');
        magicTab?.classList.remove('active');
      } else {
        magicTab?.classList.add('active');
        credentialsTab?.classList.remove('active');
      }
      
      clearToasts();
    });
  });
}

function initPasswordToggle(): void {
  const pwToggle = document.getElementById('togglePassword');
  const pwInput = document.getElementById('adminPassword') as HTMLInputElement;
  
  if (pwToggle && pwInput) {
    pwToggle.addEventListener('click', () => {
      const isText = pwInput.type === 'text';
      pwInput.type = isText ? 'password' : 'text';
      
      const eyeOpen = pwToggle.querySelector('.eye-open') as HTMLElement;
      const eyeClosed = pwToggle.querySelector('.eye-closed') as HTMLElement;
      
      if (eyeOpen) eyeOpen.style.display = isText ? '' : 'none';
      if (eyeClosed) eyeClosed.style.display = isText ? 'none' : '';
    });
  }
}

// ============================================
// ATTEMPTS MANAGEMENT
// ============================================

function loadAttempts(): void {
  const savedAttempts = localStorage.getItem(ATTEMPTS_KEY);
  const savedTimestamp = localStorage.getItem(ATTEMPTS_TIMESTAMP_KEY);
  
  if (savedAttempts && savedTimestamp) {
    const elapsed = Date.now() - parseInt(savedTimestamp);
    if (elapsed < RESET_TIME) {
      loginAttempts = parseInt(savedAttempts);
    } else {
      resetAttempts();
    }
  } else {
    resetAttempts();
  }
  
  if (loginAttempts >= MAX_ATTEMPTS) {
    credentialsBtn.disabled = true;
    magicBtn.disabled = true;
  }
}

function saveAttempts(): void {
  localStorage.setItem(ATTEMPTS_KEY, loginAttempts.toString());
  localStorage.setItem(ATTEMPTS_TIMESTAMP_KEY, Date.now().toString());
}

function resetAttempts(): void {
  loginAttempts = 0;
  localStorage.removeItem(ATTEMPTS_KEY);
  localStorage.removeItem(ATTEMPTS_TIMESTAMP_KEY);
  credentialsBtn.disabled = false;
  magicBtn.disabled = false;
}

function setLoading(btn: HTMLButtonElement, loading: boolean): void {
  if (loading) {
    btn.classList.add('loading');
    btn.disabled = true;
  } else {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

function shakeInput(input: HTMLInputElement): void {
  input.classList.add('shake');
  setTimeout(() => input.classList.remove('shake'), 400);
}

function isAllowedMagicLinkEmail(email: string): boolean {
  return ALLOWED_MAGIC_LINK_EMAILS.includes(email.toLowerCase());
}

// ============================================
// CREDENTIALS LOGIN
// ============================================

async function loginWithCredentials(): Promise<void> {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (loginAttempts >= MAX_ATTEMPTS) {
    showToast('error', {
      title: 'Too many attempts',
      description: `Maximum ${MAX_ATTEMPTS} attempts reached. Please wait 1 hour.`,
    });
    return;
  }

  if (!username) {
    shakeInput(usernameInput);
    showToast('error', { title: 'Username required', description: 'Please enter your username.' });
    usernameInput.focus();
    return;
  }

  if (!password) {
    shakeInput(passwordInput);
    showToast('error', { title: 'Password required', description: 'Please enter your password.' });
    passwordInput.focus();
    return;
  }

  setLoading(credentialsBtn, true);
  await new Promise(resolve => setTimeout(resolve, 500));

  const foundAdmin = ADMIN_ACCOUNTS.find(
    admin => admin.username === username && admin.password === password
  );

  if (foundAdmin) {
    resetAttempts();
    localStorage.clear();
    sessionStorage.clear();
    
    localStorage.setItem('app_version', APP_VERSION);
    localStorage.setItem('admin_logged_in', 'true');
    localStorage.setItem('admin_username', foundAdmin.username);
    localStorage.setItem('admin_name', foundAdmin.name);
    localStorage.setItem('login_method', 'credentials');
    localStorage.setItem('admin_login_time', Date.now().toString());
    
    showToast('success', { 
      title: `Welcome, ${foundAdmin.name}!`, 
      description: 'Redirecting to dashboard...' 
    });
    
    setTimeout(() => {
      window.location.replace('/admin');
    }, 1000);
  } else {
    loginAttempts++;
    saveAttempts();
    const remaining = MAX_ATTEMPTS - loginAttempts;
    shakeInput(usernameInput);
    showToast('error', {
      title: 'Invalid credentials',
      description: 'Username or password is incorrect.',
      attempts: remaining > 0 ? `${remaining} attempt${remaining !== 1 ? 's' : ''} remaining` : undefined,
    });
    setLoading(credentialsBtn, false);
  }
}

// ============================================
// MAGIC LINK LOGIN (ONLY ALLOWED EMAILS)
// ============================================

async function sendMagicLink(): Promise<void> {
  const email = emailInput.value.trim();

  if (loginAttempts >= MAX_ATTEMPTS) {
    showToast('error', {
      title: 'Too many attempts',
      description: `Maximum ${MAX_ATTEMPTS} attempts reached. Please wait 1 hour.`,
    });
    return;
  }

  if (!email) {
    shakeInput(emailInput);
    showToast('error', { title: 'Email required', description: 'Please enter your email address.' });
    emailInput.focus();
    return;
  }

  if (!isAllowedMagicLinkEmail(email)) {
    shakeInput(emailInput);
    showToast('error', { 
      title: 'Access Denied', 
      description: 'This email address is not authorized for magic link login.' 
    });
    emailInput.focus();
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    shakeInput(emailInput);
    showToast('error', { title: 'Invalid email', description: 'Please enter a valid email address.' });
    emailInput.focus();
    return;
  }

  setLoading(magicBtn, true);

  try {
    const result = await AdminAuthService.sendMagicLink(email);

    if (result.success) {
      resetAttempts();
      showToast('success', {
        title: 'Magic link sent!',
        description: result.message,
      });
      emailInput.value = '';
    } else {
      loginAttempts++;
      saveAttempts();
      const remaining = MAX_ATTEMPTS - loginAttempts;
      shakeInput(emailInput);
      showToast('error', {
        title: 'Failed to send link',
        description: result.message,
        attempts: remaining > 0 ? `${remaining} attempt${remaining !== 1 ? 's' : ''} remaining` : undefined,
      });
    }
  } catch (error) {
    loginAttempts++;
    saveAttempts();
    const remaining = MAX_ATTEMPTS - loginAttempts;
    console.error('Send magic link error:', error);
    shakeInput(emailInput);
    showToast('error', {
      title: 'Something went wrong',
      description: 'An unexpected error occurred.',
      attempts: remaining > 0 ? `${remaining} attempt${remaining !== 1 ? 's' : ''} remaining` : undefined,
    });
  } finally {
    setLoading(magicBtn, false);
  }
}

// ============================================
// AUTO-RESET CHECK
// ============================================

setInterval(() => {
  const savedTimestamp = localStorage.getItem(ATTEMPTS_TIMESTAMP_KEY);
  if (savedTimestamp) {
    const elapsed = Date.now() - parseInt(savedTimestamp);
    if (elapsed >= RESET_TIME && loginAttempts > 0) {
      resetAttempts();
    }
  }
}, 60 * 1000);

// ============================================
// EVENT LISTENERS
// ============================================

credentialsBtn.addEventListener('click', loginWithCredentials);
magicBtn.addEventListener('click', sendMagicLink);

usernameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') loginWithCredentials();
});
passwordInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') loginWithCredentials();
});
emailInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMagicLink();
});

// ============================================
// INITIALIZATION - NO AUTO REDIRECT!
// ============================================

checkAndClearOldSession();
initSecurity();
initTheme();
initTabs();
initPasswordToggle();
loadAttempts();

// IMPORTANT: DO NOT call checkExistingSession() here
// Let user click login button manually
console.log('✅ Login page ready');