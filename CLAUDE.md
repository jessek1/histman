# HistMan - History Manager

A Chrome extension that automatically deletes browser history entries matching configured domains and keywords.

## Project Structure

```
/root/rds/histman/
├── src/                    # Extension source code
│   ├── manifest.json       # Chrome extension manifest (v3)
│   ├── background.js       # Service worker - monitors and deletes history
│   ├── popup.html          # Main popup UI
│   ├── popup.js            # Popup logic and authentication
│   ├── popup.css           # Popup styles
│   ├── crypto.js           # Password hashing (PBKDF2)
│   ├── totp.js             # TOTP/MFA implementation
│   ├── qrcode.min.js       # QR code generator for MFA setup
│   ├── privacy.html        # Privacy policy page
│   └── icons/              # Extension icons (16, 48, 128px)
├── dist/                   # Built packages for Chrome Web Store
├── scripts/
│   └── package.sh          # Packaging script for releases
└── CLAUDE.md               # This file
```

## Features

- **Domain filtering**: Block history entries by domain (includes subdomains)
- **Keyword filtering**: Block history entries containing specific keywords
- **Real-time monitoring**: Automatically deletes matching entries as you browse
- **Scan & Clean**: Manually scan and delete existing history matches
- **Password protection**: Optional password lock with PBKDF2 hashing
- **Two-factor authentication**: Optional TOTP-based MFA (Google Authenticator compatible)
- **Enable/disable toggle**: Quickly turn protection on/off

## Key Files

### background.js
- Listens to `chrome.history.onVisited` for real-time deletion
- `scanExistingHistory()` - searches and deletes matching history
- `matchesDomain()` - matches exact domain and subdomains
- `matchesKeyword()` - matches keywords anywhere in URL

### popup.js
- Three screens: lock, main, settings
- `STORAGE_KEY = 'histman_config'` - domains, keywords, enabled state
- `SECURITY_KEY = 'histman_security'` - password hash, salt, MFA secret

### crypto.js
- `hashPassword(password, salt)` - PBKDF2 with 100,000 iterations
- `verifyPassword(password, salt, hash)` - password verification

### totp.js
- `generateSecret()` - creates 20-byte base32 secret
- `verifyTOTP(secret, code)` - validates 6-digit codes with ±1 step tolerance

## Building & Packaging

```bash
# Package current version
./scripts/package.sh

# Package with version bump (updates manifest.json)
./scripts/package.sh 1.0.1
```

Packages are created in `/dist/histman-v{version}.zip`

## Chrome Web Store

- Developer Dashboard: https://chrome.google.com/webstore/devconsole
- Required permissions: `history`, `storage`
- Privacy policy included in extension (`privacy.html`)

## Development

1. Load unpacked extension from `/src` in `chrome://extensions/`
2. Enable Developer mode
3. Make changes and click refresh on the extension card
4. Check service worker console for background.js logs

## Storage Schema

```javascript
// histman_config
{
  domains: string[],      // e.g., ["instagram.com", "facebook.com"]
  keywords: string[],     // e.g., ["private", "secret"]
  enabled: boolean
}

// histman_security
{
  passwordHash: string | null,
  passwordSalt: string | null,
  mfaSecret: string | null,
  mfaEnabled: boolean
}
```
