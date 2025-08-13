import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StatusBar,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Keyboard,
  KeyboardEvent,
  Animated,
  TouchableWithoutFeedback,
  PermissionsAndroid,
} from 'react-native';
import MapView, { Marker, Region, Polyline, AnimatedRegion} from 'react-native-maps';
import { Animated as RNAnimated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import BottomNavBar from '../components/BottomNavBar';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useLocation } from '../Context/LocationContext';
import Geolocation from 'react-native-geolocation-service';
import Tts from 'react-native-tts';
import NavigationBanner from '../components/NavigationBanner';

const { width, height } = Dimensions.get('window');
const GOOGLE_MAPS_API_KEY = 'AIzaSyBXfOOUN_nGASNdGB9yrcBiXgR0xIvm_4g';

const MapScreen = () => {
  const { location, error, isLoading } = useLocation();
  const [userRegion, setUserRegion] = useState<Region | null>(null);
  const markerPosition = useRef(
  new AnimatedRegion({
    latitude: location?.latitude || 0,
    longitude: location?.longitude || 0,
    latitudeDelta: 0.001,
    longitudeDelta: 0.001,
  })
).current;
  const [destination, setDestination] = useState<Region | null>(null);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [routeSummary, setRouteSummary] = useState<{
  duration: string;
  distance: string;
  eta: string;
} | null>(null);
  const [stepInstructions, setStepInstructions] = useState<any[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [readyToRender, setReadyToRender] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [watchId, setWatchId] = useState<number | null>(null);
  const [isJourneyStarted, setIsJourneyStarted] = useState(false); // 👈 NEW

  const searchRef = useRef<any>(null);
  const mapRef = useRef<MapView | null>(null);
  const translateY = useRef(new Animated.Value(0)).current;
  const cameraInitialized = useRef(false);
  const prevIndexRef = useRef<number>(-1);
  const prevUserCoords = useRef<{ latitude: number; longitude: number } | null>(null);
  const lastInstructionTime = useRef<number>(0);
  const smoothedCoords = useRef<{ latitude: number; longitude: number } | null>(null);
  const userHeading = useRef(new Animated.Value(0)).current;
  const lastETAUpdateTime = useRef<number>(0);
const SMOOTHING_ALPHA = 0.3; // Tunable
const navBannerAnim = useRef(new Animated.Value(0)).current;
const [searchText, setSearchText] = useState('');
    const lastRerouteTime = useRef(0); // declare once
    const [isRerouting, setIsRerouting] = useState(false);
const rerouteAnim = useRef(new Animated.Value(0)).current;
const [currentZoom, setCurrentZoom] = useState(18);
const AnimatedMarker = RNAnimated.createAnimatedComponent(Marker);
const lastMarkerCoords = useRef<{ latitude: number; longitude: number }>({
  latitude: location?.latitude || 0,
  longitude: location?.longitude || 0,
});
const lastMarkerUpdateTime = useRef<number>(0); // Add this to your refs
const MARKER_UPDATE_INTERVAL = 1000; // Minimum 1 second between marker updates
const isAnimating = useRef(false);

  useEffect(() => {
    Tts.setDefaultLanguage('en-US');
    Tts.setDefaultRate(0.5);

    const showSub = Keyboard.addListener('keyboardDidShow', (e: KeyboardEvent) => {
      Animated.timing(translateY, {
        toValue: -e.endCoordinates.height / 2.5,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });

    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const smoothLocation = (newLat: number, newLng: number) => {
  const DEADZONE_METERS = 5;

  if (!smoothedCoords.current) {
    smoothedCoords.current = { latitude: newLat, longitude: newLng };
  }

  const distanceMoved = getDistanceFromLatLonInKm(
    smoothedCoords.current.latitude,
    smoothedCoords.current.longitude,
    newLat,
    newLng
  ) * 1000;

  if (distanceMoved < DEADZONE_METERS) {
    // 🧊 Within jitter deadzone — ignore tiny movements
    return smoothedCoords.current;
  }

  smoothedCoords.current.latitude += SMOOTHING_ALPHA * (newLat - smoothedCoords.current.latitude);
  smoothedCoords.current.longitude += SMOOTHING_ALPHA * (newLng - smoothedCoords.current.longitude);

  return {
    latitude: smoothedCoords.current.latitude,
    longitude: smoothedCoords.current.longitude,
  };
};

const handleClearRoute = () => {
  if (isJourneyStarted) {
    stopJourney();
  } else {
    // just clear directions without stopping GPS tracking
    setRouteCoords([]);
    setRouteSummary(null);
    setStepInstructions([]);
    setCurrentStepIndex(0);
    setDestination(null); // optional if you want to reset search
  }
};

const clearSearch = () => {
  searchRef.current?.setAddressText?.('');
  setSearchText('');
  setDestination(null); // Clear the selected destination
  setRouteCoords([]); // Remove route polyline
  setRouteSummary(null); // Clear route summary box
  if (userRegion && mapRef.current) {
    mapRef.current.animateToRegion(userRegion, 800);
  }
};
 const updateDynamicRouteSummary = async (latitude: number, longitude: number) => {
  const now = Date.now();
  if (now - lastETAUpdateTime.current < 15000) return; // ⏱️ throttle to once every 15 seconds
  lastETAUpdateTime.current = now;

  if (!destination) return;

  try {
    const origin = `${latitude},${longitude}`;
    const dest = `${destination.latitude},${destination.longitude}`;
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${dest}&key=${GOOGLE_MAPS_API_KEY}`
    );

    const data = await response.json();
    const leg = data.routes?.[0]?.legs?.[0];

    if (leg) {
      const duration = leg.duration.text;
      const distance = leg.distance.text;
      const durationValue = leg.duration.value;

      const etaDate = new Date(Date.now() + durationValue * 1000);
      const eta = etaDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setRouteSummary({ duration, distance, eta });
    }
  } catch (err) {
    console.warn("Failed to update route summary:", err);
  }
};

  const decodePolyline = (encoded: string) => {
    let index = 0, lat = 0, lng = 0, coordinates = [];

    while (index < encoded.length) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = (result & 1) ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = (result & 1) ? ~(result >> 1) : result >> 1;
      lng += dlng;

      coordinates.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }
    return coordinates;
  };

  const getDirectionType = (html: string): 'left' | 'right' | 'straight' | 'uturn' => {
    const lower = html.toLowerCase();
    if (lower.includes('left')) return 'left';
    if (lower.includes('right')) return 'right';
    if (lower.includes('u-turn')) return 'uturn';
    return 'straight';
  };
  
  const showReroutingBanner = () => {
  setIsRerouting(true);
  Animated.timing(rerouteAnim, {
    toValue: 1,
    duration: 300,
    useNativeDriver: true,
  }).start();

  setTimeout(() => {
    Animated.timing(rerouteAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsRerouting(false);
    });
  }, 2000); // show for 2 seconds
};
  const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      0.5 - Math.cos(dLat) / 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        (1 - Math.cos(dLon)) / 2;

    return R * 2 * Math.asin(Math.sqrt(a));
  };

  const handleManualSearch = async () => {
    const input = searchRef.current?.getAddressText?.();
    if (!input) return;

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(input)}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      const location = data.results?.[0]?.geometry?.location;
      if (location) {
        const newRegion = {
          latitude: location.lat,
          longitude: location.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setDestination(newRegion);
        mapRef.current?.animateToRegion(newRegion, 1000);
      } else {
        setErrorMsg('No location found for that search.');
      }
    } catch (err) {
      console.error('Geocoding error:', err);
      setErrorMsg('Failed to find location.');
    }
  };

  useEffect(() => {
    if (location && !readyToRender) {
      const region = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setUserRegion(region);
      console.log('✅ Initial userRegion set:', region);
      setReadyToRender(true);
    }
  }, [location]);

  const handleShowRoute = async () => {
    if (!location || !destination) return;

    try {
      const origin = `${location.latitude},${location.longitude}`;
      const dest = `${destination.latitude},${destination.longitude}`;

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${dest}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.routes.length) {
        const points = decodePolyline(data.routes[0].overview_polyline.points);
        setRouteCoords(points);
        setStepInstructions(data.routes[0].legs[0].steps);
        const duration = data.routes[0].legs[0].duration.text;
const distance = data.routes[0].legs[0].distance.text;
const durationValue = data.routes[0].legs[0].duration.value; // in seconds
const etaDate = new Date(Date.now() + durationValue * 1000);
const eta = etaDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

setRouteSummary({ duration, distance, eta });
        setCurrentStepIndex(0);

        mapRef.current?.fitToCoordinates(points, {
          edgePadding: { top: 100, bottom: 100, left: 100, right: 100 },
          animated: true,
        });
      } else {
        setErrorMsg("No routes found.");
      }
    } catch (err) {
      console.error("Directions API error:", err);
      setErrorMsg("Failed to get route.");
    }
  };

  const handleStartJourney = async () => {

    Animated.timing(navBannerAnim, {
  toValue: 1,
  duration: 400,
  useNativeDriver: true,
}).start();
    if (!routeCoords.length || !stepInstructions.length || !routeSummary) {
  await handleShowRoute();
}
    console.log('🚗 Journey started');
    setIsJourneyStarted(true); // 👈 NEW

    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission Required',
            message: 'This app needs to track your location during navigation.',
            buttonPositive: 'OK',
          }
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          setErrorMsg('Location permission denied.');
          return;
        }
      }

      const id = Geolocation.watchPosition(
  (position) => {
    const { latitude, longitude } = smoothLocation(position.coords.latitude, position.coords.longitude);
    const newRegion = {
      latitude,
      longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };

    console.log('📍 Tracking location:', latitude, longitude);
   const markerDistance = getDistanceFromLatLonInKm(
  lastMarkerCoords.current.latitude,
  lastMarkerCoords.current.longitude,
  latitude,
  longitude
) * 1000;

const MARKER_DISTANCE_THRESHOLD = 10;

if (
  markerDistance > MARKER_DISTANCE_THRESHOLD &&
  Date.now() - lastMarkerUpdateTime.current > MARKER_UPDATE_INTERVAL &&
  !isAnimating.current
) {
  if (markerDistance < 20) {
    // For small movements, update instantly without animation
    markerPosition.setValue({
      latitude,
      longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  } else {
    // For larger movements, animate
    isAnimating.current = true;
    markerPosition
      .timing({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
        duration: 500,
        useNativeDriver: false,
      } as any)
      .start(() => {
        isAnimating.current = false;
      });
  }

  lastMarkerCoords.current = { latitude, longitude };
  lastMarkerUpdateTime.current = Date.now();
}
setUserRegion(newRegion); // Still keep this to move camera

    if (!cameraInitialized.current) {
      mapRef.current?.animateCamera({
        center: newRegion,
        pitch: 60,
        heading: position.coords.heading || 0,
        zoom: 18, // ✅ Zoom in initially
      }, { duration: 800 });

      cameraInitialized.current = true;
      prevUserCoords.current = { latitude, longitude };
    } else {
      const prevCoords = prevUserCoords.current;
      const distanceMoved = prevCoords
        ? getDistanceFromLatLonInKm(latitude, longitude, prevCoords.latitude, prevCoords.longitude) * 1000
        : 0;

      if (distanceMoved > 10) {
        prevUserCoords.current = { latitude, longitude };
        const newHeading = position.coords.heading || 0;
Animated.timing(userHeading, {
  toValue: newHeading,
  duration: 300,
  useNativeDriver: false,
}).start();
        mapRef.current?.animateCamera({
          center: newRegion,
          heading: position.coords.heading || 0,
          zoom: currentZoom, // ✅ Keep zoom tight on updates
        }, { duration: 300 });

        updateDynamicRouteSummary(latitude, longitude);
      }
    }

    if (stepInstructions.length > 0 && currentStepIndex < stepInstructions.length) {
      const currentStep = stepInstructions[currentStepIndex];
      const { lat, lng } = currentStep.end_location;
      const distance = getDistanceFromLatLonInKm(latitude, longitude, lat, lng) * 1000;

      // ✅ Re-routing logic
      const REROUTE_DISTANCE_THRESHOLD = 50; // meters
const REROUTE_COOLDOWN = 10000; // ms

const distanceFromStep = getDistanceFromLatLonInKm(latitude, longitude, lat, lng) * 1000;
const isFarFromStep = distanceFromStep > REROUTE_DISTANCE_THRESHOLD;
const isCooldownOver = Date.now() - lastRerouteTime.current > REROUTE_COOLDOWN;

// Optional: prevent rerouting if we're on the final step already
const isLastStep = currentStepIndex >= stepInstructions.length - 1;

if (isFarFromStep && isCooldownOver && !isLastStep) {
  console.log('🔁 User is off-route — rerouting...');
  lastRerouteTime.current = Date.now();
  showReroutingBanner();
  handleShowRoute();    
  setCurrentStepIndex(0);
  return;
}

      // 🔇 Avoid double-speaking
      if (
        currentStepIndex === prevIndexRef.current &&
        Date.now() - lastInstructionTime.current < 5000
      ) {
        return;
      }

      const STEP_REACHED_DISTANCE_THRESHOLD = 15; // tighten threshold (was 30)
const INSTRUCTION_COOLDOWN = 15000; // prevent rapid TTS

const hasRecentlySpoken = Date.now() - lastInstructionTime.current < INSTRUCTION_COOLDOWN;

if (
  distance < STEP_REACHED_DISTANCE_THRESHOLD &&
  !hasRecentlySpoken &&
  currentStepIndex !== prevIndexRef.current
) {
  const instruction = currentStep.html_instructions.replace(/<[^>]*>?/gm, '');
  Tts.speak(instruction);
  lastInstructionTime.current = Date.now();
  prevIndexRef.current = currentStepIndex;
  setCurrentStepIndex((prev) => prev + 1);
}

      if (currentStepIndex >= stepInstructions.length) {
        Tts.speak("You have reached your destination.");
        stopJourney();
        return;
      }
    }
  },
  (error) => {
    console.error('❌ Tracking error:', error.message);
    setErrorMsg('Location tracking failed: ' + error.message);
  },
  {
    enableHighAccuracy: true,
    distanceFilter: 15,
    interval: 3000,
    fastestInterval: 2000,
    forceRequestLocation: true,
    showLocationDialog: true,
  }
);

setWatchId(id);
    } catch (err) {
      console.error('🚨 Unexpected error:', err);
      setErrorMsg('Something went wrong while starting the journey.');
    }
  };

  const stopJourney = () => {
  Animated.timing(navBannerAnim, {
    toValue: 0,
    duration: 300,
    useNativeDriver: true,
  }).start();

  if (watchId !== null) {
    Geolocation.clearWatch(watchId);
    setWatchId(null);
  }

  // 🎯 Reset all route-related data
  setCurrentStepIndex(0);
  setIsJourneyStarted(false);
  setRouteCoords([]);
  setStepInstructions([]);
  setRouteSummary(null);
  setDestination(null); // Optional: reset destination if you want full clean state

  Tts.stop();

  cameraInitialized.current = false;
  prevUserCoords.current = null;
  prevIndexRef.current = -1;
  lastInstructionTime.current = 0;
  lastETAUpdateTime.current = 0;
};
const handleZoomIn = () => {
  const newZoom = Math.min(currentZoom + 1, 20);
  setCurrentZoom(newZoom);
  mapRef.current?.animateCamera({ zoom: newZoom }, { duration: 300 });
};

const handleZoomOut = () => {
  const newZoom = Math.max(currentZoom - 1, 5);
  setCurrentZoom(newZoom);
  mapRef.current?.animateCamera({ zoom: newZoom }, { duration: 300 });
};
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient colors={['#0a0f1c', '#1f2937', '#111827']} style={styles.container}>
        <StatusBar barStyle="light-content" />
    {isRerouting && (
  <Animated.View
    style={{
      position: 'absolute',
      top: 30,
      alignSelf: 'center',
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: '#333',
      borderRadius: 8,
      zIndex: 99999,
      opacity: rerouteAnim,
      transform: [{
        translateY: rerouteAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-20, 0],
        }),
      }],
    }}
  >
    <Text style={{ color: '#fff', fontWeight: 'bold' }}>🔁 Rerouting...</Text>
  </Animated.View>
)}
    {!isJourneyStarted && (
        <Animated.View style={[styles.searchWrapper, { transform: [{ translateY }] }]}>
          <GooglePlacesAutocomplete
            ref={searchRef}
            placeholder="Search destination"
            fetchDetails={true}
            onPress={(data, details = null) => {
              if (details) {
                const { lat, lng } = details.geometry.location;
                const region = {
                  latitude: lat,
                  longitude: lng,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                };
                setDestination(region);
                mapRef.current?.animateToRegion(region, 1000);
              }
            }}
            query={{ key: GOOGLE_MAPS_API_KEY, language: 'en' }}
            styles={{
              container: styles.autocompleteContainer,
              textInputContainer: styles.textInputContainer,
              textInput: styles.textInput,
              listView: styles.listView,
            }}
            textInputProps={{
  onChangeText: (text) => setSearchText(text),
  value: searchText,
}}
            renderLeftButton={() => (
              <TouchableOpacity onPress={handleManualSearch} style={styles.iconWrapper}>
                <Icon name="search" size={22} color="#555" />
              </TouchableOpacity>
            )}
            renderRightButton={() => {
  if (searchText) {
    return (
      <TouchableOpacity onPress={clearSearch} style={styles.iconWrapper}>
        <Icon name="close" size={22} color="#888" />
      </TouchableOpacity>
    );
  }
  return <View style={{ width: 22, height: 22 }} />; // 👈 Return an empty view when no input
}}
   
            enablePoweredByContainer={false}
          />
        </Animated.View>
    )}

        {/* ✅ Show navigation banner during journey only */}
        {isJourneyStarted && stepInstructions.length > 0 && (
          <Animated.View
  style={{
    opacity: navBannerAnim,
    transform: [
      {
        translateY: navBannerAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-80, 0], // slides in from above
        }),
      },
    ],
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 9999,
  }}
>
  <NavigationBanner
    instruction={stepInstructions[currentStepIndex]?.html_instructions.replace(/<[^>]*>?/gm, '')}
    directionType={getDirectionType(stepInstructions[currentStepIndex]?.html_instructions || '')}
    nextInstruction={
      stepInstructions[currentStepIndex + 1]?.html_instructions
        ? stepInstructions[currentStepIndex + 1].html_instructions.replace(/<[^>]*>?/gm, '')
        : undefined
    }
    nextDirectionType={
      stepInstructions[currentStepIndex + 1]?.html_instructions
        ? getDirectionType(stepInstructions[currentStepIndex + 1].html_instructions)
        : undefined
    }
  />
</Animated.View>
)}

        <View style={styles.mapWrapper}>
  <MapView
    ref={mapRef}
    style={styles.map}
    region={
      userRegion || {
        latitude: 20.5937, // fallback (India center)
        longitude: 78.9629,
        latitudeDelta: 10,
        longitudeDelta: 10,
      }
    }
    followsUserLocation={true}
    showsMyLocationButton={true}
    showsCompass={true}
    rotateEnabled={true}
    pitchEnabled={true}
    zoomEnabled={true}
  >
    {destination && (
      <Marker coordinate={destination} title="Destination" pinColor="blue" />
    )}

    {routeCoords.length > 0 && (
      <Polyline coordinates={routeCoords} strokeWidth={5} strokeColor="#00BFFF" />
    )}

    {userRegion && isJourneyStarted && (
  <AnimatedMarker
    coordinate={markerPosition as any}
    anchor={{ x: 0.5, y: 0.5 }}
    rotation={userHeading as any}
    flat={true}
    zIndex={1000}
  >
    <RNAnimated.View
  style={{
    transform: [
      {
        rotate: userHeading.interpolate({
          inputRange: [0, 360],
          outputRange: ['0deg', '360deg'],
        }),
      },
    ],
  }}
>
  <Icon name="navigation" size={30} color="#00ccff" />
</RNAnimated.View>
  </AnimatedMarker>
)}

{userRegion && !isJourneyStarted && (
  <Marker coordinate={userRegion}>
    <View style={{ alignItems: 'center' }}>
      <View
        style={{
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: '#00ccff',
          borderWidth: 2,
          borderColor: '#fff',
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: '#00ccff44',
        }}
      />
    </View>
  </Marker>
)}
  </MapView>

  {/* 📍 Center-to-user-location button */}
  <TouchableOpacity
    style={{
      position: 'absolute',
      bottom: 190,
      right: 20,
      backgroundColor: '#fff',
      padding: 10,
      borderRadius: 25,
      elevation: 5,
    }}
    onPress={() => {
  if (userRegion && mapRef.current) {
    mapRef.current.animateCamera(
      {
        center: userRegion,
        heading: (userHeading as any).__getValue?.() ?? 0,
        pitch: 60,
        zoom: currentZoom, // ✅ respect current zoom
      },
      { duration: 800 }
    );
  }
}}
  >
    <Icon name="my-location" size={24} color="#333" />
  </TouchableOpacity>
{isJourneyStarted && (
  <>
    <TouchableOpacity
      style={[styles.zoomButton, { bottom: 140 }]}
      onPress={handleZoomIn}
    >
      <Text style={styles.zoomText}>+</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={[styles.zoomButton, { bottom: 80 }]}
      onPress={handleZoomOut}
    >
      <Text style={styles.zoomText}>−</Text>
    </TouchableOpacity>
  </>
)}
          {destination && !isJourneyStarted && (
  <View style={styles.controlsWrapper}>
    <TouchableOpacity style={styles.buttonDirections} onPress={handleShowRoute}>
      <Text style={styles.buttonText}>DIRECTIONS</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.buttonStart} onPress={handleStartJourney}>
      <Text style={styles.buttonText}>START</Text>
    </TouchableOpacity>
  </View>
)}
     
        </View>
{routeSummary && (
  <View style={styles.summaryBox}>
    <Text style={styles.summaryText}>
      {routeSummary.duration} • {routeSummary.distance} • ETA: {routeSummary.eta}
    </Text>

    <TouchableOpacity onPress={handleClearRoute} style={styles.closeIconWrapper}>
      <Icon name="close" size={22} color="#fff" />
    </TouchableOpacity>
  </View>
)}

        <BottomNavBar />
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
};

const screenWidth = Dimensions.get('window').width;
const styles = StyleSheet.create({
  container: { flex: 1 },
  searchWrapper: {
    marginTop: height * 0.06,
    zIndex: 9999,
    elevation: 10,
    paddingHorizontal: 9,
  },
  autocompleteContainer: {
    zIndex: 9999,
    elevation: 8,
    width: width * 0.5,
    alignSelf: 'center',
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    height: 45,
    paddingLeft: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
  textInput: {
    flex: 1,
    height: 40,
    fontSize: 15,
    color: '#333',
  },
  closeIconWrapper: {
  position: 'absolute',
  right: 12,
  top: 10,
  padding: 3,
  backgroundColor: '#444',
  borderRadius: 20,
},
  listView: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginTop: 5,
    zIndex: 9999,
    elevation: 10,
    position: 'relative',
    maxHeight: 300,
  },
  mapWrapper: {
    height: height * 0.95,
    width: width * 1.05,
    alignSelf: 'center',
    borderRadius: 20,
    marginTop: height * -0.09,
    marginBottom: 9,
  },
  map: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1f2937',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#ccc',
  },
  errorBox: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: '#fee',
    padding: 8,
    borderRadius: 5,
  },
  errorText: {
    color: '#900',
    textAlign: 'center',
  },
  controlsWrapper: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
  },
  buttonDirections: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  buttonStart: {
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  navInstruction: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    backgroundColor: '#000000aa',
    padding: 10,
    borderRadius: 10,
    zIndex: 10000,
  },
  navText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  summaryBox: {
  position: 'absolute',
  bottom: 70,
  left: (screenWidth - 250) / 2,
  right: 20,
  width: 250,
  backgroundColor: '#1f2937',
  padding: 12,
  borderRadius: 10,
  alignItems: 'center',
  borderColor: '#00ccff',
  borderWidth: 1,
  zIndex: 10000,
},
summaryText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: '600',
},
zoomButton: {
  position: 'absolute',
  right: 20,
  backgroundColor: '#000',
  width: 42,
  height: 42,
  borderRadius: 8,
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 10000,
  elevation: 6,
},
zoomText: {
  color: '#fff',
  fontSize: 24,
  fontWeight: 'bold',
},
});

export default MapScreen;