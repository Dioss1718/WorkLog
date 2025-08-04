// A flag to ensure the content script is loaded only once per page.
window.productivityTrackerContentScriptLoaded = true;

// Log a message to the console confirming that the script has loaded.
console.log("Productivity Tracker Content Script Loaded for:", window.location.href);