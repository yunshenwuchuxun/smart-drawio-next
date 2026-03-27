// Draw.io CSS styles for Light/Dark theme integration
// Injected via postMessage configure action after iframe init

export function getDrawioStyles(isDark = false) {
  const vars = {
    bgApp: isDark ? '#121212' : '#F9FAFB',
    bgSurface: isDark ? '#1E1E1E' : '#FFFFFF',
    textPrimary: isDark ? '#EDEDED' : '#111827',
    textSecondary: isDark ? '#A1A1AA' : '#6B7280',
    borderSubtle: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
  };

  return `
    /* Menubar */
    .geMenubarContainer {
      background: ${vars.bgSurface} !important;
      border-bottom: 1px solid ${vars.borderSubtle} !important;
    }

    /* Toolbar */
    .geToolbarContainer {
      background: ${vars.bgApp} !important;
      border-bottom: 1px solid ${vars.borderSubtle} !important;
      height: 40px !important;
      padding: 0 8px !important;
    }

    /* Sidebar */
    .geSidebarContainer {
      background: ${vars.bgSurface} !important;
      border-right: 1px solid ${vars.borderSubtle} !important;
    }

    /* Sidebar section titles */
    .geSidebarContainer .geTitle {
      font-family: 'Geist Mono', monospace !important;
      font-size: 10px !important;
      text-transform: uppercase !important;
      letter-spacing: 0.08em !important;
      color: ${vars.textSecondary} !important;
    }

    /* Toolbar buttons */
    .geToolbarButton {
      border-radius: 4px !important;
      opacity: 0.7 !important;
      transition: opacity 150ms ease, background 150ms ease !important;
    }

    .geToolbarButton:hover {
      background: ${vars.borderSubtle} !important;
      opacity: 1 !important;
    }

    /* Format panel (right side) - hide if format=0 not working */
    .geFormatContainer {
      display: none !important;
    }
  `.trim();
}

export function createConfigureMessage(isDark = false) {
  return JSON.stringify({
    action: 'configure',
    config: {
      css: getDrawioStyles(isDark),
    },
  });
}
