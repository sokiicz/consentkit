<div align="center">

# ConsentKit

**Self-hosted, open-source cookie consent management**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GDPR Compliant](https://img.shields.io/badge/GDPR-Compliant-green.svg)](#compliance-guide)
[![Google Consent Mode v2](https://img.shields.io/badge/Google%20Consent%20Mode-v2-orange.svg)](#google-consent-mode-v2-setup)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/sokiicz/consentkit/pulls)
[![Widget size](https://img.shields.io/badge/widget-<10KB%20gzip-blue)](#)
[![Buy me a coffee](https://img.shields.io/badge/Buy%20me%20a%20coffee-%E2%98%95-FFDD00)](https://buymeacoffee.com/sokii?utm_source=consentkit&utm_medium=readme&utm_campaign=support)

No SaaS. No dashboard. No monthly fees. No data leaving your server.

**Clone → edit one JSON file → deploy → paste one script tag.**

[FTP / Shared Hosting](#-ftp--shared-hosting-no-nodejs) · [Self-hosted Node](#quick-start-nodejs--vercel) · [Compliance Guide](#compliance-guide) · [Config Reference](#config-reference)

</div>

---

## Why ConsentKit?

Most cookie consent tools are either **SaaS with monthly fees** or **complex self-hosted platforms** that need their own database and admin panel. ConsentKit is neither.

It is a single embeddable JavaScript file + a JSON config. That's it.

| | ConsentKit | Cookiebot | CookieYes | Osano |
|---|:---:|:---:|:---:|:---:|
| Self-hosted | ✅ | ❌ | ❌ | ❌ |
| Open source | ✅ | ❌ | ❌ | ❌ |
| No monthly fee | ✅ | ❌ | ❌ | ❌ |
| Works on FTP hosting | ✅ | ❌ | ❌ | ❌ |
| GDPR opt-in by default | ✅ | ✅ | ✅ | ✅ |
| Google Consent Mode v2 | ✅ | ✅ | ✅ | ✅ |
| Dark-pattern free | ✅ | ⚠️ | ⚠️ | ⚠️ |
| GPC / DNT signal support | ✅ | ❌ | ❌ | ❌ |

---

## Features

- **Shadow DOM banner** — fully isolated styles, never conflicts with your site's CSS
- **Script pre-blocking** — non-essential scripts are blocked *before* they execute, not after
- **Google Consent Mode v2** — fires all seven parameters (including `ad_personalization`) with correct defaults, plus a `consent_update` event for GTM
- **English and Czech built in** — `"lang": "cs"` switches every text the widget adds itself, any text can be overridden in the config
- **Global Privacy Control** — auto-rejects without showing a banner when GPC is set
- **Do Not Track** — honoured as reject-all
- **CCPA "Do Not Sell" link** — built into the banner footer
- **Preferences re-open button** — always visible, consent can be withdrawn at any time
- **Consent audit log** — timestamped, versioned records stored locally (SQLite or CSV)
- **Zero dark patterns** — Accept All and Reject All are always identical in size, colour, and weight
- **< 10 KB gzipped** — a single minified JS file with zero dependencies
- **Works everywhere** — Vercel, Railway, shared cPanel hosting, any PHP server, bare VPS

---

## 🚀 FTP / Shared Hosting (no Node.js)

The fastest path. Works on GoDaddy, Hostinger, Namecheap, cPanel, any shared host.

### 1 — Download

Download **`consentkit-ftp-vX.X.X.zip`** from the [Releases page](https://github.com/sokiicz/consentkit/releases).

### 2 — Edit the config

Open `consentkit.config.json` in any text editor. (For a Czech banner start from `consentkit.config.cs.example.json` instead: copy it over `consentkit.config.json`.) Change these fields:

```json
{
  "banner": {
    "title": "We use cookies",
    "description": "We use cookies to improve your experience...",
    "privacyPolicyUrl": "/privacy-policy",
    "accentColor": "#4f46e5"
  }
}
```

### 3 — Upload

Create a `/consentkit/` folder on your server and upload the files:

```
yourwebsite.com/
└── consentkit/
    ├── widget.js
    ├── consentkit.config.json
    └── consent-log.php        ← optional, for audit logging
```

### 4 — Add the script tag

Paste before `</head>` on every page:

```html
<script
  src="/consentkit/widget.js"
  data-config="/consentkit/consentkit.config.json"
  data-log-url="/consentkit/consent-log.php"
  defer
></script>
```

Remove `data-log-url` if you don't need server-side logging.

**See [`ftp/README.md`](ftp/README.md) for the full FTP guide including WordPress instructions.**

---

## Quick Start (Node.js / Vercel)

### 1 — Clone

```bash
git clone https://github.com/sokiicz/consentkit.git
cd consentkit
```

### 2 — Configure

```bash
cp consentkit.config.example.json consentkit.config.json
# Edit consentkit.config.json with your settings
```

### 3 — Install and build

```bash
pnpm install
pnpm build
```

### 4 — Deploy

```bash
# Vercel
cd apps/server && vercel deploy

# Local
pnpm start   # http://localhost:3000
```

### 5 — Embed

```html
<script src="https://YOUR_DOMAIN/widget.js" defer></script>
```

---

## Script Blocking Setup

Add `data-ck-category` + `data-ck-src` to any script you want blocked until consent:

```html
<!-- Google Analytics -->
<script
  data-ck-category="analytics"
  data-ck-src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXX"
  async
></script>

<!-- Facebook Pixel -->
<script
  data-ck-category="marketing"
  data-ck-src="https://connect.facebook.net/en_US/fbevents.js"
  async
></script>

<!-- YouTube embed -->
<iframe
  data-ck-category="functional"
  data-ck-src="https://www.youtube.com/embed/VIDEO_ID"
  width="560" height="315" frameborder="0"
></iframe>
```

| Category key | What it blocks |
|---|---|
| `necessary` | Always active — never blocked |
| `analytics` | Google Analytics, Plausible, Hotjar… |
| `marketing` | Facebook Pixel, Google Ads, LinkedIn… |
| `functional` | Chat widgets, YouTube embeds, Typeform… |

---

## Google Consent Mode v2 Setup

ConsentKit fires all seven GCM v2 parameters (`security_storage` as `"granted"`, the rest as `"denied"`) before any user interaction — which is the requirement from Google for EEA visitors.

**Load ConsentKit before your Google tag:**

```html
<head>
  <!-- 1. ConsentKit first -->
  <script src="https://YOUR_DOMAIN/widget.js" defer></script>

  <!-- 2. Google tag second -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX');
  </script>
</head>
```

**Enable GCM in your config:**

```json
"googleConsentMode": {
  "enabled": true,
  "defaultAdStorage": "denied",
  "defaultAnalyticsStorage": "denied",
  "defaultFunctionalityStorage": "denied",
  "defaultPersonalizationStorage": "denied",
  "defaultAdUserData": "denied",
  "defaultAdPersonalization": "denied",
  "defaultSecurityStorage": "granted"
}
```

**Consent → GCM mapping:**

| ConsentKit category | GCM v2 parameters |
|---|---|
| `analytics` | `analytics_storage` |
| `marketing` | `ad_storage`, `ad_user_data`, `ad_personalization` |
| `functional` | `functionality_storage`, `personalization_storage` |
| `necessary` | `security_storage` (always `granted`) |

`defaultAdPersonalization` is optional: configs written before v1.2 do not have it and get `"denied"`.

**`consent_update` event for Google Tag Manager:** after a visitor decides (Accept All, Reject All, Save Preferences, also from the re-opened preferences), ConsentKit pushes `{ event: 'consent_update' }` to `dataLayer`, right after `gtag('consent', 'update', …)`. Tags that wait for consent only re-check on their next trigger, so use a Custom Event trigger named `consent_update` to fire them straight after the click instead of on the next page view. The event has no payload. It is not sent when consent is applied automatically (Global Privacy Control, Do Not Track, stored consent on page load).

---

## Config Reference

| Field | Type | Description |
|---|---|---|
| `version` | string | Bump this to re-ask consent from returning visitors |
| `lang` | string | `en` (default) or `cs`. Picks the built-in texts, see [Languages](#languages) |
| `strings` | object | Optional overrides for the built-in texts, see [Languages](#languages) |
| `banner.position` | string | `bottom-bar` · `bottom-left` · `bottom-right` · `center-popup` |
| `banner.primaryColor` | string | Banner background colour |
| `banner.accentColor` | string | Button / toggle colour |
| `banner.privacyPolicyUrl` | string | Link shown in banner description |
| `categories[].key` | string | Used in `data-ck-category` attributes |
| `categories[].locked` | boolean | `true` = always on (use for necessary) |
| `categories[].defaultEnabled` | boolean | Pre-selected state (`false` for GDPR opt-in) |
| `consentLogging.enabled` | boolean | POST consent records to the logging endpoint |
| `consentLogging.retentionDays` | number | Auto-delete old records (default: `1825` = 5 years) |
| `googleConsentMode.enabled` | boolean | Fire GCM v2 signals |
| `googleConsentMode.defaultAdPersonalization` | string | Optional, default `denied` |
| `ccpa.enabled` | boolean | Show "Do Not Sell" link in banner footer |

Full example: [`consentkit.config.example.json`](consentkit.config.example.json)

---

## Languages

Banner title, description, button labels and category texts come from your config, so write them in your language. The widget adds a few texts of its own (the "Learn more" link, labels for screen readers, the title of the preferences panel, the tooltip of the re-open button). Those come from a built-in table chosen by `lang`; unknown languages fall back to English.

| Key | `en` | `cs` |
|---|---|---|
| `logoAlt` | Logo | Logo |
| `learnMore` | Learn more | Více v zásadách |
| `preferencesTitle` | Cookie Preferences | Nastavení cookies |
| `backToBanner` | Back to cookie banner | Zpět na lištu |
| `alwaysOn` | Always On | Vždy zapnuto |
| `categoryToggle` | {label} cookies | Cookies: {label} |
| `reopenerLabel` | Manage cookie preferences | Nastavení cookies |

Override any of them, or write your own language, with `strings`:

```json
{
  "lang": "cs",
  "strings": { "learnMore": "Zásady ochrany údajů" }
}
```

A ready-made Czech config is in [`ftp/consentkit.config.cs.example.json`](ftp/consentkit.config.cs.example.json).

---

## Compliance Guide

### GDPR + ePrivacy (EU)

- All non-necessary scripts blocked **before** any rendering
- Opt-in model — all non-necessary categories default to **off**
- Accept All and Reject All have **identical visual weight** (hardcoded, not configurable)
- Consent never inferred from scrolling, time-on-page, or continued browsing
- Timestamped, versioned consent records stored for audit trail
- Preferences re-open button always visible — consent withdrawable at any time

### CCPA / CPRA (California)

- "Do Not Sell or Share My Personal Information" link in banner footer
- Clicking it triggers reject-all for non-necessary categories

### LGPD (Brazil)

- Opt-in consent model satisfies LGPD requirements
- Timestamped records with purpose-specific categories

### Global Privacy Control (GPC)

When `navigator.globalPrivacyControl === true` (Brave, Firefox + uBlock, DuckDuckGo browser):
- Banner is **not shown**
- All non-necessary categories silently rejected
- GCM v2 updated immediately
- Consent recorded for audit trail

Required under CPRA (California). Recommended best practice under GDPR.

### Dark patterns explicitly prevented (hardcoded)

These rules cannot be overridden by any config option:

1. Accept All and Reject All always have **identical CSS**
2. All non-necessary categories always default to **off**
3. GCM v2 always defaults to `"denied"` before user interaction
4. GPC always triggers silent reject-all
5. Consent is never assumed from page interaction
6. The re-open preferences button is always rendered

---

## Consent Log Access

Consent records are stored in `apps/server/data/consent-log.db` (Node version)
or `consent-log.csv` (FTP/PHP version).

**SQLite (Node server):**

```bash
sqlite3 apps/server/data/consent-log.db "SELECT * FROM consent_logs ORDER BY id DESC LIMIT 20;"
```

**CSV (FTP/PHP):**

Download `consent-log.csv` via your hosting file manager and open in Excel.

**Schema:**

```
visitor_id | timestamp | choices (JSON) | banner_version | user_agent | logged_at
```

---

## Self-Hosting Guide

### Railway

1. Connect your GitHub repo to a new Railway project
2. Set root directory to `apps/server`
3. Add a Volume at `/app/data` for SQLite persistence
4. Set start command: `pnpm start`

### Render

1. New Web Service → connect repo → root directory: `apps/server`
2. Build command: `pnpm install && pnpm build`
3. Start command: `pnpm start`
4. Add Persistent Disk at `/data`

### Bare VPS (Ubuntu)

```bash
git clone https://github.com/sokiicz/consentkit.git /opt/consentkit
cd /opt/consentkit
cp consentkit.config.example.json consentkit.config.json
pnpm install && pnpm build
cd apps/server
pm2 start "pnpm start" --name consentkit
```

---

## Cookie Policy Template

A minimal, copy-and-adapt cookie policy is included in the full docs:
[Cookie Policy Template](https://github.com/sokiicz/consentkit/wiki/Cookie-Policy-Template)

---

## Project Structure

```
consentkit/
├── ftp/                          # ← Download this for FTP/shared hosting
│   ├── widget.js                 #   Pre-built banner (attached to Releases)
│   ├── consentkit.config.json    #   Edit this
│   ├── consent-log.php           #   PHP audit logging
│   └── embed-example.html        #   Copy-paste HTML examples
│
├── packages/widget/src/          # Widget source (Vanilla TypeScript)
│   ├── index.ts                  #   Entry point
│   ├── banner.ts                 #   Shadow DOM UI
│   ├── i18n.ts                   #   Built-in texts (en, cs)
│   ├── blocker.ts                #   Script pre-blocking
│   ├── gcm.ts                    #   Google Consent Mode v2
│   └── consent.ts                #   Storage + logging
│
├── apps/server/                  # Config server (Next.js)
│   └── pages/api/
│       ├── config.ts             #   GET /api/config
│       └── consent.ts            #   POST /api/consent → SQLite
│
└── consentkit.config.example.json
```

---

## Contributing

Pull requests are welcome. For significant changes please open an issue first.

```bash
pnpm install
pnpm dev        # widget watch + Next.js dev server
pnpm build      # production build
pnpm zip        # package ftp/ into dist/consentkit-ftp.zip
```

---

## License

[MIT](LICENSE) — free for personal and commercial use.
