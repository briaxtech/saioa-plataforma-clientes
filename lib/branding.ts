import type { BrandingPalette, BrandingSettings, BrandingTypography } from "./types"

const DEFAULT_PALETTE: BrandingPalette = {
  primary: "#7c3aed", // brand purple
  primaryForeground: "#0b0b12",
  background: "#020204",
  foreground: "#f5f7fb",
  accent: "#06b6d4", // brand cyan
  accentForeground: "#020204",
  muted: "#0f172a",
  mutedForeground: "#cbd5e1",
  border: "#111827",
  card: "#0a0a0c",
  cardForeground: "#f5f7fb",
  sidebar: "#020204",
  sidebarForeground: "#f5f7fb",
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
  return {
    logo_url: branding?.logo_url || DEFAULT_LOGO_URL,
    // Mantener la UI unificada con la paleta/tipografia base de la home
    palette: DEFAULT_PALETTE,
    typography: DEFAULT_TYPOGRAPHY,
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
  const branding: BrandingSettings = {}

  if (payload?.logo_url && typeof payload.logo_url === "string") {
    branding.logo_url = payload.logo_url.trim()
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
