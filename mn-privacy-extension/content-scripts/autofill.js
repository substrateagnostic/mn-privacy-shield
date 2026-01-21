// MN Privacy Shield - Auto-fill Content Script
// Detects and fills privacy opt-out forms

import { detectFieldType, findFormFields, findRequestCheckboxes } from '../lib/field-matchers.js';

let userInfo = null;
let isEnabled = false;

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'FILL_FORM') {
    userInfo = message.userInfo;
    const result = fillForm();
    sendResponse(result);
  } else if (message.type === 'GET_FORM_STATUS') {
    const fields = findFormFields();
    const checkboxes = findRequestCheckboxes();
    sendResponse({
      hasForm: Object.keys(fields).length > 0,
      fields: Object.keys(fields),
      checkboxes: Object.keys(checkboxes)
    });
  } else if (message.type === 'SET_USER_INFO') {
    userInfo = message.userInfo;
    sendResponse({ success: true });
  }
  return true; // Keep channel open for async response
});

/**
 * Fill detected form fields with user info
 */
function fillForm() {
  if (!userInfo) {
    return { success: false, error: 'No user info available' };
  }

  const fields = findFormFields();
  const filled = [];
  const failed = [];

  // Map user info to field types
  const valueMap = {
    fullName: userInfo.name,
    firstName: userInfo.name?.split(' ')[0],
    lastName: userInfo.name?.split(' ').slice(1).join(' '),
    email: userInfo.email,
    phone: userInfo.phone || '',
    address: userInfo.address,
    city: userInfo.city,
    state: userInfo.state,
    zip: userInfo.zip,
    country: 'United States'
  };

  for (const [fieldType, inputs] of Object.entries(fields)) {
    const value = valueMap[fieldType];
    if (!value) continue;

    for (const input of inputs) {
      try {
        if (input.tagName === 'SELECT') {
          fillSelect(input, value);
        } else {
          fillInput(input, value);
        }
        filled.push(fieldType);
        highlightField(input, 'success');
      } catch (e) {
        failed.push({ field: fieldType, error: e.message });
        highlightField(input, 'error');
      }
    }
  }

  // Try to check opt-out/delete checkboxes
  const checkboxes = findRequestCheckboxes();
  const checkedTypes = [];

  for (const [requestType, inputs] of Object.entries(checkboxes)) {
    // Prefer delete and optOut
    if (['delete', 'optOut'].includes(requestType)) {
      for (const input of inputs) {
        if (!input.checked) {
          input.click();
          checkedTypes.push(requestType);
          highlightField(input, 'success');
        }
      }
    }
  }

  return {
    success: true,
    filled,
    failed,
    checkedTypes,
    totalFields: Object.keys(fields).length
  };
}

/**
 * Fill a text input with proper event triggering
 */
function fillInput(input, value) {
  // Focus the input
  input.focus();

  // Clear existing value
  input.value = '';

  // Set new value
  input.value = value;

  // Trigger events that React/Vue/Angular listen for
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));

  // Blur to trigger validation
  input.blur();
}

/**
 * Fill a select dropdown
 */
