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
        setIsLocationDetected(true);

        const address = await fetchGeocodedAddress(lat, lng);
        setEditLocation(address);
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation failed:', err);
        setLocationError("Couldn't get your location — you can type it manually");
        setIsLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleClearLocationOptIn = () => {
    setLocationOptIn(false);
    setCapturedCoords(null);
    setIsLocationDetected(false);
  };

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

  const handleInitiateRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      setShowMicExplainerModal(true);
    }
  };

  const startRecording = async () => {
    try {
      setShowMicExplainerModal(false);
      setRecordingSeconds(0);
      setIsRecording(true);
      setSpeechErrorMsg(null);
      audioChunksRef.current = [];

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

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          if (audioChunksRef.current.length > 0) {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.onloadend = () => {
              const audioBase64 = reader.result as string;
              setVoiceAudioAttachment({
                id: 'att-voice-' + Math.random().toString(36).substr(2, 6),
                name: `Original_Voice_Recording_${new Date().toISOString().slice(0, 10)}.webm`,
                type: 'audio',
                dataUrl: audioBase64,
                size: audioBlob.size,
                uploadedAt: new Date().toISOString(),
                isLiveCapture: true,
                captureMethod: 'voice_recording'
              });
            };
            reader.readAsDataURL(audioBlob);
          }
        };

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
      setAttachmentsList(prev => [...prev, newAtt]);
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
  };

  const handleAddCapturedPhoto = (newPhotoAtt: Attachment) => {
    setAttachmentsList(prev => [...prev, newPhotoAtt]);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachmentsList(prev => prev.filter(a => a.id !== id));
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
      ...(locationOptIn && capturedCoords ? { latitude: capturedCoords.lat, longitude: capturedCoords.lng } : {}),
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
      attachments: [
        ...attachmentsList,
        ...(voiceAudioAttachment ? [voiceAudioAttachment] : [])
      ],
      user_edited: Object.keys(touchedFields).length > 0,
      tags: [editCategory, ...(people[0]?.name ? [people[0].name] : [])]
    };

    if (contributeSignalOptIn && locationOptIn && capturedCoords) {
      contributeAnonymousSignal(capturedCoords.lat, capturedCoords.lng, editCategory);
    }

    onSaveIncident(newIncident);
  };

  const renderFieldBadge = (fieldName: string) => {
    if (fieldName === 'location' && isLocationDetected && !touchedFields['location']) {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-950 text-teal-300 border border-teal-700/60 transition">
          <span>📍 Detected</span>
        </span>
      );
    }
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
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-magenta border border-white/10">
        <Sparkles className="w-2.5 h-2.5 text-magenta" />
        <span>AI-suggested</span>
      </span>
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28 space-y-6">
      
      {/* Processing State Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="bg-bg-black border border-white/10 rounded-2xl p-8 max-w-sm w-full text-center space-y-4 shadow-2xl film-grain">
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

      {/* Storage Size Awareness Banner */}
      {storageInfo.isLowStorage && (
        <div className="bg-amber-950/90 border border-amber-500/60 rounded-xl p-3 text-xs text-amber-200 flex items-center space-x-2 shadow-md">
          <HardDrive className="w-4 h-4 text-amber-400 shrink-0" />
          <span>You're running low on local storage ({storageInfo.usedMB} MB used) — consider exporting and clearing older entries.</span>
        </div>
      )}

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={showCameraModal}
        locationText={editLocation}
        onCapture={handleAddCapturedPhoto}
        onClose={() => setShowCameraModal(false)}
        onFallbackToUpload={() => {
          setSpeechErrorMsg("Camera access needed to take a photo — you can upload one instead");
          fileInputRef.current?.click();
        }}
      />

      {/* Microphone Explainer Modal */}
      {showMicExplainerModal && (
        <div className="fixed inset-0 z-50 bg-charcoal-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-charcoal-800 border border-charcoal-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-teal-400">
              <Mic className="w-6 h-6" />
              <h3 className="text-base font-semibold text-charcoal-100">Microphone Access Needed</h3>
            </div>
            <p className="text-xs text-charcoal-300 leading-relaxed">
              EvidenceHer needs microphone access to record audio and auto-transcribe it. Your audio stays private on your device.
            </p>
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setShowMicExplainerModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-charcoal-700 hover:bg-charcoal-600 text-charcoal-200 font-medium text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={startRecording}
                className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs transition shadow-md flex items-center justify-center space-x-1"
              >
                <Mic className="w-4 h-4" />
                <span>Start Voice Recording</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner Nudge */}
      <div className="relative rounded-2xl bg-bg-black border border-white/10 p-5 film-grain overflow-hidden shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-magenta/15 via-violet/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex items-start space-x-3">
          <div className="w-10 h-10 rounded-xl bg-magenta/20 border border-magenta/40 flex items-center justify-center text-magenta shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-3xl tracking-wide text-text-light">LOG AN INCIDENT</h1>
            <p className="text-sm text-text-muted mt-1 leading-relaxed">
              "Just say or type what happened in your own words. We'll quietly organize it into a structured, timestamped record for you."
            </p>
          </div>
        </div>
      </div>

      {/* Mode Switcher Buttons */}
      <div className="flex p-1.5 bg-white/5 rounded-full border border-white/10">
        <button
          disabled={isProcessing}
          onClick={() => {
            setSpeechErrorMsg(null);
            setMode('voice');
          }}
          className={`flex-1 py-2.5 px-4 rounded-full text-xs font-semibold uppercase tracking-wider transition flex items-center justify-center space-x-2 disabled:opacity-50 ${
            mode === 'voice'
              ? 'bg-magenta text-bg-black shadow-md'
              : 'text-text-muted hover:text-text-light'
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>Voice Record</span>
        </button>
        <button
          disabled={isProcessing}
          onClick={() => setMode('text')}
          className={`flex-1 py-2.5 px-4 rounded-full text-xs font-semibold uppercase tracking-wider transition flex items-center justify-center space-x-2 disabled:opacity-50 ${
            mode === 'text'
              ? 'bg-magenta text-bg-black shadow-md'
              : 'text-text-muted hover:text-text-light'
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
        <div className="bg-bg-black border border-white/10 rounded-2xl p-6 text-center space-y-6 film-grain">
          <div className="flex flex-col items-center justify-center space-y-4">
            
            {/* Pulsing Mic Button */}
            <button
              disabled={isProcessing}
              onClick={handleInitiateRecording}
              className={`w-28 h-28 rounded-full flex items-center justify-center transition-all transform active:scale-95 border-4 shadow-xl disabled:opacity-50 ${
                isRecording
                  ? 'bg-magenta text-bg-black border-magenta/40 animate-pulse ring-8 ring-magenta/20'
                  : 'bg-magenta text-bg-black border-magenta/40 hover:bg-magenta-deep'
              }`}
            >
              {isRecording ? <MicOff className="w-12 h-12" /> : <Mic className="w-12 h-12" />}
            </button>

            <div>
              {isRecording ? (
                <div className="space-y-1">
                  <span className="inline-block px-3.5 py-1 rounded-full bg-magenta/20 text-magenta text-xs font-semibold tracking-wide uppercase">
                    Recording Live ({formatTime(recordingSeconds)})
                  </span>
                  <p className="text-xs text-text-muted">Speak naturally. Tap button again when finished.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <span className="text-sm font-semibold text-text-light block">Tap to start recording voice</span>
                  <p className="text-xs text-text-muted">Speech is auto-transcribed securely on your device</p>
                </div>
              )}
            </div>

            {/* Always Visible Bailout Option */}
            <div className="pt-2">
              <button
                disabled={isProcessing}
                onClick={() => setMode('text')}
                className="inline-flex items-center space-x-1.5 text-xs text-magenta hover:text-text-light font-semibold px-4 py-2 rounded-full bg-white/5 border border-magenta/40 transition disabled:opacity-50"
              >
                <Type className="w-3.5 h-3.5" />
                <span>Prefer typing? Switch to text input</span>
              </button>
            </div>
          </div>

          {/* Transcript Preview Box */}
          {inputText && (
            <div className="text-left bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
              <span className="text-xs font-display tracking-wider text-magenta uppercase block">Transcribed Text</span>
              <p className="text-sm text-text-light leading-relaxed whitespace-pre-wrap">{inputText}</p>
            </div>
          )}
        </div>
      )}

      {/* Text Mode View */}
      {mode === 'text' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-text-muted">
              Write what happened (include time, location, names, quotes if remembered):
            </label>
            {inputText && (
              <span className="text-[10px] text-magenta bg-white/5 px-2 py-0.5 rounded-full border border-magenta/40">
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
            className="w-full bg-white/5 border border-white/10 focus:border-magenta rounded-2xl p-4 text-sm text-text-light placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-magenta/20 transition-all leading-relaxed disabled:opacity-50"
          />
        </div>
      )}

      {/* Evidentiary Attachment Options */}
      <div className="bg-bg-black border border-white/10 rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-semibold text-text-light uppercase tracking-wider">
            <Paperclip className="w-4 h-4 text-magenta" />
            <span>Evidentiary Attachments</span>
          </div>
          <span className="text-[10px] text-text-muted">Stored locally on device</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => setShowCameraModal(true)}
            className="px-3.5 py-2 rounded-full bg-magenta/15 hover:bg-magenta/25 border border-magenta/40 text-magenta text-xs font-semibold flex items-center space-x-1.5 transition disabled:opacity-50"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Take Watermarked Photo</span>
          </button>

          <label className={`px-3.5 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-text-light text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <Paperclip className="w-3.5 h-3.5 text-magenta" />
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
            <div className="flex items-center justify-between bg-white/5 border border-magenta/40 rounded-xl p-3 text-xs">
              <div className="flex items-center space-x-2 text-magenta font-semibold">
                <Mic className="w-4 h-4 text-magenta shrink-0" />
                <div className="truncate max-w-[240px]">
                  <span className="font-semibold block">🎙️ Original Voice Recording</span>
                  <span className="text-[10px] text-text-muted">Raw audio preserved alongside transcript</span>
                </div>
              </div>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setVoiceAudioAttachment(null)}
                className="text-text-muted hover:text-magenta disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {attachmentsList.map((att) => (
            <div key={att.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-3 text-xs">
              <div className="flex items-center space-x-2 truncate pr-2">
                {att.isLiveCapture ? (
                  <Camera className="w-4 h-4 text-magenta shrink-0" />
                ) : (
                  <Paperclip className="w-4 h-4 text-text-muted shrink-0" />
                )}
                <div className="truncate">
                  <span className="text-text-light font-semibold block truncate">{att.name}</span>
                  {att.isLiveCapture && (
                    <span className="text-[10px] text-magenta font-mono">📷 Live Watermarked Photo</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleRemoveAttachment(att.id)}
                className="text-text-muted hover:text-magenta disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex items-center space-x-3">
        <button
          disabled={isProcessing}
          onClick={onCancel}
          className="flex-1 py-3.5 rounded-full border border-magenta/50 text-magenta hover:bg-magenta/10 font-semibold text-xs uppercase tracking-wider transition disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleProcessSubmit}
          disabled={!inputText.trim() || isProcessing}
          className="flex-1 py-3.5 rounded-full bg-magenta hover:bg-magenta-deep text-bg-black font-semibold text-xs uppercase tracking-wider transition shadow-lg shadow-magenta/20 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="fixed inset-0 z-50 bg-bg-black/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-bg-black border border-white/10 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl my-auto">
            
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center space-x-2 text-magenta text-xs font-display tracking-wider uppercase">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Review AI Draft</span>
                </div>
                <h3 className="font-display text-2xl text-text-light mt-1">VERIFY EXTRACTED FIELDS</h3>
                
                <p className="text-xs text-text-muted font-medium mt-1 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full inline-block">
                  Review what I found — everything here is editable before you save.
                </p>
              </div>
              <button onClick={() => setShowReviewModal(false)} className="text-text-muted hover:text-text-light">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">

              {/* Date & Time */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-text-muted font-semibold">Incident Date & Time</label>
                  {renderFieldBadge('datetime')}
                </div>
                <input
                  type="datetime-local"
                  value={editDatetime}
                  onChange={(e) => {
                    setEditDatetime(e.target.value);
                    markTouched('datetime');
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-text-light focus:outline-none focus:border-magenta transition-all"
                />
              </div>

              {/* Location & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-text-muted font-semibold">Location</label>
                    {renderFieldBadge('location')}
                  </div>
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={editLocation}
                      onChange={(e) => {
                        setEditLocation(e.target.value);
                        markTouched('location');
                      }}
                      placeholder="e.g. 4th Floor Conference Room"
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-text-light focus:outline-none focus:border-magenta transition-all"
                    />

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={isLocating}
                        className="inline-flex items-center space-x-1.5 text-[11px] font-semibold px-3 py-1 rounded-full bg-magenta/15 hover:bg-magenta/25 text-magenta border border-magenta/40 transition disabled:opacity-50"
                      >
                        {isLocating ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Locating...</span>
                          </>
                        ) : (
                          <>
                            <MapPin className="w-3 h-3" />
                            <span>{locationOptIn ? '📍 Location Captured (Update)' : 'Use my current location'}</span>
                          </>
                        )}
                      </button>

                      {locationOptIn && (
                        <button
                          type="button"
                          onClick={handleClearLocationOptIn}
                          className="text-[10px] text-text-muted hover:text-magenta transition"
                        >
                          Remove coordinates
                        </button>
                      )}
                    </div>

                    {locationError && (
                      <p className="text-[11px] text-amber-400 mt-1 flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3 inline shrink-0 mr-1" />
                        <span>{locationError}</span>
                      </p>
                    )}

                    <p className="text-[10px] text-text-muted leading-tight">
                      Location is optional and only used to help you spot patterns — it's never shared unless you export a report.
                    </p>

                    {locationOptIn && capturedCoords && (
                      <div className="bg-white/5 border border-magenta/30 p-2.5 rounded-xl space-y-1 mt-2">
                        <label className="flex items-start space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={contributeSignalOptIn}
                            onChange={(e) => setContributeSignalOptIn(e.target.checked)}
                            className="mt-0.5 rounded bg-bg-black border-white/20 text-magenta focus:ring-magenta shrink-0"
                          />
                          <span className="text-[11px] text-text-muted leading-snug">
                            Anonymously contribute this incident's location and category to a shared safety signal for other users nearby. Your name, details, and identity are never included — only an anonymous count.
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-text-muted font-semibold">Category</label>
                    {renderFieldBadge('category')}
                  </div>
                  <select
                    value={editCategory}
                    onChange={(e) => {
                      setEditCategory(e.target.value as CategoryType);
                      markTouched('category');
                    }}
                    className="w-full bg-bg-black border border-white/10 rounded-xl p-3 text-text-light focus:outline-none focus:border-magenta transition-all"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-text-muted font-semibold">Person Involved (Name)</label>
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
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-text-light focus:outline-none focus:border-magenta transition-all"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-text-muted font-semibold">Role / Relationship</label>
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
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-text-light focus:outline-none focus:border-magenta transition-all"
                  />
                </div>
              </div>

              {/* Auto Summary */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-text-muted font-semibold">Auto-Generated Summary</label>
                  {renderFieldBadge('summary')}
                </div>
                <input
                  type="text"
                  value={editSummary}
                  onChange={(e) => {
                    setEditSummary(e.target.value);
                    markTouched('summary');
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-text-light focus:outline-none focus:border-magenta transition-all"
                />
              </div>

              {/* Witnesses */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-text-muted font-semibold">Witnesses (Comma Separated)</label>
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
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-text-light focus:outline-none focus:border-magenta transition-all"
                />
              </div>

              {/* Severity Rating */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-text-muted font-semibold">Self-Rated Severity (1 to 5)</label>
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
                      className={`flex-1 py-2 rounded-xl font-semibold transition-all ${
                        editSeverity === rating
                          ? 'bg-magenta text-bg-black shadow-md'
                          : 'bg-white/5 text-text-muted border border-white/10'
                      }`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="flex items-center space-x-3 pt-3 border-t border-white/10">
              <button
                onClick={() => setShowReviewModal(false)}
                className="flex-1 py-3 rounded-full border border-magenta/50 text-magenta hover:bg-magenta/10 font-semibold text-xs uppercase tracking-wider transition"
              >
                Back to Editing Text
              </button>
              <button
                onClick={handleFinalSave}
                className="flex-1 py-3 rounded-full bg-magenta hover:bg-magenta-deep text-bg-black font-semibold text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center space-x-1"
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
