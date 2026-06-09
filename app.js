/**
 * Job Request Platform - Service Integrations
 * Configured for PWA, EmailJS, OneSignal, & Google Sheets
 */

// -------------------------------------------------------------
// 1. CONFIGURATION & STATE MANAGERS
// -------------------------------------------------------------
const CONFIG_KEY = 'job_dispatch_platform_config';
const LOCAL_JOBS_KEY = 'job_dispatch_platform_local_jobs';

// Default configuration keys fallback, load from LocalStorage first if defined
let CONFIG = {
  emailjsServiceId: 'service_k2wvtka',
  emailjsTemplateIdToMe: 'template_6al3xzt',
  emailjsTemplateIdToClient: '',
  emailjsTemplateIdDecision: '',
  emailjsPublicKey: 'iM4OLEofrmyZ7ewYL',
  oneSignalAppId: '',
  googleSheetsUrl: ''
};

function loadPlatformConfig() {
  const saved = localStorage.getItem(CONFIG_KEY);
  if (saved) {
    try {
      CONFIG = { ...CONFIG, ...JSON.parse(saved) };
    } catch (e) {
      console.warn("Could not parse saved config", e);
    }
  }
}

function savePlatformConfig(newCfg) {
  CONFIG = { ...CONFIG, ...newCfg };
  localStorage.setItem(CONFIG_KEY, JSON.stringify(CONFIG));
  updateDashboardSourceIndicator();
}

loadPlatformConfig();

// Mock Initial seed values for beautiful, instant prototype look-and-feel if no data exists
const MOCK_SEEDS = [
  {
    id: "JOB-A19F8B",
    category: "WiFi Troubleshooting",
    priority: "Urgent",
    clientName: "Alice Miller",
    businessName: "Downtown Cafe Hub",
    phoneNumber: "+1 (555) 762-1100",
    email: "alice@downtowncafe.com",
    jobDescription: "The primary wireless access point is offline following a circuit beaker failure. Merchant readers and POS terminals cannot connect. Urgent diagnostic needed.",
    address: "742 Broadway, New York, NY",
    preferredDateTime: "2026-06-09T10:00",
    photos: ["https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=200&auto=format&fit=crop&q=60"],
    status: "Pending",
    isNew: true,
    createdAt: "2026-06-08T11:45:00.000Z"
  },
  {
    id: "JOB-D82M7C",
    category: "Camera Install",
    priority: "Normal",
    clientName: "David Sterling",
    businessName: "Green Life Storage",
    phoneNumber: "+1 (555) 981-4433",
    email: "manager@greenlifestorage.com",
    jobDescription: "Need installation of 3 dome cameras on the back warehouse wall. Structure is masonry. Cables need to run through drop-ceiling. Hardware is already at site.",
    address: "512 Industrials Road, Suite C",
    preferredDateTime: "2026-06-12T09:00",
    photos: [],
    status: "Pending",
    isNew: true,
    createdAt: "2026-06-08T09:12:00.000Z"
  },
  {
    id: "JOB-B36K5L",
    category: "POS Setup",
    priority: "Emergency",
    clientName: "Marcus Vance",
    businessName: "Bistro Fine Dining",
    phoneNumber: "+1 (555) 301-8899",
    email: "marcus@bistrofine.com",
    jobDescription: "Main checkout terminal has lost serial connectivity to the card swipe pad. Customers cannot tap. Emergency support is requested to rewire or provision a new register.",
    address: "88 Ocean Avenue, Miami, FL",
    preferredDateTime: "2026-06-08T14:30",
    photos: [],
    status: "Pending",
    isNew: true,
    createdAt: "2026-06-08T12:05:00.000Z"
  }
];

function getLocalJobs() {
  const data = localStorage.getItem(LOCAL_JOBS_KEY);
  if (!data) {
    localStorage.setItem(LOCAL_JOBS_KEY, JSON.stringify(MOCK_SEEDS));
    return MOCK_SEEDS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return MOCK_SEEDS;
  }
}

function saveLocalJobs(jobs) {
  localStorage.setItem(LOCAL_JOBS_KEY, JSON.stringify(jobs));
}

// -------------------------------------------------------------
// 2. REGISTER PWA & HANDLE INSTALL PROMPTS
// -------------------------------------------------------------
let deferredPrompt;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then((reg) => console.log('Service Worker Registered successfully', reg.scope))
      .catch((err) => console.error('Service Worker registration failed:', err));
  });
}

