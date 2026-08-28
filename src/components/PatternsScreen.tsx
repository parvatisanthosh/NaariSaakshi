import React, { useMemo } from 'react';
import { PieChart, TrendingUp, User, MapPin, AlertTriangle, ShieldCheck, ChevronRight, Info, CheckCircle2 } from 'lucide-react';
import { Incident } from '../types';
import { analyzeIncidentPatterns } from '../aiEngine';

interface PatternsScreenProps {
  incidents: Incident[];
  onSelectIncident: (incident: Incident) => void;
  onGenerateReport: () => void;
}

export const PatternsScreen: React.FC<PatternsScreenProps> = ({
  incidents,
  onSelectIncident,
  onGenerateReport
}) => {
  const analysis = useMemo(() => analyzeIncidentPatterns(incidents), [incidents]);

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

      {/* Cluster Groupings: By Location */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-charcoal-400 uppercase tracking-wider">Grouped by Location</h3>
        
        {analysis.clusters.filter(c => c.type === 'location').length === 0 ? (
          <div className="bg-charcoal-800/30 border border-charcoal-700/50 rounded-xl p-4 text-xs text-charcoal-400">
            No repeated location clusters detected yet.
          </div>
        ) : (
          analysis.clusters.filter(c => c.type === 'location').map((cluster, i) => (
            <div key={i} className="bg-charcoal-800/90 border border-charcoal-700 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-teal-400" />
                  <span className="font-semibold text-charcoal-100">{cluster.key}</span>
                </div>
                <span className="text-xs font-semibold text-teal-300 bg-teal-950 px-2 py-0.5 rounded-full border border-teal-800">
                  {cluster.count} Incidents
                </span>
              </div>
            </div>
          ))
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
