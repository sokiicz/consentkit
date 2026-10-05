# Changelog

## Unreleased

- **`scripts/consent-summary.mjs`:** daily summary of accept all, reject all and custom choices from the SQLite or CSV consent log, counts only, each visitor counted once by default. See the README, chapter Consent Log Access.

## 1.2.3 (2026-10-07)

### Privacy: GPC and Do Not Track visitors are logged once, not on every page

- A visitor whose browser sends Global Privacy Control or Do Not Track gets no banner and is treated as "reject all". Until now that decision was written again on every page view: a new log row (with the visitor id and user agent) and a rewritten stored record each time. Now the widget still applies "denied" (script blocking, Consent Mode) on every page, but records and logs it only once: when the stored record already says everything is rejected for the current config version, nothing more is stored or sent. If the stored choice was different (an earlier "accept all", or an older config version), the rejection is recorded once.
- "Once" means once per browser and config version: the record lives in the visitor's browser storage, so clearing it, a private window or a new config `version` records and logs the rejection again. If sending the log fails (no network), it is not retried, so the audit trail is "at most once", not "exactly once". A visitor with GPC or DNT always gets "reject all": if they manually allow a category, the next page view overrides it with the rejection and records it again.
- Logs written by earlier versions still contain one row per page view for these visitors, and old rows are not cleaned up. When you count consent choices from a log, count each visitor once (by their first decision), not each row.

## 1.2.2 (2026-10-05)

### What visitors see: the toggle switches in the preferences panel are readable

- **The "off" switch was almost invisible on a light banner.** Its track was 20 % white and its knob white, so on a white dialog an off switch could not be seen. Now an off switch is an outlined track with a knob on the left, both in the banner's text colour, and an on switch is a filled track with the knob on the right. The two states differ by shape and position, not only by colour, and an off switch has the contrast of the text itself (about 17:1 on the default dark banner, 15.6:1 for dark text `#1f242e` on white).
- **The state is also written out.** Under each switch a word says "On" or "Off" ("Zapnuto" and "Vypnuto" with `"lang": "cs"`; override with `strings.stateOn` and `strings.stateOff`). The checkbox is now marked as a switch (`role="switch"`) with `aria-checked`, so a screen reader announces it as a switch that is on or off.
- **The accent colour fills an "on" switch only when it stands out.** If `accentColor` has at least 3:1 contrast with the banner it fills the track, otherwise the text colour does. **This changes the shipped default look:** the default indigo `#4f46e5` on the default dark `#1a1a1a` is only 2.8:1, so on the default banner an "on" switch is now white with a dark knob instead of indigo. Teal `#00a8a9` on white is about 2.9:1, so a white banner with that accent gets a dark "on" track. Pick an accent with at least 3:1 against `primaryColor` if you want your brand colour on the switches. The knob takes whichever banner colour contrasts more with the track.
- **The keyboard focus ring of a switch is drawn in the text colour**, not in fixed white, so it shows on light banners.
- The focus ring of the close button in the panel is drawn in the text colour as well, and the hidden checkbox now covers the whole switch, which gives touch and mobile screen readers a real target. The state word is 12 px.
- All categories still start off, the banner text is untouched, Accept All and Reject All look as before. Checked: in a browser (computed styles, keyboard focus, clicking the switches) and with an automated axe-core 4.10 scan of the open panel on a white banner, which found no violations (role, names of the switches and the dialog, labels, allowed ARIA). Not done: nothing was checked with a screen reader, and Windows high-contrast mode is not specially handled. Please test with NVDA, VoiceOver or TalkBack before you rely on the announcements.

## 1.2.1 (2026-10-05)

### Fix: Google Consent Mode did not reach Google tags (earlier versions, when the page defined no `gtag()` of its own)

