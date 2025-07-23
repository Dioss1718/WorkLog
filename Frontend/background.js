let activeTabId = null;
let activeTabUrl = null;
let lastActiveTime = {};
let websiteTime = {};
let blockedSites = [];
let syncIntervalId = null;

const BACKEND_URL = 'http://localhost:5000/api';
const SYNC_INTERVAL_MS = 60 * 1000;

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

async function loadBlockedSites() {
  const result = await chrome.storage.sync.get(['blockedSites']);
  blockedSites = result.blockedSites || [];
}

async function loadWebsiteTime() {
  const result = await chrome.storage.local.get(['websiteTime']);
  websiteTime = result.websiteTime || {};
}

function saveWebsiteTime() {
  chrome.storage.local.set({ websiteTime });
}

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

        chrome.runtime.sendMessage({ action: "updateReport" }).catch(() => {
        });
      }
      lastActiveTime[activeTabId] = now;
    }
  }
}

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
    } else {
    }
  } catch (error) {
  }
}

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

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  updateTime();

  activeTabId = activeInfo.tabId;
  try {
    const tab = await chrome.tabs.get(activeTabId);
    activeTabUrl = tab.url;
    lastActiveTime[activeTabId] = Date.now();

    if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('edge://')) {
      chrome.scripting.executeScript({
        target: { tabId: activeTabId },
        files: ['content.js']
      }).catch(error => {
      });
    }

  } catch (e) {
    activeTabUrl = null;
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tabId === activeTabId && changeInfo.url) {
    updateTime();
    activeTabUrl = tab.url;
    lastActiveTime[activeTabId] = Date.now();
  }

  if (changeInfo.status === 'loading' && tab.url) {
    const domain = getDomain(tab.url);
    if (domain && blockedSites.some(blocked => domain.includes(blocked))) {
      chrome.tabs.update(tabId, { url: chrome.runtime.getURL('blocked.html') });
    }
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === activeTabId) {
    updateTime();
    activeTabId = null;
    activeTabUrl = null;
  }
  delete lastActiveTime[tabId];
});

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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateBlockedSites") {
    loadBlockedSites();
    sendResponse({ status: "Blocked sites updated in background" });
  } else if (request.action === "authStatusChanged") {
    manageSyncInterval();
    loadBlockedSites();
  }
});

chrome.storage.sync.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.authToken) {
    manageSyncInterval();
    loadBlockedSites();
  }
});

async function initialize() {
  await loadBlockedSites();
  await loadWebsiteTime();
  setInterval(updateTime, 1000);

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