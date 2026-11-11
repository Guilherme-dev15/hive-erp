import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { getConfig } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import { applyThemeVariables } from '../utils/themeUtils';

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  storeName: string;
  slug: string;
}

export interface ThemeContextType {
  theme: ThemeConfig;
  setTheme: (newTheme: Partial<ThemeConfig>) => void;
  refreshTheme: () => Promise<void>;
  loadingTheme: boolean;
}

export const ThemeContext = createContext<ThemeContextType | null>(null);

const DEFAULT_THEME: ThemeConfig = {
  primaryColor: '#D4AF37',
  secondaryColor: '#343434',
  storeName: 'Hive ERP',
  slug: '',
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user, userData, needsOnboarding } = useAuth();
  const [theme, setThemeState] = useState<ThemeConfig>(DEFAULT_THEME);
  const [loadingTheme, setLoadingTheme] = useState(false);
  const isSubscriptionBlocked = Boolean(
    userData?.subscription?.isBlocked && !userData?.isSuperAdmin
  );

  const setTheme = useCallback((newTheme: Partial<ThemeConfig>) => {
    setThemeState((prev) => {
      const updated = { ...prev, ...newTheme };
      applyThemeVariables(updated.primaryColor, updated.secondaryColor);
      return updated;
    });
  }, []);

  const refreshTheme = useCallback(async () => {
    if (!user || needsOnboarding || isSubscriptionBlocked) return;
    try {
      setLoadingTheme(true);
      const data = await getConfig();
      if (data) {
        const nextTheme: ThemeConfig = {
          primaryColor: data.primaryColor || DEFAULT_THEME.primaryColor,
          secondaryColor: data.secondaryColor || DEFAULT_THEME.secondaryColor,
          storeName: data.storeName || DEFAULT_THEME.storeName,
          slug: data.slug || '',
        };
        setThemeState(nextTheme);
        applyThemeVariables(nextTheme.primaryColor, nextTheme.secondaryColor);
      }
    } catch (err) {
      console.warn('Não foi possível carregar o tema da loja:', err);
    } finally {
      setLoadingTheme(false);
    }
  }, [user, needsOnboarding, isSubscriptionBlocked]);

  useEffect(() => {
    if (!user) {
      setThemeState(DEFAULT_THEME);
      applyThemeVariables(DEFAULT_THEME.primaryColor, DEFAULT_THEME.secondaryColor);
      return;
    }

    if (userData?.store) {
      const fallbackTheme: ThemeConfig = {
        primaryColor: userData.store.primaryColor || DEFAULT_THEME.primaryColor,
        secondaryColor: userData.store.secondaryColor || DEFAULT_THEME.secondaryColor,
        storeName: userData.store.storeName || DEFAULT_THEME.storeName,
        slug: userData.store.slug || '',
      };
      setThemeState(fallbackTheme);
      applyThemeVariables(fallbackTheme.primaryColor, fallbackTheme.secondaryColor);
    }

    if (!needsOnboarding && !isSubscriptionBlocked) {
      refreshTheme();
    }
  }, [user, userData?.store, needsOnboarding, isSubscriptionBlocked, refreshTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, refreshTheme, loadingTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: DEFAULT_THEME,
      setTheme: () => undefined,
      refreshTheme: async () => undefined,
      loadingTheme: false,
    };
  }
  return context;
}
