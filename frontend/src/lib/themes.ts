export type ThemeName = 'fidelity-green' | 'slate-blue'

export interface DiagramPalette {
  primary: string
  primaryDark: string
  primaryLight: string
  accent: string
  accentLight: string
  neutral50: string
  neutral100: string
  neutral200: string
  neutral300: string
  neutral600: string
  neutral900: string
}

export const themePalettes: Record<ThemeName, DiagramPalette> = {
  'fidelity-green': {
    primary: '#00754a',
    primaryDark: '#005334',
    primaryLight: '#e6f2ec',
    accent: '#c9a227',
    accentLight: '#f8f1dd',
    neutral50: '#f7f8f7',
    neutral100: '#edefec',
    neutral200: '#dde1dc',
    neutral300: '#c3c9c2',
    neutral600: '#5b6660',
    neutral900: '#1f2622',
  },
  'slate-blue': {
    primary: '#1f5c99',
    primaryDark: '#153f6b',
    primaryLight: '#e8f0f9',
    accent: '#d97706',
    accentLight: '#fdf0dc',
    neutral50: '#f7f8fa',
    neutral100: '#edeff3',
    neutral200: '#dde2e8',
    neutral300: '#c3cad3',
    neutral600: '#5b6572',
    neutral900: '#1c2430',
  },
}

export const themeLabels: Record<ThemeName, string> = {
  'fidelity-green': 'Fidelity Green',
  'slate-blue': 'Slate Blue',
}

const CSS_VAR_BY_PALETTE_KEY: Record<keyof DiagramPalette, string> = {
  primary: '--color-primary',
  primaryDark: '--color-primary-dark',
  primaryLight: '--color-primary-light',
  accent: '--color-accent',
  accentLight: '--color-accent-light',
  neutral50: '--color-neutral-50',
  neutral100: '--color-neutral-100',
  neutral200: '--color-neutral-200',
  neutral300: '--color-neutral-300',
  neutral600: '--color-neutral-600',
  neutral900: '--color-neutral-900',
}

export function applyTheme(themeName: ThemeName): void {
  const palette = themePalettes[themeName]
  const root = document.documentElement
  for (const key of Object.keys(CSS_VAR_BY_PALETTE_KEY) as (keyof DiagramPalette)[]) {
    root.style.setProperty(CSS_VAR_BY_PALETTE_KEY[key], palette[key])
  }
}
