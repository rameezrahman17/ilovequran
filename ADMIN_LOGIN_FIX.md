# Admin Login Fix - Quick Guide

## Issue

Admin login was showing "Invalid credentials" even with correct username and password.

## Root Cause

The password hash in `.env` was incorrect. The bcrypt hash didn't match the password "admin123".

## Solution Applied

1. **Generated correct bcrypt hash:**

   ```bash
   node -e "const bcrypt = require('bcrypt'); console.log(bcrypt.hashSync('admin123', 10));"
   ```

   Result: `$2b$10$Mb1Q.CiMvHAksqA0jtTCbuWZsviNcEAkNc.1kXEaOQkott8h4yqJe`

2. **Updated `.env` file** with the correct hash

3. **Restarted the server** to load new environment variables

## Current Working Credentials

- **Username:** `admin`
- **Password:** `admin123`
- **Login URL:** http://localhost:3000/#admin-login

## Important Reminder

**Always restart the server after changing `.env` file:**

```bash
# Stop the server (Ctrl+C in terminal)
# Then restart:
npm start
```

## Verified Working

✅ Login API tested successfully  
✅ JWT token generated correctly  
✅ Server running on port 3000

You can now login to the admin panel!
