document.addEventListener('DOMContentLoaded', async () => {
  // --- DOM Element References ---
  const blockSiteInput = document.getElementById('blockSiteInput');
  const addBlockedSiteButton = document.getElementById('addBlockedSite');
  const blockedSitesList = document.getElementById('blockedSitesList');
  const productivityReportDiv = document.getElementById('productivityReport');
  const clearDataButton = document.getElementById('clearData');
  const syncDataButton = document.getElementById('syncData');
  const messageBox = document.getElementById('messageBox');
  const messageBoxContent = document.getElementById('messageBoxContent');
  const messageBoxClose = document.getElementById('messageBoxClose');

  const BACKEND_URL = 'http://localhost:5000/api';

  /**
   * Displays a message in a dedicated message box.
   * @param {string} message - The message to be displayed.
   */
  function showMessageBox(message) {
    if (messageBoxContent && messageBox) {
      messageBoxContent.textContent = message;
      messageBox.style.display = 'block';
    }
  }

  // Event listener to close the message box.
  if (messageBoxClose) {
    messageBoxClose.addEventListener('click', () => {
      messageBox.style.display = 'none';
    });
  }

  /**
   * Loads blocked sites from storage and renders them in the UI.
   */
  async function loadBlockedSites() {
    const result = await chrome.storage.sync.get(['blockedSites']);
    const blockedSites = result.blockedSites || [];

    if (blockedSitesList) {
      blockedSitesList.innerHTML = '';

      if (blockedSites.length === 0) {
        const noSitesMessage = document.createElement('li');
        noSitesMessage.textContent = 'No sites blocked yet.';
        noSitesMessage.classList.add('no-data-message');
        blockedSitesList.appendChild(noSitesMessage);
      } else {
        blockedSites.forEach(site => {
          const li = document.createElement('li');
          li.innerHTML = `
            <span>${site}</span>
            <button data-site="${site}" class="remove-button">Remove</button>
          `;
          blockedSitesList.appendChild(li);
        });
      }
    }
  }

  // Event listener for adding a new blocked site.
  if (addBlockedSiteButton) {
    addBlockedSiteButton.addEventListener('click', async () => {
      const site = blockSiteInput.value.trim();

      if (!site) {
        showMessageBox('Please type a website address.');
        return;
      }

      let currentBlockedSites = (await chrome.storage.sync.get(['blockedSites'])).blockedSites || [];

      if (currentBlockedSites.includes(site)) {
        showMessageBox(`"${site}" is already blocked.`);
        return;
      }

      currentBlockedSites.push(site);
      await chrome.storage.sync.set({ blockedSites: currentBlockedSites });

      blockSiteInput.value = '';
      loadBlockedSites();
      showMessageBox(`"${site}" was added.`);

      // Notify the background script to update its list of blocked sites.
      chrome.runtime.sendMessage({ action: "updateBlockedSites" });
    });
  }

  // Event delegation for removing a blocked site.
  if (blockedSitesList) {
    blockedSitesList.addEventListener('click', async (event) => {
      if (event.target.classList.contains('remove-button')) {
        const siteToRemove = event.target.dataset.site;

        let blockedSites = (await chrome.storage.sync.get(['blockedSites'])).blockedSites || [];
        blockedSites = blockedSites.filter(site => site !== siteToRemove);

        await chrome.storage.sync.set({ blockedSites });
        loadBlockedSites();
        showMessageBox(`"${siteToRemove}" was removed.`);

        // Notify the background script about the change.
        chrome.runtime.sendMessage({ action: "updateBlockedSites" });
      }
    });
  }

  /**
   * Loads and renders the productivity report for today.
   */
  async function loadProductivityReport() {
    const today = new Date().toISOString().slice(0, 10);
    const localResult = await chrome.storage.local.get(['websiteTime']);
    const todayData = (localResult.websiteTime && localResult.websiteTime[today]) || {};

    if (!productivityReportDiv) return;

    productivityReportDiv.innerHTML = '';

    // Sort sites by time spent in descending order.
    const sortedSites = Object.entries(todayData).sort(([, timeA], [, timeB]) => timeB - timeA);

    if (sortedSites.length === 0) {
      productivityReportDiv.innerHTML = '<p class="no-data-message">No data for today yet. Start Browse!</p>';
    } else {
      sortedSites.forEach(([site, timeInSeconds]) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = timeInSeconds % 60;
        const timeString = `${minutes}m ${seconds}s`;

        const div = document.createElement('div');
        div.classList.add('report-item');
        div.innerHTML = `
          <span class="report-site">${site}</span>
          <span class="report-time">${timeString}</span>
        `;
        productivityReportDiv.appendChild(div);
      });
    }
  }

  // Event listener to clear all local data.
  if (clearDataButton) {
    clearDataButton.addEventListener('click', async () => {
      showMessageBox('Clearing all saved data...');
      await chrome.storage.local.clear();
      await chrome.storage.sync.remove('blockedSites');
      showMessageBox('All data cleared.');
      loadBlockedSites();
      loadProductivityReport();
      chrome.runtime.sendMessage({ action: "updateBlockedSites" });
    });
  }

  // Event listener for the sync button (currently a placeholder).
  if (syncDataButton) {
    syncDataButton.addEventListener('click', async () => {
      showMessageBox('This sync feature is not yet connected to a backend. It will be added later!');
    });
  }

  // Initial load of data when the popup opens.
  loadBlockedSites();
  loadProductivityReport();

  // Listener for messages from the background script to refresh the report.
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "updateReport") {
      loadProductivityReport();
    }
  });
});