export const colors = {
  primary: '#0B5D4B',
  primaryText: '#FFFFFF',
  text: '#1A1F24',
  textMuted: '#5B6670',
  border: '#D9DEE3',
  background: '#FFFFFF',
  surface: '#F5F6F7',
  danger: '#B42318',
  dangerSurface: '#FEF3F2',
  success: '#067647',
  successSurface: '#ECFDF3',
  warning: '#B54708',
  warningSurface: '#FFFAEB',
  info: '#175CD3',
  infoSurface: '#EFF8FF',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 4, md: 8 } as const;

export const typography = {
  title: { fontSize: 22, fontWeight: '600' },
  heading: { fontSize: 17, fontWeight: '600' },
  body: { fontSize: 15 },
  label: { fontSize: 13, fontWeight: '500' },
  small: { fontSize: 13 },
} as const;