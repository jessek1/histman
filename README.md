# HistMan - History Manager

A Chrome extension that automatically deletes browser history entries matching your configured domains and keywords.

![Chrome Web Store](https://img.shields.io/badge/platform-Chrome-green)
![Manifest Version](https://img.shields.io/badge/manifest-v3-blue)
![License](https://img.shields.io/badge/license-GPL--3.0-brightgreen)

## Features

- **Domain Filtering** - Block entire domains including all subdomains
- **Keyword Filtering** - Block URLs containing specific keywords
- **Real-Time Protection** - Automatically deletes matching history as you browse
- **Scan & Clean** - Remove matching entries from existing history
- **Password Protection** - Optional password lock with secure PBKDF2 hashing
- **Two-Factor Authentication** - Optional TOTP-based 2FA (Google Authenticator compatible)
- **Privacy Focused** - All data stays on your device, no external servers

## Installation

### From Chrome Web Store
*(Coming soon)*

### Manual Installation (Developer Mode)
1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/histman.git
   ```
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (top right toggle)
4. Click "Load unpacked"
5. Select the `src` folder from the cloned repository

## Usage

1. Click the HistMan icon in your browser toolbar
2. Add domains to block (e.g., `example.com`)
3. Add keywords to filter (e.g., `private`)
4. HistMan automatically deletes matching history entries

### Optional Security Setup
1. Click the gear icon (⚙️) to open Security settings
2. Set a password to protect your settings
3. Enable 2FA by scanning the QR code with an authenticator app

## Project Structure

```
histman/
├── src/                    # Extension source code
│   ├── manifest.json       # Chrome extension manifest (v3)
│   ├── background.js       # Service worker for history monitoring
│   ├── popup.html/js/css   # Extension popup UI
│   ├── crypto.js           # Password hashing utilities
│   ├── totp.js             # TOTP/2FA implementation
│   ├── qrcode.min.js       # QR code generator
│   ├── privacy.html        # Privacy policy
│   └── icons/              # Extension icons
├── scripts/
│   └── package.sh          # Build script for releases
├── dist/                   # Built packages (gitignored)
└── CLAUDE.md               # Development documentation
```

## Building

Create a package for Chrome Web Store submission:

```bash
# Package with current version
./scripts/package.sh

# Package with new version (auto-updates manifest.json)
./scripts/package.sh 1.0.1
```

Packages are created in the `dist/` directory.

## Permissions

HistMan requires minimal permissions:

| Permission | Purpose |
|------------|---------|
| `history` | Read and delete browser history entries |
| `storage` | Save settings locally on your device |

## Privacy

- **No data collection** - We don't collect any personal data
- **No external servers** - Everything runs locally on your device
- **No analytics** - No tracking or telemetry
- **Secure storage** - Passwords are hashed with PBKDF2 (100,000 iterations)

See [privacy.html](src/privacy.html) for the full privacy policy.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- QR code generation based on [qrcodejs](https://github.com/davidshimjs/qrcodejs)
