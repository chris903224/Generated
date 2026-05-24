// src/admin-login.ts
// Improved: top-toast notification system with dual login (Credentials + Magic Link)
// Includes 5 hardcoded admin accounts
// Magic Link: @phinmaed.com only

import { AdminAuthService } from './services/supabase.service';

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

// ── PHINMAED EMAIL DOMAIN ────────────────────────────────────────
const ALLOWED_EMAIL_DOMAIN = '@phinmaed.com';

// ── Rate limiting ───────────────────────────────────────────
let loginAttempts = 0;
const MAX_ATTEMPTS = 5;

// ── Toast durations ─────────────────────────────────────────
const TOAST_SUCCESS_TTL = 8000;
const TOAST_ERROR_TTL = 6000;
const TOAST_INFO_TTL = 6000;

// ════════════════════════════════════════════════════════════
//  TAB SWITCHING
// ════════════════════════════════════════════════════════════

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

// ════════════════════════════════════════════════════════════
//  TOAST NOTIFICATION SYSTEM
// ════════════════════════════════════════════════════════════

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

// ════════════════════════════════════════════════════════════
//  HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════

async function checkExistingSession(): Promise<void> {
  const isAuthenticated = await AdminAuthService.isAuthenticated();
  const isLoggedIn = localStorage.getItem('admin_logged_in') === 'true';
  const loginMethod = localStorage.getItem('login_method');
  
  // If already logged in via credentials, redirect to admin
  if (loginMethod === 'credentials' && isLoggedIn) {
    window.location.href = '/admin';
    return;
  }
  
  // If logged in via magic link, redirect to admin
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

// Check if email is allowed domain
function isAllowedEmail(email: string): boolean {
  return email.toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN);
}

// ════════════════════════════════════════════════════════════
//  CREDENTIALS LOGIN
// ════════════════════════════════════════════════════════════

async function loginWithCredentials(): Promise<void> {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (loginAttempts >= MAX_ATTEMPTS) {
    showToast('error', {
      title: 'Too many attempts',
      description: `Maximum ${MAX_ATTEMPTS} attempts reached. Please contact administrator.`,
    });
    credentialsBtn.disabled = true;
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
  loginAttempts++;
  const remaining = MAX_ATTEMPTS - loginAttempts;

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const foundAdmin = ADMIN_ACCOUNTS.find(
    admin => admin.username === username && admin.password === password
  );

  if (foundAdmin) {
    // Clear any previous auth data
    localStorage.clear();
    
    // Store credentials login data with timestamp for session expiry
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
    shakeInput(usernameInput);
    showToast('error', {
      title: 'Invalid credentials',
      description: 'Username or password is incorrect.',
      attempts: remaining > 0 ? `${remaining} attempt${remaining !== 1 ? 's' : ''} remaining` : undefined,
    });
    setLoading(credentialsBtn, false);
  }
}

// ════════════════════════════════════════════════════════════
//  MAGIC LINK LOGIN (@phinmaed.com ONLY)
// ════════════════════════════════════════════════════════════

async function sendMagicLink(): Promise<void> {
  const email = emailInput.value.trim();

  if (loginAttempts >= MAX_ATTEMPTS) {
    showToast('error', {
      title: 'Too many attempts',
      description: `Maximum ${MAX_ATTEMPTS} attempts reached. Please contact administrator.`,
    });
    magicBtn.disabled = true;
    return;
  }

  if (!email) {
    shakeInput(emailInput);
    showToast('error', { title: 'Email required', description: 'Please enter your email address.' });
    emailInput.focus();
    return;
  }

  // Email domain validation - ONLY @phinmaed.com
  if (!isAllowedEmail(email)) {
    shakeInput(emailInput);
    showToast('error', { 
      title: 'Invalid Email Domain', 
      description: `Only ${ALLOWED_EMAIL_DOMAIN} emails are allowed for magic link login.` 
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
  loginAttempts++;
  const remaining = MAX_ATTEMPTS - loginAttempts;

  try {
    const result = await AdminAuthService.sendMagicLink(email);

    if (result.success) {
      showToast('success', {
        title: 'Magic link sent!',
        description: result.message,
        attempts: remaining > 0 ? `${remaining} attempt${remaining !== 1 ? 's' : ''} remaining` : undefined,
      });
      emailInput.value = '';
    } else {
      shakeInput(emailInput);
      showToast('error', {
        title: 'Failed to send link',
        description: result.message,
        attempts: remaining > 0 ? `${remaining} attempt${remaining !== 1 ? 's' : ''} remaining` : undefined,
      });
    }
  } catch (error) {
    console.error('Send magic link error:', error);
    shakeInput(emailInput);
    showToast('error', {
      title: 'Something went wrong',
      description: 'An unexpected error occurred. Please try again.',
      attempts: remaining > 0 ? `${remaining} attempt${remaining !== 1 ? 's' : ''} remaining` : undefined,
    });
  } finally {
    setLoading(magicBtn, false);
  }
}

// Reset attempts after 1 hour
setInterval(() => {
  if (loginAttempts > 0) {
    loginAttempts = 0;
    credentialsBtn.disabled = false;
    magicBtn.disabled = false;
    console.log('Login attempts reset after 1 hour');
  }
}, 60 * 60 * 1000);

// ════════════════════════════════════════════════════════════
//  EVENT LISTENERS
// ════════════════════════════════════════════════════════════

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

// ════════════════════════════════════════════════════════════
//  INITIALIZATION
// ════════════════════════════════════════════════════════════

checkExistingSession();