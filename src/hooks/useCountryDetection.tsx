import { useState, useEffect } from 'react';

export const useCountryDetection = () => {
  const [isIndia, setIsIndia] = useState<boolean>(true); // Default to India
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const detectCountry = async () => {
      try {
        // Try to detect country from timezone first (fast)
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (timezone.includes('Kolkata') || timezone.includes('Asia/Calcutta')) {
          setIsIndia(true);
          setLoading(false);
          return;
        }

        // Fallback: Use IP-based detection
        const response = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) });
        const data = await response.json();
        setIsIndia(data.country_code === 'IN');
      } catch (error) {
        // Default to India on error
        setIsIndia(true);
      } finally {
        setLoading(false);
      }
    };

    detectCountry();
  }, []);

  return { isIndia, loading };
};
