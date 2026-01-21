# MN Privacy Shield - Browser Extension

Send Global Privacy Control (GPC) signals to websites, enforcing your Minnesota Consumer Data Privacy Act (MCDPA) opt-out rights automatically.

## What is GPC?

Global Privacy Control (GPC) is a technical specification that allows users to signal their privacy preferences to websites. Under MCDPA (effective July 31, 2025), websites **must** honor GPC signals as a valid opt-out request.

## Features

- **Automatic GPC Signal**: Sends `Sec-GPC: 1` header with all requests
- **DOM Property**: Sets `navigator.globalPrivacyControl = true`
- **One-Click Toggle**: Enable/disable GPC signal instantly
- **Legal Compliance**: Recognized under MCDPA, CCPA, CPA, and CTDPA

## Installation

### From Source (Development)

1. Clone this repository
2. Generate PNG icons (see below)
3. Open Chrome and navigate to `chrome://extensions`
4. Enable "Developer mode" (toggle in top-right)
5. Click "Load unpacked" and select this folder

### Generate Icons

The extension requires PNG icons. Convert the SVG icons:

```bash
# Using Inkscape
inkscape -w 16 -h 16 icons/icon.svg -o icons/icon16.png
inkscape -w 48 -h 48 icons/icon.svg -o icons/icon48.png
inkscape -w 128 -h 128 icons/icon.svg -o icons/icon128.png

# Or use online converter like svgtopng.com
```

## Testing

1. Install the extension
2. Visit https://global-privacy-control.glitch.me/
3. The page should show GPC is **enabled**
4. Open DevTools Console and run: `navigator.globalPrivacyControl`
   - Should return `true`
5. Open DevTools Network tab, refresh, and check request headers
   - Should include `Sec-GPC: 1`

## Legal Background

### Minnesota Consumer Data Privacy Act (MCDPA)

- **Effective**: July 31, 2025
- **GPC Recognition**: Explicitly recognized as valid universal opt-out
- **Response Deadline**: Companies have 45 days to respond to requests
- **Penalties**: Up to $7,500 per violation

### Other States with GPC Recognition

- California (CCPA/CPRA)
- Colorado (CPA)
- Connecticut (CTDPA)
- Montana (MCDPA)
- Texas (TDPSA)

## How It Works

### 1. HTTP Header (Sec-GPC)

The extension uses Chrome's `declarativeNetRequest` API to add the `Sec-GPC: 1` header to all outgoing requests. This signals to servers that the user does not consent to their data being sold or shared.

### 2. JavaScript Property (navigator.globalPrivacyControl)

Some websites check the `navigator.globalPrivacyControl` property before sending tracking requests. The extension injects a content script (in MAIN world) to define this property as `true`.

## Privacy

This extension:
- Does **not** collect any data about you
- Does **not** communicate with any external servers
- Does **not** track your browsing activity
- Only stores your GPC enabled/disabled preference locally

## Resources

- [MN Privacy Shield Web App](https://alexgallefrom.io/projects/mn-privacy-shield) - Generate opt-out letters
- [GPC Specification](https://privacycg.github.io/gpc-spec/)
- [GPC Test Page](https://global-privacy-control.glitch.me/)
- [MN AG Consumer Page](https://www.ag.state.mn.us/Data-Privacy/Consumer/)

## License

MIT License - See LICENSE file

## Author

[Alex Galle-From](https://alexgallefrom.io)

---

*над. нашу. присутствие. память.*
