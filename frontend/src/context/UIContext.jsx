import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

const UIContext = createContext({
  loadingCount: 0,
  startLoading: () => {},
  stopLoading: () => {},
  withLoading: async (fn) => fn()
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

  return (
    <UIContext.Provider value={{ loadingCount, startLoading, stopLoading, withLoading }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => useContext(UIContext);

export default UIContext;
