import { useState, useEffect, createContext, useContext } from 'react';
import { settingsApi } from '../services';

const SettingsContext = createContext(null);

const DEFAULTS = {
  brandName: 'VOLTIQ',
  logoUrl: '',
  tagline: 'Technology that moves you',
  announcementText: 'Free express shipping on orders over Rs 500,000 · Use code WELCOME10 for 10% off',
  announcementEnabled: true,
  contactEmail: 'support@voltiq.store',
  contactPhone: '+92 300 010 2020',
  address: '100 Circuit Avenue, Lahore, PK',
  aboutText: 'Premium electronics, smart devices and accessories — curated for people who expect more from their gear.',
  footerCopyright: 'VOLTIQ. All rights reserved.',
  socialLinks: { facebook: '#', instagram: '#', x: '#', youtube: '#' },
  metaTitle: 'VOLTIQ — Premium Electronics Store',
  metaDescription: 'Shop the latest electronics, smartphones, laptops, and accessories at VOLTIQ.',
  bankName: 'HBL',
  bankAccountTitle: 'MUHAMMAD ADA',
  bankAccountNumber: '09917902364499',
  bankDiscountPercent: 20,
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    settingsApi
      .get()
      .then((s) => { if (alive && s) setSettings((prev) => ({ ...prev, ...s })); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  return <SettingsContext.Provider value={{ settings, loading, setSettings }}>{children}</SettingsContext.Provider>;
}

export default function useSiteSettings() {
  return useContext(SettingsContext) || { settings: DEFAULTS, loading: false };
}
