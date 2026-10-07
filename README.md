<div align="center">

# ConsentKit

**Self-hosted, open-source cookie consent management**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GDPR opt-in by default](https://img.shields.io/badge/GDPR-opt--in%20by%20default-green.svg)](#compliance-guide)
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

---

## Features

- **Shadow DOM banner** — fully isolated styles, never conflicts with your site's CSS
- **Script pre-blocking** — non-essential scripts are blocked *before* they execute, not after
- **Google Consent Mode v2** — fires all seven parameters (including `ad_personalization`) with correct defaults, plus a `consent_update` event for GTM
- **English and Czech built in** — `"lang": "cs"` switches every text the widget adds itself, any text can be overridden in the config
- **Global Privacy Control** — auto-rejects without showing a banner when GPC is set
- **Do Not Track** — honoured as reject-all
- **CCPA "Do Not Sell" link** — built into the banner footer
- **Always a way to withdraw consent** — a re-open button is shown once consent exists (also after Accept All) and a visitor can drag it off screen for the rest of the browser session; or switch it off and link `ConsentKit.openPreferences()` from your footer or settings page. Visitors whose browser sends GPC or DNT get no banner and no button, `openPreferences()` still works for them
- **Consent audit log** — timestamped, versioned records stored locally (SQLite or CSV)
- **No hidden choice** — Accept All and Reject All sit side by side on the first layer with the same style (height, font, colour, weight), one click each. No pre-ticked boxes, no cookie wall
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
    ├── consent-log.php        ← optional, for audit logging
    └── .htaccess              ← with the log: keeps the CSV private (Apache)
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

**Using Google Tag Manager or Google Analytics with Consent Mode?** Load the script without `defer`, before the Google tag, and add `data-gcm="on"`. See [Google Consent Mode v2 Setup](#google-consent-mode-v2-setup).

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

**Load ConsentKit before your Google tag, without `defer` or `async`, and tell it you use Consent Mode.** A Google tag (GA4, Google Ads, Tag Manager) that starts before a consent default exists treats consent as granted. With `data-gcm="on"` the widget sends the default (everything `denied`, `security_storage` `granted`) the moment the script runs, before the config has been fetched. If your config is inline (`window.__consentKitConfig`, set before the script) you do not need the attribute, the widget uses the defaults from that config right away.

```html
<head>
  <!-- 1. ConsentKit first, synchronous -->
  <script src="https://YOUR_DOMAIN/widget.js" data-config="/consentkit/consentkit.config.json" data-gcm="on"></script>

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

If your site defines its own `gtag()` before ConsentKit, ConsentKit uses it. Your own `gtag` must push the `arguments` object (`function gtag(){dataLayer.push(arguments);}`), Google ignores commands pushed as arrays.

**Check that it works:** open the console on a fresh visit and run `Object.prototype.toString.call(dataLayer[0])`. It should say `[object Arguments]` and `dataLayer[0][1]` should be `"default"`. Before the visitor decides, a Google tag must not set `_ga` cookies or send hits with granted consent.

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

**`consent_update` event for Google Tag Manager:** after a visitor decides (Accept All, Reject All, Save Preferences, also from the re-opened preferences), ConsentKit pushes `{ event: 'consent_update' }` to `dataLayer`, right after `gtag('consent', 'update', …)`. Tags that wait for consent only re-check on their next trigger, so use a Custom Event trigger named `consent_update` to fire them straight after the click instead of on the next page view. The event has no payload and is also sent when `googleConsentMode.enabled` is `false`. It is not sent when consent is applied automatically (Global Privacy Control, Do Not Track, stored consent on page load).

---

## Config Reference

| Field | Type | Description |
|---|---|---|
| `version` | string | Bump this to re-ask consent from returning visitors |
| `lang` | string | `en` (default) or `cs`. Picks the built-in texts, see [Languages](#languages) |
| `strings` | object | Optional overrides for the built-in texts, see [Languages](#languages) |
| `banner.position` | string | `bottom-bar` · `bottom-left` · `bottom-right` · `center-popup` |
| `banner.primaryColor` | string | Banner background colour |
| `banner.accentColor` | string | Fills an "on" toggle switch when it stands out from `primaryColor` by at least 3:1, otherwise `textColor` does. Also the re-open button. Buttons use `textColor` and `primaryColor` |
| `banner.privacyPolicyUrl` | string | Link shown in banner description |
| `banner.showReopenButton` | boolean | Floating re-open button after consent, default `true`. Set `false` only together with your own link, see [Open preferences from your own link](#open-preferences-from-your-own-link) |
| `categories[].key` | string | Used in `data-ck-category` attributes |
| `categories[].locked` | boolean | `true` = always on (use for necessary) |
| `categories[].defaultEnabled` | boolean | Pre-selected state (`false` for GDPR opt-in) |
| `consentLogging.enabled` | boolean | POST consent records to the logging endpoint |
| `consentLogging.retentionDays` | number | Auto-delete old records on the Node server (default: `1825` = 5 years). The PHP script has its own 5-year default |
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
| `stateOn` | On | Zapnuto |
| `stateOff` | Off | Vypnuto |

Override any of them, or write your own language, with `strings`:

```json
{
  "lang": "cs",
  "strings": { "learnMore": "Zásady ochrany údajů" }
}
```

A ready-made Czech config is in [`ftp/consentkit.config.cs.example.json`](ftp/consentkit.config.cs.example.json).

---

## Open preferences from your own link

The floating re-open button can collide with your layout (a mobile navigation bar, a chat button). Turn it off with `"banner": { "showReopenButton": false }` and put a link where visitors look for such things: next to your privacy policy and terms links in the footer, and on your settings page. Withdrawing consent has to stay as easy as giving it, so do not switch the button off without adding the link.

```html
<a href="#" onclick="ConsentKit.openPreferences(); return false;">Cookie settings</a>
```

The panel opens with the visitor's current choices, and saving works exactly like the re-open button (Google Consent Mode update, `consent_update` event, log entry). It also works for visitors whose browser sends Global Privacy Control, who otherwise never see a banner. The call does nothing until the widget has loaded its config, so use it from a click handler, not at page load.

---

## Compliance Guide

ConsentKit is a tool, not legal advice, and a banner alone does not make a site compliant: that also depends on your texts, your categories and what your site really loads. Supervisory authorities differ on details such as button styling. If in doubt, ask your legal adviser.

### GDPR + ePrivacy (EU)

- All non-necessary scripts blocked **before** any rendering
- Opt-in model — all non-necessary categories default to **off**
- Accept All and Reject All have **identical visual weight** (hardcoded, not configurable)
- Consent never inferred from scrolling, time-on-page, or continued browsing
- Timestamped, versioned consent records stored for audit trail
- A way to withdraw consent is always available: the re-open button (also after Accept All; a visitor can drag it off screen for the rest of the browser session, it is back on the next visit), or your own link to `ConsentKit.openPreferences()` when you set `banner.showReopenButton` to `false`

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
- The decision is recorded once for the audit trail, not again on every page view

Required under CPRA (California). Recommended best practice under GDPR.

### Hardcoded behaviour

These rules are in the widget code and cannot be changed by any config option:

1. Accept All and Reject All always have **identical CSS**
2. GPC always triggers silent reject-all
3. Consent is never assumed from page interaction

One more rule is a default you may switch off, with a condition: the re-open preferences button is rendered once a visitor has made a choice (visitors whose browser sends GPC or DNT get no banner and no button), unless you set `banner.showReopenButton` to `false` and provide your own link to `ConsentKit.openPreferences()`.

The shipped config also starts with every non-necessary category off (`defaultEnabled: false`) and all Google Consent Mode defaults `denied` (except `security_storage`). Those are config values: keep them for an opt-in setup.

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
pnpm zip        # package ftp/ into dist/consentkit-ftp-v<version>.zip
```

---

## License

[MIT](LICENSE) — free for personal and commercial use.
