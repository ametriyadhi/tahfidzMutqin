import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

interface BrandingContextType {
  appName: string;
  appLogo: string | null;
  loginLogo: string | null;
  footerText: string;
  loading: boolean;
  refreshBranding: () => Promise<void>;
  setPageTitle: (subtitle: string) => void;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appName, setAppName] = useState<string>('SITA Tahfidz');
  const [appLogo, setAppLogo] = useState<string | null>(null);
  const [loginLogo, setLoginLogo] = useState<string | null>(null);
  const [footerText, setFooterText] = useState<string>('Sistem Digital Setoran Tahfidz');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchBranding = async () => {
    try {
      const data = await api.getWhiteLabel();
      if (data) {
        setAppName(data.appName || 'SITA Tahfidz');
        setAppLogo(data.appLogo || null);
        setLoginLogo(data.loginLogo || null);
        setFooterText(data.footerText || 'Sistem Digital Setoran Tahfidz');
      }
    } catch (error) {
      console.error('Failed to load branding configurations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranding();
  }, []);

  useEffect(() => {
    const favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (favicon) {
      favicon.href = appLogo || '/favicon.svg';
    } else {
      const newFavicon = document.createElement('link');
      newFavicon.rel = 'icon';
      newFavicon.type = 'image/svg+xml';
      newFavicon.href = appLogo || '/favicon.svg';
      document.head.appendChild(newFavicon);
    }
  }, [appLogo]);

  const refreshBranding = async () => {
    setLoading(true);
    await fetchBranding();
  };

  const setPageTitle = (subtitle: string) => {
    document.title = `${appName} | ${subtitle}`;
  };

  return (
    <BrandingContext.Provider
      value={{
        appName,
        appLogo,
        loginLogo,
        footerText,
        loading,
        refreshBranding,
        setPageTitle,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};
