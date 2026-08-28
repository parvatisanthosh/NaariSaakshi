import React, { useState, useMemo } from 'react';
import { Calendar, MapPin, User, Tag, Plus, Search, AlertTriangle, ChevronRight, Paperclip, ShieldAlert, Filter } from 'lucide-react';
import { Incident, CategoryType } from '../types';
import { analyzeIncidentPatterns } from '../aiEngine';

interface TimelineScreenProps {
  incidents: Incident[];
  onSelectIncident: (incident: Incident) => void;
  onLogNew: () => void;
  onViewPatterns: () => void;
}

export const TimelineScreen: React.FC<TimelineScreenProps> = ({
  incidents,
  onSelectIncident,
  onLogNew,
  onViewPatterns
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Compute pattern alert for 2+ incidents involving same person/location
  const patternInsight = useMemo(() => {
    return analyzeIncidentPatterns(incidents);
  }, [incidents]);

  const topPatternCluster = patternInsight.clusters.find(c => c.count >= 2);

  // Filtered and Sorted Incidents (Reverse chronological - Newest first)
  const filteredIncidents = useMemo(() => {
    return incidents
      .filter(inc => {
        const matchesSearch =
          searchTerm === '' ||
          inc.narrative_structured.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inc.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inc.people_involved.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          inc.narrative_raw.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory =
          selectedCategory === 'All' || inc.category === selectedCategory;

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => new Date(b.incident_datetime).getTime() - new Date(a.incident_datetime).getTime());
  }, [incidents, searchTerm, selectedCategory]);

  const getCategoryColor = (cat: CategoryType) => {
    switch (cat) {
      case 'Physical':
        return 'bg-plum-950/80 text-plum-300 border-plum-700/60';
      case 'Quid-Pro-Quo':
        return 'bg-amber-950/80 text-amber-300 border-amber-700/60';
      case 'Digital':
        return 'bg-teal-950/80 text-teal-300 border-teal-700/60';
      case 'Stalking':
        return 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60';
      default:
        return 'bg-charcoal-800 text-charcoal-300 border-charcoal-700';
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28 space-y-6">
      
      {/* Pattern Warning Banner if 2+ incidents detected */}
      {topPatternCluster && (
        <div 
          onClick={onViewPatterns}
          className="bg-gradient-to-r from-plum-950/90 via-charcoal-800 to-teal-950/90 border border-plum-500/30 rounded-2xl p-4 shadow-lg cursor-pointer hover:border-plum-400/50 transition group"
        >
          <div className="flex items-start space-x-3">
            <div className="w-9 h-9 rounded-full bg-plum-900/80 border border-plum-400/40 flex items-center justify-center text-plum-300 shrink-0 mt-0.5 group-hover:scale-105 transition">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-plum-300 uppercase tracking-wider">Pattern Detected</span>
                <span className="text-[11px] text-teal-300 font-medium flex items-center space-x-1 group-hover:underline">
                  <span>View Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <p className="text-sm font-medium text-charcoal-100 mt-1">
                {topPatternCluster.count} incidents logged involving "{topPatternCluster.key}"
              </p>
              <p className="text-xs text-charcoal-300 mt-0.5">
                AI pattern analysis shows escalating frequency over the last month.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Prominent Log Incident Quick Banner */}
      <div className="flex items-center justify-between bg-charcoal-800/60 border border-charcoal-700/80 rounded-2xl p-4">
        <div>
          <h2 className="text-base font-semibold text-charcoal-100">Incident Timeline</h2>
          <p className="text-xs text-charcoal-400 mt-0.5">{incidents.length} secure record{incidents.length !== 1 ? 's' : ''} stored locally</p>
        </div>
        <button
          onClick={onLogNew}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-700 to-teal-600 hover:from-teal-600 hover:to-teal-500 text-white font-medium text-xs transition shadow-md shadow-teal-900/30 flex items-center space-x-1.5 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Log Incident</span>
        </button>
      </div>

      {/* Search and Category Filter Bar */}
      <div className="space-y-3">
        {/* Search Box */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-charcoal-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search notes, names, or locations..."
            className="w-full bg-charcoal-900 border border-charcoal-700 focus:border-teal-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-charcoal-100 placeholder-charcoal-500 focus:outline-none transition"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {['All', 'Verbal', 'Physical', 'Digital', 'Stalking', 'Quid-Pro-Quo'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition border ${
                selectedCategory === cat
                  ? 'bg-teal-700 text-white border-teal-500 shadow-sm'
                  : 'bg-charcoal-800/80 text-charcoal-400 border-charcoal-700 hover:text-charcoal-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Incident List Cards */}
      <div className="space-y-3">
        {filteredIncidents.length === 0 ? (
          <div className="text-center py-12 bg-charcoal-800/20 border border-dashed border-charcoal-700/60 rounded-2xl p-6">
            <p className="text-sm font-medium text-charcoal-300">No matching incidents found</p>
            <p className="text-xs text-charcoal-400 mt-1">Try adjusting your search terms or filter settings.</p>
          </div>
        ) : (
          filteredIncidents.map(incident => {
            const dateFormatted = new Date(incident.incident_datetime).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });
            const timeFormatted = new Date(incident.incident_datetime).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={incident.id}
                onClick={() => onSelectIncident(incident)}
                className="bg-charcoal-800/80 hover:bg-charcoal-800 border border-charcoal-700/80 hover:border-teal-500/40 rounded-2xl p-4 transition cursor-pointer shadow-sm group space-y-3"
              >
                {/* Header: Date/Time + Category Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs text-charcoal-400 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-teal-400" />
                    <span>{dateFormatted} at {timeFormatted}</span>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getCategoryColor(incident.category)}`}>
                    {incident.category}
                  </span>
                </div>

                {/* Summary */}
                <p className="text-sm font-medium text-charcoal-100 group-hover:text-teal-200 transition leading-snug">
                  {incident.narrative_structured.summary}
                </p>

                {/* Meta details: Person & Location */}
                <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-charcoal-300">
                  {incident.people_involved.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <User className="w-3.5 h-3.5 text-charcoal-400" />
                      <span className="font-medium">{incident.people_involved.map(p => p.name).join(', ')}</span>
                    </div>
                  )}

                  {incident.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-charcoal-400" />
                      <span>{incident.location}</span>
                    </div>
                  )}

                  {incident.attachments.length > 0 && (
                    <div className="flex items-center space-x-1 text-teal-400">
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>{incident.attachments.length} attachment</span>
                    </div>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
