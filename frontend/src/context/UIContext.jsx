import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const UIContext = createContext({
  loadingCount: 0,
  startLoading: () => {},
  stopLoading: () => {},
  withLoading: async (fn) => fn(),
  showToast: (message, options) => {},
  toastSuccess: (message, options) => {},
  toastError: (message, options) => {},
  toastInfo: (message, options) => {},
  toastWarning: (message, options) => {},
});

export const UIProvider = ({ children }) => {
  const [loadingCount, setLoadingCount] = useState(0);
  const mounted = useRef(true);

  React.useEffect(() => () => { mounted.current = false; }, []);

  const startLoading = useCallback(() => {
    setLoadingCount(c => c + 1);
  }, []);

  const stopLoading = useCallback(() => {
    setLoadingCount(c => (c > 0 ? c - 1 : 0));
  }, []);

  const withLoading = useCallback(async (fn) => {
    startLoading();
    try {
      return await fn();
    } finally {
      if (mounted.current) stopLoading();
    }
  }, [startLoading, stopLoading]);

  // Snackbar/Toast queue
  const [queue, setQueue] = useState([]);
  const [snack, setSnack] = useState(null); // { key, message, severity, autoHideDuration }

  useEffect(() => {
    if (!snack && queue.length > 0) {
      setSnack(queue[0]);
      setQueue((q) => q.slice(1));
    }
  }, [queue, snack]);

  const enqueue = useCallback((message, options = {}) => {
    const item = {
      key: Date.now() + Math.random(),
      message,
      severity: options.severity || 'info',
      autoHideDuration: typeof options.autoHideDuration === 'number' ? options.autoHideDuration : 3000,
    };
    setQueue((q) => [...q, item]);
  }, []);

  const showToast = enqueue;
  const toastSuccess = useCallback((message, options = {}) => enqueue(message, { ...options, severity: 'success' }), [enqueue]);
  const toastError = useCallback((message, options = {}) => enqueue(message, { ...options, severity: 'error' }), [enqueue]);
  const toastInfo = useCallback((message, options = {}) => enqueue(message, { ...options, severity: 'info' }), [enqueue]);
  const toastWarning = useCallback((message, options = {}) => enqueue(message, { ...options, severity: 'warning' }), [enqueue]);

  const handleClose = useCallback((_, reason) => {
    if (reason === 'clickaway') return;
    setSnack(null);
  }, []);

  return (
    <UIContext.Provider value={{ loadingCount, startLoading, stopLoading, withLoading, showToast, toastSuccess, toastError, toastInfo, toastWarning }}>
      {children}
      <Snackbar
        open={!!snack}
        autoHideDuration={snack?.autoHideDuration}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleClose} severity={snack?.severity || 'info'} variant="filled" sx={{ width: '100%' }}>
          {snack?.message}
        </Alert>
      </Snackbar>
    </UIContext.Provider>
  );
};

export const useUI = () => useContext(UIContext);

export default UIContext;
