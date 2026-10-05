# Changelog

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
