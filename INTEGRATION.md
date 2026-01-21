# MN Privacy Shield — Website Integration Plan

## Overview

MN Privacy Shield is a consumer rights tool for the Minnesota Consumer Data Privacy Act (MCDPA).

**Components:**
1. **Web App** (`mn-privacy-web/`) — Letter generator + deadline tracker
2. **Browser Extension** (`mn-privacy-extension/`) — Global Privacy Control signal

---

## Recommended Deployment

### Web App
- **Subdomain:** `shield.alexgallefrom.io` or `privacy.alexgallefrom.io`
- **Platform:** Vercel (matches main site)
- **Repository:** Can stay in this repo or split to dedicated repo

### Browser Extension
- **Chrome Web Store:** Publish as "MN Privacy Shield - Global Privacy Control"
- **Firefox Add-ons:** Port to Firefox (Manifest V3 compatible)
- **GitHub Releases:** Provide `.crx` for sideloading

---

## Main Site Integration (alexgallefrom.io)

### Add to Projects Array

In `lib/content.ts`, add to `projects.webapps`:

```typescript
{
  title: "MN Privacy Shield",
  tag: "Consumer Rights",
  status: "Active",
  desc: "Exercise your Minnesota Consumer Data Privacy Act rights. Generate opt-out letters for 545+ data brokers, track 45-day compliance deadlines.",
  links: {
    demo: "https://shield.alexgallefrom.io/",
    source: "https://github.com/alexgallefrom/mn-privacy-shield"
  }
}
```

### Optional: Add to Navbar

If you want top-level visibility, add to navbar:

```typescript
{ href: "https://shield.alexgallefrom.io", label: "Privacy Shield", external: true }
```

### Thematic Framing

This tool connects to your broader work:

- **Authentication Cliff thesis:** Data brokers are the opposite of verified identity — they aggregate unverified PII
- **Minnesota Digital Trust Act:** Consumer-facing complement to business-side accountability
- **Proof-of-Safety Stack:** Privacy protection without surveillance (local storage, no tracking)
- **The Three Questions:** Who owns data? (You do.) Who gets it? (You decide.) What's it worth? (Your privacy.)

---

## Design System Applied

The web app now uses Galle-From® Bedrock Standard:

- **Colors:** Oxblood accent (#4a0404), Bedrock (#111111), Paper (#f9f9f7)
- **Typography:** Inter Tight (body), JetBrains Mono (labels/UI)
- **Borders:** 2px sharp (no rounded corners)
- **Patterns:** `[MONOSPACE_TAGS]`, uppercase headlines, hover rise + shadow

---

## Before Publishing

### Web App
- [ ] Replace `alexgallefrom.io` attribution link with correct URL once deployed
- [ ] Add meta tags for social sharing (og:image, twitter:card)
- [ ] Consider adding source link to GitHub

### Browser Extension
- [ ] Convert SVG icons to PNG (16x16, 48x48, 128x128)
- [ ] Test on Chrome: `chrome://extensions` → Load unpacked
- [ ] Test on https://global-privacy-control.glitch.me/
- [ ] Update popup link to actual deployed web app URL
- [ ] Create Chrome Web Store listing
- [ ] Create privacy policy page (required for Web Store)

---

## File Structure

```
MN privacy MNCDP/
├── INTEGRATION.md          ← This file
├── mn-privacy-web/         ← Next.js 16 web app
│   ├── src/
│   │   ├── app/            ← Pages (/, /generator, /tracker)
│   │   ├── components/     ← React components
│   │   ├── data/           ← 545 brokers from CA CPPA registry
│   │   └── lib/            ← Types, templates, PDF generation, storage
│   └── registry.csv        ← Source CA data
│
└── mn-privacy-extension/   ← Manifest V3 Chrome extension
    ├── manifest.json
    ├── background.js       ← Service worker (GPC toggle)
    ├── inject-gpc.js       ← MAIN world script (navigator.globalPrivacyControl)
    ├── rules.json          ← declarativeNetRequest (Sec-GPC header)
    ├── popup/              ← Extension popup UI
    └── icons/              ← Extension icons
```

---

## Key Links

- MN AG Consumer Page: https://www.ag.state.mn.us/Data-Privacy/Consumer/
- MN AG Complaint Form: https://www.ag.state.mn.us/Data-Privacy/Complaint/
- GPC Specification: https://privacycg.github.io/gpc-spec/
- GPC Test Page: https://global-privacy-control.glitch.me/
- CA CPPA Registry: https://cppa.ca.gov/data_broker_registry/

---

*над. нашу. присутствие. память.*
