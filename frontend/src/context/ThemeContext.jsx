import React, { createContext, useContext, useEffect, useState } from 'react';
import { createTheme } from '@mui/material/styles';
import { alpha } from '@mui/material';

const ThemeContext = createContext(null);

const createCustomTheme = (mode) => {
  const isLight = mode === 'light';

  const primary = {
    main: isLight ? '#304ffe' : '#536dfe',
    light: '#8c9eff',
    dark: '#1a237e',
    contrastText: '#ffffff'
  };
  const secondary = {
    main: isLight ? '#00b8d4' : '#00acc1',
    light: '#62efff',
    dark: '#00838f',
    contrastText: '#ffffff'
  };

  const bgDefault = isLight ? '#f5f7fa' : '#091017';
  const bgPaper = isLight ? '#ffffff' :  '#121a23';

  const gradients = {
    primary: `linear-gradient(135deg, ${primary.main}, ${secondary.main})`,
    surface: isLight
      ? 'linear-gradient(145deg, rgba(255,255,255,0.9), rgba(245,247,250,0.9))'
      : 'linear-gradient(145deg, rgba(18,26,35,0.92), rgba(9,16,23,0.92))',
    accent: isLight
      ? 'radial-gradient(circle at 30% 30%, rgba(48,79,254,0.25), rgba(48,79,254,0) 70%)'
      : 'radial-gradient(circle at 30% 30%, rgba(83,109,254,0.28), rgba(83,109,254,0) 70%)'
  };

  const theme = createTheme({
    palette: {
      mode,
      primary,
      secondary,
      background: { default: bgDefault, paper: bgPaper },
      divider: isLight ? alpha('#0a0a0a', 0.12) : alpha('#ffffff', 0.08),
      text: {
        primary: isLight ? '#0f1419' : '#f5f7fa',
        secondary: isLight ? alpha('#0f1419', 0.65) : alpha('#f5f7fa', 0.72),
        disabled: isLight ? alpha('#0f1419', 0.38) : alpha('#f5f7fa', 0.4)
      },
      success: { main: '#1e8e3e' },
      error: { main: '#e53935' },
      warning: { main: '#fb8c00' },
      info: { main: '#039be5' },
      gradients
    },
    shape: { borderRadius: 16 },
    typography: {
      fontFamily: 'Inter, Roboto, Arial, sans-serif',
      h1: { fontWeight: 600, letterSpacing: '-0.02em' },
      h2: { fontWeight: 600, letterSpacing: '-0.02em' },
      h3: { fontWeight: 600 },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600 }
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            background: gradients.surface,
            backdropFilter: 'blur(12px)',
            border: `1px solid ${isLight ? alpha('#0f1419', 0.08) : alpha('#ffffff', 0.08)}`,
            boxShadow: isLight
              ? '0 4px 18px rgba(0,0,0,0.08)'
              : '0 4px 28px rgba(0,0,0,0.55)'
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            paddingTop: 10,
            paddingBottom: 10,
            fontWeight: 600
          },
          containedPrimary: {
            backgroundImage: gradients.primary,
            boxShadow: '0 4px 16px 0 rgba(48,79,254,0.45)',
            '&:hover': {
              boxShadow: '0 6px 22px 0 rgba(48,79,254,0.55)',
              filter: 'brightness(1.05)'
            }
          },
          outlinedPrimary: {
            borderColor: alpha(primary.main, 0.4),
            '&:hover': { borderColor: primary.main, backgroundColor: alpha(primary.main, 0.04) }
          }
        }
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: isLight ? alpha('#0f1419', 0.02) : alpha('#ffffff', 0.05),
            '& fieldset': { borderColor: isLight ? alpha('#0f1419', 0.18) : alpha('#ffffff', 0.18) },
            '&:hover fieldset': { borderColor: isLight ? alpha('#0f1419', 0.34) : alpha('#ffffff', 0.34) },
            '&.Mui-focused fieldset': { borderColor: primary.main }
          },
          input: {
            padding: '14px 14px',
            // Neutralize Chrome/Safari autofill yellow background
            '&:-webkit-autofill': {
              WebkitBoxShadow: '0 0 0 1000px transparent inset',
              WebkitTextFillColor: 'inherit',
              transition: 'background-color 9999s ease-out'
            },
            '&:-webkit-autofill:hover': {
              WebkitBoxShadow: '0 0 0 1000px transparent inset'
            },
            '&:-webkit-autofill:focus': {
              WebkitBoxShadow: '0 0 0 1000px transparent inset'
            }
          }
        }
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            // Keep label style consistent whether filled (autofill) or not
            '&.MuiFormLabel-filled': {
              color: 'inherit',
              fontWeight: 500
            }
          }
        }
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: gradients.primary,
            boxShadow: '0 2px 14px rgba(0,0,0,0.45)'
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            background: gradients.surface,
            borderRadius: 22,
            border: `1px solid ${isLight ? alpha('#0f1419', 0.1) : alpha('#ffffff', 0.1)}`,
            boxShadow: isLight
              ? '0 6px 24px rgba(0,0,0,0.08)'
              : '0 6px 32px rgba(0,0,0,0.55)'
          }
        }
      }
    }
  });

  return theme;
};

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('themeMode');
    if (savedTheme) {
      setThemeMode(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newTheme);
    localStorage.setItem('themeMode', newTheme);
  };

  const theme = createCustomTheme(themeMode);

  return (
    <ThemeContext.Provider value={{ theme, themeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
