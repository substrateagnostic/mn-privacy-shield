/**
 * MN Privacy Shield - Background Service Worker
 * Manages Global Privacy Control (GPC) signal state
 *
 * GPC is legally recognized under:
 * - Minnesota Consumer Data Privacy Act (MCDPA) - effective July 31, 2025
 * - California Consumer Privacy Act (CCPA)
 * - Colorado Privacy Act (CPA)
 * - Connecticut Data Privacy Act (CTDPA)
 */

const RULE_ID = 1;
const GPC_RULESET_ID = 'gpc_header_rules';

// Default state
let gpcEnabled = true;

// Initialize on install
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[MN Privacy Shield] Extension installed/updated');

  // Load saved state or set default
  const stored = await chrome.storage.local.get(['gpcEnabled']);
  gpcEnabled = stored.gpcEnabled !== false; // Default to enabled

  // Save initial state
  await chrome.storage.local.set({ gpcEnabled });

  // Register content script for DOM property injection
  await registerContentScript();

  // Sync header rules with current state
  await updateNetRequestRules();

  // Update icon based on state
  await updateIcon();

  console.log(`[MN Privacy Shield] GPC ${gpcEnabled ? 'enabled' : 'disabled'}`);
});

// Register MAIN world content script for navigator.globalPrivacyControl
async function registerContentScript() {
  try {
    // Unregister existing scripts first
    const existingScripts = await chrome.scripting.getRegisteredContentScripts();
    const gpcScript = existingScripts.find(s => s.id === 'gpc-inject');

    if (gpcScript) {
      await chrome.scripting.unregisterContentScripts({ ids: ['gpc-inject'] });
    }

    // Only register if GPC is enabled
    if (gpcEnabled) {
      await chrome.scripting.registerContentScripts([{
        id: 'gpc-inject',
        matches: ['<all_urls>'],
        js: ['inject-gpc.js'],
        runAt: 'document_start',
        world: 'MAIN',
        allFrames: true
      }]);
      console.log('[MN Privacy Shield] Content script registered (MAIN world)');
    }
  } catch (error) {
    console.error('[MN Privacy Shield] Failed to register content script:', error);
  }
}

// Update declarativeNetRequest rules
async function updateNetRequestRules() {
  try {
    if (gpcEnabled) {
      await chrome.declarativeNetRequest.updateEnabledRulesets({
        enableRulesetIds: [GPC_RULESET_ID]
      });
    } else {
      await chrome.declarativeNetRequest.updateEnabledRulesets({
        disableRulesetIds: [GPC_RULESET_ID]
      });
    }
    console.log(`[MN Privacy Shield] Net request rules ${gpcEnabled ? 'enabled' : 'disabled'}`);
  } catch (error) {
    console.error('[MN Privacy Shield] Failed to update net request rules:', error);
  }
}

