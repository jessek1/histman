# HistMan Privacy Policy

**Last updated: December 2024**

> **Summary:** HistMan operates entirely on your device. We do not collect, store, transmit, or share any of your personal data, browsing history, or settings. Your privacy is fully protected.

## Introduction

HistMan ("the Extension") is a browser extension that helps you manage your browsing history by automatically deleting entries that match domains or keywords you configure. This privacy policy explains how the Extension handles your data.

## Data Collection

**We do not collect any data.** The Extension:

- Does NOT collect personal information
- Does NOT collect browsing history
- Does NOT collect usage statistics
- Does NOT use analytics or tracking
- Does NOT communicate with external servers

## Data Storage

All data is stored locally on your device using Chrome's built-in storage API. This includes:

- **Domain list:** The domains you configure for history deletion
- **Keyword list:** The keywords you configure for history deletion
- **Security settings:** Your password hash and MFA secret (if enabled)
- **Preferences:** Whether the extension is enabled or disabled

This data never leaves your device and is not accessible to us or any third party.

## Password and Security

If you choose to set a password:

- Your password is hashed using PBKDF2 with a random salt before storage
- The original password is never stored
- MFA secrets are stored locally and used only for verification
- All security data remains on your device

## Permissions

The Extension requires the following permissions:

| Permission | Purpose |
|------------|---------|
| `history` | Required to read and delete browser history entries that match your configured filters |
| `storage` | Required to save your settings locally on your device |

These permissions are used solely for the Extension's core functionality and not for data collection.

## Third-Party Services

The Extension does not use any third-party services, APIs, or analytics platforms. It operates completely offline after installation.

## Data Sharing

We do not share any data because we do not collect any data. Your configured domains, keywords, and settings remain exclusively on your device.

## Data Deletion

To delete all Extension data:

- Uninstall the Extension from Chrome, or
- Clear the Extension's storage via Chrome settings

## Children's Privacy

The Extension does not collect any personal information from anyone, including children under 13.

## Changes to This Policy

If we make changes to this privacy policy, we will update the "Last updated" date at the top. Continued use of the Extension after changes constitutes acceptance of the updated policy.

## Contact

If you have questions about this privacy policy, please open an issue on our GitHub repository or contact the developer.

---

**HistMan - History Manager**

This extension is open source and operates entirely on your device.
