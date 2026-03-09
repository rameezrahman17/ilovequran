# Gmail App Password Setup Guide

## The Problem

Your Gmail App Password is being rejected with error:

```
535-5.7.8 Username and Password not accepted
```

## Solution: Generate a New App Password

### Step 1: Enable 2-Factor Authentication (if not already enabled)

1. Go to https://myaccount.google.com/security
2. Under "Signing in to Google", click "2-Step Verification"
3. Follow the steps to enable it

### Step 2: Generate App Password

1. Go to https://myaccount.google.com/apppasswords
2. Sign in if prompted
3. Under "Select app", choose "Mail"
4. Under "Select device", choose "Other (Custom name)"
5. Type "I Love Quran" and click "Generate"
6. **Copy the 16-character password** (it will look like: `abcd efgh ijkl mnop`)

### Step 3: Update Your .env File

1. Open terminal in your project folder
2. Run this command (replace `YOUR_NEW_PASSWORD` with the password from step 2, **remove all spaces**):

```bash
cd /Users/rameezrahman/Desktop/my_project
cat > .env << 'EOF'
# Environment Variables
EMAIL_USER=rameezrahman17@gmail.com
EMAIL_APP_PASSWORD=YOUR_NEW_PASSWORD_WITHOUT_SPACES
PORT=3000
EOF
```

Example: If your password is `abcd efgh ijkl mnop`, use `abcdefghijklmnop`

### Step 4: Restart the Server

1. Stop the current server (Ctrl+C in the terminal running npm start)
2. Start it again: `npm start`

### Step 5: Test

1. Go to http://localhost:8080
2. Click Contact
3. Submit the form

---

## Alternative: Use a Different Email Service

If Gmail continues to have issues, you can use a different email service. Let me know if you want to try:

- Outlook/Hotmail
- SendGrid
- Mailgun
- Or any other SMTP service
