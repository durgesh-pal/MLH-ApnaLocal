import { useState, useEffect } from 'react';
import { JAUNPUR_LOCALITIES } from '../lib/localities';

export const useGeolocation = () => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearestLocality, setNearestLocality] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });

        // Find nearest locality
        let minDistance = Infinity;
        let nearest = null;

        JAUNPUR_LOCALITIES.forEach((loc) => {
          const distance = Math.sqrt(
            Math.pow(loc.lat - latitude, 2) + Math.pow(loc.lng - longitude, 2)
          );
          if (distance < minDistance) {
            minDistance = distance;
            nearest = loc.name;
          }
        });

        setNearestLocality(nearest);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
  }, []);

  return { location, nearestLocality, error, loading };
};
