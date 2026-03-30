#!/usr/bin/env node
/**
 * LEXORA Demo Data Seed Script
 * Creates professional demo data for testing
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const ORG_ID = '00000000-0000-0000-0000-000000000001';

async function main() {
  console.log('🌱 Seeding LEXORA demo data...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Get first user from organization
  const { data: users } = await supabase
    .from('users')
    .select('id')
    .eq('organization_id', ORG_ID)
    .limit(1);

  if (!users || users.length === 0) {
    console.error('❌ No users found in organization');
    console.log('Run BACKFILL_ORGANIZATION_DATA.sql first');
    process.exit(1);
  }

  const userId = users[0].id;
  console.log('✓ Found user:', userId);

  // 1. Create Clients
  console.log('\n📋 Creating clients...');
  const clients = [
    {
      id: 'c1000000-0000-0000-0000-000000000001',
      organization_id: ORG_ID,
      firm_reference_code: 'CLT-2024-001',
      legal_name: 'Stratford Manufacturing Ltd',
      display_name: 'Stratford Manufacturing',
      status: 'ACTIVE',
      billing_email: 'finance@stratfordmfg.co.uk',
      phone: '+44 20 7946 0958',
      address_line1: '145 Bishopsgate',
      city: 'London',
      postal_code: 'EC2M 3YD',
      country_code: 'GB',
      data_classification: 'FIRM_CONFIDENTIAL',
    },
    {
      id: 'c1000000-0000-0000-0000-000000000002',
      organization_id: ORG_ID,
      firm_reference_code: 'CLT-2024-015',
      legal_name: 'Williams Property Group PLC',
      display_name: 'Williams Property',
      status: 'ACTIVE',
      billing_email: 'legal@williamsprop.com',
      phone: '+44 161 927 5543',
      address_line1: '42 King Street',
      city: 'Manchester',
      postal_code: 'M2 6BA',
      country_code: 'GB',
      data_classification: 'FIRM_CONFIDENTIAL',
    },
    {
      id: 'c1000000-0000-0000-0000-000000000003',
      organization_id: ORG_ID,
      firm_reference_code: 'CLT-2024-032',
      legal_name: 'Davidson Technology Solutions Ltd',
      display_name: 'Davidson Tech',
      status: 'ACTIVE',
      billing_email: 'contracts@davidsontech.io',
      phone: '+44 117 496 3382',
      address_line1: '88 Queens Road',
      city: 'Bristol',
      postal_code: 'BS8 1RT',
      country_code: 'GB',
      data_classification: 'FIRM_CONFIDENTIAL',
    },
  ];

  const { error: clientsError } = await supabase
    .from('clients')
    .upsert(clients, { onConflict: 'id' });

  if (clientsError) {
    console.error('❌ Clients error:', clientsError);
  } else {
    console.log('✓ Created 3 clients');
  }

  // 2. Create Matters
  console.log('\n⚖️ Creating matters...');
  const now = new Date();
  const matters = [
    {
      id: 'm1000000-0000-0000-0000-000000000001',
      organization_id: ORG_ID,
      client_id: 'c1000000-0000-0000-0000-000000000001',
      matter_number: 'MAT-2024-187',
      title: 'Employment Dispute - Senior Engineer Dismissal',
      description: 'Former senior engineer alleges unfair dismissal and breach of contract. High-value claim with significant reputational risk. Tribunal hearing scheduled for Q2 2025.',
      status: 'OPEN',
      practice_area: 'Employment Law',
      lead_attorney_id: userId,
      opens_on: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      data_classification: 'FIRM_CONFIDENTIAL',
    },
    {
      id: 'm1000000-0000-0000-0000-000000000002',
      organization_id: ORG_ID,
      client_id: 'c1000000-0000-0000-0000-000000000002',
      matter_number: 'MAT-2024-203',
      title: 'Commercial Property Acquisition - Manchester Warehouse',
      description: 'Acquisition of 50,000 sq ft warehouse facility in Manchester. Due diligence review, contract negotiations, and completion. Purchase price £4.2M.',
      status: 'OPEN',
      practice_area: 'Real Estate',
      lead_attorney_id: userId,
      opens_on: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      data_classification: 'FIRM_CONFIDENTIAL',
    },
    {
      id: 'm1000000-0000-0000-0000-000000000003',
      organization_id: ORG_ID,
      client_id: 'c1000000-0000-0000-0000-000000000003',
      matter_number: 'MAT-2024-219',
      title: 'Software Licensing Agreement Review',
      description: 'Review and negotiation of enterprise software licensing agreement with US-based SaaS provider. Annual contract value £380K.',
      status: 'PENDING',
      practice_area: 'Commercial Contracts',
      lead_attorney_id: userId,
      opens_on: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      data_classification: 'FIRM_CONFIDENTIAL',
    },
  ];

  const { error: mattersError } = await supabase
    .from('matters')
    .upsert(matters, { onConflict: 'id' });

  if (mattersError) {
    console.error('❌ Matters error:', mattersError);
  } else {
    console.log('✓ Created 3 matters');
  }

  // 3. Create Time Entries
  console.log('\n⏱️ Creating time entries...');
  const timeEntries = [
    { matter_id: 'm1000000-0000-0000-0000-000000000001', days_ago: 3, hours: 2.5, description: 'Initial client consultation and case assessment', amount: 500 },
    { matter_id: 'm1000000-0000-0000-0000-000000000001', days_ago: 2, hours: 4.0, description: 'Review employment contract and supporting documentation', amount: 800 },
    { matter_id: 'm1000000-0000-0000-0000-000000000001', days_ago: 1, hours: 1.5, description: 'Correspondence with opposing counsel', amount: 300 },
    { matter_id: 'm1000000-0000-0000-0000-000000000002', days_ago: 5, hours: 3.5, description: 'Due diligence review - title searches and planning permissions', amount: 700 },
    { matter_id: 'm1000000-0000-0000-0000-000000000002', days_ago: 4, hours: 2.0, description: 'Draft sale and purchase agreement', amount: 400 },
    { matter_id: 'm1000000-0000-0000-0000-000000000003', days_ago: 2, hours: 1.5, description: 'Initial contract review and risk assessment', amount: 300 },
    { matter_id: 'm1000000-0000-0000-0000-000000000003', days_ago: 1, hours: 2.5, description: 'Redline review and client consultation on key terms', amount: 500 },
  ].map((entry) => ({
    organization_id: ORG_ID,
    matter_id: entry.matter_id,
    user_id: userId,
    work_date: new Date(now.getTime() - entry.days_ago * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    hours: entry.hours,
    description: entry.description,
    billable: true,
    status: 'UNBILLED',
    amount: entry.amount,
  }));

  const { error: timeError } = await supabase
    .from('time_entries')
    .insert(timeEntries);

  if (timeError) {
    console.error('❌ Time entries error:', timeError);
  } else {
    console.log(`✓ Created ${timeEntries.length} time entries (£3,500 unbilled)`);
  }

  // 4. Verify
  console.log('\n📊 Verifying data...');
  const { data: clientCount } = await supabase
    .from('clients')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', ORG_ID);

  const { data: matterCount } = await supabase
    .from('matters')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', ORG_ID);

  const { data: timeCount } = await supabase
    .from('time_entries')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', ORG_ID);

  console.log(`\n✅ Demo data loaded successfully!`);
  console.log(`   Clients: ${(clientCount as any)?.count || 0}`);
  console.log(`   Matters: ${(matterCount as any)?.count || 0}`);
  console.log(`   Time Entries: ${(timeCount as any)?.count || 0}`);
  console.log('\nRefresh your dashboard at http://localhost:3000');
}

main().catch(console.error);
