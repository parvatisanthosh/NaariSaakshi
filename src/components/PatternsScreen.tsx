import React, { useMemo, useState, useEffect } from 'react';
import { PieChart, TrendingUp, User, MapPin, AlertTriangle, ShieldCheck, ChevronRight, Info, CheckCircle2, Globe } from 'lucide-react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Incident } from '../types';
import { analyzeIncidentPatterns } from '../aiEngine';
import { fetchNearbyCommunitySignals, CommunitySignalCell } from '../firebaseService';

interface PatternsScreenProps {
  incidents: Incident[];
  onSelectIncident: (incident: Incident) => void;
  onGenerateReport: () => void;
}

const createCustomPinIcon = (count: number) => {
  let size = 28;
  let bgColor = '#0f766e'; // teal-700
  let borderColor = '#2dd4bf'; // teal-400
  let fontSize = '11px';

  if (count === 2) {
    size = 34;
    bgColor = '#b45309'; // amber-700
    borderColor = '#f59e0b'; // amber-500
    fontSize = '12px';
  } else if (count >= 3) {
    size = 40;
    bgColor = '#9f1239'; // rose-800
    borderColor = '#f43f5e'; // rose-500
    fontSize = '13px';
  }

  return L.divIcon({
    className: 'custom-map-pin',
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background-color: ${bgColor};
      border: 2px solid ${borderColor};
      border-radius: 50%;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: ${fontSize};
      box-shadow: 0 4px 12px rgba(0,0,0,0.6);
      font-family: system-ui, -apple-system, sans-serif;
    ">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};

export const PatternsScreen: React.FC<PatternsScreenProps> = ({
  incidents,
  onSelectIncident,
  onGenerateReport
}) => {
  const analysis = useMemo(() => analyzeIncidentPatterns(incidents), [incidents]);

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

  const [communitySignals, setCommunitySignals] = useState<CommunitySignalCell[]>([]);

  const userLocations = useMemo(() => {
    return locationGroups.map(g => ({ lat: g.lat, lng: g.lng }));
  }, [locationGroups]);

  useEffect(() => {
    if (userLocations.length > 0) {
      fetchNearbyCommunitySignals(userLocations).then(signals => {
        setCommunitySignals(signals);
      });
    }
  }, [userLocations]);

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'High':
      case 'Elevated':
        return 'bg-plum-950 text-plum-300 border-plum-500/50';
      case 'Moderate':
        return 'bg-amber-950 text-amber-300 border-amber-500/50';
      default:
        return 'bg-teal-950 text-teal-300 border-teal-500/50';
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28 space-y-6">
      
      {/* Title & Purpose Header */}
      <div className="bg-charcoal-800/80 border border-charcoal-700/80 rounded-2xl p-5 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-teal-400 font-semibold text-xs uppercase tracking-wider">
            <PieChart className="w-4 h-4" />
            <span>AI Pattern Detection & Insights</span>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getRiskBadgeColor(analysis.overallRiskLevel)}`}>
            {analysis.overallRiskLevel} Risk Pattern
          </span>
        </div>

        <h2 className="text-lg font-semibold text-charcoal-100">{analysis.headline}</h2>
        
        <p className="text-xs text-charcoal-300 leading-relaxed pt-1 border-t border-charcoal-700/50">
          "This view exists to help you see connections and frequency trends across time that you might be too close to notice day-to-day."
        </p>
      </div>

      {/* Narrative AI Analysis Card */}
      <div className="bg-charcoal-800/50 border border-charcoal-700/60 rounded-2xl p-5 space-y-3">
        <h3 className="text-xs font-semibold text-charcoal-200 uppercase tracking-wider flex items-center space-x-1.5">
          <Info className="w-4 h-4 text-teal-400" />
          <span>Pattern Synthesis</span>
        </h3>
        <p className="text-xs text-charcoal-200 leading-relaxed">
          {analysis.detailedAnalysis}
        </p>
      </div>

      {/* Cluster Groupings: By Person */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-charcoal-400 uppercase tracking-wider">Grouped by Person Involved</h3>
        
        {analysis.clusters.filter(c => c.type === 'person').length === 0 ? (
          <div className="bg-charcoal-800/30 border border-charcoal-700/50 rounded-xl p-4 text-xs text-charcoal-400">
            No repeated individuals detected across multiple entries yet.
          </div>
        ) : (
          analysis.clusters.filter(c => c.type === 'person').map((cluster, i) => (
            <div key={i} className="bg-charcoal-800/90 border border-charcoal-700 rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-plum-950 border border-plum-500/40 flex items-center justify-center text-plum-300 font-bold text-xs">
                    {cluster.count}x
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-charcoal-100">{cluster.key}</h4>
                    <span className="text-[11px] text-charcoal-400">
                      Active: {new Date(cluster.firstSeen).toLocaleDateString()} – {new Date(cluster.lastSeen).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-mono px-2 py-1 rounded bg-plum-900/60 text-plum-300 border border-plum-700/50">
                  Escalation Score: {cluster.escalationScore}/10
                </span>
              </div>

              <p className="text-xs text-charcoal-300 leading-relaxed bg-charcoal-900/50 p-2.5 rounded-xl border border-charcoal-700/40">
                {cluster.description}
              </p>

              {/* Related Incident Cards */}
              <div className="space-y-2 pt-1">
                {cluster.incidents.map(inc => (
                  <div
                    key={inc.id}
                    onClick={() => onSelectIncident(inc)}
                    className="flex items-center justify-between bg-charcoal-900/80 hover:bg-charcoal-900 p-2.5 rounded-xl border border-charcoal-700/60 cursor-pointer text-xs text-charcoal-200 transition group"
                  >
                    <div className="truncate pr-2">
                      <span className="text-teal-400 font-medium mr-2">[{inc.category}]</span>
                      <span className="truncate">{inc.narrative_structured.summary}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-charcoal-400 group-hover:text-teal-300 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Location Hotspots Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-charcoal-400 uppercase tracking-wider flex items-center space-x-1.5">
            <MapPin className="w-4 h-4 text-teal-400" />
            <span>Location Hotspots</span>
          </h3>
          {locationGroups.length > 0 && (
            <span className="text-[11px] text-teal-300 bg-teal-950 px-2.5 py-0.5 rounded-full border border-teal-800 font-medium">
              {locationGroups.length} Hotspot Location{locationGroups.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        {locationGroups.length === 0 ? (
          <div className="bg-charcoal-800/40 border border-charcoal-700/60 rounded-2xl p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-charcoal-700/60 border border-charcoal-600 flex items-center justify-center text-charcoal-400 mx-auto">
              <MapPin className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-charcoal-200">No Location Coordinates Recorded</h4>
            <p className="text-xs text-charcoal-400 max-w-md mx-auto leading-relaxed">
              Location patterns will appear here once you add location data to your entries.
            </p>
          </div>
        ) : (
          <div className="bg-charcoal-800/80 border border-charcoal-700 rounded-2xl p-3 space-y-2 shadow-lg">
            <div className="h-72 w-full rounded-xl overflow-hidden relative border border-charcoal-700/80">
              <MapContainer
                center={[locationGroups[0].lat, locationGroups[0].lng]}
                zoom={14}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {/* Community Signal Layer (Anonymous, Aggregated) */}
                {communitySignals.map((signal, sIdx) => (
                  <Circle
                    key={`signal-${sIdx}`}
                    center={[signal.lat, signal.lng]}
                    radius={120 + Math.min(signal.count * 30, 200)}
                    pathOptions={{
                      color: '#06b6d4',
                      fillColor: '#0891b2',
                      fillOpacity: 0.25,
                      weight: 2,
                      dashArray: '4, 4'
                    }}
                  >
                    <Popup>
                      <div className="space-y-2 text-xs max-w-xs">
                        <div className="border-b border-charcoal-700 pb-1 flex items-center justify-between">
                          <span className="font-bold text-cyan-300 text-xs flex items-center space-x-1">
                            <Globe className="w-3.5 h-3.5 text-cyan-400 inline mr-1" />
                            <span>Community Signal (Anonymous)</span>
                          </span>
                        </div>
                        <p className="text-charcoal-200 font-semibold">
                          {signal.count} anonymous report{signal.count > 1 ? 's' : ''} in this grid area (~100m)
                        </p>
                        <div className="bg-charcoal-900/90 p-2 rounded-lg border border-charcoal-700 space-y-1 text-[11px]">
                          <span className="font-medium text-charcoal-400 block uppercase text-[10px]">
                            Category Breakdown:
                          </span>
                          <div className="grid grid-cols-2 gap-1 text-charcoal-300 text-[10px]">
                            {signal.categoryBreakdown.verbal > 0 && <span>• Verbal: {signal.categoryBreakdown.verbal}</span>}
                            {signal.categoryBreakdown.physical > 0 && <span>• Physical: {signal.categoryBreakdown.physical}</span>}
                            {signal.categoryBreakdown.digital > 0 && <span>• Digital: {signal.categoryBreakdown.digital}</span>}
                            {signal.categoryBreakdown.stalking > 0 && <span>• Stalking: {signal.categoryBreakdown.stalking}</span>}
                            {signal.categoryBreakdown.quid_pro_quo > 0 && <span>• Quid Pro Quo: {signal.categoryBreakdown.quid_pro_quo}</span>}
                            {signal.categoryBreakdown.other > 0 && <span>• Other: {signal.categoryBreakdown.other}</span>}
                          </div>
                        </div>
                        <p className="text-[10px] text-charcoal-400 italic border-t border-charcoal-700/50 pt-1 leading-snug">
                          No names or details are ever stored or accessible.
                        </p>
                      </div>
                    </Popup>
                  </Circle>
                ))}

                {locationGroups.map((group, idx) => (
                  <Marker
                    key={idx}
                    position={[group.lat, group.lng]}
                    icon={createCustomPinIcon(group.incidents.length)}
                  >
                    <Popup>
                      <div className="space-y-2 text-xs max-w-xs">
                        <div className="border-b border-charcoal-700 pb-1.5 flex items-center justify-between gap-2">
                          <span className="font-bold text-teal-300 text-xs truncate">
                            📍 {group.locationName || 'Saved Location'}
                          </span>
                          <span className="text-[10px] bg-teal-950 px-1.5 py-0.5 rounded text-teal-300 border border-teal-800 shrink-0 font-semibold">
                            {group.incidents.length} incident{group.incidents.length > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                          {group.incidents.map((inc) => (
                            <div
                              key={inc.id}
                              onClick={() => onSelectIncident(inc)}
                              className="p-2 bg-charcoal-800 hover:bg-charcoal-700 rounded-lg border border-charcoal-700/60 cursor-pointer transition text-[11px] group"
                            >
                              <div className="flex items-center justify-between text-charcoal-400 text-[10px] mb-0.5">
                                <span>{new Date(inc.incident_datetime).toLocaleDateString()}</span>
                                <span className="text-teal-400 font-semibold">[{inc.category}]</span>
                              </div>
                              <p className="text-charcoal-100 font-medium line-clamp-2">
                                {inc.narrative_structured.summary}
                              </p>
                              <div className="flex items-center space-x-1 text-teal-400 text-[10px] mt-1 group-hover:text-teal-300 font-medium">
                                <span>Open incident detail</span>
                                <ChevronRight className="w-3 h-3" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-charcoal-300 pt-2 border-t border-charcoal-700/50">
              <div className="flex items-center space-x-1.5">
                <div className="w-3 h-3 rounded-full bg-teal-600 border border-teal-400"></div>
                <span>Your Personal Incident Pins</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-3 h-3 rounded-full bg-cyan-600/40 border border-cyan-400 border-dashed"></div>
                <span>Community signal (anonymous, aggregated)</span>
              </div>
            </div>

            <p className="text-[11px] text-charcoal-400 text-center leading-relaxed">
              This shows how many people have anonymously reported something nearby — never who, never what happened. It's a safety signal, not a search tool.
            </p>
          </div>
        )}
      </div>

      {/* Recommended Next Actions */}
      <div className="bg-gradient-to-r from-teal-950/60 to-charcoal-800 border border-teal-500/30 rounded-2xl p-5 space-y-3 shadow-md">
        <h3 className="text-xs font-semibold text-teal-300 uppercase tracking-wider flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4" />
          <span>Recommended Next Steps</span>
        </h3>
        <ul className="space-y-2 text-xs text-charcoal-200">
          {analysis.suggestedActions.map((action, i) => (
            <li key={i} className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <span>{action}</span>
            </li>
          ))}
        </ul>

        <div className="pt-2">
          <button
            onClick={onGenerateReport}
            className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs transition shadow-md flex items-center justify-center space-x-1.5"
          >
            <span>Generate Complaint Report Now</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};
