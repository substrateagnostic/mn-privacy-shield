# Minnesota Data Privacy Rights Tool
## Architecture Specification for Claude Code

**Project Name:** MN Privacy Shield (or similar)
**Purpose:** Help Minnesotans exercise their rights under the Minnesota Consumer Data Privacy Act (MCDPA)
**Target:** alexgallefrom.com integration + standalone use

---

## 1. THE PROBLEM

The Minnesota Consumer Data Privacy Act gives residents powerful rights:
- Right to know what data companies have
- Right to opt-out of data sales
- Right to delete personal data
- Right to get a list of who bought their data
- Right to question automated/AI profiling decisions

**But** exercising these rights requires:
1. Knowing which companies have your data (there's no MN registry)
2. Sending individual requests to each company
3. Tracking 45-day response deadlines
4. Filing complaints when companies don't respond

The AG's office has template letters, but no automation. The article explicitly says "lawmakers would need to act to make it easier."

**We make it easier.**

---

## 2. CORE FEATURES

### 2.1 Universal Opt-Out Signal (Browser Extension)

**What it does:** Enables Global Privacy Control (GPC) signal

**Technical implementation:**
- GPC is a W3C draft standard
- HTTP header: `Sec-GPC: 1`
- DOM property: `navigator.globalPrivacyControl = true`
- Minnesota law recognizes "universal opt-out mechanisms"

**Why this matters:**
- GPC is legally recognized in CA, CO, CT, NJ and being adopted elsewhere
- Minnesota's MCDPA explicitly allows "universal opt-out systems"
- One toggle protects against ALL compliant sites

**Build:**
- Simple Chrome/Firefox extension
- Single on/off toggle
- Shows GPC status in toolbar
- Logs which sites received the signal (optional)

### 2.2 Data Broker Request Generator (Web App)

**What it does:** Batch-generates MCDPA request letters to data brokers

**Data sources:**
- California Data Broker Registry (500+ brokers, downloadable CSV)
  - URL: https://oag.ca.gov/data-brokers (now at CPPA)
  - Many CA brokers operate nationally
- User can add custom companies

**User flow:**
1. User enters their info (name, address, email)
2. User selects request type(s):
   - Opt-out of sale
   - Delete my data
   - Get list of who you sold to
   - Get copy of my data
   - Correct inaccurate data
3. User selects companies (checkboxes, "select all" option)
4. System generates personalized letters using AG templates
5. User can:
   - Download all as PDFs
   - Download all as single merged PDF
   - Get email templates with mailto: links
   - Print batch

**Templates (from MN AG site):**
- https://www.ag.state.mn.us/Data-Privacy/Consumer/Letters/MCDPA_Template_Letter_sub_h.pdf (list of third parties)
- https://www.ag.state.mn.us/Data-Privacy/Consumer/Letters/MCDPA_Template_Letter_sub_f.pdf (opt-out)
- https://www.ag.state.mn.us/Data-Privacy/Consumer/Letters/MCDPA_Template_Letter_sub_e.pdf (copy/portability)
- https://www.ag.state.mn.us/Data-Privacy/Consumer/Letters/MCDPA_Template_Letter_sub_b.pdf (right to know)
- https://www.ag.state.mn.us/Data-Privacy/Consumer/Letters/MCDPA_Template_Letter_sub_c.pdf (correction)
- https://www.ag.state.mn.us/Data-Privacy/Consumer/Letters/MCDPA_Template_Letter_sub_d.pdf (deletion)
- https://www.ag.state.mn.us/Data-Privacy/Consumer/Letters/MCDPA_Template_Letter_sub_g.pdf (profiling info)

### 2.3 Deadline Tracker

**What it does:** Tracks 45-day response deadlines

**Features:**
- Calendar view of pending requests
- Email reminders at 30 days, 40 days, 45 days
- Status tracking: Sent → Acknowledged → Completed / No Response
- One-click complaint generator when deadline passes

**Complaint flow:**
- After 45 days with no response, generate AG complaint
- Link to: https://www.ag.state.mn.us/Data-Privacy/Complaint/
- Pre-fill complaint form data where possible

### 2.4 Community Data (Optional/Future)

**What it does:** Crowdsourced broker response data

**Features:**
- Users can report: "Company X responded in Y days" / "Company X ignored me"
- Aggregate stats: "Acxiom: 78% response rate, avg 12 days"
- Helps users prioritize which brokers to target

**Privacy consideration:** No PII stored, only aggregate response stats

---

## 3. TECHNICAL ARCHITECTURE

### 3.1 Stack Recommendation

**Frontend:**
- React or Svelte (lightweight)
- Tailwind CSS
- Works as static site (can host on GitHub Pages)

**Backend (minimal):**
- Could be entirely client-side for privacy
- Optional: Simple API for deadline reminders (email service)
- Optional: Supabase or similar for community data

**Browser Extension:**
- Manifest V3 (Chrome)
- WebExtension API (Firefox)
- ~50 lines of code for core GPC functionality

### 3.2 Data Storage

**Client-side (localStorage/IndexedDB):**
- User's request history
- Deadline tracking
- Selected companies

**Server-side (optional):**
- Email reminder queue
- Community response stats (anonymized)

### 3.3 Privacy-First Design

**Critical:** A privacy tool must BE private

- No tracking, no analytics (or privacy-respecting only like Plausible)
- All PII stays client-side
- No account required for core functionality
- Optional account only for email reminders
- Open source

---

## 4. DATA BROKER DATABASE

### 4.1 Initial Seed

Download CA registry CSV from CPPA:
https://cppa.ca.gov/data_brokers/

Fields needed:
- Company name
- Contact email
- Website
- Opt-out URL (if provided)
- Physical address

### 4.2 Schema

```typescript
interface DataBroker {
  id: string;
  name: string;
  email: string;
  website: string;
  optOutUrl?: string;
  address?: string;
  category?: string; // "advertising", "people-search", "financial", etc.
  
  // Community data (optional)
  avgResponseDays?: number;
  responseRate?: number;
  lastUpdated?: Date;
}
```

### 4.3 Categories to Prioritize

For ICE/surveillance concerns specifically:
1. **Location data brokers** (Venntel, Babel Street, etc.)
2. **People search sites** (Spokeo, BeenVerified, Whitepages)
3. **Advertising/tracking networks**
4. **Data aggregators** (Acxiom, Oracle Data Cloud, LiveRamp)

---

## 5. LETTER GENERATION

### 5.1 Template Structure

```
[DATE]

[COMPANY NAME]
[COMPANY ADDRESS]

Re: Minnesota Consumer Data Privacy Act Request - [REQUEST TYPE]

Dear Privacy Officer:

I am a Minnesota resident exercising my rights under the Minnesota 
Consumer Data Privacy Act, Minn. Stat. § 325O.

[REQUEST-SPECIFIC PARAGRAPH]

My information:
Name: [USER NAME]
Address: [USER ADDRESS]
Email: [USER EMAIL]

You are required to respond to this request within 45 days. Failure 
to respond may result in a complaint to the Minnesota Attorney General's 
Office and potential fines of $7,500 per violation.

Sincerely,
[USER NAME]
```

### 5.2 Request-Specific Paragraphs

**Opt-Out:**
> I request that you cease selling my personal data to third parties, 
> cease using my personal data for targeted advertising, and cease 
> profiling me for automated decisions that produce legal or similarly 
> significant effects.

**Deletion:**
> I request that you delete all personal data you have collected about me.

**List of Third Parties:**
> I request a list of all third parties to whom you have sold or 
> disclosed my personal data.

(etc. - pull exact language from AG templates)

---

## 6. BROWSER EXTENSION SPEC

### 6.1 Core Functionality

```javascript
// manifest.json (V3)
{
  "manifest_version": 3,
  "name": "MN Privacy Shield",
  "version": "1.0",
  "description": "Enable Global Privacy Control for Minnesota residents",
  "permissions": ["storage"],
  "action": {
    "default_popup": "popup.html",
    "default_icon": "icon.png"
  },
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["gpc.js"],
    "run_at": "document_start"
  }]
}

// gpc.js
if (localStorage.getItem('gpc_enabled') === 'true') {
  Object.defineProperty(navigator, 'globalPrivacyControl', {
    value: true,
    writable: false
  });
}

// For the header, need declarativeNetRequest in V3
```

### 6.2 Popup UI

- Toggle switch: "Enable Global Privacy Control"
- Status indicator: ON/OFF
- Brief explanation of what GPC does
- Link to full web app for more tools

---

## 7. INTEGRATION WITH ALEXGALLEFROM.COM

### 7.1 Landing Page

- Clear explanation of MN privacy rights
- "Why this matters now" (ICE/surveillance context without being inflammatory)
- Tool access (web app + extension download)
- Link to AG resources

### 7.2 Positioning

"Minnesota gave you data privacy rights. Here's how to use them."

**Tone:** Practical, empowering, non-partisan (this is about rights, not politics)

---

## 8. IMPLEMENTATION PHASES

### Phase 1: MVP (1-2 weeks)
- [ ] Browser extension with GPC toggle
- [ ] Static web app with letter generator
- [ ] 50 most important data brokers pre-loaded
- [ ] PDF generation (client-side)
- [ ] Basic deadline tracking (localStorage)

### Phase 2: Enhanced (2-4 weeks)
- [ ] Email reminder system
- [ ] Full CA broker database imported
- [ ] Complaint generator integration
- [ ] Mobile-responsive design

### Phase 3: Community (4-8 weeks)
- [ ] Anonymous response tracking
- [ ] Broker "report card" system
- [ ] User accounts (optional)
- [ ] API for other tools to use

---

## 9. LEGAL CONSIDERATIONS

- This is a tool to exercise existing legal rights
- Not legal advice - include disclaimer
- Letters use AG-provided templates
- GPC is explicitly recognized in MN law
- Open source = transparency

---

## 10. RESOURCES

**Minnesota AG:**
- Consumer info: https://www.ag.state.mn.us/Data-Privacy/Consumer/
- FAQ: https://www.ag.state.mn.us/Data-Privacy/FAQ/
- Complaint form: https://www.ag.state.mn.us/Data-Privacy/Complaint/
- Template letters: https://www.ag.state.mn.us/Data-Privacy/Consumer/Letters/

**Global Privacy Control:**
- Spec: https://globalprivacycontrol.github.io/gpc-spec/
- Info: https://globalprivacycontrol.org/
- Implementation guide: https://globalprivacycontrol.org/implementation

**Data Broker Registry:**
- CA (now at CPPA): https://cppa.ca.gov/data_brokers/

---

## 11. CLAUDE CODE IMPLEMENTATION NOTES

**Start with:**
1. Browser extension (smallest lift, immediate value)
2. Letter generator web app (React + client-side PDF)
3. Broker database from CA registry

**Key libraries:**
- pdf-lib or jsPDF for client-side PDF generation
- date-fns for deadline calculations
- React Query or SWR if adding backend

**Testing:**
- Test GPC signal at: https://globalprivacycontrol.org/
- Many sites now show "GPC detected" in their privacy settings

---

*Spec version: 1.0*
*Created: 2026-01-20*
*For: Alex Galle-From / Sovereign City project*
