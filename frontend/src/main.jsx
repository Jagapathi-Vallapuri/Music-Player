import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { ThemeProvider, useTheme } from './context/ThemeContext.jsx';

const AppWrapper = () => {
  const { theme } = useTheme();
  
  return (
    <MUIThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </MUIThemeProvider>
  );
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <AppWrapper />
    </ThemeProvider>
  </StrictMode>,
)
