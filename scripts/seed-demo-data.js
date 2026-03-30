#!/usr/bin/env node

/**
 * Seed Demo Data for LEXORA
 * Creates sample cases, clients, and data for testing
 */

const SUPABASE_URL = 'https://xrzlewoeryvsgbcasmor.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhyemxld29lcnl2c2diY2FzbW9yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY2MTczOSwiZXhwIjoyMDkwMjM3NzM5fQ.vV1NnXqBefBSsS-xLeyb26n8GAQ6WZB4NlTYkgi5iOg';

// Get organization ID for harris@lexora.com
async function getOrganizationId() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.harris@lexora.com&select=organization_id`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`
    }
  });
  const users = await res.json();
  return users[0]?.organization_id;
}

// Get user ID for harris@lexora.com
async function getUserId() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.harris@lexora.com&select=id`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`
    }
  });
  const users = await res.json();
  return users[0]?.id;
}

// Create demo clients
async function createClients(orgId) {
  const clients = [
    { legal_name: 'Acme Corporation Ltd', display_name: 'Acme Corp', status: 'ACTIVE' },
    { legal_name: 'TechStart UK Limited', display_name: 'TechStart', status: 'ACTIVE' },
    { legal_name: 'Global Industries PLC', display_name: 'Global Industries', status: 'ACTIVE' },
    { legal_name: 'Johnson & Associates', display_name: 'Johnson & Associates', status: 'ACTIVE' },
    { legal_name: 'Smith Family Trust', display_name: 'Smith Trust', status: 'ACTIVE' },
  ];

  const createdClients = [];

  for (const client of clients) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/clients`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        organization_id: orgId,
        ...client
      })
    });

    if (res.ok) {
      const created = await res.json();
      createdClients.push(created[0]);
      console.log(`✅ Created client: ${client.display_name}`);
    } else {
      console.error(`❌ Failed to create client: ${client.display_name}`, await res.text());
    }
  }

  return createdClients;
}

// Create demo matters/cases
async function createMatters(orgId, userId, clients) {
  const matters = [
    {
      client_id: clients[0].id,
      matter_number: 'MAT-2024-001',
      title: 'Corporate Restructuring - Merger Advice',
      description: 'Advising Acme Corporation on merger with international partner. Due diligence, regulatory compliance, and contract negotiations.',
      status: 'OPEN',
      practice_area: 'Corporate Law',
      opens_on: '2024-01-15'
    },
    {
      client_id: clients[1].id,
      matter_number: 'MAT-2024-002',
      title: 'Intellectual Property - Patent Application',
      description: 'Filing patent applications for TechStart\'s new AI technology. International filing strategy and trademark protection.',
      status: 'OPEN',
      practice_area: 'Intellectual Property',
      opens_on: '2024-02-01'
    },
    {
      client_id: clients[2].id,
      matter_number: 'MAT-2024-003',
      title: 'Employment Dispute Resolution',
      description: 'Representing Global Industries in employment tribunal case. Settlement negotiations ongoing.',
      status: 'PENDING',
      practice_area: 'Employment Law',
      opens_on: '2024-01-20'
    },
    {
      client_id: clients[3].id,
      matter_number: 'MAT-2024-004',
      title: 'Commercial Lease Negotiation',
      description: 'Negotiating favorable lease terms for Johnson & Associates\' new London office. Reviewing landlord obligations.',
      status: 'OPEN',
      practice_area: 'Real Estate',
      opens_on: '2024-03-01'
    },
    {
      client_id: clients[4].id,
      matter_number: 'MAT-2023-015',
      title: 'Estate Planning and Will Creation',
      description: 'Comprehensive estate planning for Smith Family Trust. Completed will drafting and trust setup.',
      status: 'CLOSED',
      practice_area: 'Private Client',
      opens_on: '2023-11-10',
      closes_on: '2024-01-30'
    },
    {
      client_id: clients[0].id,
      matter_number: 'MAT-2024-005',
      title: 'Data Protection Compliance Review',
      description: 'GDPR compliance audit and policy review for Acme Corporation. Implementing new data handling procedures.',
      status: 'OPEN',
      practice_area: 'Data Protection',
      opens_on: '2024-02-15'
    },
  ];

  const createdMatters = [];

  for (const matter of matters) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/matters`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        organization_id: orgId,
        lead_attorney_id: userId,
        ...matter
      })
    });

    if (res.ok) {
      const created = await res.json();
      createdMatters.push(created[0]);
      console.log(`✅ Created matter: ${matter.matter_number} - ${matter.title}`);
      
      // Add user as participant
      await fetch(`${SUPABASE_URL}/rest/v1/matter_participants`, {
        method: 'POST',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          matter_id: created[0].id,
          user_id: userId,
          participant_role: 'Lead Attorney',
          is_primary: true
        })
      });
    } else {
      console.error(`❌ Failed to create matter: ${matter.title}`, await res.text());
    }
  }

  return createdMatters;
}

// Main function
async function main() {
  console.log('🌱 Seeding demo data for LEXORA...\n');

  const orgId = await getOrganizationId();
  const userId = await getUserId();

  if (!orgId || !userId) {
    console.error('❌ Could not find organization or user ID for harris@lexora.com');
    return;
  }

  console.log(`📋 Organization ID: ${orgId}`);
  console.log(`👤 User ID: ${userId}\n`);

  console.log('Creating clients...');
  const clients = await createClients(orgId);

  console.log('\nCreating matters...');
  const matters = await createMatters(orgId, userId, clients);

  console.log('\n✅ Demo data seeded successfully!');
  console.log(`\n📊 Summary:`);
  console.log(`   Clients: ${clients.length}`);
  console.log(`   Matters: ${matters.length}`);
  console.log('\nYou can now test the app with realistic data!');
}

main().catch(console.error);
