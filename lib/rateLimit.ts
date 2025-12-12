import type { NextRequest } from 'next/server';

interface RateLimitRecord {
  attempts: number;
  firstAttempt: number;
  lastAttempt: number;
  blockedUntil?: number | null;
}

interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  retryAfter: number | null;
  message: string | null;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

const RATE_LIMIT_CONFIG = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
  blockDurationMs: 30 * 60 * 1000,
} as const;

function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown';
  return ip;
}

function isBlocked(identifier: string): boolean {
  const record = rateLimitStore.get(identifier);
  if (!record) return false;

  const now = Date.now();
  
  if (record.blockedUntil && now < record.blockedUntil) {
    return true;
  }

  if (record.blockedUntil && now >= record.blockedUntil) {
    rateLimitStore.delete(identifier);
    return false;
  }

  if (record.attempts >= RATE_LIMIT_CONFIG.maxAttempts) {
    record.blockedUntil = now + RATE_LIMIT_CONFIG.blockDurationMs;
    return true;
  }

  if (now - record.firstAttempt > RATE_LIMIT_CONFIG.windowMs) {
    rateLimitStore.delete(identifier);
    return false;
  }

  return false;
}

function recordFailedAttempt(identifier: string): void {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record) {
    rateLimitStore.set(identifier, {
      attempts: 1,
      firstAttempt: now,
      lastAttempt: now,
    });
    return;
  }

  if (now - record.firstAttempt > RATE_LIMIT_CONFIG.windowMs) {
    record.attempts = 1;
    record.firstAttempt = now;
    record.lastAttempt = now;
    record.blockedUntil = null;
  } else {
    record.attempts += 1;
    record.lastAttempt = now;
  }

  if (record.attempts >= RATE_LIMIT_CONFIG.maxAttempts) {
    record.blockedUntil = now + RATE_LIMIT_CONFIG.blockDurationMs;
  }
}

function recordSuccess(identifier: string): void {
  rateLimitStore.delete(identifier);
}

function getRemainingAttempts(identifier: string): number {
  const record = rateLimitStore.get(identifier);
  if (!record) return RATE_LIMIT_CONFIG.maxAttempts;
  
  if (isBlocked(identifier)) {
    return 0;
  }

  return Math.max(0, RATE_LIMIT_CONFIG.maxAttempts - record.attempts);
}

function getBlockedUntil(identifier: string): number | null {
  const record = rateLimitStore.get(identifier);
  if (!record || !record.blockedUntil) return null;
  return record.blockedUntil;
}

function cleanup(): void {
  const now = Date.now();
  for (const [identifier, record] of rateLimitStore.entries()) {
    if (record.blockedUntil && now >= record.blockedUntil) {
      if (now - record.firstAttempt > RATE_LIMIT_CONFIG.windowMs) {
        rateLimitStore.delete(identifier);
      }
    } else if (!record.blockedUntil && now - record.firstAttempt > RATE_LIMIT_CONFIG.windowMs) {
      rateLimitStore.delete(identifier);
    }
  }
}

setInterval(cleanup, 5 * 60 * 1000);

export function checkRateLimit(request: NextRequest): RateLimitResult {
  const identifier = getClientIdentifier(request);
  
  if (isBlocked(identifier)) {
    const blockedUntil = getBlockedUntil(identifier);
    const remainingMs = blockedUntil ? Math.ceil((blockedUntil - Date.now()) / 1000) : 0;
    
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfter: remainingMs,
      message: `Quá nhiều lần thử đăng nhập sai. Vui lòng thử lại sau ${Math.ceil(remainingMs / 60)} phút.`,
    };
  }

  const remainingAttempts = getRemainingAttempts(identifier);
  
  return {
    allowed: true,
    remainingAttempts,
    retryAfter: null,
    message: null,
  };
}

export function recordFailedLogin(request: NextRequest): number {
  const identifier = getClientIdentifier(request);
  recordFailedAttempt(identifier);
  return getRemainingAttempts(identifier);
}

export function recordSuccessfulLogin(request: NextRequest): void {
  const identifier = getClientIdentifier(request);
  recordSuccess(identifier);
}




