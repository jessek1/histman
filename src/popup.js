// HistMan Popup Script

const STORAGE_KEY = 'histman_config';
const SECURITY_KEY = 'histman_security';

// Default configuration
const defaultConfig = {
  domains: [],
  keywords: [],
  enabled: true
};

// Default security settings
const defaultSecurity = {
  passwordHash: null,
  passwordSalt: null,
  mfaSecret: null,
  mfaEnabled: false
};

// Temporary state for MFA setup
let pendingMfaSecret = null;

// ============================================
// Screen Management
// ============================================

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.toggle('hidden', screen.id !== screenId);
  });
}

// ============================================
// Storage Functions
// ============================================

async function getConfig() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] || defaultConfig;
}

async function saveConfig(config) {
  await chrome.storage.local.set({ [STORAGE_KEY]: config });
}

async function getSecurity() {
  const result = await chrome.storage.local.get(SECURITY_KEY);
  return result[SECURITY_KEY] || defaultSecurity;
}

async function saveSecurity(security) {
  await chrome.storage.local.set({ [SECURITY_KEY]: security });
}

// ============================================
// Status Messages
// ============================================

function showStatus(elementId, message, type = 'info') {
  const statusEl = document.getElementById(elementId);
  if (!statusEl) return;

  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  setTimeout(() => {
    statusEl.textContent = '';
    statusEl.className = 'status';
  }, 3000);
}

// ============================================
// Authentication Functions
// ============================================

async function checkAuthRequired() {
  const security = await getSecurity();
  return security.passwordHash !== null;
}

async function handleUnlock() {
  const security = await getSecurity();
  const passwordInput = document.getElementById('unlock-password');
  const mfaInput = document.getElementById('unlock-mfa');
  const password = passwordInput.value;

  if (!password) {
    showStatus('lock-status', 'Please enter your password', 'error');
    return;
  }

  // Verify password
  const isValid = await HistManCrypto.verifyPassword(
    password,
    security.passwordSalt,
    security.passwordHash
  );

  if (!isValid) {
    showStatus('lock-status', 'Incorrect password', 'error');
    passwordInput.value = '';
    return;
  }

  // Check MFA if enabled
  if (security.mfaEnabled) {
    const mfaCode = mfaInput.value.trim();
    if (!mfaCode) {
      showStatus('lock-status', 'Please enter your 2FA code', 'error');
      return;
    }

    const mfaValid = await HistManTOTP.verifyTOTP(security.mfaSecret, mfaCode);
    if (!mfaValid) {
      showStatus('lock-status', 'Invalid 2FA code', 'error');
      mfaInput.value = '';
      return;
    }
  }

  // Success - show main screen
  passwordInput.value = '';
  mfaInput.value = '';
  showScreen('main-screen');
  renderMainUI();
}

async function handleLock() {
  const authRequired = await checkAuthRequired();
  if (authRequired) {
    const security = await getSecurity();
    document.getElementById('mfa-input-group').classList.toggle('hidden', !security.mfaEnabled);
    showScreen('lock-screen');
  }
}

// ============================================
// Password Management
// ============================================

async function handleSetPassword() {
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  if (!newPassword) {
    showStatus('settings-status', 'Please enter a password', 'error');
    return;
  }

  if (newPassword.length < 4) {
    showStatus('settings-status', 'Password must be at least 4 characters', 'error');
    return;
  }

  if (newPassword !== confirmPassword) {
    showStatus('settings-status', 'Passwords do not match', 'error');
    return;
  }

  const security = await getSecurity();
  security.passwordSalt = await HistManCrypto.generateSalt();
  security.passwordHash = await HistManCrypto.hashPassword(newPassword, security.passwordSalt);
  await saveSecurity(security);

  document.getElementById('new-password').value = '';
  document.getElementById('confirm-password').value = '';

  renderSecurityUI();
  showStatus('settings-status', 'Password set successfully', 'success');
}

async function handleChangePassword() {
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('change-new-password').value;
  const confirmPassword = document.getElementById('change-confirm-password').value;

  const security = await getSecurity();

  // Verify current password
  const isValid = await HistManCrypto.verifyPassword(
    currentPassword,
    security.passwordSalt,
    security.passwordHash
  );

  if (!isValid) {
    showStatus('settings-status', 'Current password is incorrect', 'error');
    return;
  }

  if (!newPassword) {
    showStatus('settings-status', 'Please enter a new password', 'error');
    return;
  }

  if (newPassword.length < 4) {
    showStatus('settings-status', 'Password must be at least 4 characters', 'error');
    return;
  }

  if (newPassword !== confirmPassword) {
    showStatus('settings-status', 'New passwords do not match', 'error');
    return;
  }

  security.passwordSalt = await HistManCrypto.generateSalt();
  security.passwordHash = await HistManCrypto.hashPassword(newPassword, security.passwordSalt);
  await saveSecurity(security);

  document.getElementById('current-password').value = '';
  document.getElementById('change-new-password').value = '';
  document.getElementById('change-confirm-password').value = '';

  renderSecurityUI();
  showStatus('settings-status', 'Password changed successfully', 'success');
}

