import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { PieChart, TrendingUp, User, MapPin, AlertTriangle, ShieldCheck, ChevronRight, Info, CheckCircle2, Globe, FileText, ArrowRight, Shield, ArrowLeft, Crosshair, LocateFixed } from 'lucide-react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { Incident } from '../types';
import { analyzeIncidentPatterns } from '../aiEngine';
import { COMMUNITY_SIGNALS_ENABLED, fetchNearbyCommunitySignals, CommunitySignalCell } from '../firebaseService';

interface PatternsScreenProps {
  incidents: Incident[];
  onSelectIncident: (incident: Incident) => void;
  onGenerateReport: () => void;
  onBack?: () => void;
}

// Map Controller for Smooth Flying / Recentering
const MapRecenterController: React.FC<{ center: [number, number]; zoom?: number }> = ({ center, zoom = 14 }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { animate: true, duration: 1.2 });
  }, [center, zoom, map]);
  return null;
};

// Pulsing Blue Marker for User's Live Current Location ("You Are Here")
const createUserLocationIcon = () => {
  return L.divIcon({
    className: 'custom-user-location-pin',
    html: `<div style="
      position: relative;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        position: absolute;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background-color: rgba(56, 189, 248, 0.35);
        animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
      "></div>
      <div style="
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background-color: #38BDF8;
        border: 3px solid #FFFFFF;
        box-shadow: 0 0 14px rgba(56, 189, 248, 0.9);
      "></div>
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 11],
    popupAnchor: [0, -12]
  });
};

const createCustomPinIcon = (count: number) => {
  let size = 32;
  let bgColor = '#E8368F'; // magenta
  let borderColor = '#B81F6B';

  if (count === 2) {
    size = 38;
    bgColor = '#7C5CFF'; // violet
    borderColor = '#5B3BE0';
  } else if (count >= 3) {
    size = 44;
    bgColor = '#E8368F'; // magenta
    borderColor = '#1A1410';
  }

  return L.divIcon({
    className: 'custom-map-pin',
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background-color: ${bgColor};
      border: 3px solid ${borderColor};
      border-radius: 50%;
      color: #0D0B10;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 13px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.3);
      font-family: 'Bebas Neue', system-ui, sans-serif;
    ">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};

export const PatternsScreen: React.FC<PatternsScreenProps> = ({
  incidents,
  onSelectIncident,
  onGenerateReport,
  onBack
}) => {
  const analysis = useMemo(() => analyzeIncidentPatterns(incidents), [incidents]);

  // Live User Location State
  const [userCurrentLocation, setUserCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);

  const requestUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationDenied(true);
      return;
    }
    setIsLocatingUser(true);
    setLocationDenied(false);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCurrentLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setIsLocatingUser(false);
      },
      (err) => {
        console.warn('Live location detection error:', err);
        setIsLocatingUser(false);
        setLocationDenied(true);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    requestUserLocation();
  }, [requestUserLocation]);

  const locationGroups = useMemo(() => {
    const groups: { [key: string]: { lat: number; lng: number; incidents: Incident[]; locationName: string } } = {};
    
    incidents.forEach(inc => {
      if (typeof inc.latitude === 'number' && typeof inc.longitude === 'number' && !isNaN(inc.latitude) && !isNaN(inc.longitude)) {
        const key = `${inc.latitude.toFixed(4)},${inc.longitude.toFixed(4)}`;
        if (!groups[key]) {
          groups[key] = {
            lat: inc.latitude,
            lng: inc.longitude,
            incidents: [],
            locationName: inc.location
          };
        }
        groups[key].incidents.push(inc);
      }
    });

    return Object.values(groups);
  }, [incidents]);

  // Average / Centroid of incidents as fallback
  const incidentCentroid = useMemo(() => {
    if (locationGroups.length === 0) return null;
    const sumLat = locationGroups.reduce((acc, g) => acc + g.lat, 0);
    const sumLng = locationGroups.reduce((acc, g) => acc + g.lng, 0);
    return [sumLat / locationGroups.length, sumLng / locationGroups.length] as [number, number];
  }, [locationGroups]);

  // Final map center logic: Live User Location -> Incident Centroid -> null
  const mapCenter = useMemo<[number, number] | null>(() => {
    if (userCurrentLocation) {
      return [userCurrentLocation.lat, userCurrentLocation.lng];
    }
    if (incidentCentroid) {
      return incidentCentroid;
    }
    return null;
  }, [userCurrentLocation, incidentCentroid]);

  const [communitySignals, setCommunitySignals] = useState<CommunitySignalCell[]>([]);

  const userLocations = useMemo(() => {
    const locs = locationGroups.map(g => ({ lat: g.lat, lng: g.lng }));
    if (userCurrentLocation) {
      locs.push(userCurrentLocation);
    }
    return locs;
  }, [locationGroups, userCurrentLocation]);

  useEffect(() => {
    if (userLocations.length > 0) {
      fetchNearbyCommunitySignals(userLocations).then(signals => {
        setCommunitySignals(signals);
      });
    }
  }, [userLocations]);

  return (
    <div className="w-full space-y-10 pb-28 relative">
      
      {/* Top Back Navigation Button */}
      {onBack && (
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-magenta hover:text-magenta-deep transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Timeline</span>
          </button>
        </div>
      )}

      {/* SECTION 1: HERO TITLE BANNER (High Contrast Theme Aware) */}
      <section className="rounded-3xl bg-bg-black border border-white/10 p-8 sm:p-14 shadow-2xl relative z-10 w-full space-y-6 film-grain">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-magenta text-bg-black font-bold flex items-center justify-center shadow-lg">
              <PieChart className="w-6 h-6 text-bg-black" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold tracking-widest text-magenta uppercase block">PATTERN SUMMARY</span>
              <h1 className="font-display text-4xl sm:text-6xl tracking-wide text-text-light leading-none">
                PATTERN DETECTION & INSIGHTS
              </h1>
            </div>
          </div>

          <span className="px-5 py-2 rounded-full font-display text-base font-bold tracking-wider bg-magenta text-bg-black shadow-md shrink-0 uppercase">
            {analysis.overallRiskLevel} Risk Pattern
          </span>
        </div>

        <div className="space-y-3 max-w-4xl">
          <h2 className="font-display text-3xl sm:text-5xl text-text-light tracking-wide leading-tight">
            {analysis.headline}
          </h2>
          <p className="text-sm sm:text-base text-text-muted leading-relaxed font-medium">
            "This view exists to help you see connections and frequency trends across time that you might be too close to notice day-to-day."
          </p>
        </div>
      </section>

      {/* SECTION 2: PATTERN SYNTHESIS CARD */}
      <section className="rounded-3xl bg-bg-black text-text-light p-8 sm:p-10 shadow-xl border border-white/10 space-y-4 relative z-10 w-full film-grain">
        <div className="flex items-center space-x-2 text-magenta">
          <Info className="w-5 h-5 text-magenta" />
          <h3 className="font-display text-2xl tracking-wider text-text-light uppercase">PATTERN SYNTHESIS</h3>
        </div>
        <p className="text-sm sm:text-base text-text-light/90 leading-relaxed font-medium">
          {analysis.detailedAnalysis}
        </p>
      </section>

      {/* SECTION 3: CLUSTER GROUPINGS BY PERSON */}
      <section className="space-y-6 relative z-10 w-full">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-3xl tracking-wider text-text-light uppercase">GROUPED BY PERSON INVOLVED</h3>
          <span className="text-xs font-mono font-bold text-text-muted uppercase">EVIDENCE CLUSTERS</span>
        </div>
        
        {analysis.clusters.filter(c => c.type === 'person').length === 0 ? (
          <div className="rounded-3xl bg-bg-black p-8 text-sm text-text-muted font-medium border border-white/10 text-center">
            No repeated individuals detected across multiple entries yet.
          </div>
        ) : (
          analysis.clusters.filter(c => c.type === 'person').map((cluster, i) => (
            <div key={i} className="rounded-3xl bg-bg-black p-6 sm:p-8 space-y-6 shadow-xl border border-white/10 transition-all duration-300 hover:shadow-2xl">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-magenta text-bg-black font-display font-bold text-2xl flex items-center justify-center shadow-md shrink-0">
                    {cluster.count}x
                  </div>
                  <div>
                    <h4 className="font-display text-3xl text-text-light tracking-wide">{cluster.key}</h4>
                    <span className="text-xs font-mono font-bold text-text-muted">
                      ACTIVE RANGE: {new Date(cluster.firstSeen).toLocaleDateString()} – {new Date(cluster.lastSeen).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <span className="px-4 py-1.5 rounded-full font-display text-sm font-bold bg-white/10 text-magenta border border-magenta/40 shadow-sm shrink-0">
                  ESCALATION SCORE: {cluster.escalationScore}/10
                </span>
              </div>

              <p className="text-sm text-text-light/90 leading-relaxed font-medium bg-white/5 p-5 rounded-2xl border border-white/10">
                {cluster.description}
              </p>

              {/* Related Incident Cards */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-mono font-bold text-text-muted uppercase block">CONNECTED INCIDENT LOGS:</span>
                {cluster.incidents.map(inc => (
                  <div
                    key={inc.id}
                    onClick={() => onSelectIncident(inc)}
                    className="flex items-center justify-between bg-white/5 hover:bg-magenta hover:text-bg-black p-4 rounded-2xl border border-white/10 cursor-pointer text-sm font-medium transition-all duration-300 group shadow-sm"
                  >
                    <div className="truncate pr-3 flex items-center space-x-3">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-magenta border border-magenta/40 group-hover:bg-bg-black group-hover:text-magenta transition-colors">
                        {inc.category}
                      </span>
                      <span className="truncate text-text-light group-hover:text-bg-black font-semibold">
                        {inc.narrative_structured.summary}
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-bg-black shrink-0 transition-transform group-hover:translate-x-1" />
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      {/* SECTION 4: LOCATION HOTSPOTS MAP */}
      <section className="space-y-6 relative z-10 w-full">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-3xl tracking-wider text-text-light uppercase flex items-center space-x-2">
            <MapPin className="w-6 h-6 text-magenta" />
            <span>LOCATION HOTSPOTS & COMMUNITY SIGNALS</span>
          </h3>
          {locationGroups.length > 0 && (
            <span className="font-display text-lg font-bold text-bg-black bg-magenta px-4 py-1 rounded-full shadow-md">
              {locationGroups.length} HOTSPOT LOCATION{locationGroups.length > 1 ? 'S' : ''}
            </span>
          )}
        </div>
        
        {!mapCenter ? (
          <div className="rounded-3xl bg-bg-black p-10 text-center space-y-4 border border-white/10 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-white/10 text-magenta flex items-center justify-center mx-auto shadow-md">
              <MapPin className="w-6 h-6 text-magenta" />
            </div>
            <div className="space-y-2">
              <h4 className="font-display text-2xl text-text-light uppercase tracking-wide">LOCATION MAP OFFLINE</h4>
              <p className="text-xs sm:text-sm text-text-muted max-w-md mx-auto leading-relaxed">
                Enable location access to see your area on the map, or log an incident with location enabled to get started.
              </p>
            </div>
            <button
              onClick={requestUserLocation}
              disabled={isLocatingUser}
              className="px-6 py-3 rounded-full bg-magenta hover:bg-magenta-deep text-bg-black font-display font-bold text-sm tracking-wider uppercase shadow-lg transition active:scale-95 flex items-center justify-center space-x-2 mx-auto disabled:opacity-50"
            >
              <LocateFixed className="w-4 h-4" />
              <span>{isLocatingUser ? 'DETECTING LOCATION...' : 'ENABLE LOCATION ACCESS'}</span>
            </button>
          </div>
        ) : (
          <div className="rounded-3xl bg-bg-black p-4 space-y-4 shadow-xl border border-white/10">
            <div className="h-96 w-full rounded-2xl overflow-hidden relative border border-white/10 shadow-inner">
              
              {/* Floating Recenter Control Button */}
              <button
                onClick={requestUserLocation}
                title="Recenter on my location"
                disabled={isLocatingUser}
                className="absolute top-4 right-4 z-[400] p-3 rounded-2xl bg-bg-black/90 hover:bg-magenta text-magenta hover:text-bg-black border border-white/20 shadow-2xl transition-all duration-300 active:scale-95 group"
              >
                <LocateFixed className={`w-5 h-5 ${isLocatingUser ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`} />
              </button>

              <MapContainer
                center={mapCenter}
                zoom={14}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
              >
                <MapRecenterController center={mapCenter} zoom={14} />

                {/* High-Contrast OpenStreetMap Tile Layer (No API Key Required) */}
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  className="map-tiles-dark"
                />

                {/* User's Live Current Location Marker ("You Are Here") */}
                {userCurrentLocation && (
                  <Marker
                    position={[userCurrentLocation.lat, userCurrentLocation.lng]}
                    icon={createUserLocationIcon()}
                  >
                    <Popup>
                      <div className="p-1 text-xs font-sans text-text-light font-bold">
                        📍 You are here (Current Live Location)
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Community Signal Layer (Anonymous, Aggregated Grid Cells) */}
                {communitySignals.map((signal, sIdx) => (
                  <Circle
                    key={`signal-${sIdx}`}
                    center={[signal.lat, signal.lng]}
                    radius={120 + Math.min(signal.count * 30, 200)}
                    pathOptions={{
                      color: '#E8368F',
                      fillColor: '#E8368F',
                      fillOpacity: 0.25,
                      weight: 2,
                      dashArray: '4, 4'
                    }}
                  >
                    <Popup>
                      <div className="space-y-2 text-xs max-w-xs font-sans">
                        <div className="border-b border-black/10 pb-1 flex items-center justify-between">
                          <span className="font-bold text-magenta text-xs flex items-center space-x-1">
                            <Globe className="w-3.5 h-3.5 text-magenta inline mr-1" />
                            <span>Community Signal</span>
                          </span>
                        </div>
                        <p className="text-text-light font-semibold">
                          {signal.count} report{signal.count > 1 ? 's' : ''} in this area
                        </p>
                      </div>
                    </Popup>
                  </Circle>
                ))}

                {/* Personal Incident Pins */}
                {locationGroups.map((group, idx) => (
                  <Marker
                    key={idx}
                    position={[group.lat, group.lng]}
                    icon={createCustomPinIcon(group.incidents.length)}
                  >
                    <Popup>
                      <div className="space-y-2 text-xs max-w-xs font-sans">
                        <div className="border-b border-black/10 pb-1.5 flex items-center justify-between gap-2">
                          <span className="font-bold text-text-light text-xs truncate">
                            📍 {group.locationName || 'Saved Location'}
                          </span>
                          <span className="text-[10px] bg-magenta px-2 py-0.5 rounded-full text-bg-black font-bold shrink-0">
                            {group.incidents.length} incident{group.incidents.length > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                          {group.incidents.map((inc) => (
                            <div
                              key={inc.id}
                              onClick={() => onSelectIncident(inc)}
                              className="p-2 bg-white/10 hover:bg-magenta hover:text-bg-black rounded-lg border border-black/10 cursor-pointer transition text-[11px] group"
                            >
                              <div className="flex items-center justify-between text-text-muted text-[10px] mb-0.5">
                                <span>{new Date(inc.incident_datetime).toLocaleDateString()}</span>
                                <span className="text-magenta group-hover:text-bg-black font-semibold">[{inc.category}]</span>
                              </div>
                              <p className="text-text-light group-hover:text-bg-black font-semibold line-clamp-2">
                                {inc.narrative_structured.summary}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-text-muted font-medium pt-2 border-t border-white/10">
              <div className="flex items-center space-x-2">
                <div className="w-3.5 h-3.5 rounded-full bg-[#38BDF8] border-2 border-white shadow-sm"></div>
                <span>Your Current Location (Live)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3.5 h-3.5 rounded-full bg-magenta border border-magenta-deep shadow-sm"></div>
                <span>Your Personal Incident Pins</span>
              </div>
              {COMMUNITY_SIGNALS_ENABLED && (
                <div className="flex items-center space-x-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-magenta/30 border border-magenta border-dashed"></div>
                  <span>Community Signal (Aggregated)</span>
                </div>
              )}
            </div>

            <p className="text-xs text-text-muted text-center leading-relaxed font-medium">
              Your current location is shown only to you, on your device. It is saved with an entry only if you choose to add it, and it is never shared. Shared community signals are paused pending a privacy review.
            </p>
          </div>
        )}
      </section>

      {/* SECTION 5: RECOMMENDED NEXT ACTIONS */}
      <section className="rounded-3xl bg-bg-black text-text-light p-8 sm:p-12 space-y-6 shadow-2xl border border-white/10 relative z-10 w-full film-grain">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-magenta text-bg-black flex items-center justify-center shadow-md">
            <ShieldCheck className="w-6 h-6 text-bg-black" />
          </div>
          <h3 className="font-display text-3xl tracking-wide text-text-light uppercase">RECOMMENDED ACTION STEPS</h3>
        </div>

        <ul className="space-y-3 text-sm sm:text-base font-semibold text-text-light">
          {analysis.suggestedActions.map((action, i) => (
            <li key={i} className="flex items-start space-x-3 bg-white/5 p-4 rounded-2xl border border-white/10 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-magenta shrink-0 mt-0.5" />
              <span className="text-text-light">{action}</span>
            </li>
          ))}
        </ul>

        <div className="pt-4">
          <button
            onClick={onGenerateReport}
            className="w-full py-5 rounded-full bg-magenta hover:bg-magenta-deep text-bg-black font-display font-bold text-xl tracking-wider transition-all duration-300 shadow-xl shadow-magenta/30 hover:scale-[1.01] flex items-center justify-center space-x-2"
          >
            <span>GENERATE COMPLAINT REPORT NOW</span>
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </section>

    </div>
  );
};