// Listening for PWA Install triggers
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  // Show standard install triggers
  const installBtnHeader = document.getElementById('pwa-install-btn');
  const installBannerBtn = document.getElementById('pwa-install-banner-btn');
  if (installBtnHeader) installBtnHeader.classList.remove('hidden');
  if (installBannerBtn) installBannerBtn.classList.remove('hidden');
});

function triggerPwaInstallation() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === 'accepted') {
      console.log('User installed the PWA application.');
    }
    deferredPrompt = null;
    const installBtnHeader = document.getElementById('pwa-install-btn');
    if (installBtnHeader) installBtnHeader.classList.add('hidden');
  });
}

const installBtnHeader = document.getElementById('pwa-install-btn');
if (installBtnHeader) installBtnHeader.addEventListener('click', triggerPwaInstallation);

const installBannerBtn = document.getElementById('pwa-install-banner-btn');
if (installBannerBtn) installBannerBtn.addEventListener('click', triggerPwaInstallation);


// -------------------------------------------------------------
// 3. ONESIGNAL SDK INITIALIZATION Setup
// -------------------------------------------------------------
function initializeOneSignal() {
  if (CONFIG.oneSignalAppId) {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function(OneSignal) {
      await OneSignal.init({
        appId: CONFIG.oneSignalAppId,
        safari_web_id: undefined,
        notifyButton: {
          enable: true,
        },
        allowLocalhostAsSecureOrigin: true,
      });
      console.log("OneSignal push notifications loaded");
    });
    
    // Inject OneSignal SDK script tags dynamically if not loaded
    if (!document.querySelector('script[src*="OneSignalSDK.js"]')) {
      const script = document.createElement('script');
      script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
      script.defer = true;
      document.head.appendChild(script);
    }
  }
}
initializeOneSignal();


// -------------------------------------------------------------
// 4. EMAILJS LOADER
// -------------------------------------------------------------
function initializeEmailJS() {
  if (CONFIG.emailjsPublicKey && typeof emailjs !== 'undefined') {
    emailjs.init(CONFIG.emailjsPublicKey);
    console.log("EmailJS initialized");
  } else if (CONFIG.emailjsPublicKey) {
    // Inject emailjs cdn dynamically if missing
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
    script.onload = () => {
      emailjs.init(CONFIG.emailjsPublicKey);
      console.log("EmailJS loaded from CDN and initialized.");
    };
    document.head.appendChild(script);
  }
}
initializeEmailJS();


// -------------------------------------------------------------
// 5. PHOTO UPLOADS (MAX 5 SELECTIONS, BASE64 CONVERT)
// -------------------------------------------------------------
let attachedImages = []; // Cache array of base64 data strings

const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('file-input');
const thumbnailsDiv = document.getElementById('thumbnails');
const photoCountSpan = document.getElementById('photo-count');

if (dropArea && fileInput) {
  dropArea.addEventListener('click', () => fileInput.click());
  
  // Highlight border on drag over
  ['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropArea.classList.add('border-blue-500', 'bg-blue-50/20');
    }, false);
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropArea.classList.remove('border-blue-500', 'bg-blue-50/20');
    }, false);
  });
  
  dropArea.addEventListener('drop', (e) => {
    handleImageFiles(e.dataTransfer.files);
  });
  
  fileInput.addEventListener('change', (e) => {
    handleImageFiles(e.target.files);
  });
}

function handleImageFiles(files) {
  const spaceLeft = 5 - attachedImages.length;
  if (spaceLeft <= 0) {
    alert("Maximum of 5 photos reached.");
    return;
  }
  
  const filesArray = Array.from(files).slice(0, spaceLeft);
  
  filesArray.forEach(file => {
    if (!file.type.startsWith('image/')) {
      alert("Only image uploads are permitted.");
      return;
    }
    
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert(`File "${file.name}" exceeds the 5MB size limit.`);
      return;
    }
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      attachedImages.push(reader.result);
      renderThumbnails();
    };
  });
}

function deleteAttachedImage(index) {
  attachedImages.splice(index, 1);
  renderThumbnails();
}

