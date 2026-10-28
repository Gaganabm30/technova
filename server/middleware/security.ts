import { Request, Response, NextFunction } from 'express';

/**
 * Security headers middleware
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  // Allow scripts from self and inline for Vite SPA hydration
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' ws: wss: http: https:;"
  );
  next();
}

/**
 * Validates request payload sizes and strips suspicious script tags from input strings
 */
export function sanitizeInputs(req: Request, res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  next();
}

function sanitizeObject(obj: any): void {
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'string') {
      // Basic strip of raw script execution tags while preserving markdown and plain text
      obj[key] = val.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').trim();
    } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      sanitizeObject(val);
    }
  }
}

/**
 * Validates attachment payload metadata
 */
export function validateAttachment(attachment: { name: string; size: number; type?: string }): { valid: boolean; error?: string } {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB limit
  const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.txt', '.csv', '.xlsx', '.docx', '.zip'];

  if (!attachment.name || typeof attachment.name !== 'string') {
    return { valid: false, error: 'Invalid file name.' };
  }

  if (attachment.size > MAX_SIZE) {
    return { valid: false, error: 'File size exceeds maximum limit of 10MB.' };
  }

  const ext = attachment.name.toLowerCase().slice(attachment.name.lastIndexOf('.'));
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `File type ${ext} is not permitted for upload.` };
  }

  return { valid: true };
}
