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
const apiRateLimitStore = new Map<string, RateLimitRecord>();
const apiGetRateLimitStore = new Map<string, RateLimitRecord>();
const apiAuthRateLimitStore = new Map<string, RateLimitRecord>();

const RATE_LIMIT_CONFIG = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
  blockDurationMs: 30 * 60 * 1000,
} as const;

const API_RATE_LIMIT_CONFIG = {
  maxRequests: 200,
  windowMs: 60 * 1000,
  blockDurationMs: 10 * 60 * 1000,
  burstLimit: 50,
  burstWindowMs: 10 * 1000,
} as const;

const API_GET_RATE_LIMIT_CONFIG = {
  maxRequests: 500,
  windowMs: 60 * 1000,
  blockDurationMs: 5 * 60 * 1000,
  burstLimit: 100,
  burstWindowMs: 10 * 1000,
} as const;

const API_AUTH_RATE_LIMIT_CONFIG = {
  maxRequests: 30,
  windowMs: 60 * 1000,
  blockDurationMs: 15 * 60 * 1000,
  burstLimit: 10,
  burstWindowMs: 10 * 1000,
} as const;

function getClientIdentifier(request: NextRequest): string {
  // Try multiple headers for better IP detection behind proxies/CDN
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  const trueClientIp = request.headers.get('true-client-ip');
  
  const ip = cfConnectingIp || trueClientIp || realIp || 
             (forwarded ? forwarded.split(',')[0].trim() : null) || 
             'unknown';
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

function isApiBlocked(identifier: string, isGet: boolean, isAuth: boolean): boolean {
  let store: Map<string, RateLimitRecord>;
  let config: typeof API_RATE_LIMIT_CONFIG | typeof API_GET_RATE_LIMIT_CONFIG | typeof API_AUTH_RATE_LIMIT_CONFIG;
  
  if (isAuth) {
    store = apiAuthRateLimitStore;
    config = API_AUTH_RATE_LIMIT_CONFIG;
  } else if (isGet) {
    store = apiGetRateLimitStore;
    config = API_GET_RATE_LIMIT_CONFIG;
  } else {
    store = apiRateLimitStore;
    config = API_RATE_LIMIT_CONFIG;
  }
  
  const record = store.get(identifier);
  if (!record) return false;

  const now = Date.now();
  
  if (record.blockedUntil && now < record.blockedUntil) {
    return true;
  }

  if (record.blockedUntil && now >= record.blockedUntil) {
    store.delete(identifier);
    return false;
  }

  if (record.attempts >= config.maxRequests) {
    record.blockedUntil = now + config.blockDurationMs;
    return true;
  }

  if (now - record.firstAttempt > config.windowMs) {
    store.delete(identifier);
    return false;
  }

  return false;
}

function recordApiRequest(identifier: string, isGet: boolean, isAuth: boolean): void {
  let store: Map<string, RateLimitRecord>;
  let config: typeof API_RATE_LIMIT_CONFIG | typeof API_GET_RATE_LIMIT_CONFIG | typeof API_AUTH_RATE_LIMIT_CONFIG;
  
  if (isAuth) {
    store = apiAuthRateLimitStore;
    config = API_AUTH_RATE_LIMIT_CONFIG;
  } else if (isGet) {
    store = apiGetRateLimitStore;
    config = API_GET_RATE_LIMIT_CONFIG;
  } else {
    store = apiRateLimitStore;
    config = API_RATE_LIMIT_CONFIG;
  }
  const now = Date.now();
  const record = store.get(identifier);

  if (!record) {
    store.set(identifier, {
      attempts: 1,
      firstAttempt: now,
      lastAttempt: now,
    });
    return;
  }

  const timeSinceFirst = now - record.firstAttempt;
  if (timeSinceFirst <= config.burstWindowMs) {
    if (record.attempts >= config.burstLimit) {
      record.blockedUntil = now + config.blockDurationMs;
      record.attempts += 1;
      return;
    }
  }

  if (now - record.firstAttempt > config.windowMs) {
    record.attempts = 1;
    record.firstAttempt = now;
    record.lastAttempt = now;
    record.blockedUntil = null;
  } else {
    record.attempts += 1;
    record.lastAttempt = now;
  }

  if (record.attempts >= config.maxRequests) {
    record.blockedUntil = now + config.blockDurationMs;
  }
}

function getApiRemainingRequests(identifier: string, isGet: boolean, isAuth: boolean): number {
  let store: Map<string, RateLimitRecord>;
  let config: typeof API_RATE_LIMIT_CONFIG | typeof API_GET_RATE_LIMIT_CONFIG | typeof API_AUTH_RATE_LIMIT_CONFIG;
  
  if (isAuth) {
    store = apiAuthRateLimitStore;
    config = API_AUTH_RATE_LIMIT_CONFIG;
  } else if (isGet) {
    store = apiGetRateLimitStore;
    config = API_GET_RATE_LIMIT_CONFIG;
  } else {
    store = apiRateLimitStore;
    config = API_RATE_LIMIT_CONFIG;
  }
  
  const record = store.get(identifier);
  if (!record) return config.maxRequests;
  
  if (isApiBlocked(identifier, isGet, isAuth)) {
    return 0;
  }

  return Math.max(0, config.maxRequests - record.attempts);
}

function getApiBlockedUntil(identifier: string, isGet: boolean, isAuth: boolean): number | null {
  let store: Map<string, RateLimitRecord>;
  
  if (isAuth) {
    store = apiAuthRateLimitStore;
  } else if (isGet) {
    store = apiGetRateLimitStore;
  } else {
    store = apiRateLimitStore;
  }
  
  const record = store.get(identifier);
  if (!record || !record.blockedUntil) return null;
  return record.blockedUntil;
}

function cleanupApiRateLimit(): void {
  const now = Date.now();
  
  for (const [identifier, record] of apiRateLimitStore.entries()) {
    if (record.blockedUntil && now >= record.blockedUntil) {
      if (now - record.firstAttempt > API_RATE_LIMIT_CONFIG.windowMs) {
        apiRateLimitStore.delete(identifier);
      }
    } else if (!record.blockedUntil && now - record.firstAttempt > API_RATE_LIMIT_CONFIG.windowMs) {
      apiRateLimitStore.delete(identifier);
    }
  }
  
  // Cleanup GET store
  for (const [identifier, record] of apiGetRateLimitStore.entries()) {
    if (record.blockedUntil && now >= record.blockedUntil) {
      if (now - record.firstAttempt > API_GET_RATE_LIMIT_CONFIG.windowMs) {
        apiGetRateLimitStore.delete(identifier);
      }
    } else if (!record.blockedUntil && now - record.firstAttempt > API_GET_RATE_LIMIT_CONFIG.windowMs) {
      apiGetRateLimitStore.delete(identifier);
    }
  }
  
  for (const [identifier, record] of apiAuthRateLimitStore.entries()) {
    if (record.blockedUntil && now >= record.blockedUntil) {
      if (now - record.firstAttempt > API_AUTH_RATE_LIMIT_CONFIG.windowMs) {
        apiAuthRateLimitStore.delete(identifier);
      }
    } else if (!record.blockedUntil && now - record.firstAttempt > API_AUTH_RATE_LIMIT_CONFIG.windowMs) {
      apiAuthRateLimitStore.delete(identifier);
    }
  }
}

setInterval(cleanupApiRateLimit, 60 * 1000);

export function checkApiRateLimit(request: NextRequest): RateLimitResult {
  const identifier = getClientIdentifier(request);
  const method = request.method.toUpperCase();
  const pathname = request.nextUrl.pathname;
  const isGet = method === 'GET';
  const isAuth = pathname.startsWith('/api/auth') && 
                 !pathname.includes('/session') && 
                 !pathname.includes('/providers') &&
                 !pathname.includes('/csrf') &&
                 method === 'POST';
  
  let config: typeof API_RATE_LIMIT_CONFIG | typeof API_GET_RATE_LIMIT_CONFIG | typeof API_AUTH_RATE_LIMIT_CONFIG;
  let store: Map<string, RateLimitRecord>;
  
  if (isAuth) {
    config = API_AUTH_RATE_LIMIT_CONFIG;
    store = apiAuthRateLimitStore;
  } else if (isGet) {
    config = API_GET_RATE_LIMIT_CONFIG;
    store = apiGetRateLimitStore;
  } else {
    config = API_RATE_LIMIT_CONFIG;
    store = apiRateLimitStore;
  }
  
  // Kiểm tra nếu đã bị block
  if (isApiBlocked(identifier, isGet, isAuth)) {
    const blockedUntil = getApiBlockedUntil(identifier, isGet, isAuth);
    const remainingMs = blockedUntil ? Math.ceil((blockedUntil - Date.now()) / 1000) : 0;
    
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfter: remainingMs,
      message: `Quá nhiều requests. Vui lòng thử lại sau ${Math.ceil(remainingMs / 60)} phút.`,
    };
  }

  const record = store.get(identifier);
  const now = Date.now();
  
  if (record && (now - record.firstAttempt) <= config.windowMs) {
    const timeSinceFirst = now - record.firstAttempt;
    if (timeSinceFirst <= config.burstWindowMs) {
      if (record.attempts >= config.burstLimit) {
        record.blockedUntil = now + config.blockDurationMs;
        const remainingMs = Math.ceil(config.blockDurationMs / 1000);
        return {
          allowed: false,
          remainingAttempts: 0,
          retryAfter: remainingMs,
          message: `Quá nhiều requests trong thời gian ngắn. Vui lòng thử lại sau ${Math.ceil(remainingMs / 60)} phút.`,
        };
      }
    }
    
  
    if (record.attempts >= config.maxRequests) {
      record.blockedUntil = now + config.blockDurationMs;
      const remainingMs = Math.ceil(config.blockDurationMs / 1000);
      return {
        allowed: false,
        remainingAttempts: 0,
        retryAfter: remainingMs,
        message: `Quá nhiều requests. Vui lòng thử lại sau ${Math.ceil(remainingMs / 60)} phút.`,
      };
    }
  }

  recordApiRequest(identifier, isGet, isAuth);
  
  const updatedRecord = store.get(identifier);
  if (updatedRecord) {
    const timeSinceFirst = now - updatedRecord.firstAttempt;
    if (timeSinceFirst <= config.windowMs) {
      if (updatedRecord.attempts > config.maxRequests) {
        updatedRecord.blockedUntil = now + config.blockDurationMs;
        const remainingMs = Math.ceil(config.blockDurationMs / 1000);
        return {
          allowed: false,
          remainingAttempts: 0,
          retryAfter: remainingMs,
          message: `Quá nhiều requests. Vui lòng thử lại sau ${Math.ceil(remainingMs / 60)} phút.`,
        };
      }
    }
  }
  
  if (isApiBlocked(identifier, isGet, isAuth)) {
    const blockedUntil = getApiBlockedUntil(identifier, isGet, isAuth);
    const remainingMs = blockedUntil ? Math.ceil((blockedUntil - Date.now()) / 1000) : 0;
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfter: remainingMs,
      message: `Quá nhiều requests. Vui lòng thử lại sau ${Math.ceil(remainingMs / 60)} phút.`,
    };
  }
  
  const remainingRequests = getApiRemainingRequests(identifier, isGet, isAuth);
  
  return {
    allowed: true,
    remainingAttempts: remainingRequests,
    retryAfter: null,
    message: null,
  };
}




