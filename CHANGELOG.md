# Changelog

## 1.2.0 (2026-10-03)

### What visitors see (read this before you upgrade)

- **Button look changed.** Accept All and Reject All now look exactly the same: both filled with the banner's text colour and labelled with its background colour (white with dark text in the default config), one CSS rule for both. Customize stays outlined. Before, Reject All was faded. The accent colour is now used for toggles only.
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
- README and docs no longer claim "GDPR Compliant", "zero dark patterns" or a comparison with named competitors.

### Upgrading

Replace `widget.js`. Keep the `version` field of your config unless you want every visitor to be asked again. Check that your layout works with the new button look and with the re-open button after Accept All, or turn it off as described above.
