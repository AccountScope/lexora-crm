# LEXORA — AI-Powered Legal Simulation Platform

**Status:** Active Build (2026-03-20)  
**Priority:** 35% focus  
**Launch Target:** June 2026  
**Revenue Target:** £50K MRR by Dec 2026 (500 paying students @ £99/month)

---

## EXECUTIVE SUMMARY

Lexora is an AI-powered legal simulation platform that allows UK law students to practice real legal scenarios with a realistic AI judge, receive professional feedback, and track their exam readiness.

**Why this wins:**
- ✅ SQE is new (launched 2021) — existing tools are boring/expensive
- ✅ 15,000 UK law students/year — high willingness to pay (used to £10-20K training costs)
- ✅ No major competitor with AI judge avatar technology
- ✅ Dual revenue: B2C students + B2B universities
- ✅ Clear path to £1M (840 students @ £99/month)

---

## CORE PRODUCT VISION

Lexora allows users to:
- ✅ Practice real legal scenarios in simulated environments
- ✅ Be questioned by a realistic AI judge (visual avatar + voice)
- ✅ Conduct client interviews with AI clients
- ✅ Complete SQE-style timed simulations
- ✅ Receive professional, structured legal feedback
- ✅ Track progress and exam readiness scores

**Experience must feel:** "I am being assessed by a real judge"

---

## FLAGSHIP FEATURE: REAL-TIME AI JUDGE (CRITICAL)

**Technical Implementation:**
- Human-like avatar via **HeyGen LiveAvatar** or **Tavus**
- Real-time voice conversation via **OpenAI Realtime API**
- Video streaming via **LiveKit**
- Low latency (<300ms response time)
- Natural turn-taking (interruptions allowed)

**Behaviour:**
- Formal, professional UK legal tone
- Asks one question at a time
- Interrupts weak or rambling answers
- Applies appropriate pressure
- Adjusts difficulty dynamically based on performance
- Maintains full character throughout session

**Realism triggers:**
- Countdown timers
- Judge interruptions mid-answer
- Tone variations (strict / neutral / supportive)
- Natural pauses and thinking moments
- Pressure cues when student hesitates

---

## CORE SIMULATION MODES

### A. AI JUDGE MODE (FLAGSHIP)
- Courtroom-style questioning
- Dynamic follow-ups based on answers
- Real-time pressure and interruptions
- Tests legal reasoning + communication under pressure

### B. CLIENT INTERVIEW MODE
- AI acts as client with legal problem
- Scenario-based (divorce, contract dispute, criminal defense)
- Tests communication + issue-spotting + empathy

### C. SQE EXAM MODE
- Timed exam-style questions
- Structured SQE assessment format
- Mimics real exam conditions

---

## AI FEEDBACK SYSTEM (PREMIUM QUALITY)

After each session, generate a **professional legal performance report**:

**Structure:**
- Overall Score (0-100%)
- Legal Accuracy (did you spot the issues?)
- Communication (clarity, professionalism)
- Confidence (tone, hesitations)
- Issue Spotting (what you missed)

**Written Feedback:**
- What you did well
- What needs improvement
- How to improve (clear, actionable steps)

**Tone:** Must feel like a real legal assessor wrote it (professional, constructive, detailed)

---

## EXAM READINESS SYSTEM (MAJOR SELLING POINT)

**Implement:**
- "Exam Readiness Score" (0–100)
- "Pass Probability Indicator" (based on performance trends)
- Progress toward SQE readiness
- Personalized study plan

**Why this matters:** Law students are obsessed with "am I ready to pass?" — this is a core conversion feature.

---

## PERSONALISED TRAINING ENGINE

The system must adapt to each user:

- Identify weaknesses (e.g., weak on contract law, struggles with communication)
- Recommend next simulation based on weaknesses
- Adjust difficulty dynamically (harder if student is excelling)
- Track improvement over time

**Goal:** Feels like a personal AI legal coach that knows your strengths/weaknesses

---

## PERFORMANCE DASHBOARD (HIGH-END)

