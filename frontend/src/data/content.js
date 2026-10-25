// Words for the landing page and the role chooser. Edit the text here.

export const roles = [
    { id: 'customer', name: 'Customer', desc: 'Book a trusted local service.' },
    { id: 'worker', name: 'Worker', desc: 'Get jobs, submit work, build your Work Passport.' },
    { id: 'owner', name: 'Cooperative Owner', desc: 'Manage workers, bookings and reviews.' },
  ]
  
  export const steps = [
    { n: '01', title: 'Book', text: 'Request deep cleaning on Kolar Road.' },
    { n: '02', title: 'Allocate', text: 'The cooperative assigns a local worker.' },
    { n: '03', title: 'Complete', text: 'Work is finished with photo evidence.' },
    { n: '04', title: 'Confirm', text: 'Customer and reviewer close the job.' },
  ]
  
  export const benefits = [
    {
      tag: 'For customers',
      title: 'Know who’s coming and what was done',
      text: 'Follow your booking from allocation to confirmation, with clear evidence of completed work.',
    },
    {
      tag: 'For workers',
      title: 'Build a record of real work you carry with you',
      text: 'Turn each verified switch replacement, repair or cleaning job into a lasting work history.',
    },
    {
      tag: 'For cooperatives',
      title: 'Fair, transparent allocation and clear records',
      text: 'Coordinate local teams with an accountable trail from request through final review.',
    },
  ]
  
  export const principles = [
    { n: '01', title: 'Humans decide', sub: 'AI only assists' },
    { n: '02', title: 'Workers control', sub: 'their own record' },
    { n: '03', title: 'Every action', sub: 'is logged' },
    { n: '04', title: 'Customers see', sub: 'only what they need' },
  ]
  
  // Only the first answer appears in the design; the rest is draft copy to replace.
  export const faqs = [
    {
      q: 'Who is this for?',
      a: 'KaamGar is for Bhopal residents booking local services, cooperative teams allocating work, and workers building a verified record of completed jobs.',
    },
    {
      q: 'How does a booking work?',
      a: 'Choose a service, share a few details and your preferred time. Your cooperative reviews the request and allocates a local worker, and you can follow each step in My bookings.',
    },
    {
      q: 'What is the Work Passport?',
      a: 'A worker-owned record of completed jobs. Each entry is backed by real evidence and a human review.',
    },
    {
      q: 'Does AI decide whether a job is verified?',
      a: 'No. A human cooperative reviewer decides verification. AI only assists.',
    },
    {
      q: 'Is my data private?',
      a: 'Customers see only what they need, workers control their own record, and every action is logged.',
    },
    {
      q: 'Do I pay anything to book?',
      a: 'No payments are collected in this pilot.',
    },
  ]