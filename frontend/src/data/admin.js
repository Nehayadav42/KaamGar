// Sample data for the Cooperative Admin space. Replace with API data later.

export const ORG = {
    name: 'Bhopal Shramik Cooperative',
    admin: 'Ayesha S. (demo admin)',
  }
  
  export const AREAS = ['Arera Colony', 'MP Nagar', 'Kolar Road']
  
  export const workers = [
    { id: 'w1', name: 'Imran K.', skills: ['Plumbing repair'], areas: ['Arera Colony', 'MP Nagar'], availability: 'Available', note: null, status: 'Active', details: 'Cooperative-reviewed' },
    { id: 'w2', name: 'Sunita R.', skills: ['Cleaning and maintenance'], areas: ['Arera Colony', 'MP Nagar', 'Kolar Road'], availability: 'Available', note: null, status: 'Active', details: 'Cooperative-reviewed' },
    { id: 'w3', name: 'Rajesh V.', skills: ['Electrical repair'], areas: ['Arera Colony', 'MP Nagar', 'Kolar Road'], availability: 'Available', note: null, status: 'Active', details: 'Cooperative-reviewed' },
    { id: 'w4', name: 'Farhan A.', skills: ['Plumbing repair'], areas: ['Arera Colony', 'MP Nagar', 'Kolar Road'], availability: 'Available except Saturday', note: null, status: 'Active', details: 'Cooperative-reviewed' },
    { id: 'w5', name: 'Meena P.', skills: ['Cleaning and maintenance', 'Plumbing repair'], areas: ['Kolar Road'], availability: 'Available', note: null, status: 'Pending approval', details: 'Self-declared' },
    { id: 'w6', name: 'Deepak M.', skills: ['Electrical repair'], areas: ['MP Nagar'], availability: 'Unavailable', note: 'On leave this week', status: 'Suspended', details: 'Cooperative-reviewed' },
  ]
  
  const defaults = {
    areas: [...AREAS],
    active: true,
    requires: { details: true, address: true, schedule: true },
    evidence: { before: true, after: true, notes: true },
    activity: [{ text: 'Seeded as an example service', at: '5 Oct 2026, 8:00 pm' }],
  }
  
  export const seedServices = [
    { id: 'electrical', name: 'Electrical repair', category: 'Electrical', desc: 'Switches, sockets and everyday electrical faults.', ...defaults },
    { id: 'plumbing', name: 'Plumbing repair', category: 'Plumbing', desc: 'Leaking faucets, blocked drains and small plumbing repairs.', ...defaults },
    { id: 'cleaning', name: 'Cleaning and maintenance', category: 'Cleaning & maintenance', desc: 'Deep cleaning and routine care for your home or workplace.', ...defaults },
  ]