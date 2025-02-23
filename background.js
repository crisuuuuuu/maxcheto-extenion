let screenshots = [];
let intervalId = null;
let port = null;

// Keep alive connection
function keepAlive() {
  if (port) {
    port.disconnect();
  }
  port = chrome.runtime.connect({ name: 'keepAlive' });
  port.onDisconnect.addListener(keepAlive);
}

// Function to take screenshot
function takeScreenshot() {
  chrome.windows.getLastFocused({ populate: true }, async (window) => {
    try {
      const activeTab = window.tabs.find(tab => tab.active);
      
      if (activeTab && !activeTab.url.includes('chrome://')) {
        const image = await chrome.tabs.captureVisibleTab(window.id, {
          format: 'png'
        });

        const screenshot = {
          timestamp: new Date().toLocaleString(),
          image: image,
          url: activeTab.url
        };

        // Load existing screenshots and keep only the last 20
        const result = await chrome.storage.local.get('screenshots');
        let existingScreenshots = result.screenshots || [];
        existingScreenshots.push(screenshot);
        
        // Keep only the most recent 20 screenshots
        if (existingScreenshots.length > 20) {
          existingScreenshots = existingScreenshots.slice(-20);
        }

        // Save updated array
        await chrome.storage.local.set({ 'screenshots': existingScreenshots });
        console.log('Screenshot saved:', screenshot.timestamp);
        
        keepAlive();
      }
    } catch (error) {
      console.error('Screenshot error:', error);
    }
  });
}
// Add this at the beginning of your background.js
const blockedKeywords = [
  'porn', 'xxx', 'adult', 'sex', 'nsfw', 'fuck','penis', 'vagina', 'ass','boobs','cock','dick','gay','pussy','fur','xnxx', 'imtlazarus'
  // Add more keywords as needed
];

// Add this function to check URLs
function isBlockedURL(url) {
  const lowercaseUrl = url.toLowerCase();
  return blockedKeywords.some(keyword => lowercaseUrl.includes(keyword));
}

// Add this listener for URL monitoring
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (isBlockedURL(details.url)) {
    chrome.tabs.update(details.tabId, {
      url: chrome.runtime.getURL('access_deneid.html')
    });
  }
});

// Function to start screenshot timer
function startScreenshotTimer() {
  if (intervalId) {
    clearInterval(intervalId);
  }
  takeScreenshot(); // Take initial screenshot
  intervalId = setInterval(takeScreenshot, 10 * 1000);
  keepAlive();
}

// Handle extension icon click
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: 'policies.html' });
});

// Start the screenshot process and keep it alive
chrome.runtime.onInstalled.addListener(startScreenshotTimer);
chrome.runtime.onStartup.addListener(startScreenshotTimer);
chrome.runtime.onConnect.addListener(function(port) {
  if (port.name === 'keepAlive') {
    setTimeout(keepAlive, 5000);
  }
});

// Initial start
startScreenshotTimer();