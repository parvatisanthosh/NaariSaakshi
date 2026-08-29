import React, { useState, useRef } from 'react';
import { ArrowLeft, Calendar, MapPin, User, Users, Tag, Trash2, Edit3, Save, X, Paperclip, AlertOctagon, Check, Mic, Camera, Plus, Clock, PhoneCall } from 'lucide-react';
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
  allIncidents = [],
  onUpdate,
  onDelete,
  onBack
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  // Attachments State
  const [attachmentsList, setAttachmentsList] = useState<Attachment[]>(incident.attachments || []);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleAddAttachment = (newAtt: Attachment) => {
    const updatedList = [...attachmentsList, newAtt];
    setAttachmentsList(updatedList);
    onUpdate({
      ...incident,
      attachments: updatedList
    });
  };

  const handleRemoveAttachment = (id: string) => {
    const updatedList = attachmentsList.filter(a => a.id !== id);
    setAttachmentsList(updatedList);
    onUpdate({
      ...incident,
      attachments: updatedList
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const newAtt: Attachment = {
        id: 'att-' + Math.random().toString(36).substr(2, 6),
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'document',
        dataUrl: reader.result as string,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        isLiveCapture: false,
        captureMethod: 'upload'
      };
      handleAddAttachment(newAtt);
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
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
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28 space-y-6">
      
      {/* Camera Capture Modal for Adding Evidence */}
      <CameraCaptureModal
        isOpen={showCameraModal}
        locationText={incident.location}
        onCapture={handleAddAttachment}
        onClose={() => setShowCameraModal(false)}
        onFallbackToUpload={() => {
          fileInputRef.current?.click();
        }}
      />
      
      {/* Top Header Controls */}
      <div className="flex items-center justify-between border-b border-charcoal-800 pb-4">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-xs font-medium text-charcoal-300 hover:text-charcoal-100 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Timeline</span>
        </button>

        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-xs font-medium text-teal-300 border border-charcoal-700 transition flex items-center space-x-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Entry</span>
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-1.5 rounded-lg bg-charcoal-800 hover:bg-accent-rose/20 text-xs font-medium text-accent-rose border border-charcoal-700 transition flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-xs font-medium text-charcoal-300 border border-charcoal-700 transition"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      {/* Main Card View / Edit */}
      <div className="bg-charcoal-800/80 border border-charcoal-700/80 rounded-2xl p-6 space-y-6 shadow-md">
        
        {!isEditing ? (
          /* READ-ONLY VIEW */
          <div className="space-y-6">
            
            {/* Header Badge & Date */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-charcoal-700/60 pb-4">
              <div>
                <span className="text-xs text-charcoal-400 font-mono">RECORD ID: {incident.id}</span>
                <h2 className="text-lg font-semibold text-charcoal-100 mt-1">{incident.narrative_structured.summary}</h2>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-950 text-teal-300 border border-teal-700/60">
                {incident.category}
              </span>
            </div>

            {/* POSH Filing Deadline Guidance Box */}
            {(() => {
              const poshInfo = calculatePoshDeadline(incident, allIncidents);
              return (
                <div className="bg-charcoal-900/80 border border-charcoal-700/80 p-3.5 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center space-x-1.5 text-teal-400 font-medium">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span>{poshInfo.displayText}</span>
                    {poshInfo.isSeries && (
                      <span className="text-[10px] text-teal-300 font-mono">(calculated from latest in series)</span>
                    )}
                  </div>
                  <p className="text-[10px] text-charcoal-400 leading-relaxed">
                    General guidance based on the POSH Act, 2013 — confirm current deadlines with your organization's ICC or a legal professional, as processes can vary. General informational guidance only — not legal advice.
                  </p>
                </div>
              );
            })()}

            {/* Structured Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-charcoal-900/60 p-3 rounded-xl border border-charcoal-700/50 space-y-1">
                <span className="text-charcoal-400 font-medium flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-teal-400" />
                  <span>Date & Time</span>
                </span>
                <p className="text-charcoal-100 font-medium">
                  {new Date(incident.incident_datetime).toLocaleString()}
                </p>
              </div>

              <div className="bg-charcoal-900/60 p-3 rounded-xl border border-charcoal-700/50 space-y-1">
                <span className="text-charcoal-400 font-medium flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-400" />
                  <span>Location</span>
                </span>
                <p className="text-charcoal-100 font-medium">{incident.location || 'Unspecified'}</p>
              </div>

              <div className="bg-charcoal-900/60 p-3 rounded-xl border border-charcoal-700/50 space-y-1">
                <span className="text-charcoal-400 font-medium flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-teal-400" />
                  <span>Person Involved</span>
                </span>
                <p className="text-charcoal-100 font-medium">
                  {incident.people_involved.map(p => `${p.name} (${p.roleOrRelationship})`).join(', ') || 'None listed'}
                </p>
              </div>

              <div className="bg-charcoal-900/60 p-3 rounded-xl border border-charcoal-700/50 space-y-1">
                <span className="text-charcoal-400 font-medium flex items-center space-x-1.5">
                  <Users className="w-3.5 h-3.5 text-teal-400" />
                  <span>Witnesses</span>
                </span>
                <p className="text-charcoal-100 font-medium">
                  {incident.witnesses.length > 0 ? incident.witnesses.join(', ') : 'No witnesses listed'}
                </p>
              </div>
            </div>

            {/* Key Facts / Actions */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-teal-400 uppercase tracking-wider">Key Specific Actions</h3>
              <ul className="space-y-1.5">
                {incident.narrative_structured.keyActions.map((action, idx) => (
                  <li key={idx} className="text-xs text-charcoal-200 bg-charcoal-900/40 p-2.5 rounded-lg border border-charcoal-700/40 leading-relaxed">
                    • {action}
                  </li>
                ))}
              </ul>
            </div>

            {/* Audio Attachments / Call Recordings / Raw Evidence */}
            {attachmentsList.some(a => a.type === 'audio' || a.captureMethod === 'voice_recording') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-teal-400 uppercase tracking-wider flex items-center space-x-1.5">
                    {incident.tags?.includes('Call Recording') ? (
                      <PhoneCall className="w-4 h-4 text-teal-400" />
                    ) : (
                      <Mic className="w-4 h-4 text-teal-400" />
                    )}
                    <span>
                      {incident.tags?.includes('Call Recording')
                        ? '🎙️ Call Recording (Original Raw Audio Source)'
                        : '🎙️ Original Voice Recording (Raw Evidence)'}
                    </span>
                  </h3>
                  <span className="text-[10px] bg-teal-950 text-teal-300 px-2 py-0.5 rounded border border-teal-800 font-medium">
                    {incident.tags?.includes('Call Recording') ? 'Call Evidence Source' : 'Unedited Audio'}
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
              <h3 className="text-xs font-semibold text-charcoal-400 uppercase tracking-wider flex items-center space-x-1.5">
                <span>📝 AI-Generated Transcript / Raw Notes</span>
              </h3>
              <p className="text-xs text-charcoal-300 bg-charcoal-900/80 p-3 rounded-xl border border-charcoal-700/60 italic leading-relaxed whitespace-pre-wrap">
                "{incident.narrative_raw}"
              </p>
            </div>

            {/* Attachments Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-t border-charcoal-700/60 pt-4">
                <h3 className="text-xs font-semibold text-charcoal-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Paperclip className="w-4 h-4 text-teal-400" />
                  <span>Attached Evidence ({attachmentsList.length})</span>
                </h3>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowCameraModal(true)}
                    className="px-2.5 py-1.5 rounded-lg bg-teal-950 hover:bg-teal-900 border border-teal-500/40 text-teal-300 text-[11px] font-medium flex items-center space-x-1 transition"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Take Photo</span>
                  </button>

                  <label className="px-2.5 py-1.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 border border-charcoal-700 text-charcoal-200 text-[11px] font-medium flex items-center space-x-1 transition cursor-pointer">
                    <Plus className="w-3.5 h-3.5 text-teal-400" />
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
                <p className="text-xs text-charcoal-400 italic">No attachments added yet.</p>
              ) : (
                <div className="space-y-2">
                  {attachmentsList.map(att => (
                    <div key={att.id} className="bg-charcoal-900/90 p-3 rounded-xl border border-charcoal-700/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-xs">
                          {att.type === 'audio' ? (
                            <Mic className="w-4 h-4 text-teal-400 shrink-0" />
                          ) : att.isLiveCapture || att.captureMethod === 'camera' ? (
                            <Camera className="w-4 h-4 text-teal-400 shrink-0" />
                          ) : (
                            <Paperclip className="w-4 h-4 text-charcoal-400 shrink-0" />
                          )}
                          <div className="truncate">
                            <span className="text-charcoal-200 font-medium block truncate">{att.name}</span>
                            {att.isLiveCapture && (
                              <span className="text-[10px] text-teal-400 font-mono">📷 Live Watermarked Photo</span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveAttachment(att.id)}
                          className="text-charcoal-400 hover:text-accent-rose text-xs transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {att.type === 'image' && att.dataUrl && (
                        <div className="mt-2 max-w-sm rounded-lg overflow-hidden border border-charcoal-700">
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
            <h3 className="text-sm font-semibold text-teal-300">Editing Incident Record</h3>

            <div>
              <label className="block text-charcoal-300 mb-1 font-medium">Incident Date & Time</label>
              <input
                type="datetime-local"
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
                className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl p-2.5 text-charcoal-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-charcoal-300 mb-1 font-medium">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl p-2.5 text-charcoal-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-charcoal-300 mb-1 font-medium">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CategoryType)}
                  className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl p-2.5 text-charcoal-100 focus:outline-none focus:border-teal-500"
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
                <label className="block text-charcoal-300 mb-1 font-medium">Person Involved Name</label>
                <input
                  type="text"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl p-2.5 text-charcoal-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-charcoal-300 mb-1 font-medium">Role / Relationship</label>
                <input
                  type="text"
                  value={personRole}
                  onChange={(e) => setPersonRole(e.target.value)}
                  className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl p-2.5 text-charcoal-100 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-charcoal-300 mb-1 font-medium">Summary</label>
              <input
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl p-2.5 text-charcoal-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-charcoal-300 mb-1 font-medium">Key Actions (One per line)</label>
              <textarea
                value={keyActionsText}
                onChange={(e) => setKeyActionsText(e.target.value)}
                rows={3}
                className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl p-2.5 text-charcoal-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-charcoal-300 mb-1 font-medium">Original Raw Notes / Transcript</label>
              <textarea
                value={rawNotes}
                onChange={(e) => setRawNotes(e.target.value)}
                rows={4}
                className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl p-2.5 text-charcoal-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-charcoal-300 mb-1 font-medium">Witnesses (Comma separated)</label>
              <input
                type="text"
                value={witnessesText}
                onChange={(e) => setWitnessesText(e.target.value)}
                className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl p-2.5 text-charcoal-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="pt-3 flex space-x-3">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2.5 rounded-xl bg-charcoal-700 hover:bg-charcoal-600 text-charcoal-200 font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium transition shadow-lg flex items-center justify-center space-x-1.5"
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
        <div className="fixed inset-0 z-50 bg-charcoal-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-charcoal-800 border border-charcoal-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-accent-rose">
              <AlertOctagon className="w-6 h-6" />
              <h3 className="text-base font-semibold text-charcoal-100">Permanently Delete Entry?</h3>
            </div>
            <p className="text-xs text-charcoal-300 leading-relaxed">
              This action cannot be undone. This incident record will be permanently wiped from your local device storage.
            </p>
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-charcoal-700 hover:bg-charcoal-600 text-charcoal-200 font-medium text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={() => onDelete(incident.id)}
                className="flex-1 py-2.5 rounded-xl bg-accent-rose/90 hover:bg-accent-rose text-white font-medium text-xs transition shadow-md"
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
