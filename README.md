# Serverless Job Request Platform Deployment Guide

This repository contains a lightweight, modern, and completely free job request platform. It is designed to run entirely serverless, hosting the frontend on **GitHub Pages**, using **Google Sheets** (via Google Apps Script) as your database API, **EmailJS** for mail routing, and **OneSignal** for push notifications.

---

## 📂 File Structure

```text
/
├── index.html          # Public Landing Page (PWA enabled)
├── request.html        # Public Job Request Form Page (with up to 5 image attachments)
├── dashboard.html      # Private Admin Dashboard (to Accept/Decline & Filter requests)
├── manifest.json       # Progressive Web App configuration
├── service-worker.js   # Service worker for caching and push notifications
├── css/
│   └── style.css       # Clean, modern UI stylesheets
└── js/
    └── app.js          # Shared Application Logic (Emails, Push Notification, API)
```

---

## 🚀 Setup Steps

### 1. Google Sheets & Google Apps Script Setup (Free Database)
Your database is a simple Google Sheet. Clients submit requests, and your private dashboard updates state via a Google Apps Script Web App.

1. Create a new **Google Sheet**.
2. Name the first tab (sheet) `Jobs`.
3. Set up the header columns in Row 1:
   - `id`
   - `category`
   - `priority`
   - `clientName`
   - `businessName`
   - `phoneNumber`
   - `email`
   - `jobDescription`
   - `address`
   - `preferredDateTime`
   - `photos` (this stores the comma-separated or JSON list of image storage/URLs/data)
   - `status` (defaults to 'Pending')
   - `isNew` (defaults to TRUE, becomes FALSE when opened)
   - `createdAt`

4. In the spreadsheet's top menu, click **Extensions** > **Apps Script**.
5. Delete any code in the editor and paste the **Google Apps Script Code** provided below.
6. Click the Save icon (floppy disk).
7. In the top right, click **Deploy** > **New deployment**.
8. Click the gear icon next to "Select type" and choose **Web app**.
9. Configure the deployment details:
   - **Description**: `Job Request API`
   - **Execute as**: `Me (your-email@gmail.com)`
   - **Who has access**: `Anyone` (this lets your public form submit data to it)
10. Click **Deploy**.
11. **IMPORTANT**: Copy the generated **Web App URL**. It will look like:
    `https://script.google.com/macros/s/AKfycb.../exec`
12. Paste this URL into your `js/app.js` under `CONFIG.googleSheetsUrl`.

---

### 2. EmailJS Setup (Free Client & Admin Emails)
EmailJS sends emails directly from the browser without exposing servers.

1. Sign up for a free account at [EmailJS](https://www.emailjs.com/).
2. Add a new **Email Service** (e.g., connect Gmail or your business mail). Note your **Service ID** (e.g., `service_xxxxxx`).
3. Create **three Email Templates** with the following details:

#### 📬 Template A: New Job Notification to Admin (You)
- Name your template "New Job Admin Notification" or similar.
- **Template Subject**: `🚨 New Job Request: {{priority}} priority - {{clientName}}`
- **Template Body**:
  ```text
  Hello Admin,

  A new job request has been received! Here are the details:

  - Job ID: {{id}}
  - Category: {{category}}
  - Priority: {{priority}}
  - Client Name: {{clientName}} ({{businessName}})
  - Phone: {{phoneNumber}}
  - Email: {{email}}
  - Preferred Date/Time: {{preferredDateTime}}
  - Address: {{address}}

  Description:
  {{jobDescription}}

  Go to your Private Dashboard to accept or decline:
  {{dashboardUrl}}
  ```
- Copy the **Template ID** (e.g., `template_xxxxxx`).

#### 📬 Template B: Auto‑Reply Confirmation to Client (Customer)
- Name your template "Job Confirmation Auto-Reply".
- **To Email**: `{{email}}`
- **Template Subject**: `🛠️ Job Request Received: {{category}}`
- **Template Body**:
  ```text
  Dear {{clientName}},

  We have successfully received your job request for "{{category}}". Our technical team is reviewing it and will notify you shortly.

  Summary of your request:
  - Priority: {{priority}}
  - Preferred Time: {{preferredDateTime}}
  - Job Description:
    {{jobDescription}}

  Thank you for choosing our services!

  Best regards,
  Support Team
  ```
- Copy the **Template ID**.

#### 📬 Template C: Dispatch Decision Response (Accept/Decline)
- Name your template "Job Status Update".
- **To Email**: `{{email}}`
- **Template Subject**: `Update on your Job Request: {{status}}`
- **Template Body**:
  ```text
  Dear {{clientName}},

  Your job request (ID: {{id}}) for "{{category}}" has been reviewed.

  Status: {{status}}

  Message:
  {{decisionMessage}}

  If you have any questions, please feel free to reach out to us at support@example.com or via phone.

  Best regards,
  Scheduling & Dispatch Team
  ```
- Copy the **Template ID**.

4. Locate your **Public Key** under Account Settings (or API Keys).
5. Open `js/app.js` and paste your IDs in the `CONFIG` block:
   ```javascript
   const CONFIG = {
     emailjsServiceId: "YOUR_SERVICE_ID",
     emailjsTemplateIdToMe: "YOUR_ADMIN_TEMPLATE_ID",
     emailjsTemplateIdToClient: "YOUR_CLIENT_TEMPLATE_ID",
     emailjsTemplateIdDecision: "YOUR_DECISION_TEMPLATE_ID",
     emailjsPublicKey: "YOUR_PUBLIC_KEY",
     ...
   };
   ```

---

### 3. OneSignal Setup (Free Push Notifications)
OneSignal allows sending instant web pushes to your mobile or desktop browser when jobs are submitted or updated.

1. Sign up for a free account at [OneSignal](https://onesignal.com/).
2. Create a new app/website. Choose **Web Push** as the platform.
3. Configure the **Typical Site**:
   - Site Name: `Job Request Dispatch`
   - Site URL: `https://your-username.github.io/your-repo-name`
   - Upload an icon if desired.
4. Under **Permission Prompt Setup**, configure a clean push prompt button or slide prompt.
5. In your OneSignal Dashboard, navigate to **Settings** > **Keys & IDs**.
6. Copy the **App ID** (do not share the API Key; keep App ID public in the code).
7. Paste it in `js/app.js` under `CONFIG.oneSignalAppId`.
8. Ensure you upload `service-worker.js` and `manifest.json` to your GitHub Pages root. OneSignal detects this file to coordinate background notifications!

---

### 4. Deploying to GitHub Pages
1. Push all files to a repository on GitHub.
2. Go to the repository's **Settings** > **Pages**.
3. Under "Build and deployment", set source to **Deploy from a branch** and select `main` (or the branch with your files) and path `/` (root).
4. Save the configuration. After 1-2 minutes, GitHub will publish your site!
5. Navigate to the URL shown (e.g., `https://your-username.github.io/your-repo-name/`) to test the app.
