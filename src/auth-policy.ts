export function validateSignup(password: string, confirmation: string, consent: boolean): string | undefined {
  if (password.length < 12) return 'Use a passphrase of at least 12 characters.';
  if (password.length > 128) return 'Use no more than 128 characters.';
  if (password !== confirmation) return 'Passwords do not match.';
  if (!consent) return 'Please acknowledge the privacy notice.';
}
