# Supabase Setup Guide

## Database + Auth Setup for Academic Writing Platform

This project now uses Supabase instead of Firebase. Follow these steps to get
Supabase running locally.

---

## Step 1: Create a Supabase Project

1. Go to https://supabase.com/dashboard
2. Click **New project**
3. Choose an organization, enter a name, set a database password
4. Create the project and wait for provisioning

---

## Step 2: Grab Your API Keys

In the Supabase dashboard:

1. Go to **Project Settings → API**
2. Copy:
   - **Project URL**
   - **Publishable (anon) key**
   - **Service role key** (secret, server-only)

---

## Step 3: Set Environment Variables

Open `.env.local` and add:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_DEV_AUTH_BYPASS=true
```

Notes:
- `NEXT_PUBLIC_DEV_AUTH_BYPASS=true` skips login during development.
- Data still writes to Supabase even in dev bypass mode.

---

## Step 4: Create the Database Schema

1. Go to **SQL Editor**
2. Create a new query
3. Paste the contents of `supabase/schema.sql`
4. Click **Run**

---

## Step 5: Create Storage Bucket

1. Go to **Storage**
2. Create a bucket named `papers`
3. Set it to **public**

---

## Step 6: (Optional) Enable Google Auth

If you want real auth instead of dev bypass:

1. Go to **Authentication → Providers**
2. Enable **Google**
3. Add redirect URL: `http://localhost:2550/auth/callback`

---

## Step 7: Run the App

```bash
npm run dev
```

Open: http://localhost:2550

---

## ✅ Verification Checklist

- [ ] Supabase project created
- [ ] Keys added to `.env.local`
- [ ] `supabase/schema.sql` executed
- [ ] `papers` storage bucket created (public)
- [ ] App runs on http://localhost:2550
- [ ] Create document works
- [ ] Auto-save writes to Supabase