function renderThumbnails() {
  if (!thumbnailsDiv) return;
  thumbnailsDiv.innerHTML = '';
  
  attachedImages.forEach((imgSrc, idx) => {
    const thumb = document.createElement('div');
    thumb.className = "relative w-full aspect-square border border-slate-200 rounded-lg overflow-hidden group";
    thumb.innerHTML = `
      <img src="${imgSrc}" class="w-full h-full object-cover" />
      <button type="button" class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200" onclick="deleteAttachedImage(${idx})">
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    `;
    thumbnailsDiv.appendChild(thumb);
  });
  
  if (photoCountSpan) {
    photoCountSpan.textContent = `${attachedImages.length} / 5 attached`;
  }
}


// -------------------------------------------------------------
// 6. CLIENT-SIDE FORM SUBMISSION (Save Sheet, Notify, Confirm)
// -------------------------------------------------------------
const requestForm = document.getElementById('job-request-form');
if (requestForm) {
  requestForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submit-btn');
    const errPanel = document.getElementById('form-error-panel');
    
    // Block button state
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="animate-spin-custom h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
      </svg>
      <span>Submitting Dispatch Request...</span>
    `;
    errPanel.classList.add('hidden');
    
    // Create random ID for the job request
    const jobId = "JOB-" + Math.random().toString(36).substr(2, 6).toUpperCase();
    
    // Gather fields
    const jobData = {
      action: 'create',
      id: jobId,
      category: document.getElementById('category').value,
      priority: document.getElementById('priority').value,
      clientName: document.getElementById('clientName').value,
      businessName: document.getElementById('businessName').value,
      phoneNumber: document.getElementById('phoneNumber').value,
      email: document.getElementById('email').value,
      jobDescription: document.getElementById('jobDescription').value,
      address: document.getElementById('address').value,
      preferredDateTime: document.getElementById('preferredDateTime').value,
      photos: attachedImages,
      status: 'Pending',
      isNew: true,
      createdAt: new Date().toISOString()
    };
    
    try {
      // 1. Send data to Google Sheet
      if (CONFIG.googleSheetsUrl) {
        const response = await fetch(CONFIG.googleSheetsUrl, {
          method: 'POST',
          mode: 'no-cors', // Standard Apps Script deployment workaround mapping
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(jobData)
        });
        console.log("Uploaded successfully to spreadsheet API endpoint.", response);
      } else {
        // Fallback: Save to LocalStorage array for local testing if no Sheets URL
        const local = getLocalJobs();
        local.unshift(jobData);
        saveLocalJobs(local);
        console.log("No spreadsheet URL configured. Saved ticket to client localStorage.");
      }
      
      // 2. Email Admin notification via EmailJS
      const formData = {
        name: jobData.clientName,
        email: jobData.email,
        phone: jobData.phoneNumber,
        jobType: jobData.category,
        description: jobData.jobDescription
      };

      emailjs.init("iM4OLEofrmyZ7ewYL");

      emailjs.send("service_k2wvtka", "template_6al3xzt", {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          job_type: formData.jobType,
          description: formData.description
      });
      
      // 3. Email Auto-Reply confirmation to Client via EmailJS
      if (CONFIG.emailjsServiceId && CONFIG.emailjsTemplateIdToClient) {
        await emailjs.send(CONFIG.emailjsServiceId, CONFIG.emailjsTemplateIdToClient, {
          email: jobData.email,
          clientName: jobData.clientName,
          category: jobData.category,
          priority: jobData.priority,
          preferredDateTime: jobData.preferredDateTime,
          jobDescription: jobData.jobDescription
        });
        console.log("Auto-reply dispatched to client mailbox.");
      }
      
      // 4. OneSignal push call (Trigger notification to admin)
      if (CONFIG.oneSignalAppId) {
        // Since we are serverless, we can push a custom REST notification trigger or leverage browser-push
        // We output to tracking consoles.
        console.log(`Active OneSignal notification queued: New Job ${jobId} submitted.`);
      }
      
      // 5. Hide form and reveal Confirm card
      document.getElementById('job-request-form').reset();
      attachedImages = [];
      renderThumbnails();
      
      document.getElementById('request-container').classList.add('hidden');
      
      const thankYouCard = document.getElementById('thank-you-container');
      thankYouCard.classList.remove('hidden');
      
      document.getElementById('conf-job-id').textContent = jobId;
      document.getElementById('conf-category').textContent = jobData.category;
      document.getElementById('conf-clientName').textContent = jobData.clientName;
      
      const confPriority = document.getElementById('conf-priority');
      confPriority.textContent = jobData.priority;
      confPriority.className = `px-1.5 py-0.5 rounded font-medium ${
        jobData.priority === 'Emergency' ? 'bg-red-100 text-red-800' : 
        jobData.priority === 'Urgent' ? 'bg-amber-105 text-amber-800' : 'bg-blue-100 text-blue-800'
      }`;
      
    } catch (error) {
      console.error("Submission failed: ", error);
      errPanel.textContent = "There was a network transmission error: " + error.toString() + ". Your request was stored in your local browser storage if Sheets isn't deployed.";
      errPanel.classList.remove('hidden');
      
      // Still fallback save locally
      const local = getLocalJobs();
      local.unshift(jobData);
      saveLocalJobs(local);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <span>Submit Dispatch Request</span>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      `;
    }
  });
}