Dashboard must include:
- Total sessions completed
- Average score
- Improvement over time (line graph)
- Strength vs weakness breakdown (radar chart)
- Next recommended simulation

**Design Standard:** Stripe / Revolut level — clean, modern, data-driven

---

## SESSION REPLAY + AI COMMENTARY (HIGH VALUE)

After each session:
- Full transcript available
- Replay key moments (video + audio)
- AI highlights:
  - Mistakes you made
  - Missed legal issues
  - Strong answers

**Goal:** Feels like "a private tutor reviewing your performance"

---

## MULTIPLE JUDGE PERSONALITIES

Include:
- **Strict Judge** (high pressure, interrupts often)
- **Neutral Judge** (balanced, professional)
- **Supportive Judge** (learning mode, encouraging)

**Why:** Increases realism, replayability, and engagement. Students can practice with different styles.

---

## SCENARIO LIBRARY (PERCEIVED DEPTH)

Structured categories:
- Criminal Law (theft, assault, murder scenarios)
- Contract Law (breach, formation, remedies)
- Tort Law (negligence, defamation)
- Property Law (landlord-tenant, easements)
- Ethics (professional conduct)

**Launch with:** 20 scenarios (4 per category)
**Scale to:** 100+ scenarios by Q4 2026

---

## COURT-READY REPORT EXPORT (B2B SELLING POINT)

Generate downloadable **PDF reports**:
- Clean, professional format
- Scores + detailed breakdown
- Improvement plan
- Tutor/university branding option (white-label potential)

**Use cases:**
- Students share with tutors
- Universities track cohort performance
- Law firms assess candidate readiness

---

## LIGHT UNIVERSITY / TUTOR MODE

Include:
- "Share report" feature (send to tutor/professor)
- "Invite tutor to review" (email link)
- Basic admin dashboard (for future B2B expansion)

**Why:** Lays foundation for institutional sales (universities, law firms)

---

## PREMIUM TRIGGERS (MONETISATION)

**Free Trial:**
- 3 sessions free
- Limited feedback (basic scores only, no detailed commentary)
- No transcript/replay
- No exam readiness score

**Paid Tier (£99/month):**
- Unlimited sessions
- Full professional feedback
- Transcripts + replay
- Exam readiness tracking
- Advanced analytics

**Upgrade Prompts:**
- After free sessions run out
- When accessing locked features (transcript, detailed feedback)
- When exam readiness score would be shown

---

## UX / UI STANDARD (NON-NEGOTIABLE)

- Must feel like a **£100M SaaS product**
- Clean, minimal, consistent design
- Perfect on mobile + desktop
- Zero friction, zero confusion
- No placeholder text, no broken flows

**Design References:**
- Stripe (clean, professional)
- Notion (intuitive, smooth)
- Revolut (modern, data-driven)

---

## TECH STACK

- **Frontend:** Next.js (App Router)
- **Database:** Supabase (auth, PostgreSQL, storage)
- **Hosting:** Vercel
- **Voice AI:** OpenAI Realtime API (GPT-4 + voice)
- **Video Streaming:** LiveKit (real-time WebRTC)
- **Avatar:** HeyGen LiveAvatar or Tavus (AI-generated judge face)
- **Payments:** Stripe (subscriptions)
- **Analytics:** PostHog or Amplitude

---

## LANDING PAGE (HIGH CONVERSION)

Must clearly communicate:
- **Hero:** "Lexora — The Future of Legal Training"
- **Subheading:** "Practice law with a real AI judge. Know if you're ready to pass."
- **Primary CTA:** "Start Free Trial"

**Include:**
- Product demo video (show AI judge in action)
- Feature breakdown (3 modes, feedback, exam readiness)
- Trust signals (UK law focus, SQE-aligned)
- Pricing (free trial → £99/month)
- Social proof (testimonials once available)

---

## QUALITY CONTROL (CRITICAL)

Before launch:
- ✅ All flows must be seamless
- ✅ No broken UI
- ✅ No inconsistent styling
- ✅ No placeholder text
- ✅ No lag in AI responses (<300ms)
- ✅ Avatar movements feel natural
- ✅ Voice sounds professional and authoritative

