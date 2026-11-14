// Shared between scripts/prerender-mermaid.mjs (build-time render) and
// src/components/Mermaid.tsx (chart lookup hash). No React imports — safe for node.
export const lightThemeVariables = {
  primaryColor: '#6366f1',
  primaryTextColor: '#1e293b',
  primaryBorderColor: '#6366f1',
  lineColor: '#64748b',
  secondaryColor: '#f1f5f9',
  tertiaryColor: '#e2e8f0',
  background: '#ffffff',
  mainBkg: '#f1f5f9',
  nodeBorder: '#6366f1',
  clusterBkg: '#f8fafc',
  clusterBorder: '#e2e8f0',
  titleColor: '#1e293b',
  edgeLabelBackground: '#ffffff',
  nodeTextColor: '#1e293b',
}

export const darkThemeVariables = {
  primaryColor: '#818cf8',
  primaryTextColor: '#f1f5f9',
  primaryBorderColor: '#818cf8',
  lineColor: '#94a3b8',
  secondaryColor: '#1e293b',
  tertiaryColor: '#334155',
  background: '#0f172a',
  mainBkg: '#1e293b',
  nodeBorder: '#818cf8',
  clusterBkg: '#1e293b',
  clusterBorder: '#334155',
  titleColor: '#f1f5f9',
  edgeLabelBackground: '#0f172a',
  nodeTextColor: '#f1f5f9',
}

export const getBaseConfig = (isDark) => ({
  startOnLoad: false,
  theme: 'base',
  themeVariables: isDark ? darkThemeVariables : lightThemeVariables,
  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
  fontSize: 10,
  flowchart: {
    htmlLabels: false,
    curve: 'basis',
    padding: 15,
    nodeSpacing: 50,
    rankSpacing: 50,
    useMaxWidth: true,
  },
  sequence: {
    diagramMarginX: 50,
    diagramMarginY: 10,
    actorMargin: 50,
    width: 150,
    height: 65,
    boxMargin: 10,
    boxTextMargin: 5,
    noteMargin: 10,
    messageMargin: 35,
  },
})

// fnv1a-32 — deterministic key for chart → pre-rendered SVG lookup.
export function chartHash(text) {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return 'm' + h.toString(16)
}
