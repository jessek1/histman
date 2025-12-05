// HistMan Background Service Worker
// Monitors browser history and deletes entries matching configured domains/keywords

const STORAGE_KEY = 'histman_config';

// Default configuration
const defaultConfig = {
  domains: [],
  keywords: [],
  enabled: true
};

// Get current configuration from storage
async function getConfig() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] || defaultConfig;
}

// Check if a URL matches any configured domain
function matchesDomain(url, domains) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    return domains.some(domain => {
      const normalizedDomain = domain.toLowerCase().trim();
      // Match exact domain or subdomain
      return hostname === normalizedDomain ||
             hostname.endsWith('.' + normalizedDomain);
    });
  } catch {
    return false;
  }
}

// Check if a URL contains any configured keyword
function matchesKeyword(url, keywords) {
  const lowerUrl = url.toLowerCase();
  return keywords.some(keyword => {
    const normalizedKeyword = keyword.toLowerCase().trim();
    return normalizedKeyword && lowerUrl.includes(normalizedKeyword);
  });
}

// Check if a URL should be deleted based on config
function shouldDeleteUrl(url, config) {
  if (!config.enabled) return false;

  return matchesDomain(url, config.domains) ||
         matchesKeyword(url, config.keywords);
}

// Delete a specific URL from history
async function deleteFromHistory(url) {
  try {
    await chrome.history.deleteUrl({ url });
    console.log('[HistMan] Deleted:', url);
  } catch (error) {
    console.error('[HistMan] Error deleting URL:', error);
  }
}

// Process a history visit
async function processVisit(historyItem) {
  const config = await getConfig();

  if (shouldDeleteUrl(historyItem.url, config)) {
    await deleteFromHistory(historyItem.url);
  }
}

// Scan existing history for matching entries
async function scanExistingHistory() {
  const config = await getConfig();

  if (!config.enabled) return { deleted: 0 };

  const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000);
  const urlsToDelete = new Set();

  // Search for each domain specifically
  for (const domain of config.domains) {
    const results = await chrome.history.search({
      text: domain,
      startTime: oneYearAgo,
      maxResults: 10000
    });

    for (const item of results) {
      if (matchesDomain(item.url, [domain])) {
        urlsToDelete.add(item.url);
      }
    }
  }

  // Search for each keyword specifically
  for (const keyword of config.keywords) {
    const results = await chrome.history.search({
      text: keyword,
      startTime: oneYearAgo,
      maxResults: 10000
    });

    for (const item of results) {
      if (matchesKeyword(item.url, [keyword])) {
        urlsToDelete.add(item.url);
      }
    }
  }

  // Also do a general scan to catch anything missed
  const generalResults = await chrome.history.search({
    text: '',
    startTime: oneYearAgo,
    maxResults: 10000
  });

  for (const item of generalResults) {
    if (shouldDeleteUrl(item.url, config)) {
      urlsToDelete.add(item.url);
    }
  }

  // Delete all matching URLs
  let deletedCount = 0;
  for (const url of urlsToDelete) {
    await deleteFromHistory(url);
    deletedCount++;
  }

  console.log('[HistMan] Scan complete. Deleted', deletedCount, 'entries');
  return { deleted: deletedCount };
}

// Listen for new history entries
chrome.history.onVisited.addListener(processVisit);

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'scanHistory') {
    scanExistingHistory().then(sendResponse);
    return true; // Keep channel open for async response
  }

  if (message.action === 'getStats') {
    getConfig().then(config => {
      sendResponse({
        domains: config.domains.length,
        keywords: config.keywords.length,
        enabled: config.enabled
      });
    });
    return true;
  }
});

// Log when extension starts
console.log('[HistMan] Background service worker started');