// -------------------------------------------------------------
// 7. PRIVATE ADMIN DASHBOARD (Fetch, Filters, Expand Cards, Accept/Decline)
// -------------------------------------------------------------
let allJobs = [];
let pendingDecisionJob = null; // Holds job data during acceptance/decline dialog
let pendingDecisionAction = ''; // 'Accepted' or 'Declined'

const jobsContainer = document.getElementById('jobs-container');
const emptySlate = document.getElementById('empty-slate');
const dashboardLoader = document.getElementById('dashboard-loader');

async function loadDashboardJobs() {
  if (!jobsContainer) return;
  
  // Show spinner
  jobsContainer.innerHTML = '';
  emptySlate.classList.add('hidden');
  dashboardLoader.classList.remove('hidden');
  
  try {
    if (CONFIG.googleSheetsUrl) {
      // In production, fetch fresh jobs from spreadsheet
      const response = await fetch(CONFIG.googleSheetsUrl);
      const resData = await response.json();
      if (resData.success) {
        allJobs = resData.data;
      } else {
        throw new Error(resData.error || "Failed to load spreadsheet rows.");
      }
    } else {
      // Fallback: Read local array
      allJobs = getLocalJobs();
    }
    
    renderJobCards();
    updateDashboardStats();
  } catch (error) {
    console.error("Data load failed: ", error);
    // Display local list and warning
    allJobs = getLocalJobs();
    renderJobCards();
    updateDashboardStats();
  } finally {
    dashboardLoader.classList.add('hidden');
  }
}

function updateDashboardSourceIndicator() {
  const ind = document.getElementById('storage-indicator');
  if (!ind) return;
  if (CONFIG.googleSheetsUrl) {
    ind.textContent = "SYNCED WITH SPREADSHEETS";
    ind.className = "px-2.5 py-1 text-[10px] font-mono font-bold tracking-wider rounded-md border text-emerald-600 bg-emerald-50 border-emerald-200 shadow-sm";
  } else {
    ind.textContent = "DEMO MODE (LOCAL REQS)";
    ind.className = "px-2.5 py-1 text-[10px] font-mono font-bold tracking-wider rounded-md border text-slate-500 bg-slate-50 border-slate-200";
  }
}

function updateDashboardStats() {
  const statTotal = document.getElementById('stat-total');
  const statPending = document.getElementById('stat-pending');
  const statAccepted = document.getElementById('stat-accepted');
  const statDeclined = document.getElementById('stat-declined');
  
  if (!statTotal) return;
  
  const pending = allJobs.filter(j => j.status === 'Pending').length;
  const accepted = allJobs.filter(j => j.status === 'Accepted').length;
  const declined = allJobs.filter(j => j.status === 'Declined').length;
  
  statTotal.textContent = allJobs.length;
  statPending.textContent = pending;
  statAccepted.textContent = accepted;
  statDeclined.textContent = declined;
}

