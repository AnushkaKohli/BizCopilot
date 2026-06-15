do $$
declare
  demo_user_id uuid;
  doc1_id uuid := gen_random_uuid();
  doc2_id uuid := gen_random_uuid();
  doc3_id uuid := gen_random_uuid();
begin
  -- Get the demo user's id
  select id into demo_user_id from auth.users where email = 'demo@bizcopilot.app' limit 1;

  if demo_user_id is null then
    raise notice 'Demo user not found. Create demo@bizcopilot.app in Supabase Auth first.';
    return;
  end if;

  -- Update profile to mark as demo
  update public.profiles
  set
    full_name = 'Alex Johnson',
    company_name = 'Sunrise Retail Co.',
    is_demo = true
  where id = demo_user_id;

  -- -------------------------------------------------------
  -- Sample Invoice
  -- -------------------------------------------------------
  insert into public.documents (id, user_id, name, file_type, file_size, document_type, status, raw_text, analysis)
  values (
    doc1_id,
    demo_user_id,
    'Invoice_INV-2024-0892.pdf',
    'pdf',
    142000,
    'invoice',
    'ready',
    'INVOICE

Invoice Number: INV-2024-0892
Date: November 15, 2024
Due Date: December 15, 2024

From:
OfficeSupplies Pro Ltd.
123 Commerce Street, Chicago, IL 60601
billing@officesuppliespro.com

To:
Sunrise Retail Co.
Alex Johnson
456 Main Street, Austin, TX 78701

Items:
- Office Chair Ergonomic Pro (x5): $299.99 each = $1,499.95
- Standing Desk Converter (x2): $189.50 each = $379.00
- Wireless Mouse Bundle (x10): $29.99 each = $299.90
- Monitor Stand Adjustable (x5): $49.99 each = $249.95

Subtotal: $2,428.80
Tax (8.5%): $206.45
Shipping: $75.00
TOTAL DUE: $2,710.25

Payment Terms: Net 30
Late Fee: 1.5% per month after due date
Accepted Methods: Bank Transfer, Check, Credit Card

Bank Transfer Details:
Bank: First National Bank
Routing: 071000013
Account: 9876543210

Notes: Please reference invoice number INV-2024-0892 on all payments.',
    '{
      "summary": "Invoice INV-2024-0892 from OfficeSupplies Pro Ltd. for $2,710.25 worth of office furniture and accessories delivered to Sunrise Retail Co. Payment is due by December 15, 2024 with a Net 30 payment term.",
      "document_type": "invoice",
      "key_information": {
        "invoice_number": "INV-2024-0892",
        "vendor": "OfficeSupplies Pro Ltd.",
        "total_amount": "$2,710.25",
        "due_date": "December 15, 2024",
        "payment_terms": "Net 30",
        "items_count": 4,
        "subtotal": "$2,428.80",
        "tax": "$206.45 (8.5%)",
        "shipping": "$75.00",
        "late_fee": "1.5% per month"
      },
      "action_items": [
        {"id": "ai1", "task": "Process payment of $2,710.25 to OfficeSupplies Pro Ltd.", "owner": "Finance Team", "due_date": "December 15, 2024", "priority": "high", "completed": false},
        {"id": "ai2", "task": "Reference invoice number INV-2024-0892 on payment", "owner": "Finance Team", "due_date": "December 15, 2024", "priority": "medium", "completed": false},
        {"id": "ai3", "task": "Confirm receipt of all 5 items listed on the invoice", "owner": "Operations", "due_date": "November 22, 2024", "priority": "medium", "completed": false},
        {"id": "ai4", "task": "File invoice in accounts payable system", "owner": "Finance Team", "due_date": "November 18, 2024", "priority": "low", "completed": false}
      ],
      "risks": [
        {"id": "r1", "description": "Late payment will incur 1.5% monthly fee (~$40/month)", "severity": "medium", "category": "Financial"},
        {"id": "r2", "description": "No confirmation of delivery terms — verify items arrive before payment", "severity": "low", "category": "Operational"}
      ]
    }'::jsonb
  );

  -- -------------------------------------------------------
  -- Sample Contract
  -- -------------------------------------------------------
  insert into public.documents (id, user_id, name, file_type, file_size, document_type, status, raw_text, analysis)
  values (
    doc2_id,
    demo_user_id,
    'Service_Agreement_CloudSoft.docx',
    'docx',
    89000,
    'contract',
    'ready',
    'SERVICE AGREEMENT

This Service Agreement ("Agreement") is entered into as of January 1, 2025, between CloudSoft Technologies Inc. ("Provider") and Sunrise Retail Co. ("Client").

1. SERVICES
Provider agrees to deliver: Cloud storage (2TB), Priority customer support (24/7), Monthly security audits, Software updates and patches.

2. TERM
This Agreement commences January 1, 2025 and continues for 24 months, ending December 31, 2026. Automatic renewal applies unless 60-day written notice is provided.

3. PAYMENT
Monthly fee: $1,200/month. Annual total: $14,400. Payment due within 15 days of invoice. Late payments subject to 2% monthly interest.

4. CONFIDENTIALITY
Client data is strictly confidential. Provider will not share, sell, or use client data for any purpose other than delivering contracted services.

5. LIABILITY LIMITATION
Provider liability is limited to 3 months of fees paid ($3,600). Provider is not liable for indirect, incidental, or consequential damages.

6. TERMINATION
Either party may terminate with 60 days written notice. Client owes fees through termination date. Early termination fee: 2 months remaining fees.

7. INTELLECTUAL PROPERTY
All IP created during this agreement remains property of Provider unless explicitly stated otherwise in writing.

8. GOVERNING LAW
This Agreement is governed by the laws of California.

Signed:
CloudSoft Technologies Inc.: Sarah Mitchell, CEO
Sunrise Retail Co.: Alex Johnson, Owner
Date: December 20, 2024',
    '{
      "summary": "24-month cloud services agreement between Sunrise Retail Co. and CloudSoft Technologies Inc. starting January 2025 at $1,200/month ($28,800 total). The agreement includes cloud storage, 24/7 support, and security audits, with significant auto-renewal and early termination clauses.",
      "document_type": "contract",
      "key_information": {
        "parties": ["CloudSoft Technologies Inc. (Provider)", "Sunrise Retail Co. (Client)"],
        "start_date": "January 1, 2025",
        "end_date": "December 31, 2026",
        "duration": "24 months",
        "monthly_fee": "$1,200",
        "total_value": "$28,800",
        "auto_renewal": "Yes — 60-day written notice required to cancel",
        "governing_law": "California",
        "liability_cap": "$3,600 (3 months fees)"
      },
      "action_items": [
        {"id": "ai1", "task": "Calendar the auto-renewal notice deadline (November 1, 2026)", "owner": "Alex Johnson", "due_date": "November 1, 2026", "priority": "high", "completed": false},
        {"id": "ai2", "task": "Review IP ownership clause with legal counsel", "owner": "Legal", "due_date": "January 15, 2025", "priority": "high", "completed": false},
        {"id": "ai3", "task": "Set up recurring payment for $1,200/month starting January 2025", "owner": "Finance Team", "due_date": "January 1, 2025", "priority": "high", "completed": false},
        {"id": "ai4", "task": "Confirm 2TB storage meets current and projected data needs", "owner": "IT Team", "due_date": "December 31, 2024", "priority": "medium", "completed": false},
        {"id": "ai5", "task": "Store signed agreement in contract management system", "owner": "Alex Johnson", "due_date": "January 5, 2025", "priority": "low", "completed": false}
      ],
      "risks": [
        {"id": "r1", "description": "Auto-renewal clause — missing 60-day notice locks you in for another 24 months ($28,800)", "severity": "high", "category": "Legal"},
        {"id": "r2", "description": "Liability cap of only $3,600 — very low for a $28,800 contract if service fails", "severity": "high", "category": "Financial"},
        {"id": "r3", "description": "IP clause is broad — any tools or work built on their platform may belong to Provider", "severity": "critical", "category": "Legal"},
        {"id": "r4", "description": "Early termination fee could be significant — 2 months remaining fees", "severity": "medium", "category": "Financial"},
        {"id": "r5", "description": "California governing law may complicate disputes if your business is in Texas", "severity": "low", "category": "Legal"}
      ]
    }'::jsonb
  );

  -- -------------------------------------------------------
  -- Sample Meeting Notes
  -- -------------------------------------------------------
  insert into public.documents (id, user_id, name, file_type, file_size, document_type, status, raw_text, analysis)
  values (
    doc3_id,
    demo_user_id,
    'Q1_Planning_Meeting_Notes.txt',
    'txt',
    4200,
    'meeting_notes',
    'ready',
    'Q1 2025 PLANNING MEETING NOTES
Date: December 10, 2024
Attendees: Alex Johnson (Owner), Maria Chen (Operations), David Park (Marketing), Lisa Torres (Finance)
Duration: 90 minutes

AGENDA
1. Q4 2024 Review
2. Q1 2025 Goals
3. Budget Allocation
4. Team Updates

DISCUSSION

Q4 2024 Review:
Revenue came in at $340,000, up 12% from Q3. Returns increased slightly to 8% (target was 5%). Holiday campaign performed well but inventory ran short on 3 SKUs. Lisa flagged that accounts receivable has grown to $45,000 — needs attention.

Q1 2025 Goals:
- Revenue target: $380,000 (12% growth)
- Reduce returns to below 5%
- Launch new product line by February 28
- Hire 2 additional customer service reps by January 31
- Implement new inventory management system

Budget Q1:
- Marketing: $25,000 (up from $18,000 in Q4)
- Operations: $40,000
- New hires: $15,000 signing + first month
- Technology (inventory system): $8,000 one-time + $500/month

Action Items Discussed:
- Alex: Finalize product line suppliers by Dec 20
- Maria: Get 3 quotes for inventory system by Dec 27
- David: Submit Q1 marketing plan by Dec 20
- Lisa: Follow up on all AR over 60 days by Dec 15 (total ~$28,000)
- Maria: Post job listings for CS reps by Dec 13
- All: Review and approve Q1 budget draft by Dec 17

Next Meeting: January 7, 2025 at 10am
Meeting Notes prepared by: Maria Chen',
    '{
      "summary": "Q1 2025 planning meeting for Sunrise Retail Co. covered Q4 performance (12% revenue growth to $340K), set Q1 targets ($380K revenue), and assigned 6 time-sensitive action items. Key concerns include rising accounts receivable ($45K) and inventory shortages.",
      "document_type": "meeting_notes",
      "key_information": {
        "meeting_date": "December 10, 2024",
        "attendees": ["Alex Johnson (Owner)", "Maria Chen (Operations)", "David Park (Marketing)", "Lisa Torres (Finance)"],
        "q4_revenue": "$340,000",
        "q4_growth": "12%",
        "q1_revenue_target": "$380,000",
        "accounts_receivable": "$45,000 (overdue: ~$28,000)",
        "q1_total_budget": "$88,500+",
        "next_meeting": "January 7, 2025"
      },
      "action_items": [
        {"id": "ai1", "task": "Lisa: Follow up on AR over 60 days (~$28,000)", "owner": "Lisa Torres", "due_date": "December 15, 2024", "priority": "high", "completed": false},
        {"id": "ai2", "task": "Maria: Post job listings for 2 CS reps", "owner": "Maria Chen", "due_date": "December 13, 2024", "priority": "high", "completed": false},
        {"id": "ai3", "task": "Alex: Finalize product line suppliers", "owner": "Alex Johnson", "due_date": "December 20, 2024", "priority": "high", "completed": false},
        {"id": "ai4", "task": "David: Submit Q1 marketing plan", "owner": "David Park", "due_date": "December 20, 2024", "priority": "medium", "completed": false},
        {"id": "ai5", "task": "Maria: Get 3 quotes for inventory management system", "owner": "Maria Chen", "due_date": "December 27, 2024", "priority": "medium", "completed": false},
        {"id": "ai6", "task": "All: Review and approve Q1 budget draft", "owner": "All Attendees", "due_date": "December 17, 2024", "priority": "medium", "completed": false}
      ],
      "risks": [
        {"id": "r1", "description": "Accounts receivable at $45,000 with $28,000 over 60 days — cash flow risk", "severity": "high", "category": "Financial"},
        {"id": "r2", "description": "Returns at 8% vs 5% target — potential product quality or customer experience issue", "severity": "medium", "category": "Operational"},
        {"id": "r3", "description": "Inventory shortages on 3 SKUs during peak season — revenue missed", "severity": "medium", "category": "Operational"},
        {"id": "r4", "description": "Hiring timeline (Jan 31) is tight — delays could impact customer service quality in Q1", "severity": "low", "category": "HR"}
      ]
    }'::jsonb
  );

  -- Sample chat messages for the invoice
  insert into public.chat_messages (document_id, user_id, role, content) values
    (doc1_id, demo_user_id, 'user', 'What is the total amount due on this invoice?'),
    (doc1_id, demo_user_id, 'assistant', 'The total amount due is **$2,710.25**, which breaks down as follows:

- Subtotal: $2,428.80
- Tax (8.5%): $206.45
- Shipping: $75.00

Payment is due by **December 15, 2024** (Net 30 terms).'),
    (doc1_id, demo_user_id, 'user', 'What happens if we pay late?'),
    (doc1_id, demo_user_id, 'assistant', 'If you pay after December 15, 2024, a **1.5% per month** late fee will be applied. On a balance of $2,710.25, that would add approximately **$40.65 per month** until paid. I''d recommend scheduling the payment before the due date to avoid this charge.');

  raise notice 'Demo data seeded successfully for user: %', demo_user_id;
end;
$$;
