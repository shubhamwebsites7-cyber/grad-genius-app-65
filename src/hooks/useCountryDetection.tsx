import { useState, useEffect } from 'react';

export const useCountryDetection = () => {
  const [isIndia, setIsIndia] = useState<boolean>(true); // Default to India
  const [countryCode, setCountryCode] = useState<string>('IN');
  const [countryName, setCountryName] = useState<string>('India');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const detectCountry = async () => {
      try {
        // Check localStorage for manual override first
        const savedCountry = localStorage.getItem('user_country');
        if (savedCountry) {
          const { code, name } = JSON.parse(savedCountry);
          setCountryCode(code);
          setCountryName(name);
          setIsIndia(code === 'IN');
          setLoading(false);
          return;
        }

        // Method 1: Try Vercel geo headers (most reliable when deployed on Vercel)
        try {
          const vercelGeo = await fetch('/api/geo-check', { signal: AbortSignal.timeout(2000) });
          if (vercelGeo.ok) {
            const geoData = await vercelGeo.json();
            if (geoData.country) {
              updateCountryData(geoData.country, geoData.countryName || geoData.country);
              setLoading(false);
              return;
            }
          }
        } catch {
          // Continue to next method
        }

        // Method 2: Use ipapi.co (reliable, works with most VPNs)
        try {
          const response = await fetch('https://ipapi.co/json/', { 
            signal: AbortSignal.timeout(4000),
            headers: { 'Accept': 'application/json' }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.country_code && data.country_name) {
              updateCountryData(data.country_code, data.country_name);
              setLoading(false);
              return;
            }
          }
        } catch {
          // Continue to next method
        }

        // Method 3: Use ip-api.com as backup (free, no rate limits)
        try {
          const response = await fetch('http://ip-api.com/json/', { 
            signal: AbortSignal.timeout(4000) 
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.countryCode && data.country) {
              updateCountryData(data.countryCode, data.country);
              setLoading(false);
              return;
            }
          }
        } catch {
          // Continue to timezone fallback
        }

        // Method 4: Fallback to timezone detection (works offline)
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (timezone.includes('Kolkata') || timezone.includes('Calcutta')) {
          updateCountryData('IN', 'India');
        } else {
          // Default to India if all methods fail
          updateCountryData('IN', 'India');
        }
      } catch (error) {
        // Default to India on any error
        updateCountryData('IN', 'India');
      } finally {
        setLoading(false);
      }
    };

    const updateCountryData = (code: string, name: string) => {
      setCountryCode(code);
      setCountryName(name);
      setIsIndia(code === 'IN');
      // Cache in localStorage for 24 hours
      localStorage.setItem('user_country', JSON.stringify({ 
        code, 
        name, 
        timestamp: Date.now() 
      }));
    };

    // Check if cached data is still valid (24 hours)
    const savedCountry = localStorage.getItem('user_country');
    if (savedCountry) {
      try {
        const { timestamp } = JSON.parse(savedCountry);
        const hoursSinceCache = (Date.now() - timestamp) / (1000 * 60 * 60);
        if (hoursSinceCache > 24) {
          localStorage.removeItem('user_country');
        }
      } catch {
        localStorage.removeItem('user_country');
      }
    }

    detectCountry();
  }, []);

  const switchCountry = (code: string, name: string) => {
    setCountryCode(code);
    setCountryName(name);
    setIsIndia(code === 'IN');
    localStorage.setItem('user_country', JSON.stringify({ code, name, timestamp: Date.now() }));
  };

  return { isIndia, countryCode, countryName, loading, switchCountry };
};
