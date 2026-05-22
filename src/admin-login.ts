// src/admin-login.ts
// Improved: top-toast notification system, same auth logic retained

import { AdminAuthService } from './services/supabase.service';

// ── DOM Elements ──────────────────────────────────────────────
const emailInput  = document.getElementById('adminEmail')      as HTMLInputElement;
const sendBtn     = document.getElementById('sendMagicLinkBtn') as HTMLButtonElement;
const toastRegion = document.getElementById('toastRegion')     as HTMLDivElement;

// ── Rate limiting (attempts only, no lockout timer) ───────────
let loginAttempts = 0;
const MAX_ATTEMPTS = 5;

// ── Toast auto-dismiss duration (ms) ─────────────────────────
const TOAST_SUCCESS_TTL = 8_000;
const TOAST_ERROR_TTL   = 6_000;
const TOAST_INFO_TTL    = 6_000;

// ════════════════════════════════════════════════════════════
//  TOAST NOTIFICATION SYSTEM
// ════════════════════════════════════════════════════════════

type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
  title:       string;
  description?: string;
  attempts?:   string;   // small chip, e.g. "4 attempts remaining"
  ttl?:        number;   // auto-dismiss ms; pass 0 to disable
}

const TOAST_ICONS: Record<ToastType, string> = {
  success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>`,
  error: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>`,
  info: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>`,
};

/**
 * Show a toast at the top of the viewport.
 * Returns the toast element so callers can reference/dismiss it.
 */
function showToast(type: ToastType, opts: ToastOptions): HTMLElement {
  const ttl = opts.ttl !== undefined
    ? opts.ttl
    : type === 'success' ? TOAST_SUCCESS_TTL
    : type === 'error'   ? TOAST_ERROR_TTL
    : TOAST_INFO_TTL;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');

  toast.innerHTML = `
    <div class="toast-icon">${TOAST_ICONS[type]}</div>
    <div class="toast-body">
      <p class="toast-title">${opts.title}</p>
      ${opts.description ? `<p class="toast-desc">${opts.description}</p>` : ''}
      ${opts.attempts    ? `<span class="toast-attempts">${opts.attempts}</span>` : ''}
    </div>
    <button class="toast-close" aria-label="Dismiss notification">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  `;

  toastRegion.prepend(toast);

  // Dismiss on close button click
  toast.querySelector<HTMLButtonElement>('.toast-close')!.addEventListener('click', () => {
    dismissToast(toast);
  });

  // Auto-dismiss
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

// ════════════════════════════════════════════════════════════
//  HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════

async function checkExistingSession(): Promise<void> {
  const isAuthenticated = await AdminAuthService.isAuthenticated();
  if (isAuthenticated) {
    window.location.href = '/admin.html';
  }
}

function setLoading(loading: boolean): void {
  if (loading) {
    sendBtn.classList.add('loading');
    sendBtn.disabled = true;
  } else {
    sendBtn.classList.remove('loading');
    sendBtn.disabled = false;
  }
}

function shakeInput(): void {
  emailInput.classList.remove('shake');
  void emailInput.offsetWidth; // reflow to restart animation
  emailInput.classList.add('shake');
  emailInput.addEventListener('animationend', () => {
    emailInput.classList.remove('shake');
  }, { once: true });
}

// ════════════════════════════════════════════════════════════
//  MAIN FUNCTION: Send Magic Link
// ════════════════════════════════════════════════════════════

async function sendMagicLink(): Promise<void> {
  const email = emailInput.value.trim();

  // Max attempts guard
  if (loginAttempts >= MAX_ATTEMPTS) {
    showToast('error', {
      title:       'Too many attempts',
      description: `Maximum ${MAX_ATTEMPTS} attempts reached. Please contact your administrator.`,
    });
    sendBtn.disabled = true;
    return;
  }

  // Empty validation
  if (!email) {
    shakeInput();
    showToast('error', {
      title:       'Email required',
      description: 'Please enter your email address before continuing.',
    });
    emailInput.focus();
    return;
  }

  // Format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    shakeInput();
    showToast('error', {
      title:       'Invalid email',
      description: 'Please enter a valid email address.',
    });
    emailInput.focus();
    return;
  }

  setLoading(true);
  loginAttempts++;
  const remaining = MAX_ATTEMPTS - loginAttempts;
  console.log(`Login attempts used: ${loginAttempts}/${MAX_ATTEMPTS}`);

  try {
    const result = await AdminAuthService.sendMagicLink(email);

    if (result.success) {
      showToast('success', {
        title:       'Magic link sent!',
        description: result.message,
        attempts:    remaining > 0 ? `${remaining} attempt${remaining !== 1 ? 's' : ''} remaining` : undefined,
      });
      emailInput.value = '';
    } else {
      shakeInput();
      showToast('error', {
        title:       'Failed to send link',
        description: result.message,
        attempts:    remaining > 0 ? `${remaining} attempt${remaining !== 1 ? 's' : ''} remaining` : undefined,
      });
    }
  } catch (error) {
    console.error('Send magic link error:', error);
    shakeInput();
    showToast('error', {
      title:       'Something went wrong',
      description: 'An unexpected error occurred. Please try again.',
      attempts:    remaining > 0 ? `${remaining} attempt${remaining !== 1 ? 's' : ''} remaining` : undefined,
    });
  } finally {
    setLoading(false);
  }
}

// Reset attempts after 1 hour
setInterval(() => {
  if (loginAttempts > 0) {
    loginAttempts = 0;
    sendBtn.disabled = false;
    console.log('Login attempts reset after 1 hour');
  }
}, 60 * 60 * 1_000);

// ════════════════════════════════════════════════════════════
//  EVENT LISTENERS
// ════════════════════════════════════════════════════════════

sendBtn.addEventListener('click', sendMagicLink);

emailInput.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'Enter') sendMagicLink();
});

// ════════════════════════════════════════════════════════════
//  INITIALIZATION
// ════════════════════════════════════════════════════════════

checkExistingSession();