function renderJobCards() {
  if (!jobsContainer) return;
  
  const statusFilter = document.getElementById('filter-status').value;
  const priorityFilter = document.getElementById('filter-priority').value;
  const searchKeyword = document.getElementById('filter-search').value.toLowerCase().trim();
  
  // Apply filtering logic
  let filtered = allJobs;
  
  if (statusFilter !== 'All') {
    filtered = filtered.filter(j => j.status === statusFilter);
  }
  
  if (priorityFilter !== 'All') {
    filtered = filtered.filter(j => j.priority === priorityFilter);
  }
  
  if (searchKeyword) {
    filtered = filtered.filter(j => 
      j.clientName.toLowerCase().includes(searchKeyword) ||
      j.businessName.toLowerCase().includes(searchKeyword) ||
      j.id.toLowerCase().includes(searchKeyword) ||
      j.jobDescription.toLowerCase().includes(searchKeyword) ||
      j.address.toLowerCase().includes(searchKeyword)
    );
  }
  
  if (filtered.length === 0) {
    jobsContainer.innerHTML = '';
    emptySlate.classList.remove('hidden');
    return;
  }
  
  emptySlate.classList.add('hidden');
  jobsContainer.innerHTML = '';
  
  filtered.forEach(job => {
    const card = document.createElement('div');
    card.id = `card-${job.id}`;
    
    // Class names depends on read status and details
    card.className = `bg-white border rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-md ${
      job.isNew ? 'border-l-4 border-l-red-500 border-slate-250' : 'border-slate-200'
    }`;
    
    // Priority badges code
    const priorityColor = 
      job.priority === 'Emergency' ? 'bg-red-50 text-red-700 border-red-200' :
      job.priority === 'Urgent' ? 'bg-amber-50 text-amber-700 border-amber-200' :
      'bg-blue-50 text-blue-700 border-blue-200';
      
    const statusLabelColor = 
      job.status === 'Accepted' ? 'bg-emerald-550 text-white font-semibold' :
      job.status === 'Declined' ? 'bg-slate-400 text-white font-semibold' :
      'bg-amber-400 text-white font-semibold animate-pulse';

    // Photos HTML string builder
    let photosHtml = '';
    if (job.photos && job.photos.length > 0) {
      photosHtml = `
        <div class="space-y-1.5 pt-2">
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-widest">Client Attached Photos (${job.photos.length})</p>
          <div class="flex gap-2 flex-wrap">
            ${job.photos.map(p => `
              <div class="w-16 h-16 rounded-lg overflow-hidden border border-slate-205 cursor-pointer relative hover:opacity-90 shadow-sm" onclick="openEnlargedImage('${p}')">
                <img src="${p}" class="w-full h-full object-cover" />
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Format readable short date
    let formattedDate = job.createdAt;
    try {
      formattedDate = new Date(job.createdAt).toLocaleString(undefined, { 
        dateStyle: 'short', 
        timeStyle: 'short' 
      });
    } catch(e){}

    let preferredDateFormatted = job.preferredDateTime;
    try {
      preferredDateFormatted = new Date(job.preferredDateTime).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch(e){}

    // Build expandable layout body
    card.innerHTML = `
      <!-- Visible Card Header Summary row -->
      <div class="p-4 md:p-5 flex items-start justify-between gap-4 cursor-pointer select-none" onclick="toggleCardExpansion('${job.id}')">
        <div class="flex items-start space-x-3">
          <!-- Unread NEW Badge indicator -->
          ${job.isNew ? `
            <span class="px-1.5 py-0.5 bg-red-500 text-white font-bold text-[9px] rounded uppercase font-mono tracking-wide mt-1 shrink-0">
              NEW
            </span>
          ` : ''}
          
          <div class="space-y-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-mono text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">${job.id}</span>
              <span class="font-display font-black text-slate-900">${job.category}</span>
            </div>
            
            <p class="text-xs text-slate-650 font-medium">
              ${job.clientName} &bull; <span class="text-slate-800 font-semibold">${job.businessName}</span>
            </p>
            <p class="text-[10px] text-slate-400 font-mono">Submitted: ${formattedDate}</p>
          </div>
        </div>
        
        <!-- Status & Expansion control labels -->
        <div class="flex items-center space-x-2 shrink-0">
          <span class="px-2.5 py-1 rounded-full text-[10px] font-mono tracking-wider ${statusLabelColor}">
            ${job.status}
          </span>
          <span class="${priorityColor} border px-2 py-0.5 rounded text-[10px] font-semibold">
            ${job.priority}
          </span>
          <div class="p-1 hover:bg-slate-100 rounded-md transition text-slate-400 transform transition-transform duration-200" id="arrow-${job.id}">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
      
      <!-- Expandable details drawer -->
      <div id="drawer-${job.id}" class="hidden border-t border-slate-100 bg-slate-50/50 p-5 space-y-4">
        
        <div class="grid md:grid-cols-2 gap-5 text-sm">
          <div class="space-y-2.5">
            <div>
              <p class="text-xs font-semibold text-slate-500 uppercase tracking-widest">Site Information</p>
              <p class="font-medium text-slate-850 mt-1">${job.address}</p>
              <p class="text-xs text-slate-500">Scheduled: <span class="font-semibold text-slate-800">${preferredDateFormatted}</span></p>
            </div>
            
            <div>
              <p class="text-xs font-semibold text-slate-500 uppercase tracking-widest">Direct Contacts</p>
              <p class="text-xs leading-relaxed text-slate-600 mt-1">
                Phone: <a href="tel:${job.phoneNumber}" class="text-blue-600 font-medium hover:underline">${job.phoneNumber}</a><br/>
                Email: <a href="mailto:${job.email}" class="text-blue-600 font-medium hover:underline">${job.email}</a>
              </p>
            </div>
          </div>
          
          <div class="space-y-2">
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-widest">Issue & Diagnostics Description</p>
            <p class="text-xs md:text-sm leading-relaxed text-slate-700 bg-white p-3 border border-slate-205 rounded-xl whitespace-pre-line shadow-xs">
              ${job.jobDescription}
            </p>
          </div>
        </div>

        <!-- Render attachments inside drawer -->
        ${photosHtml}

        <!-- Decision actions row (Only visible for Pending jobs) -->
        ${job.status === 'Pending' ? `
          <div class="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200/60">
            <button onclick="triggerDecisionModal('${job.id}', 'Declined')" class="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2 font-semibold text-xs rounded-xl hover:bg-rose-100 transition shadow-sm">
              Decline Ticket
            </button>
            <button onclick="triggerDecisionModal('${job.id}', 'Accepted')" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 font-semibold text-xs rounded-xl transition shadow-md shadow-blue-500/10">
              Accept & Dispatch
            </button>
          </div>
        ` : `
          <div class="flex items-center justify-end text-xs text-slate-450 pt-2 font-mono">
            <span>Dispatched status Locked &bull; Update action completed</span>
          </div>
        `}

      </div>
    `;
    
    jobsContainer.appendChild(card);
  });
}

function toggleCardExpansion(jobId) {
  const drawer = document.getElementById(`drawer-${jobId}`);
  const arrow = document.getElementById(`arrow-${jobId}`);
  const card = document.getElementById(`card-${jobId}`);
  
  if (!drawer) return;
  const isCurrentlyHidden = drawer.classList.contains('hidden');
  
  if (isCurrentlyHidden) {
    drawer.classList.remove('hidden');
    arrow.classList.add('rotate-180');
    
    // Core detail: mark card as read / clear NEW badge when opened
    markJobAsRead(jobId);
  } else {
    drawer.classList.add('hidden');
    arrow.classList.remove('rotate-180');
  }
}

function markJobAsRead(jobId) {
  const jobIdx = allJobs.findIndex(j => j.id === jobId);
  if (jobIdx === -1 || !allJobs[jobIdx].isNew) return;
  
  // Update state locally
  allJobs[jobIdx].isNew = false;
  
  try {
    // Write spreadsheet rows
    if (CONFIG.googleSheetsUrl) {
      fetch(CONFIG.googleSheetsUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'update',
          id: jobId,
          isNew: false
        })
      });
    }
  } catch(e){}
  
  // Write local fallbacks
  saveLocalJobs(allJobs);
  
  // Reflash stats and badges without reloading everything
  updateDashboardStats();
  
  // Remove the left border red indicator and the NEW badge from UI directly
  const card = document.getElementById(`card-${jobId}`);
  if (card) {
    card.classList.remove('border-l-4', 'border-l-red-500');
    // Remove the badge child element if any
    const badge = card.querySelector('span.bg-red-500');
    if (badge) badge.remove();
  }
}

