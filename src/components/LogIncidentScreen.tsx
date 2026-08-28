import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Type, Sparkles, Paperclip, CheckCircle2, AlertCircle, Edit3, X, Trash2, ArrowRight, Check, Loader2 } from 'lucide-react';
import { Attachment, CategoryType, Incident, PersonInvolved } from '../types';
import { extractIncidentFromRawText } from '../aiEngine';

interface LogIncidentScreenProps {
  onSaveIncident: (incident: Incident) => void;
  onCancel: () => void;
}

export const LogIncidentScreen: React.FC<LogIncidentScreenProps> = ({ onSaveIncident, onCancel }) => {
  const [mode, setMode] = useState<'text' | 'voice'>('voice');
  const [inputText, setInputText] = useState('');
  
  // Voice Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [speechErrorMsg, setSpeechErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<any | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Attachment state
  const [attachment, setAttachment] = useState<Attachment | null>(null);

  // Extracted Data for Confirmation Modal
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Reading through what you shared...');

  // Editable Form fields inside Review Modal
  const [editDatetime, setEditDatetime] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editCategory, setEditCategory] = useState<CategoryType>('Verbal');
  const [editPersonName, setEditPersonName] = useState('');
  const [editPersonRole, setEditPersonRole] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editActions, setEditActions] = useState<string[]>([]);
  const [editWitnesses, setEditWitnesses] = useState('');
  const [editSeverity, setEditSeverity] = useState<number>(3);

  // Field Touched / Edited Tracking State
  const [touchedFields, setTouchedFields] = useState<{ [key: string]: boolean }>({});

  const markTouched = (fieldName: string) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
  };

  // Setup Web Speech Recognition if available
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + ' ';
        }
        if (currentTranscript.trim()) {
          setInputText(currentTranscript);
          setSpeechErrorMsg(null);
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error:', e.error);
        handleSpeechFallback("Didn't catch that — you can type instead");
      };

      speechRecognitionRef.current = recognition;
    }
  }, []);

  // Focus textarea when switching to text mode
  useEffect(() => {
    if (mode === 'text' && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [mode]);

  const handleSpeechFallback = (msg: string) => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);

    if (speechRecognitionRef.current) {
      try { speechRecognitionRef.current.stop(); } catch (e) {}
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      } catch (e) {}
    }

    setSpeechErrorMsg(msg);
    setMode('text');
  };

  const startRecording = async () => {
    try {
      setRecordingSeconds(0);
      setIsRecording(true);
      setSpeechErrorMsg(null);

      if (speechRecognitionRef.current) {
        try { 
          speechRecognitionRef.current.start(); 
        } catch (e) {
          console.warn('Failed to start speech recognition:', e);
        }
      } else {
        handleSpeechFallback("Voice recognition isn't supported on this browser — you can type instead");
        return;
      }

      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
      }
    } catch (err) {
      console.warn('Microphone access unavailable or denied:', err);
      handleSpeechFallback("Didn't catch that — microphone unavailable. You can type instead.");
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);

    if (speechRecognitionRef.current) {
      try { speechRecognitionRef.current.stop(); } catch (e) {}
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      } catch (e) {}
    }

    if (!inputText.trim()) {
      handleSpeechFallback("Didn't catch that — you can type instead");
    }
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAttachment({
        id: 'att-' + Math.random().toString(36).substr(2, 6),
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'document',
        dataUrl: reader.result as string,
        size: file.size,
        uploadedAt: new Date().toISOString()
      });
    };
    reader.readAsDataURL(file);
  };

  // Run AI Structuring on raw text
  const handleProcessSubmit = () => {
    if (!inputText.trim() || isProcessing) return;

    setIsProcessing(true);
    setProcessingMessage('Reading through what you shared...');

    // Rotating messages during processing
    const msgTimer = setTimeout(() => {
      setProcessingMessage('Organizing the details...');
    }, 500);

    // Guaranteed minimum visibility duration of 1000ms
    setTimeout(() => {
      clearTimeout(msgTimer);
      const extracted = extractIncidentFromRawText(inputText);
      setExtractedData(extracted);

      setTouchedFields({});

      const nowFormatted = new Date().toISOString().slice(0, 16);
      setEditDatetime(nowFormatted);
      setEditLocation(extracted.location);
      setEditCategory(extracted.category);
      setEditPersonName(extracted.people_involved[0]?.name || 'Rohan Sharma');
      setEditPersonRole(extracted.people_involved[0]?.roleOrRelationship || 'Colleague');
      setEditSummary(extracted.structured_narrative.summary);
      setEditActions(extracted.structured_narrative.keyActions);
      setEditWitnesses(extracted.witnesses.join(', '));
      setEditSeverity(extracted.severity_estimate || 3);

      setIsProcessing(false);
      setShowReviewModal(true);
    }, 1000);
  };

  const handleFinalSave = () => {
    if (!inputText.trim()) return;

    const people: PersonInvolved[] = editPersonName.trim() ? [{
      id: 'p-' + Math.random().toString(36).substr(2, 6),
      name: editPersonName.trim(),
      roleOrRelationship: editPersonRole.trim() || 'Role not specified'
    }] : [];

    const newIncident: Incident = {
      id: 'inc-' + Math.random().toString(36).substr(2, 8),
      created_at: new Date().toISOString(),
      incident_datetime: new Date(editDatetime).toISOString(),
      location: editLocation || 'Unspecified location',
      people_involved: people,
      category: editCategory,
      narrative_raw: inputText,
      narrative_structured: {
        summary: editSummary,
        context: extractedData?.structured_narrative?.context || 'User confirmed details',
        keyActions: editActions.length > 0 ? editActions : [inputText],
        impactDescription: extractedData?.structured_narrative?.impactDescription || 'Logged contemporaneously by user.',
        recommendedFollowUp: extractedData?.structured_narrative?.recommendedFollowUp || 'Preserve evidence.'
      },
      witnesses: editWitnesses ? editWitnesses.split(',').map(w => w.trim()).filter(Boolean) : [],
      severity: editSeverity,
      attachments: attachment ? [attachment] : [],
      user_edited: Object.keys(touchedFields).length > 0,
      tags: [editCategory, ...(people[0]?.name ? [people[0].name] : [])]
    };

    onSaveIncident(newIncident);
  };

  const renderFieldBadge = (fieldName: string) => {
    const isEdited = touchedFields[fieldName];
    if (isEdited) {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-950 text-teal-300 border border-teal-700/60 transition">
          <Check className="w-3 h-3 text-teal-400" />
          <span>Edited</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-plum-950/80 text-plum-300 border border-plum-700/60">
        <Sparkles className="w-2.5 h-2.5 text-plum-400" />
        <span>AI-suggested</span>
      </span>
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28 space-y-6">
      
      {/* Processing State Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-charcoal-950/80 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="bg-charcoal-800 border border-charcoal-700 rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-teal-950/80 border border-teal-500/40 flex items-center justify-center text-teal-400 mx-auto">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-charcoal-100">{processingMessage}</h3>
              <p className="text-xs text-charcoal-400">Extracting facts, dates, and people silently...</p>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner Nudge */}
      <div className="bg-charcoal-800/80 border border-charcoal-700/80 rounded-2xl p-4 shadow-sm">
        <div className="flex items-start space-x-3">
          <div className="w-9 h-9 rounded-full bg-teal-950/80 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-charcoal-100">Log an Incident</h2>
            <p className="text-sm text-charcoal-300 mt-1 leading-relaxed">
              "Just say or type what happened in your own words. We'll quietly organize it into a structured, timestamped record for you."
            </p>
          </div>
        </div>
      </div>

      {/* Mode Switcher Buttons */}
      <div className="flex p-1 bg-charcoal-800/90 rounded-xl border border-charcoal-700/60">
        <button
          disabled={isProcessing}
          onClick={() => {
            setSpeechErrorMsg(null);
            setMode('voice');
          }}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition flex items-center justify-center space-x-2 disabled:opacity-50 ${
            mode === 'voice'
              ? 'bg-teal-700 text-white shadow-md'
              : 'text-charcoal-400 hover:text-charcoal-200'
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>Voice Record</span>
        </button>
        <button
          disabled={isProcessing}
          onClick={() => setMode('text')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition flex items-center justify-center space-x-2 disabled:opacity-50 ${
            mode === 'text'
              ? 'bg-teal-700 text-white shadow-md'
              : 'text-charcoal-400 hover:text-charcoal-200'
          }`}
        >
          <Type className="w-4 h-4" />
          <span>Type Notes</span>
        </button>
      </div>

      {/* Inline Fallback Message Banner */}
      {speechErrorMsg && (
        <div className="bg-amber-950/80 border border-amber-500/50 rounded-xl p-3 text-xs text-amber-200 flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{speechErrorMsg}</span>
          </div>
          <button 
            onClick={() => setSpeechErrorMsg(null)}
            className="text-amber-400 hover:text-amber-200 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Voice Mode View */}
      {mode === 'voice' && (
        <div className="bg-charcoal-800/50 border border-charcoal-700/60 rounded-2xl p-6 text-center space-y-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            
            {/* Pulsing Mic Button */}
            <button
              disabled={isProcessing}
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-28 h-28 rounded-full flex items-center justify-center transition-all transform active:scale-95 border-4 shadow-xl disabled:opacity-50 ${
                isRecording
                  ? 'bg-accent-rose text-white border-accent-rose/40 animate-pulse ring-8 ring-accent-rose/20'
                  : 'bg-teal-800 hover:bg-teal-700 text-teal-100 border-teal-600/40'
              }`}
            >
              {isRecording ? <MicOff className="w-12 h-12" /> : <Mic className="w-12 h-12" />}
            </button>

            <div>
              {isRecording ? (
                <div className="space-y-1">
                  <span className="inline-block px-3 py-1 rounded-full bg-accent-rose/20 text-accent-rose text-xs font-semibold tracking-wide uppercase">
                    Recording Live ({formatTime(recordingSeconds)})
                  </span>
                  <p className="text-xs text-charcoal-400">Speak naturally. Tap button again when finished.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <span className="text-sm font-medium text-charcoal-200 block">Tap to start recording voice</span>
                  <p className="text-xs text-charcoal-400">Speech is auto-transcribed securely on your device</p>
                </div>
              )}
            </div>

            {/* Always Visible Bailout Option */}
            <div className="pt-2">
              <button
                disabled={isProcessing}
                onClick={() => setMode('text')}
                className="inline-flex items-center space-x-1.5 text-xs text-teal-400 hover:text-teal-300 font-medium px-3 py-1.5 rounded-lg bg-teal-950/40 border border-teal-500/20 hover:border-teal-500/40 transition disabled:opacity-50"
              >
                <Type className="w-3.5 h-3.5" />
                <span>Prefer typing? Switch to text input</span>
              </button>
            </div>
          </div>

          {/* Transcript Preview Box */}
          {inputText && (
            <div className="text-left bg-charcoal-900/90 border border-charcoal-700/70 rounded-xl p-4 space-y-2">
              <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider block">Transcribed Text</span>
              <p className="text-sm text-charcoal-200 leading-relaxed whitespace-pre-wrap">{inputText}</p>
            </div>
          )}
        </div>
      )}

      {/* Text Mode View */}
      {mode === 'text' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-charcoal-300">
              Write what happened (include time, location, names, quotes if remembered):
            </label>
            {inputText && (
              <span className="text-[10px] text-teal-400 bg-teal-950 px-2 py-0.5 rounded border border-teal-800">
                Preserved from voice
              </span>
            )}
          </div>
          <textarea
            ref={textareaRef}
            disabled={isProcessing}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={7}
            placeholder="e.g. Rohan came to my desk at 4:30 PM in the 4th floor pantry. He stood over me, made unwelcome personal remarks about my appearance, and said..."
            className="w-full bg-charcoal-900 border border-charcoal-700 focus:border-teal-500 rounded-2xl p-4 text-sm text-charcoal-100 placeholder-charcoal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition leading-relaxed disabled:opacity-50"
          />
        </div>
      )}

      {/* Attachment Option */}
      <div className="bg-charcoal-800/40 border border-charcoal-700/50 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Paperclip className="w-5 h-5 text-charcoal-400" />
          <div>
            <span className="text-xs font-medium text-charcoal-200 block">Attach Evidence (Photo / Screenshot)</span>
            <span className="text-[11px] text-charcoal-400">Stored safely on device</span>
          </div>
        </div>

        <label className={`px-3 py-1.5 rounded-lg bg-charcoal-700 text-xs font-medium text-charcoal-200 transition ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-charcoal-600 cursor-pointer'}`}>
          <span>{attachment ? 'Change File' : 'Browse'}</span>
          <input type="file" disabled={isProcessing} accept="image/*,.pdf" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      {attachment && (
        <div className="flex items-center justify-between bg-teal-950/30 border border-teal-500/30 rounded-xl p-3 text-xs">
          <span className="text-teal-300 truncate max-w-[240px]">📎 {attachment.name}</span>
          <button disabled={isProcessing} onClick={() => setAttachment(null)} className="text-charcoal-400 hover:text-accent-rose disabled:opacity-50">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-2 flex items-center space-x-3">
        <button
          disabled={isProcessing}
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-300 font-medium text-sm transition disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleProcessSubmit}
          disabled={!inputText.trim() || isProcessing}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-700 to-teal-600 hover:from-teal-600 hover:to-teal-500 text-white font-medium text-sm transition shadow-lg shadow-teal-900/40 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Structuring...</span>
            </div>
          ) : (
            <>
              <span>Structure & Review</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* MANDATORY REVIEW & EDIT MODAL (Trust Requirement: User MUST confirm before saving) */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-charcoal-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-charcoal-800 border border-charcoal-700 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl my-auto">
            
            <div className="flex items-start justify-between border-b border-charcoal-700 pb-4">
              <div>
                <div className="flex items-center space-x-2 text-teal-400 text-xs font-semibold uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Review AI Draft</span>
                </div>
                <h3 className="text-lg font-semibold text-charcoal-100 mt-1">Verify Extracted Fields</h3>
                
                <p className="text-xs text-teal-300 font-medium mt-1 bg-teal-950/60 border border-teal-500/30 px-3 py-1.5 rounded-lg inline-block">
                  Review what I found — everything here is editable before you save.
                </p>
              </div>
              <button onClick={() => setShowReviewModal(false)} className="text-charcoal-400 hover:text-charcoal-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">

              {/* Date & Time */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-charcoal-300 font-medium">Incident Date & Time</label>
                  {renderFieldBadge('datetime')}
                </div>
                <input
                  type="datetime-local"
                  value={editDatetime}
                  onChange={(e) => {
                    setEditDatetime(e.target.value);
                    markTouched('datetime');
                  }}
                  className={`w-full bg-charcoal-900 border rounded-xl p-2.5 text-charcoal-100 focus:outline-none transition ${
                    touchedFields['datetime'] ? 'border-teal-500/80 ring-1 ring-teal-500/20' : 'border-charcoal-700 focus:border-teal-500'
                  }`}
                />
              </div>

              {/* Location & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-charcoal-300 font-medium">Location</label>
                    {renderFieldBadge('location')}
                  </div>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => {
                      setEditLocation(e.target.value);
                      markTouched('location');
                    }}
                    className={`w-full bg-charcoal-900 border rounded-xl p-2.5 text-charcoal-100 focus:outline-none transition ${
                      touchedFields['location'] ? 'border-teal-500/80 ring-1 ring-teal-500/20' : 'border-charcoal-700 focus:border-teal-500'
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-charcoal-300 font-medium">Category</label>
                    {renderFieldBadge('category')}
                  </div>
                  <select
                    value={editCategory}
                    onChange={(e) => {
                      setEditCategory(e.target.value as CategoryType);
                      markTouched('category');
                    }}
                    className={`w-full bg-charcoal-900 border rounded-xl p-2.5 text-charcoal-100 focus:outline-none transition ${
                      touchedFields['category'] ? 'border-teal-500/80 ring-1 ring-teal-500/20' : 'border-charcoal-700 focus:border-teal-500'
                    }`}
                  >
                    <option value="Verbal">Verbal</option>
                    <option value="Physical">Physical</option>
                    <option value="Digital">Digital</option>
                    <option value="Stalking">Stalking</option>
                    <option value="Quid-Pro-Quo">Quid-Pro-Quo</option>
                    <option value="Financial / Economic">Financial / Economic</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Person Involved */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-charcoal-300 font-medium">Person Involved (Name)</label>
                    {renderFieldBadge('personName')}
                  </div>
                  <input
                    type="text"
                    value={editPersonName}
                    onChange={(e) => {
                      setEditPersonName(e.target.value);
                      markTouched('personName');
                    }}
                    placeholder="e.g. Rohan Sharma"
                    className={`w-full bg-charcoal-900 border rounded-xl p-2.5 text-charcoal-100 focus:outline-none transition ${
                      touchedFields['personName'] ? 'border-teal-500/80 ring-1 ring-teal-500/20' : 'border-charcoal-700 focus:border-teal-500'
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-charcoal-300 font-medium">Role / Relationship</label>
                    {renderFieldBadge('personRole')}
                  </div>
                  <input
                    type="text"
                    value={editPersonRole}
                    onChange={(e) => {
                      setEditPersonRole(e.target.value);
                      markTouched('personRole');
                    }}
                    placeholder="e.g. Manager, Senior Lead"
                    className={`w-full bg-charcoal-900 border rounded-xl p-2.5 text-charcoal-100 focus:outline-none transition ${
                      touchedFields['personRole'] ? 'border-teal-500/80 ring-1 ring-teal-500/20' : 'border-charcoal-700 focus:border-teal-500'
                    }`}
                  />
                </div>
              </div>

              {/* Auto Summary */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-charcoal-300 font-medium">Auto-Generated Summary</label>
                  {renderFieldBadge('summary')}
                </div>
                <input
                  type="text"
                  value={editSummary}
                  onChange={(e) => {
                    setEditSummary(e.target.value);
                    markTouched('summary');
                  }}
                  className={`w-full bg-charcoal-900 border rounded-xl p-2.5 text-charcoal-100 focus:outline-none transition ${
                    touchedFields['summary'] ? 'border-teal-500/80 ring-1 ring-teal-500/20' : 'border-charcoal-700 focus:border-teal-500'
                  }`}
                />
              </div>

              {/* Witnesses */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-charcoal-300 font-medium">Witnesses (Comma Separated)</label>
                  {renderFieldBadge('witnesses')}
                </div>
                <input
                  type="text"
                  value={editWitnesses}
                  onChange={(e) => {
                    setEditWitnesses(e.target.value);
                    markTouched('witnesses');
                  }}
                  placeholder="e.g. Priya Nair, Security Guard"
                  className={`w-full bg-charcoal-900 border rounded-xl p-2.5 text-charcoal-100 focus:outline-none transition ${
                    touchedFields['witnesses'] ? 'border-teal-500/80 ring-1 ring-teal-500/20' : 'border-charcoal-700 focus:border-teal-500'
                  }`}
                />
              </div>

              {/* Severity Rating */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-charcoal-300 font-medium">Self-Rated Severity (1 to 5)</label>
                  {renderFieldBadge('severity')}
                </div>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => {
                        setEditSeverity(rating);
                        markTouched('severity');
                      }}
                      className={`flex-1 py-2 rounded-lg font-medium transition ${
                        editSeverity === rating
                          ? 'bg-teal-600 text-white shadow-md'
                          : 'bg-charcoal-900 text-charcoal-400 border border-charcoal-700'
                      }`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="flex items-center space-x-3 pt-3 border-t border-charcoal-700">
              <button
                onClick={() => setShowReviewModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-charcoal-700 hover:bg-charcoal-600 text-charcoal-200 font-medium text-xs transition"
              >
                Back to Editing Text
              </button>
              <button
                onClick={handleFinalSave}
                className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs transition shadow-lg shadow-teal-900/50 flex items-center justify-center space-x-1"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Save Log</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
