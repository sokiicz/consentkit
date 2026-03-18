/**
 * banner.ts — Shadow DOM banner rendering with full accessibility and GDPR dark-pattern prevention.
 */

import type { ConsentKitConfig, ConsentChoices, CategoryConfig } from './types';

type ConsentCallback = (choices: ConsentChoices) => void;

const STYLES = (cfg: ConsentKitConfig): string => `
  :host { all: initial; }
  *, *::before, *::after { box-sizing: border-box; }

  .ck-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.45);
    z-index: 2147483646;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.25s ease;
    pointer-events: none;
  }
  .ck-overlay.visible { opacity: 1; pointer-events: auto; }

  .ck-banner {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    color: ${cfg.banner.textColor};
    background: ${cfg.banner.primaryColor};
    border-radius: ${cfg.banner.borderRadius};
    z-index: 2147483647;
    box-shadow: 0 8px 32px rgba(0,0,0,0.24);
    max-width: 480px;
    width: calc(100vw - 32px);
    position: fixed;
    transform: translateY(20px);
    opacity: 0;
    transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), opacity 0.3s ease;
    pointer-events: auto;
  }
  .ck-banner.visible {
    transform: translateY(0);
    opacity: 1;
  }

  /* Position variants */
  .ck-banner.pos-bottom-bar {
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%) translateY(20px);
    max-width: 860px;
    border-radius: ${cfg.banner.borderRadius};
  }
  .ck-banner.pos-bottom-bar.visible {
    transform: translateX(-50%) translateY(0);
  }
  .ck-banner.pos-bottom-left  { bottom: 16px; left: 16px; }
  .ck-banner.pos-bottom-right { bottom: 16px; right: 16px; }
  .ck-banner.pos-center-popup { top: 50%; left: 50%; transform: translate(-50%, -50%); }
  .ck-banner.pos-center-popup.visible { transform: translate(-50%, -50%); }

  .ck-inner { padding: 20px 24px; }

  .ck-header { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
  .ck-logo { height: 28px; width: auto; }
  .ck-title { font-size: 16px; font-weight: 700; margin: 0; }

  .ck-desc { opacity: 0.88; margin: 0 0 16px; }

  .ck-link {
    color: ${cfg.banner.accentColor};
    text-decoration: underline;
    cursor: pointer;
    background: none;
    border: none;
    font: inherit;
    padding: 0;
  }

  /* === Button row — equal styling enforced (GDPR dark-pattern prevention) === */
  .ck-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }
  .ck-btn {
    flex: 1 1 auto;
    min-width: 100px;
    padding: 10px 16px;
    border-radius: calc(${cfg.banner.borderRadius} * 0.6);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    border: 2px solid ${cfg.banner.accentColor};
    transition: filter 0.15s;
    text-align: center;
    white-space: nowrap;
  }
  .ck-btn:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
  .ck-btn:hover { filter: brightness(1.12); }

  /* Accept All — prominent CTA */
  .ck-btn-accept {
    background: ${cfg.banner.accentColor};
    color: #fff;
    border-color: ${cfg.banner.accentColor};
  }
  /* Decline All — plain, no border highlight */
  .ck-btn-reject {
    background: transparent;
    color: ${cfg.banner.textColor};
    border-color: transparent;
    opacity: 0.6;
  }
  .ck-btn-reject:hover { opacity: 0.9; filter: none; }
  .ck-btn-customize {
    background: transparent;
    color: ${cfg.banner.textColor};
    border-color: transparent;
    opacity: 0.4;
    font-size: 13px;
  }
  .ck-btn-customize:hover { opacity: 0.7; filter: none; }

  /* === Preferences panel === */
  .ck-prefs {
    display: none;
    flex-direction: column;
    gap: 0;
  }
  .ck-prefs.open { display: flex; }

  .ck-prefs-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    border-bottom: 1px solid rgba(255,255,255,0.12);
  }
  .ck-prefs-title { font-size: 16px; font-weight: 700; margin: 0; }
  .ck-back-btn {
    background: none;
    border: none;
    color: ${cfg.banner.textColor};
    cursor: pointer;
    font-size: 22px;
    line-height: 1;
    padding: 4px;
    opacity: 0.7;
    border-radius: 4px;
  }
  .ck-back-btn:hover { opacity: 1; }
  .ck-back-btn:focus-visible { outline: 3px solid ${cfg.banner.accentColor}; }

  .ck-categories { padding: 8px 0; overflow-y: auto; max-height: 320px; }

  .ck-category {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 24px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .ck-category:last-child { border-bottom: none; }
  .ck-cat-info { flex: 1; }
  .ck-cat-label { font-weight: 600; margin: 0 0 2px; }
  .ck-cat-desc { opacity: 0.75; font-size: 12px; margin: 0; }

  /* Toggle switch */
  .ck-toggle {
    position: relative;
    flex-shrink: 0;
    width: 44px;
    height: 24px;
  }
  .ck-toggle input {
    opacity: 0;
    width: 0;
    height: 0;
    position: absolute;
  }
  .ck-slider {
    position: absolute;
    inset: 0;
    background: rgba(255,255,255,0.2);
    border-radius: 24px;
    cursor: pointer;
    transition: background 0.2s;
  }
  .ck-slider::before {
    content: '';
    position: absolute;
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background: #fff;
    border-radius: 50%;
    transition: transform 0.2s;
  }
  .ck-toggle input:checked + .ck-slider { background: ${cfg.banner.accentColor}; }
  .ck-toggle input:checked + .ck-slider::before { transform: translateX(20px); }
  .ck-toggle input:disabled + .ck-slider { opacity: 0.5; cursor: not-allowed; }
  .ck-toggle input:focus-visible + .ck-slider { outline: 3px solid #fff; outline-offset: 2px; }

  .ck-prefs-footer {
    padding: 16px 24px;
    border-top: 1px solid rgba(255,255,255,0.12);
    display: flex;
    gap: 8px;
  }
  .ck-btn-save {
    flex: 1;
    background: ${cfg.banner.accentColor};
    color: #fff;
    border-color: ${cfg.banner.accentColor};
  }

  /* === CCPA footer === */
  .ck-ccpa {
    padding: 10px 24px;
    border-top: 1px solid rgba(255,255,255,0.10);
    font-size: 12px;
    opacity: 0.75;
  }

  /* === Re-open button === */
  .ck-reopener {
    position: fixed;
    bottom: 20px;
    left: 20px;
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background: ${cfg.banner.accentColor};
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(0,0,0,0.25);
    z-index: 2147483645;
    transition: transform 0.2s, box-shadow 0.2s;
    color: #fff;
  }
  .ck-reopener:hover { transform: scale(1.1); box-shadow: 0 6px 20px rgba(0,0,0,0.35); }
  .ck-reopener:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
  .ck-reopener svg { width: 20px; height: 20px; fill: #fff; }

  @media (prefers-reduced-motion: reduce) {
    .ck-banner, .ck-overlay { transition: none; }
  }

  @media (max-width: 480px) {
    .ck-actions { flex-direction: column; }
    .ck-btn { flex: 1 1 100%; }
  }
`;