- **`gtag()` pushed an array.** This hit every site whose page did not define its own `gtag()` before the widget ran, which includes the usual Google Tag Manager setups. Pages that defined `gtag(){dataLayer.push(arguments);}` before ConsentKit were not affected, the widget used theirs. Google tags (gtag.js, Google Tag Manager) only read commands that are pushed as the `arguments` object. ConsentKit pushed an array, which looks the same in the `dataLayer` but is ignored, so `consent default` and `consent update` never took effect: GA4, Google Signals and Google Ads behaved as if consent was granted, whatever the visitor chose. Fixed: the widget's `gtag()` pushes `arguments`. Checked against Google's real `gtag.js`: before the fix its consent state stays unset, after the fix it shows the default as denied and `update` as granted or denied after the choice.
- **The default came too late.** It was sent only after the config had been fetched, so a Google tag could start first and run without a consent default. New: add `data-gcm="on"` to the script tag and the widget sends the default (all `denied`, `security_storage` `granted`) the moment the script runs. With an inline config (`window.__consentKitConfig`) it uses that config's defaults at once, no attribute needed. If a Google tag (Tag Manager or a plain gtag.js snippet) already started when the default is sent, the console warns, and it warns when `data-gcm="on"` is set but Consent Mode is disabled in the config.
- **`url_passthrough` now takes effect.** The widget has always set it, but because the commands were ignored it did nothing. With ad storage denied, Google may now keep click identifiers (`gclid`, `_gl`) in the URLs of links between your pages so conversions can still be attributed. This is how Consent Mode works with that setting; it is not configurable yet.
- **What you should do:** replace `widget.js`, load the script synchronously (no `defer`, no `async`) before the Google tag and add `data-gcm="on"` when you use Consent Mode with `data-config`. Sites that define their own correct `gtag()` before ConsentKit keep working, ConsentKit uses theirs. Cookies and hits that Google tags already created before the fix are not undone; consider your own assessment of what a site collected without valid consent.

## 1.2.0 (2026-10-03)

### What visitors see (read this before you upgrade)

- **Button look changed.** Accept All and Reject All now look exactly the same: both filled with the banner's text colour and labelled with its background colour (white with dark text in the default config), one CSS rule for both. Customize stays outlined. Before, Reject All was faded. The accent colour is now used for the toggle switches and the re-open button only.
- **The re-open button is shown after Accept All too.** It used to disappear when everything was accepted. The panel it opens shows the visitor's current choices (it used to show all categories off), and closing it with "x" changes nothing.
- **Keyboard focus starts on the dialog, not on Accept All**, so pressing Enter right after the banner appears no longer means consent.
- Links in the banner use the banner's text colour, which is readable on any config.
- The widget's own texts (screen-reader labels, "Learn more", the re-open tooltip) can be Czech with `"lang": "cs"`.

### What changes for site owners

- **Google Consent Mode v2: `ad_personalization`** is sent (default `denied`, follows the marketing category). Without it Google treated remarketing in the EEA as unconsented even after Accept All. Old configs keep working. `defaultAdPersonalization` is optional.
- **`consent_update` event** is pushed to `dataLayer` right after `gtag('consent', 'update', …)` when a visitor decides, so tags that wait for consent fire straight away. Not sent for automatic GPC/DNT rejects or for stored consent on page load.
- **`ConsentKit.openPreferences()`** opens the preferences panel from your own link, for example "Cookie settings" in the footer.
- **`banner.showReopenButton`** (default `true`). Set it to `false` if the floating button gets in the way, and link `ConsentKit.openPreferences()` instead. Withdrawing consent has to stay as easy as giving it.
- **`lang` and `strings`:** built-in texts for `en` and `cs`, any text can be overridden. `ftp/consentkit.config.cs.example.json` is a Czech config.

### Packaging

- The FTP ZIP also contains the Czech example config and an `.htaccess` that keeps `consent-log.csv` from being downloaded on Apache hosts.
- The release workflow builds from a lockfile and creates the GitHub release as a draft, to be published by hand.
- README and docs no longer claim "GDPR Compliant" or "zero dark patterns", and the comparison table no longer rates other products on dark patterns or GPC support.

### Upgrading

Replace `widget.js`. Keep the `version` field of your config unless you want every visitor to be asked again. Check that your layout works with the new button look and with the re-open button after Accept All, or turn it off as described above.
