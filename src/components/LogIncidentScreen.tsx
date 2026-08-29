import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Type, Sparkles, Paperclip, CheckCircle2, AlertCircle, Edit3, X, Trash2, ArrowRight, Check, Loader2, MapPin, Camera, Info, HardDrive } from 'lucide-react';
import { Attachment, CategoryType, Incident, PersonInvolved } from '../types';
import { extractIncidentFromRawText } from '../aiEngine';
import { CameraCaptureModal } from './CameraCaptureModal';
import { StorageService } from '../storageService';
import { contributeAnonymousSignal } from '../firebaseService';

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
  const [attachmentsList, setAttachmentsList] = useState<Attachment[]>([]);
  const [voiceAudioAttachment, setVoiceAudioAttachment] = useState<Attachment | null>(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showMicExplainerModal, setShowMicExplainerModal] = useState(false);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const storageInfo = StorageService.getStorageUsageInfo();

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

  // Location capture state
  const [locationOptIn, setLocationOptIn] = useState(false);
  const [capturedCoords, setCapturedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocationDetected, setIsLocationDetected] = useState(false);
  const [contributeSignalOptIn, setContributeSignalOptIn] = useState(false);

  const fetchGeocodedAddress = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
        headers: {
          'Accept-Language': 'en'
        }
      });
      if (!res.ok) throw new Error('Geocoding service error');
      const data = await res.json();
      if (data && data.address) {
        const parts = [
          data.address.amenity || data.address.building || data.address.office || data.address.shop,
          data.address.road || data.address.pedestrian,
          data.address.suburb || data.address.neighbourhood || data.address.quarter,
          data.address.city || data.address.town || data.address.village
        ].filter(Boolean);
        if (parts.length > 0) return parts.join(', ');
      }
      return data?.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (err) {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Couldn't get your location — you can type it manually");
      return;
    }
    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCapturedCoords({ lat, lng });
        setLocationOptIn(true);

        const addr = await fetchGeocodedAddress(lat, lng);
        setEditLocation(addr);
        setIsLocating(false);
        setIsLocationDetected(true);
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError("Location permission denied. You can type location manually below.");
        } else {
          setLocationError("Couldn't detect location. Please type manually.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleClearLocationOptIn = () => {
    setLocationOptIn(false);
    setCapturedCoords(null);
    setContributeSignalOptIn(false);
  };

  // Track which fields user edited inside the review modal
  const [touchedFields, setTouchedFields] = useState<{ [key: string]: boolean }>({});

  const markTouched = (field: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
  };

  // Handle Speech Recognition API setup
  const initSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return null;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let currentTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript + ' ';
      }
      setInputText(currentTranscript.trim());
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setShowMicExplainerModal(true);
      } else if (event.error === 'no-speech') {
        // Subtle non-disruptive note
      } else {
        setSpeechErrorMsg("Voice input interrupted. You can switch to 'Type Notes' anytime.");
      }
    };

    return recognition;
  };

  const handleInitiateRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setShowMicExplainerModal(true);
        return;
      }
      startRecording();
    }
  };

  const startRecording = async () => {
    try {
      setSpeechErrorMsg(null);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          const voiceAtt: Attachment = {
            id: 'voice-' + Math.random().toString(36).substr(2, 6),
            name: `Voice_Log_${new Date().toLocaleTimeString().replace(/\s/g, '')}.webm`,
            type: 'audio',
            dataUrl: base64Audio,
            size: audioBlob.size,
            uploadedAt: new Date().toISOString()
          };
          setVoiceAudioAttachment(voiceAtt);
        };
        reader.readAsDataURL(audioBlob);

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

      const recognition = initSpeechRecognition();
      if (recognition) {
        speechRecognitionRef.current = recognition;
        try {
          recognition.start();
        } catch (err) {
          console.warn('Recognition failed to start directly:', err);
        }
      }

    } catch (err: any) {
      console.error('Error starting audio recording:', err);
      setShowMicExplainerModal(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (err) {
        console.warn('Error stopping speech recognition:', err);
      }
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsRecording(false);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
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
        captureMethod: 'upload'
      };
      setAttachmentsList(prev => [...prev, newAtt]);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraPhotoCaptured = (newAtt: Attachment) => {
    setAttachmentsList(prev => [...prev, newAtt]);
  };

  const handleRemoveAttachment = (attId: string) => {
    setAttachmentsList(prev => prev.filter(a => a.id !== attId));
  };

  // Submit and Trigger Extraction Process
  const handleProcessSubmit = async () => {
    if (!inputText.trim()) return;

    if (isRecording) {
      stopRecording();
    }

    setIsProcessing(true);
    setProcessingMessage('Structuring key facts, dates, and people silently...');

    setTimeout(async () => {
      try {
        const extracted = await extractIncidentFromRawText(inputText);
        setExtractedData(extracted);

        // Populate Editable Modal fields
        setEditDatetime(extracted.incident_datetime ? new Date(extracted.incident_datetime).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16));
        setEditLocation(extracted.location || '');
        setEditCategory(extracted.category || 'Verbal');
        setEditPersonName(extracted.people_involved[0]?.name || '');
        setEditPersonRole(extracted.people_involved[0]?.roleOrRelationship || '');
        setEditSummary(extracted.structured_narrative?.summary || '');
        setEditActions(extracted.structured_narrative?.keyActions || []);
        setEditWitnesses(extracted.witnesses?.join(', ') || '');
        setEditSeverity(extracted.severity_estimate || 3);

        setTouchedFields({});
        setIsProcessing(false);
        setShowReviewModal(true);
      } catch (err) {
        console.error('Error during AI extraction:', err);
        setIsProcessing(false);
      }
    }, 900);
  };

  // User confirms final save in the modal
  const handleFinalSave = async () => {
    if (!extractedData) return;

    const finalPeople: PersonInvolved[] = editPersonName.trim() ? [{
      id: 'p-' + Math.random().toString(36).substr(2, 6),
      name: editPersonName.trim(),
      roleOrRelationship: editPersonRole.trim() || 'Unspecified'
    }] : [];

    const finalWitnesses = editWitnesses
      .split(',')
      .map(w => w.trim())
      .filter(Boolean);

    const finalAttachments = [...attachmentsList];
    if (voiceAudioAttachment) {
      finalAttachments.unshift(voiceAudioAttachment);
    }

    const isUserModified = Object.keys(touchedFields).length > 0;

    const newIncident: Incident = {
      id: 'inc-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      created_at: new Date().toISOString(),
      incident_datetime: editDatetime ? new Date(editDatetime).toISOString() : new Date().toISOString(),
      location: editLocation.trim() || 'Unspecified location',
      latitude: capturedCoords ? capturedCoords.lat : undefined,
      longitude: capturedCoords ? capturedCoords.lng : undefined,
      category: editCategory,
      people_involved: finalPeople,
      witnesses: finalWitnesses,
      narrative_raw: inputText,
      narrative_structured: {
        summary: editSummary.trim() || 'Incident record logged',
        context: 'Logged via NaariSaakshi',
        keyActions: editActions.length > 0 ? editActions : [inputText],
        impactDescription: 'Not specified'
      },
      tags: [],
      severity: editSeverity,
      attachments: finalAttachments,
      user_edited: isUserModified
    };

    if (contributeSignalOptIn && capturedCoords) {
      contributeAnonymousSignal(capturedCoords.lat, capturedCoords.lng, editCategory);
    }

    onSaveIncident(newIncident);
  };

  const renderFieldBadge = (fieldName: string) => {
    const isEdited = touchedFields[fieldName];
    if (isEdited) {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-magenta/20 text-magenta border border-magenta/40 transition">
          <Check className="w-3 h-3 text-magenta" />
          <span>Edited</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-cream text-cream-ink border border-black/10">
        <Sparkles className="w-2.5 h-2.5 text-magenta" />
        <span>AI-suggested</span>
      </span>
    );
  };

  return (
    <div className="w-full space-y-8 pb-28 relative">
      
      {showCameraModal && (
        <CameraCaptureModal
          isOpen={showCameraModal}
          locationText={editLocation}
          onCapture={handleCameraPhotoCaptured}
          onClose={() => setShowCameraModal(false)}
          onFallbackToUpload={() => {
            setShowCameraModal(false);
            fileInputRef.current?.click();
          }}
        />
      )}

      {/* Mic Permission Explanation Modal */}
      {showMicExplainerModal && (
        <div className="fixed inset-0 z-50 bg-bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-black/10 rounded-3xl w-full max-w-md p-8 space-y-6 shadow-2xl text-cream-ink">
            <div className="flex items-center space-x-3 text-magenta">
              <Mic className="w-7 h-7" />
              <h3 className="font-display text-3xl text-cream-ink leading-none">MICROPHONE ACCESS NEEDED</h3>
            </div>
            
            <p className="text-sm text-cream-ink/80 leading-relaxed font-medium">
              Voice recording requires microphone permission. In your browser settings, allow microphone access for this site to record incident audio.
            </p>

            <p className="text-xs text-cream-ink/70 font-medium">
              Alternatively, you can switch to "Type Notes" mode anytime to write your experience.
            </p>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setShowMicExplainerModal(false)}
                className="flex-1 py-3.5 rounded-full border border-black/20 text-cream-ink hover:bg-cream font-bold text-xs uppercase tracking-wider transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowMicExplainerModal(false);
                  setMode('text');
                }}
                className="flex-1 py-3.5 rounded-full bg-magenta hover:bg-magenta-deep text-bg-black font-display font-bold text-base tracking-wider transition shadow-md"
              >
                SWITCH TO TYPING
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="relative rounded-3xl bg-bg-black border border-white/10 p-6 sm:p-8 film-grain overflow-hidden shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-magenta/15 via-violet/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex items-start space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-magenta/20 border border-magenta/40 flex items-center justify-center text-magenta shrink-0 mt-0.5">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display text-4xl sm:text-5xl tracking-wide text-text-light">LOG AN INCIDENT</h1>
            <p className="text-sm text-text-muted mt-1 leading-relaxed">
              "Just say or type what happened in your own words. We'll quietly organize it into a structured, timestamped record for you."
            </p>
          </div>
        </div>
      </div>

      {/* Mode Switcher Buttons */}
      <div className="flex p-1.5 bg-white/5 rounded-full border border-white/10 shadow-sm">
        <button
          disabled={isProcessing}
          onClick={() => {
            setSpeechErrorMsg(null);
            setMode('voice');
          }}
          className={`flex-1 py-3 px-6 rounded-full font-display font-bold text-lg tracking-wider uppercase transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 ${
            mode === 'voice'
              ? 'bg-magenta text-bg-black shadow-lg scale-[1.01]'
              : 'text-text-muted hover:text-text-light'
          }`}
        >
          <Mic className="w-5 h-5" />
          <span>Voice Record</span>
        </button>
        <button
          disabled={isProcessing}
          onClick={() => setMode('text')}
          className={`flex-1 py-3 px-6 rounded-full font-display font-bold text-lg tracking-wider uppercase transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 ${
            mode === 'text'
              ? 'bg-magenta text-bg-black shadow-lg scale-[1.01]'
              : 'text-text-muted hover:text-text-light'
          }`}
        >
          <Type className="w-5 h-5" />
          <span>Type Notes</span>
        </button>
      </div>

      {/* Inline Fallback Message Banner */}
      {speechErrorMsg && (
        <div className="bg-amber-950/80 border border-amber-500/50 rounded-2xl p-4 text-xs text-amber-200 flex items-center justify-between shadow-sm animate-fade-in">
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
        <div className="bg-bg-black border border-white/10 rounded-3xl p-8 text-center space-y-6 film-grain shadow-xl">
          <div className="flex flex-col items-center justify-center space-y-5">
            
            {/* Pulsing Mic Button */}
            <button
              disabled={isProcessing}
              onClick={handleInitiateRecording}
              className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 transform active:scale-95 border-4 shadow-2xl disabled:opacity-50 ${
                isRecording
                  ? 'bg-magenta text-bg-black border-magenta/40 animate-pulse ring-8 ring-magenta/20 scale-105'
                  : 'bg-magenta text-bg-black border-magenta/40 hover:bg-magenta-deep hover:scale-105'
              }`}
            >
              {isRecording ? <MicOff className="w-14 h-14" /> : <Mic className="w-14 h-14" />}
            </button>

            <div>
              {isRecording ? (
                <div className="space-y-1">
                  <span className="inline-block px-4 py-1.5 rounded-full bg-magenta/20 text-magenta text-xs font-bold tracking-wide uppercase">
                    Recording Live ({formatTime(recordingSeconds)})
                  </span>
                  <p className="text-xs text-text-muted mt-1">Speak naturally. Tap button again when finished.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <span className="font-display text-2xl text-text-light block">TAP TO START RECORDING VOICE</span>
                  <p className="text-xs text-text-muted">Speech is auto-transcribed securely on your device</p>
                </div>
              )}
            </div>

            {/* Always Visible Bailout Option */}
            <div className="pt-2">
              <button
                disabled={isProcessing}
                onClick={() => setMode('text')}
                className="inline-flex items-center space-x-2 text-xs text-magenta hover:text-text-light font-bold px-5 py-2.5 rounded-full bg-white/5 border border-magenta/40 transition disabled:opacity-50"
              >
                <Type className="w-4 h-4" />
                <span>Prefer typing? Switch to text input</span>
              </button>
            </div>
          </div>

          {/* Transcript Preview Box */}
          {inputText && (
            <div className="text-left bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2">
              <span className="text-xs font-display tracking-wider text-magenta uppercase block">Transcribed Text</span>
              <p className="text-sm text-text-light leading-relaxed whitespace-pre-wrap">{inputText}</p>
            </div>
          )}
        </div>
      )}

      {/* Text Mode View */}
      {mode === 'text' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider">
              Write what happened (include time, location, names, quotes if remembered):
            </label>
            {inputText && (
              <span className="text-[10px] text-magenta bg-white/5 px-3 py-1 rounded-full border border-magenta/40 font-bold">
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
            className="w-full bg-white/5 border border-white/10 focus:border-magenta rounded-3xl p-5 text-sm sm:text-base text-text-light placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-magenta/20 transition-all leading-relaxed disabled:opacity-50 shadow-inner"
          />
        </div>
      )}

      {/* Evidentiary Attachment Options */}
      <div className="bg-bg-black border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-display tracking-wider text-text-light uppercase">
            <Paperclip className="w-4 h-4 text-magenta" />
            <span>Evidentiary Attachments</span>
          </div>
          <span className="text-[10px] font-mono text-text-muted">Stored locally on device</span>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => setShowCameraModal(true)}
            className="px-4 py-2.5 rounded-full bg-magenta/15 hover:bg-magenta/25 border border-magenta/40 text-magenta text-xs font-bold flex items-center space-x-2 transition disabled:opacity-50"
          >
            <Camera className="w-4 h-4" />
            <span>Take Watermarked Photo</span>
          </button>

          <label className={`px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-text-light text-xs font-bold flex items-center space-x-2 transition cursor-pointer ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <Paperclip className="w-4 h-4 text-magenta" />
            <span>Upload File / Image</span>
            <input
              ref={fileInputRef}
              type="file"
              disabled={isProcessing}
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* List Attached Items */}
        <div className="space-y-2 pt-1">
          {voiceAudioAttachment && (
            <div className="flex items-center justify-between bg-white/5 border border-magenta/40 rounded-2xl p-4 text-xs">
              <div className="flex items-center space-x-3 text-magenta font-semibold">
                <Mic className="w-5 h-5 text-magenta shrink-0" />
                <div className="truncate max-w-[240px]">
                  <span className="font-bold block text-sm">🎙️ Original Voice Recording</span>
                  <span className="text-[10px] font-mono text-text-muted">Raw audio preserved alongside transcript</span>
                </div>
              </div>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setVoiceAudioAttachment(null)}
                className="text-text-muted hover:text-magenta transition disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {attachmentsList.map((att) => (
            <div key={att.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-4 text-xs">
              <div className="flex items-center space-x-3 truncate pr-2">
                {att.isLiveCapture ? (
                  <Camera className="w-5 h-5 text-magenta shrink-0" />
                ) : (
                  <Paperclip className="w-5 h-5 text-text-muted shrink-0" />
                )}
                <div className="truncate">
                  <span className="text-text-light font-bold text-sm block truncate">{att.name}</span>
                  {att.isLiveCapture && (
                    <span className="text-[10px] text-magenta font-mono font-semibold">📷 Live Watermarked Photo</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleRemoveAttachment(att.id)}
                className="text-text-muted hover:text-magenta transition disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Storage usage note */}
      {storageInfo && (
        <div className="flex items-center space-x-2 text-[11px] text-text-muted px-2 font-mono">
          <HardDrive className="w-3.5 h-3.5 text-magenta shrink-0" />
          <span>Local storage used: {(storageInfo.usedBytes / 1024).toFixed(1)} KB</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-4 flex items-center space-x-4">
        <button
          disabled={isProcessing}
          onClick={onCancel}
          className="flex-1 py-4 rounded-full border-2 border-magenta/50 text-magenta hover:bg-magenta/10 font-display font-bold text-lg tracking-wider uppercase transition disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleProcessSubmit}
          disabled={!inputText.trim() || isProcessing}
          className="flex-1 py-4 rounded-full bg-magenta hover:bg-magenta-deep text-bg-black font-display font-bold text-lg tracking-wider uppercase transition shadow-xl shadow-magenta/30 hover:scale-[1.01] flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Structuring...</span>
            </div>
          ) : (
            <>
              <span>Structure & Review</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>

      {/* Processing State Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="bg-bg-black border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-2xl film-grain">
            <div className="w-14 h-14 rounded-full bg-magenta/20 border border-magenta/40 flex items-center justify-center text-magenta mx-auto">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display text-2xl text-text-light">{processingMessage}</h3>
              <p className="text-xs text-text-muted">Extracting facts, dates, and people silently...</p>
            </div>
          </div>
        </div>
      )}

      {/* MANDATORY REVIEW & EDIT MODAL (Trust Requirement) - High Contrast Cream Theme */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-black/10 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-8 space-y-6 shadow-2xl my-auto text-cream-ink">
            
            <div className="flex items-start justify-between border-b border-black/10 pb-4">
              <div>
                <div className="flex items-center space-x-2 text-magenta font-display text-lg tracking-wider uppercase">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>REVIEW AI DRAFT</span>
                </div>
                <h3 className="font-display text-3xl text-cream-ink mt-1 leading-none">VERIFY EXTRACTED FIELDS</h3>
                
                <p className="text-xs text-cream-ink/80 font-semibold mt-2 bg-cream border border-black/10 px-4 py-1.5 rounded-full inline-block">
                  Review what I found — everything here is editable before you save.
                </p>
              </div>
              <button onClick={() => setShowReviewModal(false)} className="text-cream-ink/60 hover:text-cream-ink font-bold text-xl">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-medium">

              {/* Date & Time */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-cream-ink font-bold uppercase tracking-wider">Incident Date & Time</label>
                  {renderFieldBadge('datetime')}
                </div>
                <input
                  type="datetime-local"
                  value={editDatetime}
                  onChange={(e) => {
                    setEditDatetime(e.target.value);
                    markTouched('datetime');
                  }}
                  className="w-full bg-cream/40 border border-black/10 rounded-2xl p-3.5 text-cream-ink font-semibold focus:outline-none focus:border-magenta focus:bg-white transition-all shadow-inner"
                />
              </div>

              {/* Location & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-cream-ink font-bold uppercase tracking-wider">Location</label>
                    {renderFieldBadge('location')}
                  </div>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editLocation}
                      onChange={(e) => {
                        setEditLocation(e.target.value);
                        markTouched('location');
                      }}
                      placeholder="e.g. 4th Floor Conference Room"
                      className="w-full bg-cream/40 border border-black/10 rounded-2xl p-3.5 text-cream-ink font-semibold focus:outline-none focus:border-magenta focus:bg-white transition-all shadow-inner"
                    />

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={isLocating}
                        className="inline-flex items-center space-x-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-magenta text-bg-black transition disabled:opacity-50 shadow-sm"
                      >
                        {isLocating ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Locating...</span>
                          </>
                        ) : (
                          <>
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{locationOptIn ? '📍 Location Captured' : 'Use my current location'}</span>
                          </>
                        )}
                      </button>

                      {locationOptIn && (
                        <button
                          type="button"
                          onClick={handleClearLocationOptIn}
                          className="text-[10px] text-cream-ink/60 hover:text-magenta font-bold transition"
                        >
                          Remove coordinates
                        </button>
                      )}
                    </div>

                    {locationOptIn && capturedCoords && (
                      <div className="bg-cream p-3 rounded-2xl border border-black/10 space-y-1 mt-2">
                        <label className="flex items-start space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={contributeSignalOptIn}
                            onChange={(e) => setContributeSignalOptIn(e.target.checked)}
                            className="mt-0.5 rounded bg-white border-black/20 text-magenta focus:ring-magenta shrink-0"
                          />
                          <span className="text-[11px] text-cream-ink/80 leading-snug font-medium">
                            Anonymously contribute location to a shared safety signal map nearby (+1 count only).
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-cream-ink font-bold uppercase tracking-wider">Category</label>
                    {renderFieldBadge('category')}
                  </div>
                  <select
                    value={editCategory}
                    onChange={(e) => {
                      setEditCategory(e.target.value as CategoryType);
                      markTouched('category');
                    }}
                    className="w-full bg-cream/40 border border-black/10 rounded-2xl p-3.5 text-cream-ink font-bold focus:outline-none focus:border-magenta focus:bg-white transition-all shadow-inner"
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

              {/* Person Involved */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-cream-ink font-bold uppercase tracking-wider">Person Involved (Name)</label>
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
                    className="w-full bg-cream/40 border border-black/10 rounded-2xl p-3.5 text-cream-ink font-semibold focus:outline-none focus:border-magenta focus:bg-white transition-all shadow-inner"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-cream-ink font-bold uppercase tracking-wider">Role / Relationship</label>
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
                    className="w-full bg-cream/40 border border-black/10 rounded-2xl p-3.5 text-cream-ink font-semibold focus:outline-none focus:border-magenta focus:bg-white transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Auto Summary */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-cream-ink font-bold uppercase tracking-wider">Auto-Generated Summary</label>
                  {renderFieldBadge('summary')}
                </div>
                <input
                  type="text"
                  value={editSummary}
                  onChange={(e) => {
                    setEditSummary(e.target.value);
                    markTouched('summary');
                  }}
                  className="w-full bg-cream/40 border border-black/10 rounded-2xl p-3.5 text-cream-ink font-semibold focus:outline-none focus:border-magenta focus:bg-white transition-all shadow-inner"
                />
              </div>

              {/* Witnesses */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-cream-ink font-bold uppercase tracking-wider">Witnesses (Comma Separated)</label>
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
                  className="w-full bg-cream/40 border border-black/10 rounded-2xl p-3.5 text-cream-ink font-semibold focus:outline-none focus:border-magenta focus:bg-white transition-all shadow-inner"
                />
              </div>

              {/* Severity Rating */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-cream-ink font-bold uppercase tracking-wider">Self-Rated Severity (1 to 5)</label>
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
                      className={`flex-1 py-3 rounded-xl font-bold transition-all shadow-sm ${
                        editSeverity === rating
                          ? 'bg-magenta text-bg-black shadow-md scale-105'
                          : 'bg-cream/50 text-cream-ink border border-black/10 hover:bg-cream'
                      }`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="flex items-center space-x-3 pt-4 border-t border-black/10">
              <button
                onClick={() => setShowReviewModal(false)}
                className="flex-1 py-3.5 rounded-full border border-black/20 text-cream-ink hover:bg-cream font-bold text-xs uppercase tracking-wider transition"
              >
                Back to Editing Text
              </button>
              <button
                onClick={handleFinalSave}
                className="flex-1 py-3.5 rounded-full bg-magenta hover:bg-magenta-deep text-bg-black font-display font-bold text-base tracking-wider transition shadow-lg flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>CONFIRM & SAVE LOG</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};