import React, { createContext, useEffect, useState, useContext } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import Geolocation, { GeoPosition, GeoError } from 'react-native-geolocation-service';

type Location = {
  latitude: number;
  longitude: number;
};

type LocationContextType = {
  location: Location | null;
  error: string | null;
  isLoading: boolean;
};

const LocationContext = createContext<LocationContextType>({
  location: null,
  error: null,
  isLoading: true,
});

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ...(Platform.Version >= 29
          ? [PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION]
          : []),
      ]);

      const allGranted = Object.values(granted).every(g => g === PermissionsAndroid.RESULTS.GRANTED);
      return allGranted;
    }
    return true;
  };

  const getInitialLocation = (): Promise<GeoPosition> => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => resolve(position),
        error => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 5000, // allow slightly cached location
          forceRequestLocation: true, // crucial in release mode
          showLocationDialog: true,
        }
      );
    });
  };

  useEffect(() => {
    let watchId: number | null = null;

    const startTracking = async () => {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setError('Location permission denied');
        setIsLoading(false);
        return;
      }

      try {
        const position = await getInitialLocation();
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        setIsLoading(false);
        console.log('📍 Initial fix:', latitude, longitude);
      } catch (err: any) {
        const msg = (err as GeoError).message || 'Location error';
        console.warn('⚠️ getCurrentPosition failed:', msg);
        setError(msg);
        setIsLoading(false);
      }

      watchId = Geolocation.watchPosition(
        pos => {
          const { latitude, longitude } = pos.coords;
          setLocation({ latitude, longitude });
          setError(null);
          console.log('📍 Watch update:', latitude, longitude);
        },
        err => {
          console.warn('⚠️ Watch error:', err.message);
          setError(err.message);
        },
        {
          enableHighAccuracy: true,
          distanceFilter: 0,
          interval: 5000,
          fastestInterval: 2000,
          forceRequestLocation: true,
          showLocationDialog: true,
        }
      );
    };

    startTracking();

    return () => {
      if (watchId !== null) {
        Geolocation.clearWatch(watchId);
        console.log('🛑 Cleared watch');
      }
    };
  }, []);

  return (
    <LocationContext.Provider value={{ location, error, isLoading }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);