function fillSelect(select, value) {
  const options = Array.from(select.options);
  const valueLower = value.toLowerCase();

  // Try exact match first
  let match = options.find(o =>
    o.value.toLowerCase() === valueLower ||
    o.textContent.trim().toLowerCase() === valueLower
  );

  // Try partial match
  if (!match) {
    match = options.find(o =>
      o.value.toLowerCase().includes(valueLower) ||
      o.textContent.trim().toLowerCase().includes(valueLower) ||
      valueLower.includes(o.value.toLowerCase()) ||
      valueLower.includes(o.textContent.trim().toLowerCase())
    );
  }

  // For state, try abbreviation
  if (!match && select.name?.toLowerCase().includes('state')) {
    const stateAbbrevs = {
      'minnesota': 'mn', 'mn': 'minnesota',
      'california': 'ca', 'ca': 'california',
      // Add more as needed
    };
    const alt = stateAbbrevs[valueLower];
    if (alt) {
      match = options.find(o =>
        o.value.toLowerCase() === alt ||
        o.textContent.trim().toLowerCase() === alt
      );
    }
  }

  if (match) {
    select.value = match.value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

/**
 * Highlight a field to show fill status
 */
function highlightField(input, status) {
  const color = status === 'success' ? '#22c55e' : '#ef4444';
  const originalOutline = input.style.outline;
  const originalBoxShadow = input.style.boxShadow;

  input.style.outline = `2px solid ${color}`;
  input.style.boxShadow = `0 0 0 3px ${color}33`;

  // Remove highlight after 2 seconds
  setTimeout(() => {
    input.style.outline = originalOutline;
    input.style.boxShadow = originalBoxShadow;
  }, 2000);
}

/**
 * Show floating notification on page
 */
function showNotification(message, type = 'info') {
  const existing = document.getElementById('mn-privacy-shield-notification');
  if (existing) existing.remove();

  const div = document.createElement('div');
  div.id = 'mn-privacy-shield-notification';
  div.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    border-radius: 8px;
    font-family: system-ui, sans-serif;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 999999;
    animation: slideIn 0.3s ease;
  `;
  div.textContent = message;

  // Add animation keyframes
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(div);

  // Auto-remove after 3 seconds
  setTimeout(() => div.remove(), 3000);
}

// Check if we're on a known opt-out page and show helper
function checkForOptOutPage() {
  const url = window.location.href.toLowerCase();
  const isOptOutPage =
    url.includes('privacy') ||
    url.includes('opt-out') ||
    url.includes('optout') ||
    url.includes('do-not-sell') ||
    url.includes('ccpa') ||
    url.includes('rights') ||
    url.includes('data-request') ||
    url.includes('gdpr');

  if (isOptOutPage) {
    // Notify background that we're on an opt-out page
    chrome.runtime.sendMessage({ type: 'ON_OPTOUT_PAGE', url: window.location.href });
  }
}

// Listen for messages from web app (via window.postMessage)
window.addEventListener('message', async (event) => {
  // Only accept messages from same origin (our web app)
  if (event.source !== window) return;

  const { type, data } = event.data || {};

  // Extension detection ping
  if (type === 'MN_PRIVACY_SHIELD_DETECT') {
    window.postMessage({ type: 'MN_PRIVACY_SHIELD_DETECTED' }, '*');
    return;
  }

  // Start session from web app
  if (type === 'MN_PRIVACY_SHIELD_START_SESSION' && data) {
    try {
      // Forward to background script
      const response = await chrome.runtime.sendMessage({
        type: 'START_SESSION_FROM_WEB',
        sessionData: data
      });

      if (response?.success) {
        window.postMessage({ type: 'MN_PRIVACY_SHIELD_SESSION_STARTED' }, '*');
        showNotification(`Session started with ${data.brokers?.length || 0} companies`, 'success');
      } else {
        window.postMessage({
          type: 'MN_PRIVACY_SHIELD_SESSION_ERROR',
          error: response?.error || 'Unknown error'
        }, '*');
      }
    } catch (error) {
      window.postMessage({
        type: 'MN_PRIVACY_SHIELD_SESSION_ERROR',
        error: error.message
      }, '*');
    }
    return;
  }
});

// Run on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkForOptOutPage);
} else {
  checkForOptOutPage();
}

// Also check after dynamic content loads
const observer = new MutationObserver(() => {
  // Debounce
  clearTimeout(window.mnPrivacyObserverTimeout);
  window.mnPrivacyObserverTimeout = setTimeout(checkForOptOutPage, 500);
});

observer.observe(document.body, { childList: true, subtree: true });

// Also check localStorage for pending sessions (fallback for when content script wasn't injected during export)
function checkPendingSession() {
  const pending = localStorage.getItem('mnPrivacyShield_pendingSession');
  if (pending) {
    try {
      const session = JSON.parse(pending);
      // Only process if recent (within 5 minutes)
      if (Date.now() - session.timestamp < 5 * 60 * 1000) {
        chrome.runtime.sendMessage({
          type: 'START_SESSION_FROM_WEB',
          sessionData: session
        }).then(response => {
          if (response?.success) {
            localStorage.removeItem('mnPrivacyShield_pendingSession');
            showNotification(`Session loaded with ${session.brokers?.length || 0} companies`, 'success');
          }
        });
      } else {
        localStorage.removeItem('mnPrivacyShield_pendingSession');
      }
    } catch (e) {
      localStorage.removeItem('mnPrivacyShield_pendingSession');
    }
  }
}

// Check for pending session on load
setTimeout(checkPendingSession, 1000);
