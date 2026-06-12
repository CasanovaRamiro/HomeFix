export function useTheme() {
  return {
    primaryDark: '#0F172A',
    accent: '#10B981',
    accentHover: '#059669',
    background: '#F8FAFC',
    card: '#FFFFFF',
    border: '#E2E8F0',
    muted: '#64748B',
    danger: '#EF4444',
    hover: '#F1F5F9',
    activeBg: 'rgba(19, 36, 59, 0.08)',
    dangerHoverBg: 'rgba(239, 68, 68, 0.05)',
  } as const
}