**If anything feels average → FIX IT**

---

## BUILD TIMELINE (8 WEEKS)

### **Week 1-2: Architecture + Core Infrastructure**
- Next.js project setup
- Supabase auth + database schema
- LiveKit + HeyGen integration POC
- OpenAI Realtime API integration
- Basic UI framework

### **Week 3-4: AI Judge MVP**
- Real-time voice + avatar working
- 5 legal scenarios (1 per category)
- Basic feedback generation
- Session recording

### **Week 5-6: Full Feature Set**
- 20 scenarios complete
- Professional feedback system
- Exam readiness scoring
- Performance dashboard
- Session replay

### **Week 7: Polish + Testing**
- UI/UX refinement
- Bug fixes
- Load testing
- Security audit

### **Week 8: Launch Prep**
- Landing page live
- Stripe billing live
- Beta user onboarding
- Marketing materials ready

**Launch Date:** June 1, 2026

---

## GO-TO-MARKET STRATEGY

### **Phase 1: Beta Launch (June 2026)**
- Target: 50 beta users
- Price: £50 for 3 months (50% discount)
- Channels: Reddit (r/LawSchool), Facebook law student groups, The Student Room

### **Phase 2: Full Launch (July 2026)**
- Target: 200 paying students @ £99/month
- Channels: LinkedIn, Instagram, TikTok (law student influencers)
- Partnerships: Law school societies, tutors

### **Phase 3: University Pilots (Aug-Sep 2026)**
- Target: 2-3 university partnerships
- Offer: Cohort licenses at £20/student/month
- Pitch: Supplement existing SQE training

### **Phase 4: Scale (Oct-Dec 2026)**
- Target: 500 paying students
- Revenue: £50K MRR
- Channels: Paid ads, referral program, university expansion

---

## REVENUE FORECAST

**June 2026:** 50 students × £50 (beta) = £2.5K MRR  
**July 2026:** 100 students × £99 = £10K MRR  
**Aug 2026:** 200 students × £99 = £20K MRR  
**Sep 2026:** 300 students × £99 = £30K MRR  
**Dec 2026:** 500 students × £99 = £50K MRR ✅

**Annual Run Rate by Dec 2026:** £600K

---

## SUCCESS METRICS

**Product:**
- Average session length >15 minutes
- Completion rate >70%
- Feedback rating >4.5/5

**Growth:**
- Month-over-month user growth >40%
- Free-to-paid conversion >20%
- Churn rate <10%

**Revenue:**
- MRR growth >30%/month
- Customer Acquisition Cost (CAC) <£50
- Lifetime Value (LTV) >£600 (6 months avg retention)

---

## RISKS & MITIGATION

**Risk 1: Complex Tech (Avatar + Voice)**
- Mitigation: Start with text-based judge, add avatar in Week 3-4
- Fallback: If avatar is buggy, launch with voice-only judge

**Risk 2: Legal Content Quality**
- Mitigation: Partner with qualified UK solicitor/barrister for scenario review
- Budget: £2-3K for legal consultant

**Risk 3: Slow B2B Sales (Universities)**
- Mitigation: Focus on B2C (students) first, B2B is bonus revenue
- Universities are slow, but students pay immediately

**Risk 4: Competition (BPP, ULaw)**
- Mitigation: They're slow to innovate, we're faster + cheaper + better tech
- Our AI judge is genuinely differentiated

---

## NEXT STEPS (IMMEDIATE)

1. ✅ CTO: Build technical architecture plan
2. ✅ Product: Draft first 5 legal scenarios
3. ✅ CTO: Set up Next.js + Supabase project
4. ✅ CTO: Test LiveKit + HeyGen integration
5. ✅ CMO: Draft landing page copy (stage for Harris approval)
6. ✅ CEO: Find legal consultant for scenario review

**First milestone:** Week 2 — AI judge speaking in real-time (even if basic)

---

**This is not a prototype. This is the new standard for legal training.**

**Execute at the highest level.**
