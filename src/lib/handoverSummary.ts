// Regex patterns to detect clinical patient identifiers or sensitive medical information
const PHI_PATTERNS = [
  /\bMRN\b/i,
  /\bSSN\b/i,
  /\bDOB\b/i,
  /\bmedical record\b/i,
  /\bpatient\b/i,
  /\bdiagnosis\b/i,
  /\bdiagnosed\b/i,
  /\bprescription\b/i,
  /\bprescribed\b/i,
  /\bmedication\b/i,
  /\bantibiotic\b/i,
  /\bphysician\b/i,
  /\bdoctor\b/i,
  /\bnurse\b/i,
  /\btachycardia\b/i,
  /\bvital signs\b/i,
  /\bIV drip\b/i,
  /\bsurgery\b/i,
  /\bsepsis\b/i
];

export function validateNonClinicalHandover(text: string): { valid: boolean; warning?: string } {
  for (const pattern of PHI_PATTERNS) {
    if (pattern.test(text)) {
      return {
        valid: false,
        warning: 'Notice: ShiftBridge strictly forbids patient identifying information (MRN, diagnosis, clinical notes). Please limit handovers to facilities, equipment, and non-clinical logistics.'
      };
    }
  }
  return { valid: true };
}

export async function summarizeHandover(
  title: string,
  description: string,
  _institutionType: 'school_college' | 'hospital'
): Promise<string> {
  // Keep handover text local. A browser-bundled API key is public, and sending
  // operational notes to a third party requires a secured server-side service.
  // Extract primary operational clauses and synthesize a clean draft
  const sentences = description
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean);

  if (sentences.length <= 2) {
    return `${title}: ${description}`;
  }

  // Take the first problem sentence and the final recommendation sentence
  return `${sentences[0]} ${sentences[sentences.length - 1]}`;
}
