export const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  'guerrillamail.com',
  'yopmail.com',
  '10minutemail.com',
  'trashmail.com',
  'sharklasers.com',
  'throwawaymail.com',
  'fakeinbox.com',
  'dispostable.com',
  'getnada.com',
  'temp-mail.org',
  'mohmal.com',
]);

const EMAIL_PATTERN =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function validateRegistrationEmail(email: string): { valid: boolean; reason?: string } {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || trimmed.includes('..') || !EMAIL_PATTERN.test(trimmed)) {
    return {
      valid: false,
      reason: 'Informe um e-mail válido (ex: seunome@empresa.com.br).',
    };
  }

  const domain = trimmed.split('@')[1] || '';
  const labels = domain.split('.');
  const tld = labels[labels.length - 1] || '';

  if (labels.length < 2 || tld.length < 2) {
    return {
      valid: false,
      reason: 'Domínio de e-mail inválido.',
    };
  }

  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return {
      valid: false,
      reason: 'Use um e-mail permanente. E-mails temporários não são aceitos.',
    };
  }

  return { valid: true };
}

export function normalizeBrazilPhoneToE164(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return null;

  if (hasPlus) {
    return digits.length >= 10 && digits.length <= 15 ? `+${digits}` : null;
  }

  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
    const ddd = Number(digits.slice(2, 4));
    return ddd >= 11 && ddd <= 99 ? `+${digits}` : null;
  }

  if (digits.length === 10 || digits.length === 11) {
    const ddd = Number(digits.slice(0, 2));
    return ddd >= 11 && ddd <= 99 ? `+55${digits}` : null;
  }

  return null;
}
