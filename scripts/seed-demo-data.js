#!/usr/bin/env node
/**
 * Seed Demo Data for Lexora
 * Creates 3 realistic demo matters with clients, time entries, documents, etc.
 * Usage: node scripts/seed-demo-data.js
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xrzlewoeryvsgbcasmor.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhyemxld29lcnl2c2diY2FzbW9yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY2MTczOSwiZXhwIjoyMDkwMjM3NzM5fQ.vV1NnXqBefBSsS-xLeyb26n8GAQ6WZB4NlTYkgi5iOg';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function seedDemoData() {
  console.log('🌱 Seeding Lexora demo data...\n');

  try {
    // Get first user ID for ownership
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (!users || users.length === 0) {
      console.error('❌ No users found. Please create a user account first.');
      process.exit(1);
    }

    const userId = users[0].id;
    console.log(`✅ Using user ID: ${userId}\n`);

    // 1. Create 3 demo clients
    console.log('📝 Creating 3 demo clients...');
    
    const clients = [
      {
        first_name: 'John',
        last_name: 'Williams',
        email: 'john.williams@example.com',
        phone: '+44 20 7946 0958',
        client_type: 'individual',
        status: 'active',
        created_by: userId,
      },
      {
        first_name: 'Sarah',
        last_name: 'Thompson',
        email: 'sarah.thompson@techinnovations.co.uk',
        phone: '+44 20 7946 0823',
        company_name: 'Tech Innovations Ltd',
        client_type: 'business',
        status: 'active',
        created_by: userId,
      },
      {
        first_name: 'Margaret',
        last_name: 'Thompson',
        email: 'executor@example.com',
        phone: '+44 20 7946 0734',
        client_type: 'individual',
        status: 'active',
        created_by: userId,
      },
    ];

    const { data: createdClients, error: clientError } = await supabase
      .from('clients')
      .insert(clients)
      .select();

    if (clientError) {
      console.error('❌ Error creating clients:', clientError.message);
      process.exit(1);
    }

    console.log(`✅ Created ${createdClients.length} clients\n`);

    // 2. Create 3 demo matters
    console.log('📂 Creating 3 demo matters...');

    const matters = [
      {
        client_id: createdClients[0].id,
        matter_number: 'MAT-2026-001',
        title: 'Residential Property Purchase - 42 Oak Street',
        matter_type: 'conveyancing',
        status: 'active',
        description: 'Purchase of residential property at 42 Oak Street, London SW1A 1AA',
        fee_arrangement: 'fixed_fee',
        estimated_value: 1500.00,
        opened_date: new Date('2026-03-01'),
        assigned_to: userId,
        created_by: userId,
      },
      {
        client_id: createdClients[1].id,
        matter_number: 'MAT-2026-002',
        title: 'Employment Tribunal - Unfair Dismissal',
        matter_type: 'employment',
        status: 'active',
        description: 'Unfair dismissal claim against former employer. Tribunal hearing scheduled.',
        fee_arrangement: 'hourly_rate',
        estimated_value: 8000.00,
        opened_date: new Date('2026-02-15'),
        assigned_to: userId,
        created_by: userId,
      },
      {
        client_id: createdClients[2].id,
        matter_number: 'MAT-2026-003',
        title: 'Probate - Estate of Margaret Thompson',
        matter_type: 'probate',
        status: 'pending',
        description: 'Probate application for deceased estate. Value approximately £450,000.',
        fee_arrangement: 'fixed_fee',
        estimated_value: 2500.00,
        opened_date: new Date('2026-03-10'),
        assigned_to: userId,
        created_by: userId,
      },
    ];

    const { data: createdMatters, error: matterError } = await supabase
      .from('matters')
      .insert(matters)
      .select();

    if (matterError) {
      console.error('❌ Error creating matters:', matterError.message);
      process.exit(1);
    }

    console.log(`✅ Created ${createdMatters.length} matters\n`);

    // 3. Create time entries
    console.log('⏱️  Creating time entries...');

    const timeEntries = [
      // Matter 1: Property Purchase
      { matter_id: createdMatters[0].id, user_id: userId, description: 'Initial client consultation', hours: 1.5, rate: 200, billable: true, entry_date: new Date('2026-03-01') },
      { matter_id: createdMatters[0].id, user_id: userId, description: 'Review property searches', hours: 2.0, rate: 200, billable: true, entry_date: new Date('2026-03-05') },
      { matter_id: createdMatters[0].id, user_id: userId, description: 'Draft contract documents', hours: 3.0, rate: 200, billable: true, entry_date: new Date('2026-03-10') },
      { matter_id: createdMatters[0].id, user_id: userId, description: 'Client meeting - exchange preparation', hours: 1.0, rate: 200, billable: true, entry_date: new Date('2026-03-15') },
      { matter_id: createdMatters[0].id, user_id: userId, description: 'Complete exchange formalities', hours: 1.5, rate: 200, billable: true, entry_date: new Date('2026-03-20') },
      
      // Matter 2: Employment Tribunal
      { matter_id: createdMatters[1].id, user_id: userId, description: 'Initial consultation - unfair dismissal', hours: 2.0, rate: 250, billable: true, entry_date: new Date('2026-02-15') },
      { matter_id: createdMatters[1].id, user_id: userId, description: 'Review employment contract and dismissal letter', hours: 3.5, rate: 250, billable: true, entry_date: new Date('2026-02-18') },
      { matter_id: createdMatters[1].id, user_id: userId, description: 'Draft tribunal claim form (ET1)', hours: 4.0, rate: 250, billable: true, entry_date: new Date('2026-02-22') },
      { matter_id: createdMatters[1].id, user_id: userId, description: 'Prepare witness statements', hours: 5.0, rate: 250, billable: true, entry_date: new Date('2026-03-01') },
      { matter_id: createdMatters[1].id, user_id: userId, description: 'Client meeting - trial preparation', hours: 2.5, rate: 250, billable: true, entry_date: new Date('2026-03-10') },
      { matter_id: createdMatters[1].id, user_id: userId, description: 'Review opponent evidence bundle', hours: 3.0, rate: 250, billable: true, entry_date: new Date('2026-03-15') },
      
      // Matter 3: Probate
      { matter_id: createdMatters[2].id, user_id: userId, description: 'Initial probate consultation', hours: 1.5, rate: 200, billable: true, entry_date: new Date('2026-03-10') },
      { matter_id: createdMatters[2].id, user_id: userId, description: 'Review will and asset documentation', hours: 2.5, rate: 200, billable: true, entry_date: new Date('2026-03-12') },
      { matter_id: createdMatters[2].id, user_id: userId, description: 'Complete IHT400 forms', hours: 3.0, rate: 200, billable: true, entry_date: new Date('2026-03-18') },
    ];

    const { data: createdTimeEntries, error: timeError } = await supabase
      .from('time_entries')
      .insert(timeEntries)
      .select();

    if (timeError) {
      console.error('❌ Error creating time entries:', timeError.message);
    } else {
      console.log(`✅ Created ${createdTimeEntries.length} time entries\n`);
    }

    // 4. Create timeline events
    console.log('📅 Creating timeline events...');

    const timelineEvents = [
      { matter_id: createdMatters[0].id, event_type: 'case_opened', title: 'Matter opened', description: 'Residential property purchase matter opened', visibility: 'client', created_by: userId },
      { matter_id: createdMatters[0].id, event_type: 'document_uploaded', title: 'Property searches received', description: 'Local authority and environmental searches completed', visibility: 'client', created_by: userId },
      { matter_id: createdMatters[0].id, event_type: 'status_update', title: 'Contract review complete', description: 'Purchase contract reviewed and approved', visibility: 'client', created_by: userId },
      
      { matter_id: createdMatters[1].id, event_type: 'case_opened', title: 'Matter opened', description: 'Employment tribunal claim matter opened', visibility: 'client', created_by: userId },
      { matter_id: createdMatters[1].id, event_type: 'court_date_set', title: 'Tribunal hearing scheduled', description: 'Final hearing scheduled for June 15, 2026', visibility: 'client', created_by: userId },
      { matter_id: createdMatters[1].id, event_type: 'document_uploaded', title: 'Witness statements drafted', description: '3 witness statements prepared', visibility: 'client', created_by: userId },
      
      { matter_id: createdMatters[2].id, event_type: 'case_opened', title: 'Matter opened', description: 'Probate application matter opened', visibility: 'client', created_by: userId },
      { matter_id: createdMatters[2].id, event_type: 'status_update', title: 'Asset valuation in progress', description: 'Property and financial assets being valued', visibility: 'client', created_by: userId },
    ];

    const { error: timelineError } = await supabase
      .from('matter_timeline_events')
      .insert(timelineEvents);

    if (timelineError) {
      console.error('❌ Error creating timeline events:', timelineError.message);
    } else {
      console.log(`✅ Created ${timelineEvents.length} timeline events\n`);
    }

    // 5. Create milestones
    console.log('🎯 Creating matter milestones...');

    const milestones = [
      // Matter 1: Property Purchase
      { matter_id: createdMatters[0].id, milestone_name: 'Offer Accepted', milestone_order: 1, status: 'completed', completed_at: new Date('2026-03-01'), completed_by: userId },
      { matter_id: createdMatters[0].id, milestone_name: 'Searches Ordered', milestone_order: 2, status: 'completed', completed_at: new Date('2026-03-05'), completed_by: userId },
      { matter_id: createdMatters[0].id, milestone_name: 'Contract Exchanged', milestone_order: 3, status: 'in_progress', estimated_completion_date: new Date('2026-04-01') },
      { matter_id: createdMatters[0].id, milestone_name: 'Completion', milestone_order: 4, status: 'pending', estimated_completion_date: new Date('2026-04-15') },
      
      // Matter 2: Employment Tribunal
      { matter_id: createdMatters[1].id, milestone_name: 'ET1 Filed', milestone_order: 1, status: 'completed', completed_at: new Date('2026-02-25'), completed_by: userId },
      { matter_id: createdMatters[1].id, milestone_name: 'Witness Statements', milestone_order: 2, status: 'in_progress', estimated_completion_date: new Date('2026-04-01') },
      { matter_id: createdMatters[1].id, milestone_name: 'Final Hearing', milestone_order: 3, status: 'pending', estimated_completion_date: new Date('2026-06-15') },
      
      // Matter 3: Probate
      { matter_id: createdMatters[2].id, milestone_name: 'IHT Forms Completed', milestone_order: 1, status: 'in_progress', estimated_completion_date: new Date('2026-03-30') },
      { matter_id: createdMatters[2].id, milestone_name: 'Grant of Probate', milestone_order: 2, status: 'pending', estimated_completion_date: new Date('2026-05-15') },
      { matter_id: createdMatters[2].id, milestone_name: 'Estate Distribution', milestone_order: 3, status: 'pending', estimated_completion_date: new Date('2026-07-30') },
    ];

    const { error: milestoneError } = await supabase
      .from('matter_milestones')
      .insert(milestones);

    if (milestoneError) {
      console.error('❌ Error creating milestones:', milestoneError.message);
    } else {
      console.log(`✅ Created ${milestones.length} milestones\n`);
    }

    // 6. Create deadlines
    console.log('⏰ Creating deadlines...');

    const deadlines = [
      { matter_id: createdMatters[0].id, deadline_name: 'Exchange contracts', deadline_type: 'custom', deadline_date: new Date('2026-04-01'), assigned_to: userId, priority: 'high', status: 'pending' },
      { matter_id: createdMatters[0].id, deadline_name: 'Completion date', deadline_type: 'custom', deadline_date: new Date('2026-04-15'), assigned_to: userId, priority: 'critical', status: 'pending' },
      
      { matter_id: createdMatters[1].id, deadline_name: 'Witness statements due', deadline_type: 'witness_list', deadline_date: new Date('2026-05-18'), assigned_to: userId, priority: 'high', status: 'pending' },
      { matter_id: createdMatters[1].id, deadline_name: 'Tribunal hearing', deadline_type: 'hearing', deadline_date: new Date('2026-06-15'), assigned_to: userId, priority: 'critical', status: 'pending' },
      
      { matter_id: createdMatters[2].id, deadline_name: 'Submit probate application', deadline_type: 'court_filing', deadline_date: new Date('2026-04-30'), assigned_to: userId, priority: 'medium', status: 'pending' },
    ];

    const { error: deadlineError } = await supabase
      .from('matter_deadlines')
      .insert(deadlines);

    if (deadlineError) {
      console.error('❌ Error creating deadlines:', deadlineError.message);
    } else {
      console.log(`✅ Created ${deadlines.length} deadlines\n`);
    }

    // 7. Create invoice for Matter 1
    console.log('💰 Creating sample invoice...');

    const invoice = {
      matter_id: createdMatters[0].id,
      client_id: createdClients[0].id,
      invoice_number: 'INV-2026-001',
      invoice_date: new Date('2026-03-25'),
      due_date: new Date('2026-04-25'),
      status: 'sent',
      subtotal: 1800.00,
      tax_amount: 360.00,
      total_amount: 2160.00,
      notes: 'Professional fees for property purchase - 42 Oak Street',
      created_by: userId,
    };

    const { data: createdInvoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert([invoice])
      .select();

    if (invoiceError) {
      console.error('❌ Error creating invoice:', invoiceError.message);
    } else {
      console.log(`✅ Created invoice: INV-2026-001\n`);
    }

    console.log('✨ Demo data seeding complete!\n');
    console.log('📊 Summary:');
    console.log(`   • 3 clients created`);
    console.log(`   • 3 matters created`);
    console.log(`   • ${timeEntries.length} time entries created`);
    console.log(`   • ${timelineEvents.length} timeline events created`);
    console.log(`   • ${milestones.length} milestones created`);
    console.log(`   • ${deadlines.length} deadlines created`);
    console.log(`   • 1 invoice created\n`);
    console.log('🚀 Lexora is now ready for Sabrina to test!\n');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run seeding
seedDemoData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
