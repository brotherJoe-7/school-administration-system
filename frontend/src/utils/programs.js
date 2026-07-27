/**
 * Program abbreviation map.
 * Key: full program name stored in the database.
 * Value: official abbreviation displayed in the UI.
 */
export const PROGRAM_ABBR = {
  'Diploma in Information Technology (DIT)':              'DIT',
  'B.Sc. (Hons) Information Technology':                  'BIT',
  'B.Sc. (Hons) Business Information Technology':         'BBIT',
  'B.Sc. (Hons) Software Engineering with Multimedia':    'BSEM',
  'B.Sc. (Hons) Information & Communication Technology':  'BICT',
};

/**
 * Return the abbreviation for a program, or the first word of the name as fallback.
 */
export function getAbbr(program) {
  if (!program) return '—';
  return PROGRAM_ABBR[program] || program.split(' ').filter(w => /^[A-Z]/.test(w)).join('').substring(0, 5) || program.substring(0, 6);
}

/**
 * Format for dropdowns: "BIT — B.Sc. (Hons) Information Technology"
 */
export function programLabel(program) {
  const abbr = PROGRAM_ABBR[program];
  return abbr ? `${abbr} — ${program}` : program;
}

/**
 * Estimate the standard duration in years for a given program.
 */
export function getProgramDuration(program) {
  if (!program) return 4;
  const p = program.toLowerCase();
  if (p.includes('primary')) return 6;
  if (p.includes('jss') || p.includes('junior')) return 3;
  if (p.includes('sss') || p.includes('senior')) return 3;
  if (p.includes('diploma') || p.includes('hnd')) return 2;
  if (p.includes('degree') || p.includes('b.sc') || p.includes('bsc') || p.includes('bba')) return 4;
  return 4; // Default fallback
}
