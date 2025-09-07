import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import createPulseTheme from '../theme.js';

const ColorModeContext = createContext({ toggleColorMode: () => {}, mode: 'dark' });

export const ColorModeProvider = ({ children }) => {
  const [mode, setMode] = useState('dark');

  useEffect(() => {
    const stored = localStorage.getItem('colorMode');
    if (stored === 'light' || stored === 'dark') setMode(stored);
  }, []);

  const toggleColorMode = () => {
    setMode(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('colorMode', next);
      return next;
    });
  };

  const theme = useMemo(() => createPulseTheme(mode), [mode]);

  const value = useMemo(() => ({ toggleColorMode, mode }), [toggleColorMode, mode]);

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ColorModeContext.Provider>
  );
};

export const useColorMode = () => useContext(ColorModeContext);

export default ColorModeContext;
