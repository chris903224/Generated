// src/admin-login.ts
// Full security: anti-F12, anti-right click, anti-inspect, anti-console, devtools detection
// Improved: top-toast notification system with dual login (Credentials + Magic Link)
// Includes 5 hardcoded admin accounts
// Magic Link: ONLY specific @phinmaed.com emails allowed
// Persistent login attempts (saved in localStorage)

import { AdminAuthService } from './services/supabase.service';

// App version - must match admin.main.ts
const APP_VERSION = "v2.1.0";

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

// ── ALLOWED EMAILS FOR MAGIC LINK ────────────────────────────────
const ALLOWED_MAGIC_LINK_EMAILS = [
  'leda.lutrania.sjc@phinmaed.com',
  'anma.saguid.sjc@phinmaed.com', 
  'juba.libao.sjc@phinmaed.com',
  'chpe.villanueva.sjc@phinmaed.com'
];

// ── Rate limiting with persistence ───────────────────────────
let loginAttempts = 0;
const MAX_ATTEMPTS = 5;
const ATTEMPTS_KEY = 'hawak_kamay_login_attempts';
const ATTEMPTS_TIMESTAMP_KEY = 'hawak_kamay_attempts_timestamp';
const RESET_TIME = 60 * 60 * 1000; // 1 hour

// ── Toast durations ─────────────────────────────────────────
const TOAST_SUCCESS_TTL = 8000;
const TOAST_ERROR_TTL = 6000;
const TOAST_INFO_TTL = 6000;

// ============================================
// VERSION CHECK - CLEAR OLD SESSIONS
// ============================================

function checkAndClearOldSession(): void {
  const storedVersion = localStorage.getItem('app_version');
  if (storedVersion !== APP_VERSION) {
    console.log(`🔄 App version changed. Clearing old session...`);
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('app_version', APP_VERSION);
  }
}

// ============================================
// SECURITY MEASURES
// ============================================

function initSecurity(): void {
  // 1. Disable Right Click
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  });

  // 2. Disable Keyboard Shortcuts
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
        (ctrl && key === 's') ||
        (ctrl && key === 'p') ||
        key === 'PrintScreen') {
      e.preventDefault();
      return false;
    }
  });

  // 3. Disable Drag and Drop
  window.addEventListener('dragstart', (e) => {
    e.preventDefault();
    return false;
  });

  // 4. Disable Text Selection on non-input elements
  document.addEventListener('selectstart', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return true;
    }
    e.preventDefault();
    return false;
  });

  // 5. Disable Copy/Paste on non-input elements
  document.addEventListener('copy', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return true;
    }
    e.preventDefault();
    return false;
  });

  document.addEventListener('cut', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return true;
    }
    e.preventDefault();
    return false;
  });

  document.addEventListener('paste', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return true;
    }
    e.preventDefault();
    return false;
  });

  // 6. Clear console logs in production
  if (window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')) {
    console.log = function() {};
    console.info = function() {};
    console.warn = function() {};
    console.error = function() {};
  }

  // 7. Add meta tags to prevent caching
  const metaNoCache = document.createElement('meta');
  metaNoCache.httpEquiv = 'Cache-Control';
  metaNoCache.content = 'no-cache, no-store, must-revalidate';
  document.head.appendChild(metaNoCache);
  
  const metaPragma = document.createElement('meta');
  metaPragma.httpEquiv = 'Pragma';
  metaPragma.content = 'no-cache';
  document.head.appendChild(metaPragma);
  
  const metaExpires = document.createElement('meta');
  metaExpires.httpEquiv = 'Expires';
  metaExpires.content = '0';
  document.head.appendChild(metaExpires);

  console.log('✅ Security fully initialized on login page');
}

// ============================================
// UI INITIALIZATION (Theme, Tabs, Password Toggle)
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
  const rail = document.querySelector('.tab-rail');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      rail?.setAttribute('data-active', tab || '');
      
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
      pwToggle.setAttribute('aria-label', isText ? 'Show password' : 'Hide password');
    });
  }
}

// ============================================
// PERSISTENT ATTEMPTS MANAGEMENT
// ============================================

