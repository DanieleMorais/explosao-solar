export const t = {
  ink: '#131417',
  inkSoft: '#3D4149',
  muted: '#6B7079',
  paper: '#FAFAF7',
  card: '#FFFFFF',
  line: '#E9E6DF',
  dark: '#0C0E1A',
  darkSoft: '#161A2C',
  darkLine: 'rgba(255,255,255,0.10)',
  sun: '#FF6B00',
  sunSoft: '#FFB300',
  sunGrad: 'linear-gradient(100deg, #FF6B00, #FFB300)',
  maxW: 1920,
  pad: '0 clamp(20px, 3vw, 56px)',
  radius: 14,
  radiusSm: 9,
  shadow: '0 1px 3px rgba(16,18,28,0.06), 0 8px 28px rgba(16,18,28,0.07)',
  shadowHover: '0 4px 12px rgba(16,18,28,0.10), 0 16px 44px rgba(16,18,28,0.14)',
}

export const catColors = {
  mundo: '#2563EB',
  brasil: '#16A34A',
  politica: '#DC2626',
  economia: '#D97706',
  tecnologia: '#7C3AED',
  ciencia: '#0891B2',
  esportes: '#EA580C',
  cultura: '#DB2777',
}

export function catColor(slug) {
  return catColors[slug] || t.sun
}