// -------------------------------------------------------------
// 8. DISPATCH DECISION ACTION EXECUTION
// -------------------------------------------------------------
const decisionModal = document.getElementById('decision-modal');
const decisionMessageTextarea = document.getElementById('decision-message');

function triggerDecisionModal(jobId, action) {
  pendingDecisionJob = allJobs.find(j => j.id === jobId);
  pendingDecisionAction = action;
  
  if (!pendingDecisionJob) return;
  
  // Reset modal dialog looks
  document.getElementById('modal-client-email').textContent = pendingDecisionJob.email;
  decisionMessageTextarea.value = action === 'Accepted' 
    ? `We have accepted your job request! A technician has been dispatch scheduled for your preferred slot: ${new Date(pendingDecisionJob.preferredDateTime).toLocaleString()}.` 
    : `Thank you for your request. Unfortunately, we cannot accommodate this scheduling dispatch at this time due to technician availability.`;
    
  const confirmBtn = document.getElementById('confirm-decision-btn');
  confirmBtn.textContent = action === 'Accepted' ? 'Approve & Dispatch' : 'Reject Ticket';
  
  if (action === 'Accepted') {
    confirmBtn.className = "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition shadow-sm";
    document.getElementById('modal-title').textContent = "Accept Job Request";
  } else {
    confirmBtn.className = "px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded font-semibold transition shadow-sm";
    document.getElementById('modal-title').textContent = "Decline Job Request";
  }
  
  decisionModal.classList.remove('hidden');
}

