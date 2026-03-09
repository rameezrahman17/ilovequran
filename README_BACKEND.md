# I Love Quran - Email Backend Setup

## Prerequisites

- Node.js installed (v14 or higher)
- Gmail account with App Password enabled

## Setup Instructions

### 1. Install Dependencies

```bash
cd /Users/rameezrahman/Desktop/my_project
npm install
```

### 2. Configure Environment Variables

The `.env` file has already been created with your credentials:

- Email: rameezrahman17@gmail.com
- App Password: (already configured)

**IMPORTANT**: The `.env` file is in `.gitignore` and will NOT be pushed to GitHub.

### 3. Run the Backend Server

```bash
# Start the server
npm start

# Or for development with auto-reload
npm run dev
```

The server will run on `http://localhost:3000`

### 4. Open the Frontend

Open `index.html` in your browser or use a local server:

```bash
# Using Python
python3 -m http.server 8080

# Or using Node.js http-server
npx http-server -p 8080
```

Then visit: `http://localhost:8080`

## How It Works

1. User fills out the contact form
2. Frontend sends POST request to `http://localhost:3000/api/contact`
3. Backend validates data and sends email via Gmail
4. User receives success/error message

## Security Notes

- ✅ Credentials stored in `.env` (not in code)
- ✅ `.env` added to `.gitignore` (won't be pushed to GitHub)
- ✅ `.env.example` provided as template (safe to share)
- ✅ CORS enabled for local development

## Deployment

For production deployment:

1. Set environment variables on your hosting platform
2. Update the API URL in `contactView.js` from `localhost:3000` to your production URL
3. Never commit `.env` file to GitHub

## Troubleshooting

**Email not sending?**

- Make sure Gmail App Password is correct
- Check if 2-factor authentication is enabled on Gmail
- Verify server is running on port 3000

**CORS errors?**

- Make sure both frontend and backend are running
- Check that the API URL matches in `contactView.js`
