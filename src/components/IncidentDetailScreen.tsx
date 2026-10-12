import React, { useState, useRef } from 'react';
import { ArrowLeft, Calendar, MapPin, User, Users, Tag, Trash2, Edit3, Save, X, Paperclip, AlertOctagon, Check, Mic, Camera, Plus, Clock, Video } from 'lucide-react';
import { CategoryType, Incident, Attachment } from '../types';
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
      onUpdate(updatedIncident);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraPhotoCaptured = async (newAtt: Attachment) => {
    const updatedAtts = [...attachmentsList, newAtt];
    setAttachmentsList(updatedAtts);

    const updatedIncident = { ...incident, attachments: updatedAtts };
    onUpdate(updatedIncident);
  };

  const handleRemoveAttachment = async (attId: string) => {
    const updatedAtts = attachmentsList.filter(a => a.id !== attId);
    setAttachmentsList(updatedAtts);

    const updatedIncident = { ...incident, attachments: updatedAtts };
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
    <div className="w-full space-y-8 pb-28 relative">
      
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
      <div className="flex items-center justify-between border-b border-black/10 pb-4">
        <button
          onClick={onBack}
          className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-magenta hover:text-magenta-deep transition"
        >
          <ArrowLeft className="w-4 h-4 text-magenta" />
          <span>Back</span>
        </button>

        <div className="flex items-center space-x-3">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="px-5 py-2 rounded-full bg-magenta hover:bg-magenta-deep text-bg-black font-display font-bold text-base tracking-wider transition shadow-md flex items-center space-x-1.5"
              >
                <Edit3 className="w-4 h-4" />
                <span>EDIT ENTRY</span>
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-5 py-2 rounded-full border-2 border-magenta/60 text-magenta hover:bg-magenta hover:text-bg-black font-display font-bold text-base tracking-wider transition flex items-center space-x-1.5 shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>DELETE</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="px-5 py-2 rounded-full border border-black/20 text-cream-ink hover:bg-cream font-bold text-xs uppercase tracking-wider transition"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      {/* Main Container View / Edit (Light Cream & White Cards) */}
      <div className="bg-cream text-cream-ink border border-black/10 rounded-3xl p-8 sm:p-12 space-y-8 shadow-2xl relative z-10 w-full">
        
        {!isEditing ? (
          /* READ-ONLY VIEW */
          <div className="space-y-8">
            
            {/* Header Badge & Title */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-6">
              <div className="space-y-1">
                <span className="text-xs font-mono font-bold text-cream-ink/60 uppercase">RECORD ID: {incident.id}</span>
                <h1 className="font-display text-4xl sm:text-6xl text-cream-ink tracking-wide leading-none">{incident.narrative_structured.summary}</h1>
              </div>
              <span className="px-5 py-2 rounded-full font-display text-lg font-bold tracking-wider bg-magenta text-bg-black shadow-md uppercase shrink-0">
                {incident.category}
              </span>
            </div>

            {/* POSH Filing Window Indicator Card */}
            <div className="bg-white border border-black/10 rounded-2xl p-5 space-y-1 text-sm shadow-md">
              <div className="flex items-center space-x-2 text-magenta font-bold">
                <Clock className="w-5 h-5" />
                <span className="font-display text-xl uppercase tracking-wider text-cream-ink">POSH FILING WINDOW GUIDANCE</span>
              </div>
              <p className="text-cream-ink/90 font-medium text-base">{poshInfo.displayText}</p>
            </div>

            {/* Structured Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <div className="bg-white p-5 rounded-2xl border border-black/10 space-y-1 shadow-sm">
                <span className="text-cream-ink/60 font-bold uppercase tracking-wider text-xs flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-magenta" />
                  <span>Date & Time</span>
                </span>
                <p className="text-cream-ink font-bold text-base">
                  {new Date(incident.incident_datetime).toLocaleString()}
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-black/10 space-y-1 shadow-sm">
                <span className="text-cream-ink/60 font-bold uppercase tracking-wider text-xs flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-magenta" />
                  <span>Location</span>
                </span>
                <p className="text-cream-ink font-bold text-base">{incident.location || 'Unspecified'}</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-black/10 space-y-1 shadow-sm">
                <span className="text-cream-ink/60 font-bold uppercase tracking-wider text-xs flex items-center space-x-2">
                  <User className="w-4 h-4 text-magenta" />
                  <span>Person Involved</span>
                </span>
                <p className="text-cream-ink font-bold text-base">
                  {incident.people_involved.map(p => `${p.name} (${p.roleOrRelationship})`).join(', ') || 'None listed'}
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-black/10 space-y-1 shadow-sm">
                <span className="text-cream-ink/60 font-bold uppercase tracking-wider text-xs flex items-center space-x-2">
                  <Users className="w-4 h-4 text-magenta" />
                  <span>Witnesses</span>
                </span>
                <p className="text-cream-ink font-bold text-base">
                  {incident.witnesses.length > 0 ? incident.witnesses.join(', ') : 'No witnesses listed'}
                </p>
              </div>
            </div>

            {/* Key Facts / Actions */}
            <div className="space-y-3">
              <h3 className="font-display text-2xl tracking-wider text-cream-ink uppercase">KEY SPECIFIC ACTIONS</h3>
              <ul className="space-y-2">
                {incident.narrative_structured.keyActions.map((action, idx) => (
                  <li key={idx} className="text-sm sm:text-base text-cream-ink bg-white p-4 rounded-2xl border border-black/10 font-medium leading-relaxed shadow-sm">
                    • {action}
                  </li>
                ))}
              </ul>
            </div>

            {/* Audio Attachments / Raw Voice Evidence */}
            {attachmentsList.some(a => a.type === 'audio' || a.captureMethod === 'voice_recording') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-2xl tracking-wider text-cream-ink uppercase flex items-center space-x-2">
                    <Mic className="w-5 h-5 text-magenta" />
                    <span>🎙️ ORIGINAL VOICE RECORDING (RAW EVIDENCE)</span>
                  </h3>
                  <span className="text-xs bg-magenta text-bg-black px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                    Unedited Audio
                  </span>
                </div>
                {attachmentsList.filter(a => a.type === 'audio' || a.captureMethod === 'voice_recording').map(att => (
                  <div key={att.id} className="bg-white p-5 rounded-2xl border border-black/10 space-y-3 shadow-md">
                    <div className="flex items-center justify-between text-xs text-cream-ink">
                      <span className="font-bold text-sm text-cream-ink">{att.name}</span>
                      <span className="font-mono text-cream-ink/60">
                        {att.size ? `${(att.size / 1024).toFixed(0)} KB` : 'Audio'}
                      </span>
                    </div>
                    {att.dataUrl && (
                      <audio controls src={att.dataUrl} className="w-full h-12 rounded-xl" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Original Raw Notes / Audio Transcript */}
            <div className="space-y-3">
              <h3 className="font-display text-2xl tracking-wider text-cream-ink uppercase">ORIGINAL RAW INPUT / TRANSCRIPT</h3>
              <p className="text-sm sm:text-base text-cream-ink/90 bg-white p-5 rounded-2xl border border-black/10 italic leading-relaxed whitespace-pre-wrap font-medium shadow-sm">
                "{incident.narrative_raw}"
              </p>
            </div>

            {/* Attachments Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-t border-black/10 pt-6">
                <h3 className="font-display text-2xl tracking-wider text-cream-ink uppercase flex items-center space-x-2">
                  <Paperclip className="w-5 h-5 text-magenta" />
                  <span>ATTACHED EVIDENCE ({attachmentsList.length})</span>
                </h3>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowCameraModal(true)}
                    className="px-4 py-2 rounded-full bg-magenta hover:bg-magenta-deep text-bg-black text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition shadow-sm"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Take Photo</span>
                  </button>

                  <label className="px-4 py-2 rounded-full bg-white hover:bg-cream border border-black/10 text-cream-ink text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer shadow-sm">
                    <Plus className="w-4 h-4 text-magenta" />
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
                <p className="text-xs text-cream-ink/60 italic font-medium">No attachments added yet.</p>
              ) : (
                <div className="space-y-3">
                  {attachmentsList.map(att => (
                    <div key={att.id} className="bg-white p-5 rounded-2xl border border-black/10 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 text-xs">
                          {att.type === 'video' ? (
                            <Video className="w-5 h-5 text-magenta shrink-0" />
                          ) : att.type === 'audio' ? (
                            <Mic className="w-5 h-5 text-magenta shrink-0" />
                          ) : att.isLiveCapture || att.captureMethod === 'camera' ? (
                            <Camera className="w-5 h-5 text-magenta shrink-0" />
                          ) : (
                            <Paperclip className="w-5 h-5 text-cream-ink/60 shrink-0" />
                          )}
                          <div className="truncate">
                            <span className="text-cream-ink font-bold text-sm block truncate">{att.name}</span>
                            {att.type === 'video' ? (
                              <span className="text-[10px] text-magenta font-bold uppercase tracking-wider">📹 Live Video Recording</span>
                            ) : att.type === 'audio' ? (
                              <span className="text-[10px] text-magenta font-bold uppercase tracking-wider">🎙️ Audio Recording</span>
                            ) : att.isLiveCapture ? (
                              <span className="text-[10px] text-magenta font-bold uppercase tracking-wider">📷 Live Watermarked Photo</span>
                            ) : null}
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveAttachment(att.id)}
                          className="text-cream-ink/60 hover:text-magenta transition"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {att.type === 'video' && att.dataUrl && (
                        <div className="mt-2 max-w-lg rounded-2xl overflow-hidden border border-black/10 shadow-sm bg-black">
                          <video src={att.dataUrl} controls className="w-full h-auto max-h-72 object-contain" />
                        </div>
                      )}

                      {att.type === 'audio' && att.dataUrl && (
                        <div className="mt-2 p-3 bg-cream/40 rounded-2xl border border-black/10">
                          <audio src={att.dataUrl} controls className="w-full" />
                        </div>
                      )}

                      {att.type === 'image' && att.dataUrl && (
                        <div className="mt-2 max-w-md rounded-2xl overflow-hidden border border-black/10 shadow-sm">
                          <img src={att.dataUrl} alt={att.name} className="w-full h-auto max-h-60 object-cover" />
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
          <div className="space-y-6 text-sm">
            <h3 className="font-display text-4xl text-cream-ink leading-none">EDITING INCIDENT RECORD</h3>

            <div className="space-y-2">
              <label className="block text-cream-ink font-bold text-xs uppercase tracking-wider">Incident Date & Time</label>
              <input
                type="datetime-local"
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
                className="w-full bg-white border border-black/10 rounded-2xl p-4 text-cream-ink font-semibold focus:outline-none focus:border-magenta transition-all shadow-inner"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-cream-ink font-bold text-xs uppercase tracking-wider">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-white border border-black/10 rounded-2xl p-4 text-cream-ink font-semibold focus:outline-none focus:border-magenta transition-all shadow-inner"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-cream-ink font-bold text-xs uppercase tracking-wider">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CategoryType)}
                  className="w-full bg-white border border-black/10 rounded-2xl p-4 text-cream-ink font-bold focus:outline-none focus:border-magenta transition-all shadow-inner"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-cream-ink font-bold text-xs uppercase tracking-wider">Person Involved Name</label>
                <input
                  type="text"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  className="w-full bg-white border border-black/10 rounded-2xl p-4 text-cream-ink font-semibold focus:outline-none focus:border-magenta transition-all shadow-inner"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-cream-ink font-bold text-xs uppercase tracking-wider">Role / Relationship</label>
                <input
                  type="text"
                  value={personRole}
                  onChange={(e) => setPersonRole(e.target.value)}
                  className="w-full bg-white border border-black/10 rounded-2xl p-4 text-cream-ink font-semibold focus:outline-none focus:border-magenta transition-all shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-cream-ink font-bold text-xs uppercase tracking-wider">Summary</label>
              <input
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full bg-white border border-black/10 rounded-2xl p-4 text-cream-ink font-semibold focus:outline-none focus:border-magenta transition-all shadow-inner"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-cream-ink font-bold text-xs uppercase tracking-wider">Key Actions (One per line)</label>
              <textarea
                value={keyActionsText}
                onChange={(e) => setKeyActionsText(e.target.value)}
                rows={3}
                className="w-full bg-white border border-black/10 rounded-2xl p-4 text-cream-ink font-semibold focus:outline-none focus:border-magenta transition-all shadow-inner"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-cream-ink font-bold text-xs uppercase tracking-wider">Original Raw Notes / Transcript</label>
              <textarea
                value={rawNotes}
                onChange={(e) => setRawNotes(e.target.value)}
                rows={4}
                className="w-full bg-white border border-black/10 rounded-2xl p-4 text-cream-ink font-semibold focus:outline-none focus:border-magenta transition-all shadow-inner"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-cream-ink font-bold text-xs uppercase tracking-wider">Witnesses (Comma separated)</label>
              <input
                type="text"
                value={witnessesText}
                onChange={(e) => setWitnessesText(e.target.value)}
                className="w-full bg-white border border-black/10 rounded-2xl p-4 text-cream-ink font-semibold focus:outline-none focus:border-magenta transition-all shadow-inner"
              />
            </div>

            <div className="pt-4 flex items-center space-x-4">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-4 rounded-full border border-black/20 text-cream-ink hover:bg-white font-bold text-xs uppercase tracking-wider transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-4 rounded-full bg-magenta hover:bg-magenta-deep text-bg-black font-display font-bold text-lg tracking-wider transition shadow-lg flex items-center justify-center space-x-2"
              >
                <Save className="w-5 h-5" />
                <span>SAVE CHANGES</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-black/10 rounded-3xl w-full max-w-md p-8 space-y-6 shadow-2xl text-cream-ink">
            <div className="flex items-center space-x-3 text-magenta">
              <AlertOctagon className="w-7 h-7" />
              <h3 className="font-display text-3xl text-cream-ink leading-none">PERMANENTLY DELETE ENTRY?</h3>
            </div>
            <p className="text-sm text-cream-ink/80 leading-relaxed font-medium">
              This action cannot be undone. This incident record will be permanently wiped from your local device storage.
            </p>
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3.5 rounded-full border border-black/20 text-cream-ink hover:bg-cream font-bold text-xs uppercase tracking-wider transition"
              >
                Cancel
              </button>
              <button
                onClick={() => onDelete(incident.id)}
                className="flex-1 py-3.5 rounded-full bg-magenta hover:bg-magenta-deep text-bg-black font-display font-bold text-base tracking-wider transition shadow-md"
              >
                YES, DELETE ENTRY
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};