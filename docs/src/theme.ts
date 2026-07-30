/**
 * Shared visual language for the tevm.sh documentation family.
 *
 * The accent matches the sibling sites (cli / logger / ethers / mud / bundler),
 * which all resolve `--vocs-color-accent` to `light-dark(#0085FF, #4DA6FF)`.
 * Everything else is expressed in Vocs' own design tokens, so both color
 * schemes stay correct without hard-coding foreground/background colors.
 */
export const accentColor = 'light-dark(#0085FF, #4DA6FF)' as const

export const themeCss = `
:root {
  --vlt-accent: light-dark(#0085FF, #4DA6FF);
  --vlt-accent-soft: light-dark(rgba(0, 133, 255, 0.10), rgba(77, 166, 255, 0.14));
  --vlt-accent-line: light-dark(rgba(0, 133, 255, 0.28), rgba(77, 166, 255, 0.32));
  --vlt-surface: light-dark(rgba(0, 0, 0, 0.02), rgba(255, 255, 255, 0.035));
  --vlt-radius: 12px;
}

.vlt-hero {
  border-bottom: 1px solid var(--vocs-border-color-primary);
  margin-bottom: 40px;
  padding-bottom: 40px;
}
.vlt-hero__eyebrow {
  color: var(--vlt-accent);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  margin: 0 0 12px;
  text-transform: uppercase;
}
.vlt-hero__title {
  border: 0 !important;
  color: var(--vocs-text-color-heading);
  font-size: clamp(2rem, 1.2rem + 3vw, 3.25rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.05;
  margin: 0 0 16px !important;
  padding: 0 !important;
}
.vlt-hero__title span { color: var(--vlt-accent); }
.vlt-hero__lead {
  color: var(--vocs-text-color-secondary);
  font-size: 1.075rem;
  line-height: 1.6;
  margin: 0 0 24px;
  max-width: 64ch;
}
.vlt-hero__actions {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 24px;
}
.vlt-button {
  border: 1px solid var(--vocs-border-color-primary);
  border-radius: 8px;
  color: var(--vocs-text-color-primary) !important;
  display: inline-block;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 9px 16px;
  text-decoration: none !important;
  transition: background-color 120ms ease, border-color 120ms ease;
}
.vlt-button:hover { background-color: var(--vlt-surface); border-color: var(--vlt-accent-line); }
.vlt-button--primary {
  background-color: var(--vlt-accent);
  border-color: var(--vlt-accent);
  color: light-dark(#ffffff, #06121f) !important;
}
.vlt-button--primary:hover { background-color: var(--vlt-accent); filter: brightness(1.07); }

.vlt-install {
  align-items: center;
  background: var(--vlt-surface);
  border: 1px solid var(--vocs-border-color-primary);
  border-radius: var(--vlt-radius);
  display: flex;
  font-family: var(--vocs-font-mono);
  font-size: 0.875rem;
  gap: 10px;
  max-width: 430px;
  padding: 12px 14px;
}
.vlt-install__prompt { color: var(--vlt-accent); user-select: none; }

.vlt-badges {
  color: var(--vocs-text-color-muted);
  display: flex;
  flex-wrap: wrap;
  font-size: 0.8125rem;
  gap: 8px 18px;
  margin-top: 20px;
}

.vlt-playground {
  background: var(--vlt-surface);
  border: 1px solid var(--vocs-border-color-primary);
  border-radius: var(--vlt-radius);
  margin: 24px 0 8px;
  padding: 18px;
}
.vlt-playground__head {
  align-items: flex-start;
  display: flex;
  gap: 12px;
  justify-content: space-between;
}
.vlt-playground__eyebrow {
  color: var(--vlt-accent);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  margin: 0 0 2px;
  text-transform: uppercase;
}
.vlt-playground__title {
  border: 0 !important;
  color: var(--vocs-text-color-heading);
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 !important;
  padding: 0 !important;
}
.vlt-playground__badge {
  background: var(--vlt-accent-soft);
  border: 1px solid var(--vlt-accent-line);
  border-radius: 999px;
  color: var(--vlt-accent);
  font-family: var(--vocs-font-mono);
  font-size: 0.75rem;
  padding: 3px 10px;
  white-space: nowrap;
}
.vlt-playground__tabs { display: flex; flex-wrap: wrap; gap: 6px; margin: 16px 0 14px; }
.vlt-playground__tab {
  background: transparent;
  border: 1px solid var(--vocs-border-color-primary);
  border-radius: 999px;
  color: var(--vocs-text-color-secondary);
  cursor: pointer;
  font-size: 0.8125rem;
  font-weight: 500;
  padding: 5px 13px;
}
.vlt-playground__tab[aria-selected='true'] {
  background: var(--vlt-accent-soft);
  border-color: var(--vlt-accent-line);
  color: var(--vlt-accent);
}
.vlt-playground__label {
  color: var(--vocs-text-color-muted);
  display: block;
  font-size: 0.8125rem;
  margin-bottom: 6px;
}
.vlt-playground__input {
  background: var(--vocs-background-color-primary);
  border: 1px solid var(--vocs-border-color-primary);
  border-radius: 8px;
  color: var(--vocs-text-color-primary);
  font-family: var(--vocs-font-mono);
  font-size: 0.875rem;
  padding: 10px 12px;
  width: 100%;
}
.vlt-playground__input:focus {
  border-color: var(--vlt-accent);
  outline: 2px solid var(--vlt-accent-soft);
}
.vlt-playground__output {
  background: var(--vocs-background-color-primary);
  border: 1px solid var(--vocs-border-color-primary);
  border-radius: 8px;
  margin-top: 14px;
  padding: 4px 12px;
}
.vlt-playground__row {
  border-bottom: 1px solid var(--vocs-border-color-primary);
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  justify-content: space-between;
  padding: 10px 0;
}
.vlt-playground__row:last-child { border-bottom: 0; }
.vlt-playground__row-label { color: var(--vocs-text-color-muted); font-size: 0.8125rem; }
.vlt-playground__row-value {
  color: var(--vocs-text-color-primary);
  font-family: var(--vocs-font-mono);
  font-size: 0.8125rem;
  overflow-wrap: anywhere;
  text-align: right;
}
.vlt-playground__error { color: light-dark(#c62828, #ff8a80); font-size: 0.875rem; padding: 10px 0; }
.vlt-playground__muted { color: var(--vocs-text-color-muted); font-size: 0.875rem; padding: 10px 0; }
.vlt-playground__footnote { color: var(--vocs-text-color-muted); font-size: 0.8125rem; margin: 12px 0 0; }

.vlt-family { border-top: 1px solid var(--vocs-border-color-primary); margin: 48px 0 8px; padding-top: 32px; }
.vlt-family__heading {
  color: var(--vocs-text-color-heading);
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  margin: 0 0 6px;
}
.vlt-family__intro { color: var(--vocs-text-color-secondary); font-size: 0.9375rem; margin: 0; }
.vlt-family__grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fill, minmax(215px, 1fr));
  margin-top: 16px;
}
.vlt-family__card {
  border: 1px solid var(--vocs-border-color-primary);
  border-radius: 10px;
  color: var(--vocs-text-color-primary) !important;
  display: block;
  padding: 13px 15px;
  text-decoration: none !important;
  transition: background-color 120ms ease, border-color 120ms ease;
}
.vlt-family__card:hover { background: var(--vlt-surface); border-color: var(--vlt-accent-line); }
.vlt-family__card[aria-current='page'] { background: var(--vlt-accent-soft); border-color: var(--vlt-accent); }
.vlt-family__name { display: block; font-size: 0.9375rem; font-weight: 600; }
.vlt-family__name small {
  color: var(--vlt-accent);
  font-size: 0.75rem;
  font-weight: 500;
  margin-left: 6px;
}
.vlt-family__host {
  color: var(--vocs-text-color-muted);
  display: block;
  font-family: var(--vocs-font-mono);
  font-size: 0.75rem;
  margin-top: 2px;
}
.vlt-family__description {
  color: var(--vocs-text-color-secondary);
  display: block;
  font-size: 0.8125rem;
  line-height: 1.5;
  margin-top: 8px;
}
`
