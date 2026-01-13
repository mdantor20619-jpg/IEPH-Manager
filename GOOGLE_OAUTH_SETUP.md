# Google OAuth Integration Setup Guide

## 🔐 Gmail Verification for IEPH Manager

This guide will help you set up Google OAuth authentication for the IEPH Manager application. This enables secure Gmail-based login and ensures data protection.

---

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click **NEW PROJECT**
4. Enter project name: `IEPH Manager`
5. Click **CREATE**
6. Wait for the project to be created and select it

---

## Step 2: Enable Google+ API

1. In the Google Cloud Console, navigate to **APIs & Services** > **Library**
2. Search for **Google+ API**
3. Click on it and press **ENABLE**
4. Go back and search for **Google Identity Services API**
5. Enable that as well

---

## Step 3: Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
3. If prompted, configure the OAuth consent screen first:
   - Select **External** user type
   - Click **CREATE**
   - Fill in:
     - **App name**: `IEPH Manager`
     - **User support email**: Your email
     - **Developer contact**: Your email
   - Click **SAVE AND CONTINUE**
   - Skip optional scopes and click **SAVE AND CONTINUE**
   - Add test users with their Gmail addresses
   - Click **SAVE AND CONTINUE** > **BACK TO DASHBOARD**

4. Now create the OAuth credential:
   - Click **+ CREATE CREDENTIALS** > **OAuth client ID**
   - Select **Web application** as the application type
   - Give it a name: `IEPH Manager Web Client`
   - Under **Authorized JavaScript origins**, add:
     ```
     http://localhost:3000
     http://localhost:5173
     https://your-netlify-domain.netlify.app
     ```
   - Under **Authorized redirect URIs**, add:
     ```
     http://localhost:3000/callback
     http://localhost:5173/callback
     https://your-netlify-domain.netlify.app/callback
     ```
   - Click **CREATE**
   - Copy your **Client ID**

---

## Step 4: Add Client ID to Application

### For Development:

1. Open `components/Auth.tsx`
2. Find this line:
   ```typescript
   client_id: '1234567890-YOUR_CLIENT_ID.apps.googleusercontent.com'
   ```
3. Replace `1234567890-YOUR_CLIENT_ID` with your actual Client ID from Step 3
4. The file appears twice in the `useEffect` hook - update both

### For Production:

1. Set environment variables in your Netlify deployment:
   - Go to Netlify dashboard
   - Select your site
   - Go to **Site settings** > **Build & deploy** > **Environment**
   - Add variable:
     ```
     VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID
     ```

2. Update `components/Auth.tsx` to use the environment variable:
   ```typescript
   client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '1234567890-YOUR_CLIENT_ID.apps.googleusercontent.com'
   ```

---

## Step 5: Test Gmail Login

### Local Testing:

1. Run the development server:
   ```bash
   npm install
   npm run dev
   ```

2. Open http://localhost:5173
3. Click **"Or: Sign in with Google"** button
4. Sign in with your Google account
5. Verify that your Gmail address appears in the app

### Production Testing:

1. Add test user emails to Google OAuth consent screen
2. Deploy to Netlify: `git push`
3. Access your live app and test Gmail login

---

## How It Works

### Authentication Flow:

```
User clicks "Sign in with Google"
    ↓
Google Sign-In popup appears
    ↓
User authenticates with Gmail
    ↓
Google returns JWT token
    ↓
App decodes token to extract email & name
    ↓
Data stored locally with Gmail as identifier
    ↓
User logged in and dashboard accessible
```

### Data Storage:

- All data is stored **locally** in browser's localStorage
- Gmail address is stored as the unique identifier
- Data is linked to the Gmail account for verification
- Export/backup functionality available in Settings

---

## Login Methods Available

### 1. Simple Name Login (Default)
- Enter any name to access dashboard
- Best for single device/local use
- Data saved locally

### 2. Google OAuth Login (Secure)
- Gmail verification required
- Data linked to Gmail account
- More secure for important data
- Can only access from verified Gmail account

---

## Troubleshooting

### "Google is not defined" Error
- Ensure Google Identity Services API is enabled
- Check internet connection
- Clear browser cache and reload

### "Failed to sign in with Google"
- Verify Client ID is correct
- Check if Google domain is in Authorized origins
- Check browser console for detailed error

### Gmail not recognized
- Add Gmail to OAuth consent screen test users
- For production, submit app for verification
- Wait for Google review (usually 1-5 days)

### Data not loading after Gmail login
- Check browser's localStorage (DevTools > Application > Storage)
- Verify Gmail address is being stored correctly
- Try exporting data first to ensure backup exists

---

## Security Best Practices

✅ **DO:**
- Keep your Client ID private
- Use HTTPS in production
- Add only trusted domains to authorized origins
- Regularly review authorized users in Google Cloud Console
- Export data backups periodically

❌ **DON'T:**
- Commit actual Client ID to public repositories
- Share Client Secret publicly
- Add unlimited domains to authorization
- Store sensitive data unencrypted

---

## For Production Deployment

1. **Verify your domain** with Google
2. **Submit OAuth app for verification** (required for production)
   - Go to OAuth consent screen
   - Click **PUBLISH APP**
   - Answer verification questions
   - Submit for review
3. **Wait for approval** (1-5 business days)
4. **Update production Client ID** after approval
5. **Monitor login activity** in Google Cloud Console

---

## Support

For issues or questions:
- Check [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- Review error messages in browser console
- Contact developer for further assistance

---

**Version:** 1.0  
**Last Updated:** January 2026