function loadAttempts(): void {
  const savedAttempts = localStorage.getItem(ATTEMPTS_KEY);
  const savedTimestamp = localStorage.getItem(ATTEMPTS_TIMESTAMP_KEY);
  
  if (savedAttempts && savedTimestamp) {
    const elapsed = Date.now() - parseInt(savedTimestamp);
    
    if (elapsed < RESET_TIME) {
      loginAttempts = parseInt(savedAttempts);
      console.log(`📊 Loaded ${loginAttempts}/${MAX_ATTEMPTS} attempts from storage`);
    } else {
      resetAttempts();
      console.log('🔄 Attempts reset due to timeout');
    }
  } else {
    resetAttempts();
  }
  
  if (loginAttempts >= MAX_ATTEMPTS) {
    credentialsBtn.disabled = true;
    magicBtn.disabled = true;
    console.log('🔒 Max attempts reached, buttons disabled');
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
  console.log('✅ Login attempts reset to 0');
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
// HELPER FUNCTIONS
// ============================================

async function checkExistingSession(): Promise<void> {
  const isAuthenticated = await AdminAuthService.isAuthenticated();
  const isLoggedIn = localStorage.getItem('admin_logged_in') === 'true';
  const loginMethod = localStorage.getItem('login_method');
  
  if (loginMethod === 'credentials' && isLoggedIn) {
    window.location.href = '/admin';
    return;
  }
  
  if (isAuthenticated || isLoggedIn) {
    window.location.href = '/admin';
  }
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
  input.classList.remove('shake');
  void input.offsetWidth;
  input.classList.add('shake');
  input.addEventListener('animationend', () => {
    input.classList.remove('shake');
  }, { once: true });
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
      description: `Maximum ${MAX_ATTEMPTS} attempts reached. Please wait 1 hour or contact administrator.`,
    });
    credentialsBtn.disabled = true;
    magicBtn.disabled = true;
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
  
  await new Promise(resolve => setTimeout(resolve, 800));

  const foundAdmin = ADMIN_ACCOUNTS.find(
    admin => admin.username === username && admin.password === password
  );

  if (foundAdmin) {
    resetAttempts();
    
    // Clear any previous auth data and set new session
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
      window.location.href = '/admin';
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
    
    if (loginAttempts >= MAX_ATTEMPTS) {
      credentialsBtn.disabled = true;
      magicBtn.disabled = true;
      showToast('error', {
        title: 'Account Locked',
        description: `Maximum ${MAX_ATTEMPTS} attempts reached. Please wait 1 hour.`,
      });
    }
  }
}

// ============================================
// MAGIC LINK LOGIN (ONLY SPECIFIC EMAILS)
// ============================================

async function sendMagicLink(): Promise<void> {
  const email = emailInput.value.trim();

  if (loginAttempts >= MAX_ATTEMPTS) {
    showToast('error', {
      title: 'Too many attempts',
      description: `Maximum ${MAX_ATTEMPTS} attempts reached. Please wait 1 hour.`,
    });
    magicBtn.disabled = true;
    credentialsBtn.disabled = true;
    return;
  }

  if (!email) {
    shakeInput(emailInput);
    showToast('error', { title: 'Email required', description: 'Please enter your email address.' });
    emailInput.focus();
    return;
  }

  // Email domain validation - ONLY specific allowed emails
  if (!isAllowedMagicLinkEmail(email)) {
    shakeInput(emailInput);
    showToast('error', { 
      title: 'Access Denied', 
      description: 'This email address is not authorized for magic link login. Only authorized OS Head personnel can use this feature.' 
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
      description: 'An unexpected error occurred. Please try again.',
      attempts: remaining > 0 ? `${remaining} attempt${remaining !== 1 ? 's' : ''} remaining` : undefined,
    });
  } finally {
    setLoading(magicBtn, false);
    
    if (loginAttempts >= MAX_ATTEMPTS) {
      credentialsBtn.disabled = true;
      magicBtn.disabled = true;
      showToast('error', {
        title: 'Account Locked',
        description: `Maximum ${MAX_ATTEMPTS} attempts reached. Please wait 1 hour.`,
      });
    }
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
      console.log('🔄 Auto-reset: Attempts cleared after 1 hour');
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
// INITIALIZATION
// ============================================

// Check and clear old session first
checkAndClearOldSession();

// Initialize security first
initSecurity();

// Initialize UI
initTheme();
initTabs();
initPasswordToggle();

// Load attempts and check session
loadAttempts();
checkExistingSession();