// Update extension icon based on state
async function updateIcon() {
  const suffix = gpcEnabled ? '' : '-disabled';

  // For now, we'll use the same icon but could swap to grayscale when disabled
  // Chrome doesn't support easy icon swapping in MV3, so we badge instead
  await chrome.action.setBadgeText({
    text: gpcEnabled ? '' : 'OFF'
  });

  await chrome.action.setBadgeBackgroundColor({
    color: gpcEnabled ? '#4a0404' : '#666666'
  });

  await chrome.action.setTitle({
    title: gpcEnabled
      ? 'MN Privacy Shield - GPC Active'
      : 'MN Privacy Shield - GPC Disabled'
  });
}

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getState') {
    sendResponse({ gpcEnabled });
    return true;
  }

  if (message.type === 'toggleGPC') {
    toggleGPC().then(newState => {
      sendResponse({ gpcEnabled: newState });
    });
    return true; // Keep channel open for async response
  }

  // Get current opt-out session
  if (message.type === 'getSession') {
    chrome.storage.local.get(['optOutSession']).then(result => {
      sendResponse({ session: result.optOutSession || null });
    });
    return true;
  }

  // Update session (from content script detecting form submission)
  if (message.type === 'updateSession') {
    chrome.storage.local.set({ optOutSession: message.session }).then(() => {
      // Notify popup of update
      chrome.runtime.sendMessage({ type: 'SESSION_UPDATED' }).catch(() => {});
      sendResponse({ success: true });
    });
    return true;
  }

  // Start session from web app (via content script bridge)
  if (message.type === 'START_SESSION_FROM_WEB') {
    const data = message.sessionData;
    const session = {
      userInfo: data.userInfo,
      brokers: data.brokers.map(b => ({
        id: b.id,
        name: b.name,
        website: b.website,
        optOutUrl: b.optOutUrl,
        email: b.email,
        status: 'pending'
      })),
      createdAt: new Date().toISOString()
    };

    chrome.storage.local.set({ optOutSession: session }).then(() => {
      console.log('[MN Privacy Shield] Session started from web app with', session.brokers.length, 'brokers');
      // Notify popup
      chrome.runtime.sendMessage({ type: 'SESSION_UPDATED' }).catch(() => {});
      sendResponse({ success: true, brokerCount: session.brokers.length });
    });
    return true;
  }

  // Content script notifying we're on an opt-out page
  if (message.type === 'ON_OPTOUT_PAGE') {
    console.log('[MN Privacy Shield] Detected opt-out page:', message.url);
    // Could update badge or show notification
    return false;
  }

  return false;
});

// Handle messages from web app (externally connectable)
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  console.log('[MN Privacy Shield] External message from:', sender.origin);

  // Verify sender is from our web app
  const allowedOrigins = ['https://shield.alexgallefrom.io', 'http://localhost:3000'];
  if (!allowedOrigins.some(origin => sender.origin?.startsWith(origin))) {
    console.warn('[MN Privacy Shield] Rejected message from unauthorized origin:', sender.origin);
    sendResponse({ success: false, error: 'Unauthorized origin' });
    return true;
  }

  // Receive opt-out session from web app
  if (message.type === 'START_OPT_OUT_SESSION') {
    const session = {
      userInfo: message.userInfo,
      brokers: message.brokers.map(b => ({
        id: b.id,
        name: b.name,
        website: b.website,
        optOutUrl: b.optOutUrl,
        email: b.email,
        status: 'pending'
      })),
      createdAt: new Date().toISOString()
    };

    chrome.storage.local.set({ optOutSession: session }).then(() => {
      console.log('[MN Privacy Shield] Opt-out session started with', session.brokers.length, 'brokers');
      // Notify popup
      chrome.runtime.sendMessage({ type: 'SESSION_UPDATED' }).catch(() => {});
      sendResponse({ success: true, brokerCount: session.brokers.length });
    });
    return true;
  }

  // Check if extension is installed (for web app detection)
  if (message.type === 'PING') {
    sendResponse({ success: true, version: chrome.runtime.getManifest().version });
    return true;
  }

  sendResponse({ success: false, error: 'Unknown message type' });
  return true;
});

// Toggle GPC state
async function toggleGPC() {
  gpcEnabled = !gpcEnabled;

  // Persist state
  await chrome.storage.local.set({ gpcEnabled });

  // Update content script registration
  await registerContentScript();

  // Update header rules
  await updateNetRequestRules();

  // Update icon
  await updateIcon();

  console.log(`[MN Privacy Shield] GPC toggled to ${gpcEnabled ? 'enabled' : 'disabled'}`);

  return gpcEnabled;
}

// Restore state on startup
chrome.runtime.onStartup.addListener(async () => {
  const stored = await chrome.storage.local.get(['gpcEnabled']);
  gpcEnabled = stored.gpcEnabled !== false;

  await registerContentScript();
  await updateNetRequestRules();
  await updateIcon();

  console.log(`[MN Privacy Shield] Startup - GPC ${gpcEnabled ? 'enabled' : 'disabled'}`);
});