async function handleRemovePassword() {
  const security = await getSecurity();
  security.passwordHash = null;
  security.passwordSalt = null;
  security.mfaSecret = null;
  security.mfaEnabled = false;
  await saveSecurity(security);

  renderSecurityUI();
  showStatus('settings-status', 'Password protection removed', 'success');
}

// ============================================
// MFA Management
// ============================================

async function handleSetupMFA() {
  try {
    pendingMfaSecret = HistManTOTP.generateSecret();

    // Display secret
    document.getElementById('mfa-secret').textContent = formatSecret(pendingMfaSecret);

    // Generate QR code
    const otpAuthUri = HistManTOTP.generateOTPAuthURI(pendingMfaSecret, 'HistMan User');
    const canvas = document.getElementById('qr-code');

    QRCode.toCanvas(canvas, otpAuthUri, {
      width: 256,
      margin: 2
    });

    // Show setup form
    document.getElementById('mfa-not-set').classList.add('hidden');
    document.getElementById('mfa-setup').classList.remove('hidden');
  } catch (error) {
    console.error('[HistMan] MFA setup error:', error);
    showStatus('settings-status', 'Error setting up 2FA', 'error');
  }
}

function formatSecret(secret) {
  // Format secret in groups of 4 for readability
  return secret.match(/.{1,4}/g).join(' ');
}

async function handleVerifyMFA() {
  const code = document.getElementById('verify-mfa-code').value.trim();

  if (!code || code.length !== 6) {
    showStatus('settings-status', 'Please enter a 6-digit code', 'error');
    return;
  }

  const isValid = await HistManTOTP.verifyTOTP(pendingMfaSecret, code);

  if (!isValid) {
    showStatus('settings-status', 'Invalid code. Please try again.', 'error');
    return;
  }

  // Save MFA secret
  const security = await getSecurity();
  security.mfaSecret = pendingMfaSecret;
  security.mfaEnabled = true;
  await saveSecurity(security);

  pendingMfaSecret = null;
  document.getElementById('verify-mfa-code').value = '';

  renderSecurityUI();
  showStatus('settings-status', '2FA enabled successfully', 'success');
}

async function handleCancelMFA() {
  pendingMfaSecret = null;
  document.getElementById('verify-mfa-code').value = '';
  renderSecurityUI();
}

async function handleDisableMFA() {
  const security = await getSecurity();
  security.mfaSecret = null;
  security.mfaEnabled = false;
  await saveSecurity(security);

  renderSecurityUI();
  showStatus('settings-status', '2FA disabled', 'success');
}

// ============================================
// Main App Functions
// ============================================

function renderList(items, listEl, type) {
  listEl.innerHTML = '';

  if (items.length === 0) {
    const emptyEl = document.createElement('li');
    emptyEl.className = 'empty-message';
    emptyEl.textContent = `No ${type} added yet`;
    listEl.appendChild(emptyEl);
    return;
  }

  items.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = 'list-item';

    const span = document.createElement('span');
    span.textContent = item;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete';
    deleteBtn.textContent = '×';
    deleteBtn.dataset.index = index;
    deleteBtn.dataset.type = type;

    li.appendChild(span);
    li.appendChild(deleteBtn);
    listEl.appendChild(li);
  });
}

async function addItem(type) {
  const input = type === 'domains'
    ? document.getElementById('domain-input')
    : document.getElementById('keyword-input');
  const value = input.value.trim();

  if (!value) {
    showStatus('status', 'Please enter a value', 'error');
    return;
  }

  const config = await getConfig();

  if (config[type].includes(value)) {
    showStatus('status', `${type === 'domains' ? 'Domain' : 'Keyword'} already exists`, 'error');
    return;
  }

  config[type].push(value);
  await saveConfig(config);

  input.value = '';
  await renderMainUI();
  showStatus('status', `${type === 'domains' ? 'Domain' : 'Keyword'} added`, 'success');
}

async function removeItem(type, index) {
  const config = await getConfig();
  config[type].splice(index, 1);
  await saveConfig(config);
  await renderMainUI();
  showStatus('status', `${type === 'domains' ? 'Domain' : 'Keyword'} removed`, 'success');
}

async function renderMainUI() {
  const config = await getConfig();
  const enabledToggle = document.getElementById('enabled-toggle');
  const domainsList = document.getElementById('domains-list');
  const keywordsList = document.getElementById('keywords-list');

  enabledToggle.checked = config.enabled;
  renderList(config.domains, domainsList, 'domains');
  renderList(config.keywords, keywordsList, 'keywords');

  // Update lock button visibility
  const authRequired = await checkAuthRequired();
  document.getElementById('lock-btn').classList.toggle('hidden', !authRequired);
}

