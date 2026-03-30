#!/usr/bin/env node
/**
 * Simple demo data seed using fetch
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env.local');
const env = readFileSync(envPath, 'utf8');

const SUPABASE_URL = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
const SUPABASE_KEY = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
const ORG_ID = '00000000-0000-0000-0000-000000000001';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal'
};

console.log('🌱 Seeding LEXORA demo data...\n');

// Get user ID
const usersRes = await fetch(`${SUPABASE_URL}/rest/v1/users?organization_id=eq.${ORG_ID}&select=id&limit=1`, { headers });
const users = await usersRes.json();

if (!users || users.length === 0) {
  console.error('❌ No users found. Run backfill script first.');
  process.exit(1);
}

const userId = users[0].id;
console.log('✓ Found user:', userId);

// 1. Clients
console.log('\n📋 Creating clients...');
const clients = [
  { id: 'c1000000-0000-0000-0000-000000000001', organization_id: ORG_ID, firm_reference_code: 'CLT-2024-001', legal_name: 'Stratford Manufacturing Ltd', display_name: 'Stratford Manufacturing', status: 'ACTIVE', billing_email: 'finance@stratfordmfg.co.uk', phone: '+44 20 7946 0958', address_line1: '145 Bishopsgate', city: 'London', postal_code: 'EC2M 3YD', country_code: 'GB', data_classification: 'FIRM_CONFIDENTIAL' },
  { id: 'c1000000-0000-0000-0000-000000000002', organization_id: ORG_ID, firm_reference_code: 'CLT-2024-015', legal_name: 'Williams Property Group PLC', display_name: 'Williams Property', status: 'ACTIVE', billing_email: 'legal@williamsprop.com', phone: '+44 161 927 5543', address_line1: '42 King Street', city: 'Manchester', postal_code: 'M2 6BA', country_code: 'GB', data_classification: 'FIRM_CONFIDENTIAL' },
  { id: 'c1000000-0000-0000-0000-000000000003', organization_id: ORG_ID, firm_reference_code: 'CLT-2024-032', legal_name: 'Davidson Technology Solutions Ltd', display_name: 'Davidson Tech', status: 'ACTIVE', billing_email: 'contracts@davidsontech.io', phone: '+44 117 496 3382', address_line1: '88 Queens Road', city: 'Bristol', postal_code: 'BS8 1RT', country_code: 'GB', data_classification: 'FIRM_CONFIDENTIAL' }
];

const clientRes = await fetch(`${SUPABASE_URL}/rest/v1/clients`, {
  method: 'POST',
  headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
  body: JSON.stringify(clients)
});

if (!clientRes.ok) {
  const err = await clientRes.text();
  console.error('❌ Clients error:', err);
} else {
  console.log('✓ Created 3 clients');
}

// 2. Matters
console.log('\n⚖️ Creating matters...');
const now = Date.now();
const matters = [
  { id: 'm1000000-0000-0000-0000-000000000001', organization_id: ORG_ID, client_id: 'c1000000-0000-0000-0000-000000000001', matter_number: 'MAT-2024-187', title: 'Employment Dispute - Senior Engineer Dismissal', description: 'Former senior engineer alleges unfair dismissal and breach of contract.', status: 'OPEN', practice_area: 'Employment Law', lead_attorney_id: userId, opens_on: new Date(now - 45*24*60*60*1000).toISOString().split('T')[0], data_classification: 'FIRM_CONFIDENTIAL' },
  { id: 'm1000000-0000-0000-0000-000000000002', organization_id: ORG_ID, client_id: 'c1000000-0000-0000-0000-000000000002', matter_number: 'MAT-2024-203', title: 'Commercial Property Acquisition - Manchester Warehouse', description: 'Acquisition of 50,000 sq ft warehouse facility.', status: 'OPEN', practice_area: 'Real Estate', lead_attorney_id: userId, opens_on: new Date(now - 21*24*60*60*1000).toISOString().split('T')[0], data_classification: 'FIRM_CONFIDENTIAL' },
  { id: 'm1000000-0000-0000-0000-000000000003', organization_id: ORG_ID, client_id: 'c1000000-0000-0000-0000-000000000003', matter_number: 'MAT-2024-219', title: 'Software Licensing Agreement Review', description: 'Review and negotiation of enterprise software licensing agreement.', status: 'PENDING', practice_area: 'Commercial Contracts', lead_attorney_id: userId, opens_on: new Date(now - 7*24*60*60*1000).toISOString().split('T')[0], data_classification: 'FIRM_CONFIDENTIAL' }
];

const matterRes = await fetch(`${SUPABASE_URL}/rest/v1/matters`, {
  method: 'POST',
  headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
  body: JSON.stringify(matters)
});

if (!matterRes.ok) {
  const err = await matterRes.text();
  console.error('❌ Matters error:', err);
} else {
  console.log('✓ Created 3 matters');
}

// 3. Time Entries
console.log('\n⏱️ Creating time entries...');
const entries = [
  { matter_id: 'm1000000-0000-0000-0000-000000000001', days: 3, hours: 2.5, desc: 'Initial client consultation', amt: 500 },
  { matter_id: 'm1000000-0000-0000-0000-000000000001', days: 2, hours: 4.0, desc: 'Review employment contract', amt: 800 },
  { matter_id: 'm1000000-0000-0000-0000-000000000001', days: 1, hours: 1.5, desc: 'Correspondence with opposing counsel', amt: 300 },
  { matter_id: 'm1000000-0000-0000-0000-000000000002', days: 5, hours: 3.5, desc: 'Due diligence review', amt: 700 },
  { matter_id: 'm1000000-0000-0000-0000-000000000002', days: 4, hours: 2.0, desc: 'Draft purchase agreement', amt: 400 },
  { matter_id: 'm1000000-0000-0000-0000-000000000003', days: 2, hours: 1.5, desc: 'Contract review', amt: 300 },
  { matter_id: 'm1000000-0000-0000-0000-000000000003', days: 1, hours: 2.5, desc: 'Redline review', amt: 500 }
].map(e => ({
  organization_id: ORG_ID,
  matter_id: e.matter_id,
  user_id: userId,
  work_date: new Date(now - e.days*24*60*60*1000).toISOString().split('T')[0],
  hours: e.hours,
  description: e.desc,
  billable: true,
  status: 'UNBILLED',
  amount: e.amt
}));

const timeRes = await fetch(`${SUPABASE_URL}/rest/v1/time_entries`, {
  method: 'POST',
  headers,
  body: JSON.stringify(entries)
});

if (!timeRes.ok) {
  const err = await timeRes.text();
  console.error('❌ Time entries error:', err);
} else {
  console.log(`✓ Created ${entries.length} time entries (£3,500 unbilled)`);
}

console.log('\n✅ Demo data loaded!\nRefresh http://localhost:3000');