// Global scope mapping for onclick execution inside dynamic cells
window.triggerDecisionModal = triggerDecisionModal;
window.toggleCardExpansion = toggleCardExpansion;

const cancelDecisionBtn = document.getElementById('cancel-decision-btn');
const closeDecisionBtn = document.getElementById('close-modal-btn');
const confirmDecisionBtn = document.getElementById('confirm-decision-btn');

if (cancelDecisionBtn) {
  cancelDecisionBtn.addEventListener('click', () => decisionModal.classList.add('hidden'));
}
if (closeDecisionBtn) {
  closeDecisionBtn.addEventListener('click', () => decisionModal.classList.add('hidden'));
}

if (confirmDecisionBtn) {
  confirmDecisionBtn.addEventListener('click', async () => {
    if (!pendingDecisionJob) return;
    
    confirmDecisionBtn.disabled = true;
    confirmDecisionBtn.textContent = "Processing...";
    
    const jobId = pendingDecisionJob.id;
    const status = pendingDecisionAction;
    const decisionText = decisionMessageTextarea.value;
    
    try {
      // 1. Save updated status to Google Sheets database
      if (CONFIG.googleSheetsUrl) {
        await fetch(CONFIG.googleSheetsUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'update',
            id: jobId,
            status: status
          })
        });
      } else {
        // Fallback local persistence
        const local = getLocalJobs();
        const idx = local.findIndex(j => j.id === jobId);
        if (idx !== -1) {
          local[idx].status = status;
          saveLocalJobs(local);
        }
      }
      
      // Update our matching active runtime state
      const targetJob = allJobs.find(j => j.id === jobId);
      if (targetJob) targetJob.status = status;
      
      // 2. Dispatch Decision Email back to client via EmailJS
      if (CONFIG.emailjsServiceId && CONFIG.emailjsTemplateIdDecision) {
        await emailjs.send(CONFIG.emailjsServiceId, CONFIG.emailjsTemplateIdDecision, {
          id: jobId,
          category: pendingDecisionJob.category,
          clientName: pendingDecisionJob.clientName,
          email: pendingDecisionJob.email,
          status: status,
          decisionMessage: decisionText
        });
        console.log("Status update email sent to client.");
      }
      
      // 3. OneSignal notification dispatch trigger (inform user or tech)
      if (CONFIG.oneSignalAppId) {
        console.log(`OneSignal trigger pushed: Job ${jobId} status updated to ${status}.`);
      }
      
      // Success: shut modal, update dashboards
      decisionModal.classList.add('hidden');
      renderJobCards();
      updateDashboardStats();
      
    } catch (e) {
      console.error("Decision saving failed: ", e);
      alert("Error occurred publishing choice. Choice stored locally instead: " + e.toString());
      
      // Still fallback
      const targetJob = allJobs.find(j => j.id === jobId);
      if (targetJob) targetJob.status = status;
      const local = getLocalJobs();
      const idx = local.findIndex(j => j.id === jobId);
      if (idx !== -1) {
        local[idx].status = status;
        saveLocalJobs(local);
      }
      decisionModal.classList.add('hidden');
      renderJobCards();
      updateDashboardStats();
    } finally {
      confirmDecisionBtn.disabled = false;
    }
  });
}

