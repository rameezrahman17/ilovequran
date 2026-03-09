# Supabase Backend Setup Guide

## Overview

This guide will help you set up the Supabase database for storing contact form submissions.

## Step 1: Create Database Table

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project: `olffnnxkssmkrhqihrat`
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the contents of `supabase_migration.sql`
6. Click **Run** to execute the migration

## Step 2: Verify Table Creation

After running the migration, you should see:

- A new table called `contact_submissions` in your database
- The verification query at the end will show all columns

## Step 3: Test the Integration

1. Start your server: `npm start`
2. Navigate to http://localhost:3000
3. Go to the Contact page and submit a test form
4. Check your Supabase dashboard under **Table Editor** → **contact_submissions**
5. You should see your test submission appear

## Admin Access

### Login Credentials

- **URL**: http://localhost:3000/#admin-login
- **Username**: `admin`
- **Password**: `admin123`

> **Security Note**: Change the admin password in production by updating the `ADMIN_PASSWORD_HASH` in your `.env` file. Generate a new hash using bcrypt.

### Accessing the Admin Panel

1. Navigate to http://localhost:3000/#admin-login (manually type the URL)
2. Enter your admin credentials
3. You'll be redirected to the admin dashboard
4. View all contact form submissions in a table format
5. Use the search box to filter submissions

### Important Security Notes

- The admin login page is NOT linked anywhere on the main website
- Access is only possible by directly typing the URL
- JWT tokens expire after 24 hours
- All sensitive keys are stored in `.env` (gitignored)
- The Supabase service key is never exposed to the frontend

## Troubleshooting

### "Failed to fetch submissions"

- Ensure your server is running (`npm start`)
- Check that the Supabase URL and service key are correct in `.env`
- Verify the table was created successfully in Supabase

### "Invalid credentials"

- Default username: `admin`
- Default password: `admin123`
- Check that `ADMIN_PASSWORD_HASH` matches in `.env`

### Database Connection Issues

- Verify `SUPABASE_URL` is correct
- Ensure `SUPABASE_SERVICE_KEY` is the **service role key**, not the anon key
- Check your Supabase project is active and not paused

## Environment Variables Reference

```env
# Supabase Configuration
SUPABASE_URL=https://olffnnxkssmkrhqihrat.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here

# JWT Secret (change in production)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$10$xQZ8vK5YJ3yH9X2L4N6mPeWqR8tF7sG9hU1jV3kW5nM7oP2qR4sT6
```

## Changing Admin Password

To change the admin password:

1. Install bcrypt globally (if not already): `npm install -g bcrypt-cli`
2. Generate a new hash: `node -e "console.log(require('bcrypt').hashSync('your_new_password', 10))"`
3. Update `ADMIN_PASSWORD_HASH` in `.env` with the new hash
4. Restart your server

## Database Schema

```sql
Table: contact_submissions
- id (UUID, Primary Key)
- name (TEXT, NOT NULL)
- email (TEXT, NOT NULL)
- contact (TEXT, nullable)
- rating (INTEGER, 1-5, nullable)
- message (TEXT, NOT NULL)
- created_at (TIMESTAMP WITH TIME ZONE, default: NOW())
```
