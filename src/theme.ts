export const colors = {
  primary: "#548BF8",   // bright blue — buttons, interactive
  bg: "#A0CBE6",        // pastel blue — screen background
  surface: "#FFFBF3",   // off-white — cards
  accent: "#FDE388",    // yellow — point badges, highlights
  text: "#1A1A1A",      // near-black — body text
  muted: "#888888",     // medium gray — secondary text
  success: "#68D368",   // green — success states
  error: "#FF6B6B",     // red — errors
  border: "#1A1A1A",    // black — all borders
  highlight: "#E8F0FF", // light blue — current-user row highlight
};

export const darkColors = {
  primary: "#548BF8",   // same blue — works on dark
  bg: "#1C1C2E",        // very dark navy — screen background
  surface: "#2A2A3C",   // dark elevated surface — cards
  accent: "#F59E0B",    // amber — point badges, highlights
  text: "#F0EFE8",      // near-white — body text
  muted: "#9CA3AF",     // medium gray — secondary text
  success: "#4ADE80",   // bright green — success states
  error: "#F87171",     // soft red — errors
  border: "#F0EFE8",    // near-white — all borders (inverted)
  highlight: "#1E3A5F", // dark blue — current-user row highlight
};

export type ColorPalette = typeof colors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// Neo-brutalist hard shadow — use spread syntax: { ...shadow }
export const shadow = {
  shadowColor: "#000",
  shadowOffset: { width: 4, height: 4 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 6,
};
