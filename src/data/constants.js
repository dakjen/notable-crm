export const TIER_NAMES = ['Notable Essentials', 'Notable Amplify', 'Notable Amplify & Retainer'];

export const TIER_CLASSES = {
  'Notable Essentials': 'tier-ess',
  'Notable Amplify': 'tier-amp',
  'Notable Amplify & Retainer': 'tier-on',
};

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
  if (!tier) return 'tier-ess';
  for (const [name, cls] of Object.entries(TIER_CLASSES)) {
    if (tier.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(tier.toLowerCase())) {
      return cls;
    }
  }
  return 'tier-ess';
}

export function formatCurrency(val) {
  if (!val) return '--';
  const n = parseInt((val || '').replace(/[^0-9]/g, ''));
  if (isNaN(n)) return val;
  return '$' + n.toLocaleString();
}

export function parsePrice(priceStr) {
  if (!priceStr) return 0;
  const n = parseInt(priceStr.replace(/[^0-9]/g, ''));
  return isNaN(n) ? 0 : n;
}

export function calcProductsValue(products) {
  if (!products || products.length === 0) return 0;
  return products.reduce((sum, p) => sum + parsePrice(p.price), 0);
}
