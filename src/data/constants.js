export const TIERS = [
  { value: 'Ready 2 Roll', label: 'Essentials: Ready 2 Roll ($1,000)', class: 'tier-ess' },
  { value: 'Get Loud', label: 'Essentials: Get Loud ($1,750)', class: 'tier-ess' },
  { value: 'Marquis', label: 'Essentials: Marquis ($3,000)', class: 'tier-ess' },
  { value: 'LinkedIn Voice Intensive', label: 'LinkedIn Voice Intensive ($1,500+)', class: 'tier-li' },
  { value: 'Notable Amplify', label: 'Notable Amplify ($8,000+)', class: 'tier-amp' },
  { value: 'Notable Amplify+ Ongoing', label: 'Notable Amplify+ Ongoing ($3–5k/mo)', class: 'tier-on' },
];

export const STAGES = ['Lead', 'Discovery', 'Active', 'In Review', 'Complete'];

export const STAGE_STYLES = {
  Lead:       { pill: 'pill-lead',   col: 'pcol-lead' },
  Discovery:  { pill: 'pill-disc',   col: 'pcol-disc' },
  Active:     { pill: 'pill-active', col: 'pcol-active' },
  'In Review':{ pill: 'pill-review', col: 'pcol-review' },
  Complete:   { pill: 'pill-done',   col: 'pcol-done' },
};

export const DOC_TYPES = [
  'Service Agreement / Contract',
  'Proposal / Scope of Work',
  'Invoice',
  'Platform Opportunity Map',
  'Launch Package',
  'Other',
];

export const DOC_ACTIONS = [
  'Signature Required',
  'Approval / Review',
  'Comment & Feedback',
  'For Reference Only',
];

export function getInitials(firstName = '', lastName = '') {
  return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
}

export function getTierClass(tier) {
  const found = TIERS.find(t => t.value === tier);
  return found ? found.class : 'tier-ess';
}

export function formatCurrency(val) {
  if (!val) return '—';
  const n = parseInt((val || '').replace(/[^0-9]/g, ''));
  if (isNaN(n)) return val;
  return '$' + n.toLocaleString();
}
