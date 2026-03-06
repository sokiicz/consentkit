# ConsentKit — FTP Setup

Get a working cookie consent banner in 5 minutes on any web host.
No Node.js. No server. No account required.

---

## What's in this folder

| File | What it is |
|---|---|
| `widget.js` | The consent banner — don't edit this |
| `consentkit.config.json` | **Your config — edit this** |
| `consent-log.php` | Optional: logs consent records to a CSV file |
| `embed-example.html` | Copy-paste examples for your pages |

---

## Step 1 — Edit the config

Open `consentkit.config.json` in any text editor (Notepad, VS Code, TextEdit).

The fields you'll want to change:

```json
"title": "We use cookies",
"description": "We use cookies to...",
"privacyPolicyUrl": "/privacy-policy",
"primaryColor": "#1a1a1a",
"accentColor": "#4f46e5"
```

- `primaryColor` — banner background (dark colour recommended)
- `accentColor` — button colour (your brand colour)
- `privacyPolicyUrl` — path to your privacy policy page

Everything else can stay as-is to start.

---

## Step 2 — Upload to your server

Create a folder called `consentkit` on your web server and upload these three files into it:

```
yourwebsite.com/
└── consentkit/
    ├── widget.js
    ├── consentkit.config.json
    └── consent-log.php          ← optional, for logging
```

Using cPanel File Manager, FileZilla, or any FTP client — just drag and drop.

---

## Step 3 — Add to your HTML

Paste this before the `</head>` tag on every page of your website:

```html
<script
  src="/consentkit/widget.js"
  data-config="/consentkit/consentkit.config.json"
  data-log-url="/consentkit/consent-log.php"
  defer
></script>
```

If you don't want consent logging, remove the `data-log-url` line.

That's it. Reload your page — the banner will appear.

---

## Step 4 — Block your analytics/marketing scripts

Instead of loading scripts directly, add `data-ck-category` and `data-ck-src` attributes.
The widget will hold them back until the visitor gives consent.

**Google Analytics:**
```html
<!-- BEFORE -->
<script src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXX" async></script>

<!-- AFTER -->
<script
  data-ck-category="analytics"
  data-ck-src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXX"
  async
></script>
```

**Facebook Pixel:**
```html
<script
  data-ck-category="marketing"
  data-ck-src="https://connect.facebook.net/en_US/fbevents.js"
  async
></script>
```

**YouTube / iframe embeds:**
```html
<iframe
  data-ck-category="functional"
  data-ck-src="https://www.youtube.com/embed/VIDEO_ID"
  width="560" height="315" frameborder="0"
></iframe>
```

Available categories: `necessary` (always on), `analytics`, `marketing`, `functional`.

---

## Reading the consent log

If you uploaded `consent-log.php`, consent events are saved to `consent-log.csv`
in the same folder. Download it via your hosting file manager and open in Excel.

Columns: `visitor_id`, `timestamp`, `choices`, `banner_version`, `user_agent`, `logged_at`

Records older than 5 years are automatically deleted (GDPR requirement).

---

## WordPress

If you use WordPress, paste the script tag into **Appearance → Theme Editor → header.php**
just before the `</head>` tag, or use a plugin like **Insert Headers and Footers**.

---

## Customising colours

Open `consentkit.config.json` and change these fields:

| Field | What it controls |
|---|---|
| `primaryColor` | Banner background colour |
| `accentColor` | Accept button and toggle colour |
| `textColor` | Text colour on the banner |
| `borderRadius` | Rounded corners (`"0px"` for sharp, `"16px"` for very round) |

Use any CSS colour value: `"#4f46e5"`, `"rgb(79,70,229)"`, `"indigo"`.

---

## Banner positions

Change `"position"` in the config to one of:

- `"bottom-bar"` — full-width bar at the bottom *(default)*
- `"bottom-left"` — small card, bottom-left corner
- `"bottom-right"` — small card, bottom-right corner
- `"center-popup"` — modal in the centre of the screen

---

## Google Consent Mode v2 (Google Analytics / Ads)

If you use Google Analytics or Google Ads, enable GCM v2 in the config:

```json
"googleConsentMode": {
  "enabled": true,
  ...
}
```

Then load the ConsentKit script **before** your Google tag. See the full
[Google Consent Mode v2 Setup](../README.md#google-consent-mode-v2-setup) guide.

---

## Troubleshooting

**Banner doesn't appear**
- Check the browser console for errors
- Make sure the paths in `data-config` and `src` match where you uploaded the files
- Check that `consentkit.config.json` is valid JSON (paste it into [jsonlint.com](https://jsonlint.com))

**consent-log.csv is not being created**
- The folder needs write permission. In cPanel → File Manager, right-click the `consentkit` folder → Change Permissions → set to `755`
- Some hosts require `777` — set it temporarily and revert to `755` if logging works

**Banner appears every time (consent not remembered)**
- Cookies/localStorage must be enabled in the visitor's browser
- The domain must match (`/consentkit/widget.js` must be on the same domain as the page)

---

## License

MIT — free for personal and commercial use.
