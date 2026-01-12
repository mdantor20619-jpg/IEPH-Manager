
# IEPH Manager - Production Deployment Guide

This application is ready to be deployed to Netlify. Follow these steps to get your student management system online.

## 1. Google Cloud Setup (OAuth)
Before deploying, you must configure Google Login:
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new Project.
3. Navigate to **APIs & Services > OAuth consent screen**.
   - Select 'External'.
   - Add your email and app name ("IEPH Manager").
4. Navigate to **Credentials > Create Credentials > OAuth client ID**.
   - Select 'Web application'.
   - Add `http://localhost:3000` (for testing) and your Netlify URL (e.g., `https://ieph-manager.netlify.app`) to **Authorized JavaScript origins**.
5. Copy the **Client ID**.

## 2. Netlify Deployment
1. Connect your repository to Netlify.
2. Go to **Site Settings > Build & deploy > Environment variables**.
3. Add the following variable:
   - `REACT_APP_GOOGLE_CLIENT_ID`: (The Client ID you copied above)
4. Trigger a new deploy.

## Features
- **Gmail Auth**: Secure teacher-only access.
- **Auto Cloud Backup**: Data is persisted to LocalStorage and synced via Gmail ID.
- **Attendance & Fines**: Automated fine generation for absentees.
- **Honorium Tracking**: Detailed monthly fee management.
- **Mobile First**: Fully responsive design for use on-the-go.

## Technical Details
- **Build Tool**: Vite / ES6 Modules
- **Styling**: Tailwind CSS
- **Framework**: React 19
- **Auth**: Google Identity Services (GIS)
