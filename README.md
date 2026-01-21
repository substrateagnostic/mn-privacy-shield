# MN Privacy Shield

Free tool to help Minnesotans exercise their rights under the Minnesota Consumer Data Privacy Act (MCDPA), effective July 31, 2025.

**Live at [shield.alexgallefrom.io](https://shield.alexgallefrom.io)**

## What This Does

1. **Letter Generator** — Generate official opt-out and deletion request letters based on MN Attorney General templates
2. **Deadline Tracker** — Track the 45-day response deadline for each company
3. **Browser Extension** — Automatic Global Privacy Control (GPC) signal + auto-fill assist for opt-out forms

## Features

- **545+ data brokers** from the CA CPPA registry
- **7 request types** matching AG Ellison's official templates
- **No account required** — all data stays in your browser
- **No tracking** — no analytics, cookies, or fingerprinting
- **Open source** — verify the code yourself

## Your Rights Under MCDPA

| Right | Statute | Description |
|-------|---------|-------------|
| Right to Know | 325M.14(2) | Find out what data companies have about you |
| Right to Delete | 325M.14(4) | Request deletion of your personal data |
| Right to Opt-Out | 325M.14(6) | Stop sale of data, targeted ads, profiling |
| Right to Correct | 325M.14(3) | Fix inaccurate information |
| Right to Portability | 325M.14(5) | Get a copy of your data |
| Third-Party List | 325M.14(8) | Know who your data was shared with |
| Profiling Info | 325M.14(7) | Understand automated decisions about you |

## Browser Extension

The extension provides:

1. **Global Privacy Control (GPC)** — Automatically tells every website not to sell your data. Legally binding under MN, CA, CO, CT law.

2. **Auto-Fill Assist** — Export your company list from the web app, then step through each portal with one-click form filling. You stay in control.

### Install

1. Download the extension from the website or this repo
2. Go to `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension folder

Chrome Web Store submission pending.

## Development

### Web App

```bash
cd mn-privacy-web
npm install
npm run dev
```

### Extension

Load unpacked from `mn-privacy-extension/` in Chrome/Edge developer mode.

## Legal

- Based on [MN Attorney General Ellison's official guidance](https://www.ag.state.mn.us/Data-Privacy/Consumer/)
- Not affiliated with the Minnesota Attorney General's office
- This tool is for informational purposes only and does not constitute legal advice
- Public interest tool — no ads, no profit

## Resources

- [MN AG Consumer Page](https://www.ag.state.mn.us/Data-Privacy/Consumer/)
- [MN AG FAQ](https://www.ag.state.mn.us/Data-Privacy/FAQ/)
- [File a Complaint](https://www.ag.state.mn.us/Data-Privacy/Complaint/)
- [Global Privacy Control](https://globalprivacycontrol.org/)

## Author

Built by [Alex Galle-From](https://alexgallefrom.io) — Minnesota attorney and AI governance researcher.

## License

MIT