async function toggleEnabled() {
  const enabledToggle = document.getElementById('enabled-toggle');
  const config = await getConfig();
  config.enabled = enabledToggle.checked;
  await saveConfig(config);
  showStatus('status', config.enabled ? 'Protection enabled' : 'Protection disabled', 'info');
}

async function scanHistory() {
  const scanBtn = document.getElementById('scan-history');
  scanBtn.disabled = true;
  scanBtn.textContent = 'Scanning...';

  try {
    const result = await chrome.runtime.sendMessage({ action: 'scanHistory' });
    showStatus('status', `Scan complete. Deleted ${result.deleted} entries.`, 'success');
  } catch (error) {
    showStatus('status', 'Error scanning history', 'error');
  }

  scanBtn.disabled = false;
  scanBtn.textContent = 'Scan & Clean History';
}

function switchTab(tabName) {
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });

  tabContents.forEach(content => {
    content.classList.toggle('active', content.id === `${tabName}-tab`);
  });
}

// ============================================
// Security Settings UI
// ============================================

async function renderSecurityUI() {
  const security = await getSecurity();
  const hasPassword = security.passwordHash !== null;

  // Password section
  document.getElementById('password-not-set').classList.toggle('hidden', hasPassword);
  document.getElementById('password-set').classList.toggle('hidden', !hasPassword);
  document.getElementById('change-password-form').classList.add('hidden');

  // MFA section (only show if password is set)
  document.getElementById('mfa-section').classList.toggle('hidden', !hasPassword);

  if (hasPassword) {
    document.getElementById('mfa-not-set').classList.toggle('hidden', security.mfaEnabled);
    document.getElementById('mfa-setup').classList.add('hidden');
    document.getElementById('mfa-enabled').classList.toggle('hidden', !security.mfaEnabled);
  }
}

function showChangePasswordForm() {
  document.getElementById('password-set').classList.add('hidden');
  document.getElementById('change-password-form').classList.remove('hidden');
}

function hideChangePasswordForm() {
  document.getElementById('current-password').value = '';
  document.getElementById('change-new-password').value = '';
  document.getElementById('change-confirm-password').value = '';
  document.getElementById('change-password-form').classList.add('hidden');
  document.getElementById('password-set').classList.remove('hidden');
}

// ============================================
// Event Listeners
// ============================================

function setupEventListeners() {
  // Lock screen
  document.getElementById('unlock-btn').addEventListener('click', handleUnlock);
  document.getElementById('unlock-password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleUnlock();
  });
  document.getElementById('unlock-mfa').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleUnlock();
  });

  // Main screen
  document.getElementById('enabled-toggle').addEventListener('change', toggleEnabled);
  document.getElementById('settings-btn').addEventListener('click', () => {
    showScreen('settings-screen');
    renderSecurityUI();
  });
  document.getElementById('lock-btn').addEventListener('click', handleLock);

  document.getElementById('add-domain').addEventListener('click', () => addItem('domains'));
  document.getElementById('add-keyword').addEventListener('click', () => addItem('keywords'));

  document.getElementById('domain-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addItem('domains');
  });
  document.getElementById('keyword-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addItem('keywords');
  });

  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-delete')) {
      const { type, index } = e.target.dataset;
      removeItem(type, parseInt(index));
    }
  });

  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  document.getElementById('scan-history').addEventListener('click', scanHistory);

  // Settings screen
  document.getElementById('back-btn').addEventListener('click', () => {
    showScreen('main-screen');
    renderMainUI();
  });

  // Password management
  document.getElementById('set-password-btn').addEventListener('click', handleSetPassword);
  document.getElementById('change-password-btn').addEventListener('click', showChangePasswordForm);
  document.getElementById('remove-password-btn').addEventListener('click', handleRemovePassword);
  document.getElementById('save-new-password-btn').addEventListener('click', handleChangePassword);
  document.getElementById('cancel-change-password-btn').addEventListener('click', hideChangePasswordForm);

  // MFA management
  document.getElementById('setup-mfa-btn').addEventListener('click', handleSetupMFA);
  document.getElementById('verify-mfa-btn').addEventListener('click', handleVerifyMFA);
  document.getElementById('cancel-mfa-btn').addEventListener('click', handleCancelMFA);
  document.getElementById('disable-mfa-btn').addEventListener('click', handleDisableMFA);
}

// ============================================
// Initialize
// ============================================

async function init() {
  setupEventListeners();

  const authRequired = await checkAuthRequired();

  if (authRequired) {
    const security = await getSecurity();
    document.getElementById('mfa-input-group').classList.toggle('hidden', !security.mfaEnabled);
    showScreen('lock-screen');
  } else {
    showScreen('main-screen');
    renderMainUI();
  }
}

init();