export class ConsentBanner {
  private root!: ShadowRoot;
  private host!: HTMLElement;
  private banner!: HTMLElement;
  private layer1!: HTMLElement;
  private prefsPanel!: HTMLElement;
  private toggles: Map<string, HTMLInputElement> = new Map();
  private config: ConsentKitConfig;
  private onConsent: ConsentCallback;
  private overlay!: HTMLElement;

  constructor(config: ConsentKitConfig, onConsent: ConsentCallback) {
    this.config = config;
    this.onConsent = onConsent;
  }

  private positionClass(): string {
    const map: Record<string, string> = {
      'bottom-bar': 'pos-bottom-bar',
      'bottom-left': 'pos-bottom-left',
      'bottom-right': 'pos-bottom-right',
      'center-popup': 'pos-center-popup',
    };
    return map[this.config.banner.position] ?? 'pos-bottom-bar';
  }

  mount(): void {
    document.body.style.overflow = 'hidden';

    this.host = document.createElement('div');
    this.host.id = 'consentkit-root';
    document.body.appendChild(this.host);

    this.root = this.host.attachShadow({ mode: 'open' });

    // Style
    const style = document.createElement('style');
    style.textContent = STYLES(this.config);
    this.root.appendChild(style);

    // Overlay (for center-popup)
    this.overlay = document.createElement('div');
    this.overlay.className = 'ck-overlay';
    if (this.config.banner.position === 'center-popup') {
      this.overlay.setAttribute('role', 'presentation');
      this.root.appendChild(this.overlay);
    }

    // Banner
    this.banner = document.createElement('div');
    this.banner.className = `ck-banner ${this.positionClass()}`;
    this.banner.setAttribute('role', 'dialog');
    this.banner.setAttribute('aria-modal', 'true');
    this.banner.setAttribute('aria-label', this.config.banner.title);
    this.banner.setAttribute('aria-live', 'polite');

    this.buildLayer1();
    this.buildPrefsPanel();

    if (this.config.ccpa?.enabled) {
      this.buildCCPA();
    }

    if (this.config.banner.position === 'center-popup') {
      this.overlay.appendChild(this.banner);
    } else {
      this.root.appendChild(this.banner);
    }

    // Animate in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.banner.classList.add('visible');
        if (this.config.banner.position === 'center-popup') {
          this.overlay.classList.add('visible');
        }
        this.focusFirstButton();
      });
    });
  }

  private buildLayer1(): void {
    const cfg = this.config.banner;

    this.layer1 = document.createElement('div');
    this.layer1.className = 'ck-inner';

    const header = document.createElement('div');
    header.className = 'ck-header';

    if (cfg.logoUrl) {
      const logo = document.createElement('img');
      logo.src = cfg.logoUrl;
      logo.alt = 'Logo';
      logo.className = 'ck-logo';
      header.appendChild(logo);
    }

    const title = document.createElement('p');
    title.className = 'ck-title';
    title.textContent = cfg.title;
    header.appendChild(title);
    this.layer1.appendChild(header);

    const desc = document.createElement('p');
    desc.className = 'ck-desc';
    desc.textContent = cfg.description;

    if (cfg.privacyPolicyUrl) {
      desc.textContent += ' ';
      const link = document.createElement('a');
      link.href = cfg.privacyPolicyUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.className = 'ck-link';
      link.textContent = 'Learn more';
      desc.appendChild(link);
    }
    this.layer1.appendChild(desc);

    const actions = document.createElement('div');
    actions.className = 'ck-actions';

    // Reject All — identical styling to Accept All (GDPR compliance)
    const rejectBtn = this.makeButton(cfg.rejectAllLabel, 'ck-btn ck-btn-reject', () => {
      this.handleRejectAll();
    });
    rejectBtn.setAttribute('aria-label', cfg.rejectAllLabel);

    // Accept All
    const acceptBtn = this.makeButton(cfg.acceptAllLabel, 'ck-btn ck-btn-accept', () => {
      this.handleAcceptAll();
    });
    acceptBtn.setAttribute('aria-label', cfg.acceptAllLabel);

    // Customize
    const customizeBtn = this.makeButton(cfg.customizeLabel, 'ck-btn ck-btn-customize', () => {
      this.showPrefs();
    });
    customizeBtn.setAttribute('aria-label', cfg.customizeLabel);
    customizeBtn.setAttribute('aria-expanded', 'false');
    customizeBtn.setAttribute('aria-controls', 'ck-prefs-panel');

    // Order: Accept | Decline | Customize — Accept is prominent CTA
    actions.appendChild(acceptBtn);
    actions.appendChild(rejectBtn);
    actions.appendChild(customizeBtn);

    this.layer1.appendChild(actions);
    this.banner.appendChild(this.layer1);
  }

  private buildPrefsPanel(): void {
    const cfg = this.config;

    this.prefsPanel = document.createElement('div');
    this.prefsPanel.className = 'ck-prefs';
    this.prefsPanel.id = 'ck-prefs-panel';
    this.prefsPanel.setAttribute('role', 'group');
    this.prefsPanel.setAttribute('aria-label', 'Cookie Preferences');
    this.prefsPanel.hidden = true;

    // Header
    const header = document.createElement('div');
    header.className = 'ck-prefs-header';

    const title = document.createElement('p');
    title.className = 'ck-prefs-title';
    title.textContent = 'Cookie Preferences';
    header.appendChild(title);

    const backBtn = document.createElement('button');
    backBtn.className = 'ck-back-btn';
    backBtn.setAttribute('aria-label', 'Back to cookie banner');
    backBtn.textContent = '×';
    backBtn.addEventListener('click', () => this.showLayer1());
    header.appendChild(backBtn);
    this.prefsPanel.appendChild(header);

    // Category list
    const catList = document.createElement('div');
    catList.className = 'ck-categories';
    catList.setAttribute('role', 'list');

    cfg.categories.forEach((cat) => {
      const row = this.buildCategoryRow(cat);
      catList.appendChild(row);
    });
    this.prefsPanel.appendChild(catList);

    // Footer
    const footer = document.createElement('div');
    footer.className = 'ck-prefs-footer';

    const saveBtn = this.makeButton(
      cfg.banner.savePreferencesLabel,
      'ck-btn ck-btn-save',
      () => { this.handleSavePrefs(); }
    );
    saveBtn.setAttribute('aria-label', cfg.banner.savePreferencesLabel);
    footer.appendChild(saveBtn);
    this.prefsPanel.appendChild(footer);

    this.banner.appendChild(this.prefsPanel);
  }

  private buildCategoryRow(cat: CategoryConfig): HTMLElement {
    const row = document.createElement('div');
    row.className = 'ck-category';
    row.setAttribute('role', 'listitem');

    const info = document.createElement('div');
    info.className = 'ck-cat-info';

    const label = document.createElement('p');
    label.className = 'ck-cat-label';
    label.id = `ck-cat-label-${cat.key}`;
    label.textContent = cat.label + (cat.locked ? ' (Always On)' : '');
    info.appendChild(label);

    const desc = document.createElement('p');
    desc.className = 'ck-cat-desc';
    desc.textContent = cat.description;
    info.appendChild(desc);

    row.appendChild(info);

    const toggleLabel = document.createElement('label');
    toggleLabel.className = 'ck-toggle';
    toggleLabel.setAttribute('aria-label', `${cat.label} cookies`);

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = cat.locked ? true : cat.defaultEnabled;
    input.disabled = cat.locked;
    input.setAttribute('aria-labelledby', `ck-cat-label-${cat.key}`);
    input.setAttribute('aria-checked', String(input.checked));
    input.addEventListener('change', () => {
      input.setAttribute('aria-checked', String(input.checked));
    });

    this.toggles.set(cat.key, input);

    const slider = document.createElement('span');
    slider.className = 'ck-slider';
    slider.setAttribute('aria-hidden', 'true');

    toggleLabel.appendChild(input);
    toggleLabel.appendChild(slider);
    row.appendChild(toggleLabel);

    return row;
  }

  private buildCCPA(): void {
    const footer = document.createElement('div');
    footer.className = 'ck-ccpa';
    const btn = document.createElement('button');
    btn.className = 'ck-link';
    btn.textContent = this.config.ccpa.doNotSellLinkText;
    btn.addEventListener('click', () => {
      // Reject all non-necessary categories (CCPA opt-out)
      this.handleRejectAll();
    });
    footer.appendChild(btn);
    this.banner.appendChild(footer);
  }

  private makeButton(text: string, className: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = className;
    btn.type = 'button';
    btn.textContent = text;
    btn.addEventListener('click', onClick);
    return btn;
  }

  private showPrefs(): void {
    this.layer1.style.display = 'none';
    this.prefsPanel.hidden = false;
    this.prefsPanel.classList.add('open');
    this.banner.setAttribute('aria-label', 'Cookie Preferences');
    this.trapFocus(this.prefsPanel);
  }

  private showLayer1(): void {
    this.prefsPanel.classList.remove('open');
    this.prefsPanel.hidden = true;
    this.layer1.style.display = '';
    this.banner.setAttribute('aria-label', this.config.banner.title);
    this.focusFirstButton();
  }

  private focusFirstButton(): void {
    requestAnimationFrame(() => {
      const btn = this.root.querySelector<HTMLButtonElement>('button');
      btn?.focus();
    });
  }

  private trapFocus(container: HTMLElement): void {
    requestAnimationFrame(() => {
      const focusables = container.querySelectorAll<HTMLElement>(
        'button, input, a[href], [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      focusables[0].focus();

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      container.addEventListener('keydown', function trap(e: KeyboardEvent) {
        if (e.key !== 'Tab') return;
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      });
    });
  }

  private getChoices(): ConsentChoices {
    const choices: ConsentChoices = {};
    this.toggles.forEach((input, key) => {
      choices[key] = input.checked;
    });
    return choices;
  }

  private handleAcceptAll(): void {
    this.toggles.forEach((input) => { input.checked = true; });
    this.onConsent(this.getChoices());
    this.dismiss();
  }

  private handleRejectAll(): void {
    this.toggles.forEach((input, key) => {
      if (!this.config.categories.find((c) => c.key === key)?.locked) {
        input.checked = false;
      }
    });
    this.onConsent(this.getChoices());
    this.dismiss();
  }

  private handleSavePrefs(): void {
    this.onConsent(this.getChoices());
    this.dismiss();
  }

  private dismiss(): void {
    document.body.style.overflow = '';

    this.banner.classList.remove('visible');
    if (this.config.banner.position === 'center-popup') {
      this.overlay.classList.remove('visible');
    }
    setTimeout(() => {
      this.host.remove();
      this.mountReopener();
    }, 350);
  }

  private mountReopener(): void {
    const reopenerHost = document.createElement('div');
    reopenerHost.id = 'consentkit-reopener';
    document.body.appendChild(reopenerHost);

    const shadow = reopenerHost.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      .ck-reopener {
        position: fixed;
        bottom: 20px;
        left: 20px;
        width: 42px;
        height: 42px;
        border-radius: 50%;
        background: ${this.config.banner.accentColor};
        border: none;
        cursor: grab;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 16px rgba(0,0,0,0.25);
        z-index: 2147483645;
        transition: transform 0.2s, box-shadow 0.2s;
        color: #fff;
        touch-action: none;
        user-select: none;
        overflow: visible;
      }
      .ck-reopener:hover { transform: scale(1.1); box-shadow: 0 6px 20px rgba(0,0,0,0.35); }
      .ck-reopener:focus-visible { outline: 3px solid ${this.config.banner.primaryColor}; outline-offset: 3px; }
      .ck-reopener svg { width: 20px; height: 20px; fill: none; stroke: #fff; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    `;
    shadow.appendChild(style);

    const btn = document.createElement('button');
    btn.className = 'ck-reopener';
    btn.setAttribute('aria-label', 'Manage cookie preferences');
    btn.setAttribute('title', 'Manage cookie preferences');
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
      </svg>
    `;
    btn.addEventListener('click', () => {
      reopenerHost.remove();
      this.remount();
    });
    shadow.appendChild(btn);

    this.initDraggable(btn, shadow, () => reopenerHost.remove());
  }

  private initDraggable(btn: HTMLElement, shadow: ShadowRoot, onDismiss: () => void): void {
    // Session-dismiss: hide immediately if the user already dragged it away
    try {
      if (sessionStorage.getItem('ck-gone')) { btn.style.display = 'none'; return; }
    } catch { /* */ }

    // Drag hint (bouncing ↓ arrow) on mobile — shown once per session
    try {
      const hintSeen = sessionStorage.getItem('ck-hint-seen');
      if (!hintSeen && window.innerWidth <= 768) {
        const hintStyle = document.createElement('style');
        hintStyle.id = 'ck-hint-style';
        hintStyle.textContent = [
          '.ck-reopener::after {',
          '  content: "↓";',
          '  position: absolute;',
          '  bottom: -18px;',
          '  left: 50%;',
          '  transform: translateX(-50%);',
          '  font-size: 11px;',
          '  font-weight: 700;',
          '  color: rgba(255,255,255,0.85);',
          '  text-shadow: 0 1px 4px rgba(0,0,0,0.4);',
          '  pointer-events: none;',
          '  animation: ck-bob 1.1s ease-in-out infinite;',
          '}',
          '@keyframes ck-bob {',
          '  0%,100% { transform: translateX(-50%) translateY(0); }',
          '  50%      { transform: translateX(-50%) translateY(4px); }',
          '}',
        ].join('');
        shadow.appendChild(hintStyle);

        const removeHint = () => {
          shadow.querySelector('#ck-hint-style')?.remove();
          try { sessionStorage.setItem('ck-hint-seen', '1'); } catch { /* */ }
        };
        btn.addEventListener('mousedown',  removeHint, { once: true });
        btn.addEventListener('touchstart', removeHint, { once: true, passive: true });
      }
    } catch { /* */ }

    let sx = 0, sy = 0, bx = 0, by = 0, dragging = false, moved = false;

    const start = (cx: number, cy: number) => {
      const r = btn.getBoundingClientRect();
      sx = cx; sy = cy; bx = r.left; by = r.top;
      dragging = true; moved = false;
      btn.style.transition = 'none';
      btn.style.left = `${bx}px`; btn.style.top = `${by}px`;
      btn.style.right = 'auto'; btn.style.bottom = 'auto';
      btn.style.cursor = 'grabbing';
    };

    const move = (cx: number, cy: number) => {
      if (!dragging) return;
      const dx = cx - sx, dy = cy - sy;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
      btn.style.left = `${bx + dx}px`;
      btn.style.top  = `${by + dy}px`;
      // Fade out as it approaches the bottom edge
      const fade = Math.max(0, 1 - Math.max(0, cy - window.innerHeight * 0.72) / (window.innerHeight * 0.28));
      btn.style.opacity = String(fade);
    };

    const end = (cy: number) => {
      if (!dragging) return;
      dragging = false; btn.style.cursor = 'grab';
      if (moved && cy > window.innerHeight * 0.82) {
        // Dragged to bottom — dismiss for session
        btn.style.transition = 'transform 0.2s ease-in, opacity 0.2s ease-in';
        btn.style.transform = 'translateY(100px)'; btn.style.opacity = '0';
        setTimeout(() => { onDismiss(); }, 220);
        try { sessionStorage.setItem('ck-gone', '1'); } catch { /* */ }
      } else {
        btn.style.opacity = '1';
      }
    };

    btn.addEventListener('mousedown', (e) => { start(e.clientX, e.clientY); });
    document.addEventListener('mousemove', (e) => { move(e.clientX, e.clientY); });
    document.addEventListener('mouseup',   (e) => { end(e.clientY); });

    btn.addEventListener('touchstart', (e) => {
      const t = e.touches[0]; start(t.clientX, t.clientY);
    }, { passive: true });
    document.addEventListener('touchmove', (e) => {
      if (!dragging) return; e.preventDefault();
      const t = e.touches[0]; move(t.clientX, t.clientY);
    }, { passive: false });
    document.addEventListener('touchend', (e) => {
      const t = e.changedTouches[0]; end(t.clientY);
    });

    // Swallow click when the user was actually dragging (don't open the panel)
    btn.addEventListener('click', (e) => {
      if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; }
    }, true);
  }

  /** Call this when consent already exists on load — skips the banner, shows only the re-open icon. */
  mountReopenerOnly(): void {
    this.mountReopener();
  }

  private remount(): void {
    this.toggles.clear();
    this.mount();
    this.showPrefs();
  }
}
