/**
 * MN Privacy Shield - Popup Script
 * Handles GPC toggle and opt-out queue UI
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Tab elements
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');

  // GPC elements
  const toggleButton = document.getElementById('toggle-button');
  const toggleText = toggleButton.querySelector('.toggle-text');
  const iconOn = document.getElementById('icon-on');
  const iconOff = document.getElementById('icon-off');
  const statusIndicator = document.getElementById('status-indicator');
  const statusDescription = document.getElementById('status-description');

  // Queue elements
  const queueEmpty = document.getElementById('queue-empty');
  const queueActive = document.getElementById('queue-active');
  const queueProgress = document.getElementById('queue-progress');
  const queueBar = document.getElementById('queue-bar');
  const userInfoName = document.getElementById('user-info-name');
  const currentBrokerName = document.getElementById('current-broker-name');
  const queueList = document.getElementById('queue-list');
  const btnOpenPortal = document.getElementById('btn-open-portal');
  const btnFillForm = document.getElementById('btn-fill-form');
  const btnMarkDone = document.getElementById('btn-mark-done');
  const btnSkip = document.getElementById('btn-skip');
  const btnClearSession = document.getElementById('btn-clear-session');

  // ============ TAB HANDLING ============

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;

      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      document.getElementById(`content-${targetTab}`).classList.add('active');
    });
  });

  // ============ GPC HANDLING ============

  // Get current GPC state
  const response = await chrome.runtime.sendMessage({ type: 'getState' });
  updateGPCUI(response.gpcEnabled);

  toggleButton.addEventListener('click', async () => {
    const response = await chrome.runtime.sendMessage({ type: 'toggleGPC' });
    updateGPCUI(response.gpcEnabled);
  });

  function updateGPCUI(enabled) {
    if (enabled) {
      toggleButton.classList.add('active');
      toggleButton.classList.remove('inactive');
      toggleButton.setAttribute('aria-pressed', 'true');
      toggleText.textContent = 'PROTECTION ENABLED';
      iconOn.classList.remove('hidden');
      iconOff.classList.add('hidden');
      statusIndicator.textContent = 'ACTIVE';
      statusIndicator.classList.add('status-active');
      statusIndicator.classList.remove('status-inactive');
      statusDescription.textContent = 'Websites are being told not to sell or share your data.';
    } else {
      toggleButton.classList.remove('active');
      toggleButton.classList.add('inactive');
      toggleButton.setAttribute('aria-pressed', 'false');
      toggleText.textContent = 'PROTECTION DISABLED';
      iconOn.classList.add('hidden');
      iconOff.classList.remove('hidden');
      statusIndicator.textContent = 'INACTIVE';
      statusIndicator.classList.remove('status-active');
      statusIndicator.classList.add('status-inactive');
      statusDescription.textContent = 'GPC signal is not being sent. Websites may sell your data.';
    }
  }

  // ============ QUEUE HANDLING ============

  let session = null;

  async function loadSession() {
    const result = await chrome.storage.local.get(['optOutSession']);
    session = result.optOutSession || null;
    updateQueueUI();
  }

  function updateQueueUI() {
    if (!session || !session.brokers || session.brokers.length === 0) {
      queueEmpty.classList.remove('hidden');
      queueActive.classList.add('hidden');
      return;
    }

    queueEmpty.classList.add('hidden');
    queueActive.classList.remove('hidden');

    // Calculate progress
    const total = session.brokers.length;
    const completed = session.brokers.filter(b => b.status === 'done' || b.status === 'skipped').length;
    const remaining = session.brokers.filter(b => b.status === 'pending');
    const current = remaining[0];

    queueProgress.textContent = `${completed} / ${total}`;
    queueBar.style.width = `${(completed / total) * 100}%`;

    // User info
    if (session.userInfo) {
      userInfoName.textContent = session.userInfo.name || '—';
    }

    // Current broker
    if (current) {
      currentBrokerName.textContent = current.name;
      btnOpenPortal.disabled = false;
      btnFillForm.disabled = false;
      btnMarkDone.disabled = false;
      btnSkip.disabled = false;
    } else {
      currentBrokerName.textContent = 'All done!';
      btnOpenPortal.disabled = true;
      btnFillForm.disabled = true;
      btnMarkDone.disabled = true;
      btnSkip.disabled = true;
    }

    // Remaining list
    queueList.innerHTML = '';
    remaining.slice(1, 6).forEach(broker => {
      const li = document.createElement('li');
      li.className = 'queue-item';
      li.textContent = broker.name;
      queueList.appendChild(li);
    });

    if (remaining.length > 6) {
      const li = document.createElement('li');
      li.className = 'queue-item queue-item-more';
      li.textContent = `+ ${remaining.length - 6} more`;
      queueList.appendChild(li);
    }
  }

  // Open portal button
  btnOpenPortal.addEventListener('click', async () => {
    if (!session) return;
    const current = session.brokers.find(b => b.status === 'pending');
    if (current) {
      const url = current.optOutUrl || current.website;
      if (url) {
        chrome.tabs.create({ url });
      }
    }
  });

  // Fill form button
  btnFillForm.addEventListener('click', async () => {
    if (!session || !session.userInfo) return;

    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    // Send fill message to content script
    try {
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'FILL_FORM',
        userInfo: session.userInfo
      });

      if (response && response.success) {
        const filled = response.filled.length;
        showNotification(`Filled ${filled} field${filled !== 1 ? 's' : ''}`, 'success');
      } else {
        showNotification('No form fields found', 'warning');
      }
    } catch (e) {
      showNotification('Cannot fill - open portal first', 'error');
    }
  });

  // Mark done button
  btnMarkDone.addEventListener('click', async () => {
    if (!session) return;
    const current = session.brokers.find(b => b.status === 'pending');
    if (current) {
      current.status = 'done';
      current.completedAt = new Date().toISOString();
      await chrome.storage.local.set({ optOutSession: session });
      updateQueueUI();
    }
  });

  // Skip button
  btnSkip.addEventListener('click', async () => {
    if (!session) return;
    const current = session.brokers.find(b => b.status === 'pending');
    if (current) {
      current.status = 'skipped';
      await chrome.storage.local.set({ optOutSession: session });
      updateQueueUI();
    }
  });

  // Clear session button
  btnClearSession.addEventListener('click', async () => {
    if (confirm('Clear this opt-out session? Progress will be lost.')) {
      await chrome.storage.local.remove(['optOutSession']);
      session = null;
      updateQueueUI();
    }
  });

  // Simple notification helper
  function showNotification(message, type) {
    // Just update a status text for now
    const current = document.getElementById('current-broker-name');
    const original = current.textContent;
    current.textContent = message;
    current.style.color = type === 'success' ? '#166534' : type === 'error' ? '#991b1b' : '#666';
    setTimeout(() => {
      current.textContent = original;
      current.style.color = '';
    }, 2000);
  }

  // Listen for session updates from web app
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SESSION_UPDATED') {
      loadSession();
    }
  });

  // Initial load
  loadSession();

  // If queue has items, auto-switch to queue tab
  if (session && session.brokers && session.brokers.some(b => b.status === 'pending')) {
    document.getElementById('tab-queue').click();
  }
});