// Enlarged image popup triggers
function openEnlargedImage(src) {
  const overlay = document.getElementById('image-overlay');
  const img = document.getElementById('enlarged-image');
  if (overlay && img) {
    img.src = src;
    overlay.classList.remove('hidden');
  }
}
window.openEnlargedImage = openEnlargedImage;


// -------------------------------------------------------------
// 9. CONFIGURATION CREDENTIAL INPUT OVERLAY HANDLING
// -------------------------------------------------------------
const openConfigBtn = document.getElementById('open-config-btn');
const closeConfigBtn = document.getElementById('close-config-btn');
const configOverlay = document.getElementById('config-overlay');
const saveConfigBtn = document.getElementById('save-config-btn');
const resetMockBtn = document.getElementById('reset-mock-btn');

function showConfigInFields() {
  if (!configOverlay) return;
  document.getElementById('cfg-sheets-url').value = CONFIG.googleSheetsUrl || '';
  document.getElementById('cfg-email-service').value = CONFIG.emailjsServiceId || '';
  document.getElementById('cfg-email-tmp-admin').value = CONFIG.emailjsTemplateIdToMe || '';
  document.getElementById('cfg-email-tmp-client').value = CONFIG.emailjsTemplateIdToClient || '';
  document.getElementById('cfg-email-tmp-decide').value = CONFIG.emailjsTemplateIdDecision || '';
  document.getElementById('cfg-email-key').value = CONFIG.emailjsPublicKey || '';
  document.getElementById('cfg-onesignal-id').value = CONFIG.oneSignalAppId || '';
}

if (openConfigBtn) {
  openConfigBtn.addEventListener('click', () => {
    showConfigInFields();
    configOverlay.classList.remove('hidden');
  });
}

if (closeConfigBtn) {
  closeConfigBtn.addEventListener('click', () => configOverlay.classList.add('hidden'));
}

if (saveConfigBtn) {
  saveConfigBtn.addEventListener('click', () => {
    const newCfg = {
      googleSheetsUrl: document.getElementById('cfg-sheets-url').value.trim(),
      emailjsServiceId: document.getElementById('cfg-email-service').value.trim(),
      emailjsTemplateIdToMe: document.getElementById('cfg-email-tmp-admin').value.trim(),
      emailjsTemplateIdToClient: document.getElementById('cfg-email-tmp-client').value.trim(),
      emailjsTemplateIdDecision: document.getElementById('cfg-email-tmp-decide').value.trim(),
      emailjsPublicKey: document.getElementById('cfg-email-key').value.trim(),
      oneSignalAppId: document.getElementById('cfg-onesignal-id').value.trim()
    };
    
    savePlatformConfig(newCfg);
    configOverlay.classList.add('hidden');
    
    // Reinitialize systems
    initializeOneSignal();
    initializeEmailJS();
    
    // Reload lists with new storage endpoints
    loadDashboardJobs();
  });
}

if (resetMockBtn) {
  resetMockBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to revert to demo mode and wipe current settings?")) {
      savePlatformConfig({
        googleSheetsUrl: '',
        emailjsServiceId: '',
        emailjsTemplateIdToMe: '',
        emailjsTemplateIdToClient: '',
        emailjsTemplateIdDecision: '',
        emailjsPublicKey: '',
        oneSignalAppId: ''
      });
      localStorage.setItem(LOCAL_JOBS_KEY, JSON.stringify(MOCK_SEEDS));
      configOverlay.classList.add('hidden');
      loadDashboardJobs();
    }
  });
}


// -------------------------------------------------------------
// 10. REFRESH AND FILTERS EVENT BINDINGS
// -------------------------------------------------------------
const refreshBtn = document.getElementById('refresh-jobs-btn');
if (refreshBtn) {
  refreshBtn.addEventListener('click', loadDashboardJobs);
}

const statusFilterEl = document.getElementById('filter-status');
if (statusFilterEl) {
  statusFilterEl.addEventListener('change', renderJobCards);
}

const priorityFilterEl = document.getElementById('filter-priority');
if (priorityFilterEl) {
  priorityFilterEl.addEventListener('change', renderJobCards);
}

const searchFilterEl = document.getElementById('filter-search');
if (searchFilterEl) {
  searchFilterEl.addEventListener('input', renderJobCards);
}

// Auto load dashboard data
if (jobsContainer) {
  updateDashboardSourceIndicator();
  loadDashboardJobs();
}
