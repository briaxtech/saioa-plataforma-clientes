import type { BrandingPalette, BrandingSettings, BrandingTypography } from "./types"

const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

const DEFAULT_PALETTE: BrandingPalette = {
  primary: "#36ccca",
  primaryForeground: "#031247",
  background: "#f4fbfb",
  foreground: "#04152d",
  accent: "#19b4bb",
  accentForeground: "#031247",
  muted: "#d9ecec",
  mutedForeground: "#4f6670",
  border: "#c2d8da",
  card: "#ffffff",
  cardForeground: "#04152d",
  sidebar: "#031247",
  sidebarForeground: "#f4fbfb",
}

const DEFAULT_TYPOGRAPHY: BrandingTypography = {
  fontSans: '"Geist", "Inter", "SF Pro Display", system-ui, -apple-system, sans-serif',
  fontHeading: '"Geist", "Inter", "SF Pro Display", system-ui, -apple-system, sans-serif',
}

export const DEFAULT_LOGO_URL = "/placeholder-logo.svg"

export interface ResolvedBranding {
  logo_url: string
  palette: BrandingPalette
  typography: BrandingTypography
}

export function resolveBranding(branding?: BrandingSettings | null): ResolvedBranding {
  const palette = { ...DEFAULT_PALETTE, ...(branding?.palette || {}) }
  const typography = { ...DEFAULT_TYPOGRAPHY, ...(branding?.typography || {}) }

  return {
    logo_url: branding?.logo_url || DEFAULT_LOGO_URL,
    palette,
    typography,
  }
}

export function applyBrandingTheme(branding?: BrandingSettings | null): ResolvedBranding {
  const resolved = resolveBranding(branding)

  if (typeof document === "undefined") {
    return resolved
  }

  const root = document.documentElement
  const { palette, typography } = resolved

  const colorMap: Record<string, string> = {
    "--primary": palette.primary,
    "--primary-foreground": palette.primaryForeground,
    "--background": palette.background,
    "--foreground": palette.foreground,
    "--accent": palette.accent,
    "--accent-foreground": palette.accentForeground,
    "--muted": palette.muted,
    "--muted-foreground": palette.mutedForeground,
    "--border": palette.border,
    "--input": palette.border,
    "--card": palette.card,
    "--card-foreground": palette.cardForeground,
    "--popover": palette.card,
    "--popover-foreground": palette.cardForeground,
    "--secondary": palette.card,
    "--secondary-foreground": palette.foreground,
    "--sidebar": palette.sidebar,
    "--sidebar-foreground": palette.sidebarForeground,
    "--sidebar-primary": palette.primary,
    "--sidebar-primary-foreground": palette.primaryForeground,
    "--sidebar-ring": palette.primary,
    "--ring": palette.accent,
    "--chart-1": palette.primary,
    "--chart-2": palette.accent,
    "--chart-3": palette.foreground,
    "--chart-4": palette.sidebar,
    "--chart-5": palette.muted,
    "--hero-from": palette.sidebar,
    "--hero-to": palette.primary,
  }

  const typographyMap: Record<string, string> = {
    "--font-sans": typography.fontSans,
    "--font-heading": typography.fontHeading,
  }

  for (const [key, value] of Object.entries(colorMap)) {
    root.style.setProperty(key, value)
  }

  for (const [key, value] of Object.entries(typographyMap)) {
    root.style.setProperty(key, value)
  }

  return resolved
}

export function sanitizeBrandingPayload(payload: any): BrandingSettings {
  const safePalette: Partial<BrandingPalette> = {}
  const safeTypography: Partial<BrandingTypography> = {}

  if (payload && typeof payload === "object") {
    if (payload.palette && typeof payload.palette === "object") {
      for (const [key, value] of Object.entries(payload.palette)) {
        if (value && typeof value === "string" && HEX_COLOR_REGEX.test(value.trim())) {
          const normalizedKey = key as keyof BrandingPalette
          safePalette[normalizedKey] = value.trim()
        }
      }
    }

    if (payload.typography && typeof payload.typography === "object") {
      if (payload.typography.fontSans && typeof payload.typography.fontSans === "string") {
        safeTypography.fontSans = payload.typography.fontSans.trim().slice(0, 120)
      }
      if (payload.typography.fontHeading && typeof payload.typography.fontHeading === "string") {
        safeTypography.fontHeading = payload.typography.fontHeading.trim().slice(0, 120)
      }
    }
  }

  const branding: BrandingSettings = {}

  if (payload?.logo_url && typeof payload.logo_url === "string") {
    branding.logo_url = payload.logo_url.trim()
  }

  if (Object.keys(safePalette).length > 0) {
    branding.palette = safePalette
  }

  if (Object.keys(safeTypography).length > 0) {
    branding.typography = safeTypography
  }

  return branding
}

export function mergeBrandingSettings(
  current: BrandingSettings | null | undefined,
  updates: BrandingSettings,
): BrandingSettings {
  return {
    logo_url: updates.logo_url ?? current?.logo_url,
    logo_path: updates.logo_path ?? current?.logo_path,
    palette: { ...(current?.palette || {}), ...(updates.palette || {}) },
    typography: { ...(current?.typography || {}), ...(updates.typography || {}) },
  }
}
