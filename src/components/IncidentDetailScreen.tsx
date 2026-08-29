import React, { useState, useRef } from 'react';
import { ArrowLeft, Calendar, MapPin, User, Users, Tag, Trash2, Edit3, Save, X, Paperclip, AlertOctagon, Check, Mic, Camera, Plus, Clock } from 'lucide-react';
import { CategoryType, Incident, Attachment } from '../types';
import { StorageService } from '../storageService';
import { CameraCaptureModal } from './CameraCaptureModal';
import { calculatePoshDeadline } from '../poshDeadlineHelper';

interface IncidentDetailScreenProps {
  incident: Incident;
  allIncidents?: Incident[];
  onUpdate: (updated: Incident) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

export const IncidentDetailScreen: React.FC<IncidentDetailScreenProps> = ({
  incident,
  onUpdate,
  onDelete,
  onBack
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Attachments State
  const [attachmentsList, setAttachmentsList] = useState<Attachment[]>(incident.attachments || []);

  // Edit State
  const [datetime, setDatetime] = useState(() => {
    try {
      return new Date(incident.incident_datetime).toISOString().slice(0, 16);
    } catch {
      return new Date().toISOString().slice(0, 16);
    }
  });
  const [location, setLocation] = useState(incident.location);
  const [category, setCategory] = useState<CategoryType>(incident.category);
  const [personName, setPersonName] = useState(incident.people_involved[0]?.name || '');
  const [personRole, setPersonRole] = useState(incident.people_involved[0]?.roleOrRelationship || '');
  const [summary, setSummary] = useState(incident.narrative_structured.summary);
  const [keyActionsText, setKeyActionsText] = useState(
    incident.narrative_structured.keyActions.join('\n')
  );
  const [witnessesText, setWitnessesText] = useState(incident.witnesses.join(', '));
  const [rawNotes, setRawNotes] = useState(incident.narrative_raw);
  const [severity, setSeverity] = useState<number>(incident.severity || 3);

  const poshInfo = calculatePoshDeadline(incident);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const newAtt: Attachment = {
        id: 'att-' + Math.random().toString(36).substr(2, 6),
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'document',
        dataUrl: reader.result as string,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        captureMethod: 'upload'
      };

      const updatedAtts = [...attachmentsList, newAtt];
      setAttachmentsList(updatedAtts);

      const updatedIncident = { ...incident, attachments: updatedAtts };
      await StorageService.updateIncident(updatedIncident);
      onUpdate(updatedIncident);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraPhotoCaptured = async (newAtt: Attachment) => {
    const updatedAtts = [...attachmentsList, newAtt];
    setAttachmentsList(updatedAtts);

    const updatedIncident = { ...incident, attachments: updatedAtts };
    await StorageService.updateIncident(updatedIncident);
    onUpdate(updatedIncident);
  };

  const handleRemoveAttachment = async (attId: string) => {
    const updatedAtts = attachmentsList.filter(a => a.id !== attId);
    setAttachmentsList(updatedAtts);

    const updatedIncident = { ...incident, attachments: updatedAtts };
    await StorageService.updateIncident(updatedIncident);
    onUpdate(updatedIncident);
  };

  const handleSave = () => {
    const updated: Incident = {
      ...incident,
      incident_datetime: new Date(datetime).toISOString(),
      location,
      category,
      people_involved: personName ? [{
        id: incident.people_involved[0]?.id || 'p-1',
        name: personName,
        roleOrRelationship: personRole || 'Unspecified'
      }] : [],
      narrative_raw: rawNotes,
      narrative_structured: {
        ...incident.narrative_structured,
        summary,
        keyActions: keyActionsText.split('\n').filter(s => s.trim().length > 0)
      },
      witnesses: witnessesText ? witnessesText.split(',').map(w => w.trim()).filter(Boolean) : [],
      severity,
      attachments: attachmentsList,
      user_edited: true
    };

    onUpdate(updated);
    setIsEditing(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-28 space-y-6">
      
      {showCameraModal && (
        <CameraCaptureModal
          isOpen={showCameraModal}
          locationText={incident.location}
          onCapture={handleCameraPhotoCaptured}
          onClose={() => setShowCameraModal(false)}
          onFallbackToUpload={() => {
            setShowCameraModal(false);
            fileInputRef.current?.click();
          }}
        />
      )}

      {/* Top Header Controls */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-xs font-semibold text-text-muted hover:text-text-light transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Timeline</span>
        </button>

        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs font-semibold text-magenta border border-magenta/40 transition flex items-center space-x-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Entry</span>
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-1.5 rounded-full bg-white/5 hover:bg-magenta/20 text-xs font-semibold text-magenta border border-white/10 transition flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs font-semibold text-text-muted border border-white/10 transition"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      {/* Main Card View / Edit */}
      <div className="bg-bg-black border border-white/10 rounded-2xl p-6 space-y-6 shadow-md film-grain">
        
        {!isEditing ? (
          /* READ-ONLY VIEW */
          <div className="space-y-6">
            
            {/* Header Badge & Date */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
              <div>
                <span className="text-xs text-text-muted/60 font-mono">RECORD ID: {incident.id}</span>
                <h2 className="font-display text-2xl tracking-wide text-text-light mt-1">{incident.narrative_structured.summary}</h2>
              </div>
              <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-white/5 text-magenta border border-magenta/40">
                {incident.category}
              </span>
            </div>

            {/* POSH Filing Window Indicator Card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-1 text-xs">
              <div className="flex items-center space-x-2 text-magenta font-semibold">
                <Clock className="w-4 h-4" />
                <span>POSH Filing Window Guidance</span>
              </div>
              <p className="text-text-light font-medium">{poshInfo.displayText}</p>
            </div>

            {/* Structured Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 space-y-1">
                <span className="text-text-muted font-medium flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-magenta" />
                  <span>Date & Time</span>
                </span>
                <p className="text-text-light font-semibold">
                  {new Date(incident.incident_datetime).toLocaleString()}
                </p>
              </div>

              <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 space-y-1">
                <span className="text-text-muted font-medium flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-magenta" />
                  <span>Location</span>
                </span>
                <p className="text-text-light font-semibold">{incident.location || 'Unspecified'}</p>
              </div>

              <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 space-y-1">
                <span className="text-text-muted font-medium flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-magenta" />
                  <span>Person Involved</span>
                </span>
                <p className="text-text-light font-semibold">
                  {incident.people_involved.map(p => `${p.name} (${p.roleOrRelationship})`).join(', ') || 'None listed'}
                </p>
              </div>

              <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 space-y-1">
                <span className="text-text-muted font-medium flex items-center space-x-1.5">
                  <Users className="w-3.5 h-3.5 text-magenta" />
                  <span>Witnesses</span>
                </span>
                <p className="text-text-light font-semibold">
                  {incident.witnesses.length > 0 ? incident.witnesses.join(', ') : 'No witnesses listed'}
                </p>
              </div>
            </div>

            {/* Key Facts / Actions */}
            <div className="space-y-2">
              <h3 className="text-xs font-display tracking-wider text-magenta uppercase">Key Specific Actions</h3>
              <ul className="space-y-1.5">
                {incident.narrative_structured.keyActions.map((action, idx) => (
                  <li key={idx} className="text-xs text-text-light bg-white/5 p-3 rounded-xl border border-white/5 leading-relaxed">
                    • {action}
                  </li>
                ))}
              </ul>
            </div>

            {/* Audio Attachments / Raw Voice Evidence */}
            {attachmentsList.some(a => a.type === 'audio' || a.captureMethod === 'voice_recording') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-teal-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <Mic className="w-4 h-4 text-teal-400" />
                    <span>🎙️ Original Voice Recording (Raw Evidence)</span>
                  </h3>
                  <span className="text-[10px] bg-teal-950 text-teal-300 px-2 py-0.5 rounded border border-teal-800 font-medium">
                    Unedited Audio
                  </span>
                </div>
                {attachmentsList.filter(a => a.type === 'audio' || a.captureMethod === 'voice_recording').map(att => (
                  <div key={att.id} className="bg-charcoal-900/90 p-3.5 rounded-xl border border-teal-500/40 space-y-2">
                    <div className="flex items-center justify-between text-xs text-charcoal-300">
                      <span className="font-medium text-teal-200">{att.name}</span>
                      <span className="text-[10px] text-charcoal-400 font-mono">
                        {att.size ? `${(att.size / 1024).toFixed(0)} KB` : 'Audio'}
                      </span>
                    </div>
                    {att.dataUrl && (
                      <audio controls src={att.dataUrl} className="w-full h-10 rounded-lg" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Original Raw Notes / Audio Transcript */}
            <div className="space-y-2">
              <h3 className="text-xs font-display tracking-wider text-text-muted uppercase">Original Raw Input / Transcript</h3>
              <p className="text-xs text-text-muted bg-white/5 p-3.5 rounded-xl border border-white/10 italic leading-relaxed whitespace-pre-wrap">
                "{incident.narrative_raw}"
              </p>
            </div>

            {/* Attachments Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <h3 className="text-xs font-display tracking-wider text-text-muted uppercase flex items-center space-x-1.5">
                  <Paperclip className="w-4 h-4 text-magenta" />
                  <span>Attached Evidence ({attachmentsList.length})</span>
                </h3>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowCameraModal(true)}
                    className="px-3 py-1.5 rounded-full bg-magenta/20 hover:bg-magenta/30 border border-magenta/40 text-magenta text-[11px] font-semibold flex items-center space-x-1 transition"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Take Photo</span>
                  </button>

                  <label className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-text-light text-[11px] font-semibold flex items-center space-x-1 transition cursor-pointer">
                    <Plus className="w-3.5 h-3.5 text-magenta" />
                    <span>Add File</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {attachmentsList.length === 0 ? (
                <p className="text-xs text-text-muted italic">No attachments added yet.</p>
              ) : (
                <div className="space-y-2">
                  {attachmentsList.map(att => (
                    <div key={att.id} className="bg-white/5 p-3.5 rounded-xl border border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-xs">
                          {att.type === 'audio' ? (
                            <Mic className="w-4 h-4 text-magenta shrink-0" />
                          ) : att.isLiveCapture || att.captureMethod === 'camera' ? (
                            <Camera className="w-4 h-4 text-magenta shrink-0" />
                          ) : (
                            <Paperclip className="w-4 h-4 text-text-muted shrink-0" />
                          )}
                          <div className="truncate">
                            <span className="text-text-light font-medium block truncate">{att.name}</span>
                            {att.isLiveCapture && (
                              <span className="text-[10px] text-magenta font-mono">📷 Live Watermarked Photo</span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveAttachment(att.id)}
                          className="text-text-muted hover:text-magenta text-xs transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {att.type === 'image' && att.dataUrl && (
                        <div className="mt-2 max-w-sm rounded-lg overflow-hidden border border-white/10">
                          <img src={att.dataUrl} alt={att.name} className="w-full h-auto max-h-48 object-cover" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        ) : (
          /* EDITABLE FORM VIEW */
          <div className="space-y-4 text-xs">
            <h3 className="font-display text-2xl text-magenta">EDITING INCIDENT RECORD</h3>

            <div>
              <label className="block text-text-muted mb-1 font-semibold">Incident Date & Time</label>
              <input
                type="datetime-local"
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-text-light focus:outline-none focus:border-magenta"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-text-muted mb-1 font-semibold">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-text-light focus:outline-none focus:border-magenta"
                />
              </div>

              <div>
                <label className="block text-text-muted mb-1 font-semibold">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CategoryType)}
                  className="w-full bg-bg-black border border-white/10 rounded-xl p-3 text-text-light focus:outline-none focus:border-magenta"
                >
                  <option value="Verbal">Verbal</option>
                  <option value="Physical">Physical</option>
                  <option value="Digital">Digital</option>
                  <option value="Stalking">Stalking</option>
                  <option value="Quid-Pro-Quo">Quid-Pro-Quo</option>
                  <option value="Intimidation / Non-verbal">Intimidation / Non-verbal</option>
                  <option value="Financial / Economic">Financial / Economic</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-text-muted mb-1 font-semibold">Person Involved Name</label>
                <input
                  type="text"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-text-light focus:outline-none focus:border-magenta"
                />
              </div>

              <div>
                <label className="block text-text-muted mb-1 font-semibold">Role / Relationship</label>
                <input
                  type="text"
                  value={personRole}
                  onChange={(e) => setPersonRole(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-text-light focus:outline-none focus:border-magenta"
                />
              </div>
            </div>

            <div>
              <label className="block text-text-muted mb-1 font-semibold">Summary</label>
              <input
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-text-light focus:outline-none focus:border-magenta"
              />
            </div>

            <div>
              <label className="block text-text-muted mb-1 font-semibold">Key Actions (One per line)</label>
              <textarea
                value={keyActionsText}
                onChange={(e) => setKeyActionsText(e.target.value)}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-text-light focus:outline-none focus:border-magenta"
              />
            </div>

            <div>
              <label className="block text-text-muted mb-1 font-semibold">Original Raw Notes / Transcript</label>
              <textarea
                value={rawNotes}
                onChange={(e) => setRawNotes(e.target.value)}
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-text-light focus:outline-none focus:border-magenta"
              />
            </div>

            <div>
              <label className="block text-text-muted mb-1 font-semibold">Witnesses (Comma separated)</label>
              <input
                type="text"
                value={witnessesText}
                onChange={(e) => setWitnessesText(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-text-light focus:outline-none focus:border-magenta"
              />
            </div>

            <div className="pt-3 flex space-x-3">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-3 rounded-full border border-magenta/50 text-magenta hover:bg-magenta/10 font-semibold text-xs uppercase tracking-wider transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-3 rounded-full bg-magenta hover:bg-magenta-deep text-bg-black font-semibold text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center space-x-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-bg-black border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl film-grain">
            <div className="flex items-center space-x-3 text-magenta">
              <AlertOctagon className="w-6 h-6" />
              <h3 className="font-display text-2xl text-text-light">PERMANENTLY DELETE ENTRY?</h3>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              This action cannot be undone. This incident record will be permanently wiped from your local device storage.
            </p>
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-full border border-magenta/50 text-magenta hover:bg-magenta/10 font-semibold text-xs uppercase tracking-wider transition"
              >
                Cancel
              </button>
              <button
                onClick={() => onDelete(incident.id)}
                className="flex-1 py-2.5 rounded-full bg-magenta hover:bg-magenta-deep text-bg-black font-semibold text-xs uppercase tracking-wider transition shadow-md"
              >
                Yes, Delete Entry
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};