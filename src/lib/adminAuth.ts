/**
 * Admin Authentication Utilities
 * Supports single or multiple main admin emails configured via environment variables.
 * Multiple emails can be comma-separated, semicolon-separated, or space-separated.
 * 
 * Supported environment variables:
 * - NEXT_PUBLIC_ADMIN_EMAILS (e.g. "admin1@gmail.com, admin2@gmail.com")
 * - NEXT_PUBLIC_ADMIN_EMAIL  (e.g. "admin1@gmail.com, admin2@gmail.com")
 */

/**
 * Returns a list of normalized, lowercase admin emails.
 */
export function getAdminEmails(): string[] {
  const envSources = [
    process.env.NEXT_PUBLIC_ADMIN_EMAILS,
    process.env.NEXT_PUBLIC_ADMIN_EMAIL,
    process.env.ADMIN_EMAILS,
    process.env.ADMIN_EMAIL,
  ];

  const emails: string[] = [];

  for (const source of envSources) {
    if (source && typeof source === 'string') {
      const parts = source.split(/[,;\s]+/);
      for (const part of parts) {
        const cleaned = part.trim().toLowerCase();
        if (cleaned && cleaned.includes('@')) {
          emails.push(cleaned);
        }
      }
    }
  }

  // Fallback defaults if no environment variables are defined
  if (emails.length === 0) {
    emails.push('shaz80170@gmail.com', 'dawafest@gmail.com');
  }

  return Array.from(new Set(emails));
}

/**
 * Checks if a given email belongs to a main admin.
 */
export function isAdminEmail(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  const adminEmails = getAdminEmails();
  return adminEmails.includes(email.trim().toLowerCase());
}
