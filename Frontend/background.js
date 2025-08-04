// --- Global State ---
let activeTabId = null;
let activeTabUrl = null;
let lastActiveTime = {}; // Tracks the last active time for each tab
let websiteTime = {}; // Stores total time spent per website
let blockedSites = []; // List of sites to block
let syncIntervalId = null;

// --- Constants ---
const BACKEND_URL = 'http://localhost:5000/api';
const SYNC_INTERVAL_MS = 60 * 1000;

/**
 * Extracts the clean domain from a URL.
 */
function getDomain(url) {
  try {
    const urlObj = new URL(url);
    let hostname = urlObj.hostname;
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }
    return hostname;
  } catch (e) {
    return null;
  }
}

/**
 * Loads blocked sites from Chrome storage.
 */
async function loadBlockedSites() {
  const result = await chrome.storage.sync.get(['blockedSites']);
  blockedSites = result.blockedSites || [];
}

/**
 * Loads website time data from Chrome local storage.
 */
async function loadWebsiteTime() {
  const result = await chrome.storage.local.get(['websiteTime']);
  websiteTime = result.websiteTime || {};
}

/**
 * Saves website time data to local storage.
 */
function saveWebsiteTime() {
  chrome.storage.local.set({ websiteTime });
}

/**
 * Calculates and updates time spent on the active tab.
 */
function updateTime() {
  if (activeTabId && activeTabUrl) {
    const domain = getDomain(activeTabUrl);
    if (domain) {
      const now = Date.now();
      const lastTime = lastActiveTime[activeTabId] || now;
      const timeSpent = Math.floor((now - lastTime) / 1000);

      if (timeSpent > 0) {
        const today = new Date().toISOString().slice(0, 10);
        if (!websiteTime[today]) {
          websiteTime[today] = {};
        }
        websiteTime[today][domain] = (websiteTime[today][domain] || 0) + timeSpent;
        saveWebsiteTime();

        chrome.runtime.sendMessage({ action: "updateReport" }).catch(() => {});
      }
      lastActiveTime[activeTabId] = now;
    }
  }
}

/**
 * Syncs local data with the backend server.
 */
async function syncDataWithBackend() {
  const authResult = await chrome.storage.sync.get(['authToken']);
  if (!authResult.authToken) {
    return;
  }

  const localWebsiteTime = (await chrome.storage.local.get(['websiteTime'])).websiteTime || {};
  const localBlockedSites = (await chrome.storage.sync.get(['blockedSites'])).blockedSites || [];

  if (Object.keys(localWebsiteTime).length === 0 && localBlockedSites.length === 0) {
    return;
  }

  try {
    const response = await fetch(`${BACKEND_URL}/data/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authResult.authToken}`
      },
      body: JSON.stringify({
        websiteTime: localWebsiteTime,
        blockedSites: localBlockedSites
      })
    });

    const result = await response.json();

    if (response.ok) {
      // Handle successful sync
    } else {
      // Handle backend errors
    }
  } catch (error) {
    // Handle network errors
  }
}

/**
 * Manages the periodic data sync interval based on user's auth status.
 */
async function manageSyncInterval() {
  const authResult = await chrome.storage.sync.get(['authToken']);
  if (authResult.authToken) {
    if (!syncIntervalId) {
      syncIntervalId = setInterval(syncDataWithBackend, SYNC_INTERVAL_MS);
      syncDataWithBackend();
    }
  } else {
    if (syncIntervalId) {
      clearInterval(syncIntervalId);
      syncIntervalId = null;
    }
  }
}

// --- Event Listeners ---

// Fired when a tab is activated.
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  updateTime(); // Record time for the previous tab
  activeTabId = activeInfo.tabId;
  try {
    const tab = await chrome.tabs.get(activeTabId);
    activeTabUrl = tab.url;
    lastActiveTime[activeTabId] = Date.now();
    // Inject content script on new tabs
    if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('edge://')) {
      chrome.scripting.executeScript({
        target: { tabId: activeTabId },
        files: ['content.js']
      }).catch(() => {});
    }
  } catch (e) {
    activeTabUrl = null;
  }
});

// Fired when a tab's URL changes.
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tabId === activeTabId && changeInfo.url) {
    updateTime();
    activeTabUrl = tab.url;
    lastActiveTime[activeTabId] = Date.now();
  }

  // Check for blocked sites on page load and redirect
  if (changeInfo.status === 'loading' && tab.url) {
    const domain = getDomain(tab.url);
    if (domain && blockedSites.some(blocked => domain.includes(blocked))) {
      chrome.tabs.update(tabId, { url: chrome.runtime.getURL('blocked.html') });
    }
  }
});

// Fired when a tab is closed.
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === activeTabId) {
    updateTime();
    activeTabId = null;
    activeTabUrl = null;
  }
  delete lastActiveTime[tabId];
});

// Fired when a window gains or loses focus.
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    updateTime();
    activeTabId = null;
    activeTabUrl = null;
  } else {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        updateTime();
        activeTabId = tabs[0].id;
        activeTabUrl = tabs[0].url;
        lastActiveTime[activeTabId] = Date.now();
      }
    });
  }
});

// Listens for messages from other parts of the extension.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateBlockedSites") {
    loadBlockedSites();
    sendResponse({ status: "Blocked sites updated in background" });
  } else if (request.action === "authStatusChanged") {
    manageSyncInterval();
    loadBlockedSites();
  }
});

// Listens for changes in Chrome storage.
chrome.storage.sync.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.authToken) {
    manageSyncInterval();
    loadBlockedSites();
  }
});

/**
 * Initializes the extension on startup.
 */
async function initialize() {
  await loadBlockedSites();
  await loadWebsiteTime();
  setInterval(updateTime, 1000); // Timer for tracking time

  // Get the initially active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      activeTabId = tabs[0].id;
      activeTabUrl = tabs[0].url;
      lastActiveTime[activeTabId] = Date.now();
    }
  });

  manageSyncInterval();
}

initialize();