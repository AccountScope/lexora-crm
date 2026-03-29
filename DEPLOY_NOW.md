# 🚀 Deploy Lexora Phase 2 - Quick Guide

**Status:** ✅ Ready to deploy  
**Build:** ✅ Successful  
**Git:** ✅ All committed (2ec27c2)

---

## 1-Minute Deploy

```bash
cd /data/.openclaw/workspace/lexora
vercel --prod
```

That's it! Vercel will:
1. Build the project (~60 seconds)
2. Deploy to production
3. Give you a live URL

---

## What You're Deploying

### Phase 2 UX Polish
- ✨ Professional tooltips throughout
- 📭 Enhanced empty states with tips
- ⚖️ Legal formatting utilities
- 🎨 Smooth micro-interactions
- 🎓 Optional onboarding system

### Changes Included
- **3 new commits** since last deployment
- **9 new components** (tooltips, onboarding, animations)
- **3 new utilities** (formatting, glossary, onboarding steps)
- **7 modified pages** (dashboard, trust accounting, reports, documents)

---

## Post-Deploy Testing (10 mins)

### Quick Smoke Test
1. **Dashboard:** Hover over KPI card info icons → tooltips should appear
2. **Trust Accounting:** Click "Trust Accounts" → check empty state has tips
3. **Document Vault:** Check chain-of-custody tooltip appears
4. **Any page:** Card hover effects should be smooth (200ms)

### Full Test (30 mins)
- [ ] Dashboard tooltips work
- [ ] Trust accounting tooltips work
- [ ] Report builder help button works
- [ ] Document vault empty state shows
- [ ] Cases table empty state shows tips
- [ ] Status badges have tooltips
- [ ] Hover animations are smooth
- [ ] Mobile: tooltips work on long-press

---

## Rollback Plan (if needed)

If something breaks:

```bash
# Option 1: Revert to previous deployment in Vercel dashboard
# Go to: Deployments → Find previous → Promote to Production

# Option 2: Git revert
cd /data/.openclaw/workspace/lexora
git log --oneline -5  # Find the commit before Phase 2
git revert <commit-hash>
vercel --prod
```

**Safe to revert:** Yes, all Phase 2 changes are backwards compatible.

---

## What Users Will See

### First-Time Users
- Optional onboarding tour (can skip)
- Info icons throughout the app
- Helpful empty states with tips

### Returning Users
- Smoother animations
- More contextual help
- Professional legal terminology
- No breaking changes to existing workflows

---

## Production URLs (after deploy)

- **Live App:** `https://lexora.vercel.app` (or custom domain)
- **Vercel Dashboard:** `https://vercel.com/your-team/lexora`
- **Git Repo:** Already committed locally

---

## Known Non-Issues

These are **expected** and **safe to ignore**:

```
[Error]: Dynamic server usage: Route /api/activity...
[Error]: Dynamic server usage: Route /api/analytics...
```

These are build-time warnings for API routes that can't be statically rendered. They don't affect production.

---

## Environment Variables

✅ Already configured in Vercel (no changes needed):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- Any other existing env vars

---

## Support Contacts

**If you hit issues:**
1. Check build logs in Vercel dashboard
2. Check browser console (F12) for errors
3. Message Harris in #lexora-crm-build Discord

**Most common issues:**
- "Module not found" → Run `npm install` before deploy
- "Build failed" → Check TypeScript errors
- "Page not loading" → Check Supabase connection

---

## Success Metrics (after 24 hours)

Track these in analytics:
- [ ] Tooltip interactions (hover counts)
- [ ] Onboarding tour completion rate
- [ ] Empty state CTA clicks
- [ ] User time on page (should increase slightly)
- [ ] Help/support tickets (should decrease)

---

## Quick Commands Reference

```bash
# Deploy to production
vercel --prod

# Check build locally first
npm run build

# Run dev server to test
npm run dev

# View Vercel logs
vercel logs

# Check git status
git log --oneline -5
git status
```

---

## What's Next?

After successful deployment:
1. ✅ Monitor for 24 hours
2. 📊 Collect user feedback
3. 🐛 Fix any bugs discovered
4. 🚀 Plan Phase 3 (advanced features)

---

**Ready?** Run `vercel --prod` and ship it! 🚀
