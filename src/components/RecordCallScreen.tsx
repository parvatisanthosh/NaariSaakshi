import React, { useState, useEffect, useRef } from 'react';
import { PhoneCall, Mic, Square, ShieldCheck, AlertCircle, Info, ArrowRight, Check, Loader2, Sparkles, Volume2 } from 'lucide-react';
import { Incident, Attachment, CategoryType } from '../types';
import { extractIncidentFromRawText } from '../aiEngine';

interface RecordCallScreenProps {
  onSaveCallIncident: (incident: Incident) => void;
  onCancel: () => void;
}

export const LEGAL_CALL_RECORDING_INFO = {
  headline: "One-Party Consent & Speakerphone Guidance",
  mainNotice: "You can legally record calls you're personally part of in India without telling the other person, under a longstanding Supreme Court ruling. This does not apply to recording conversations you're not part of. For best audio quality, put your call on speakerphone before starting.",
  legalNotice: "Laws can vary by context and this isn't legal advice — if you plan to use a recording formally (HR complaint, police, court), consider asking a lawyer or your ICC about certification requirements for the recording to be used as evidence."
};

export const RecordCallScreen: React.FC<RecordCallScreenProps> = ({
  onSaveCallIncident,
  onCancel
}) => {
  const [step, setStep] = useState<'info' | 'recording' | 'describe' | 'review'>('info');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [userDescription, setUserDescription] = useState('');
  const [callAudioAttachment, setCallAudioAttachment] = useState<Attachment | null>(null);

  // Editable Form fields inside Review Modal
  const [editDatetime, setEditDatetime] = useState('');
  const [editLocation, setEditLocation] = useState('Phone Call / Speakerphone');
  const [editCategory, setEditCategory] = useState<CategoryType>('Verbal');
  const [editPersonName, setEditPersonName] = useState('');
  const [editPersonRole, setEditPersonRole] = useState('');
  const [editSummary, setEditSummary] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const speechRecognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  const startCallRecording = async () => {
    try {
      setStep('recording');
      setIsRecording(true);
      setRecordingSeconds(0);
      setLiveTranscript('');
      audioChunksRef.current = [];

      // Web Speech API for live rough transcript
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const rec = new SpeechRecognition();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = 'en-US';

          rec.onresult = (event: any) => {
            let current = '';
            for (let i = 0; i < event.results.length; i++) {
              current += event.results[i][0].transcript + ' ';
            }
            setLiveTranscript(current.trim());
          };

          speechRecognitionRef.current = rec;
          rec.start();
        } catch (e) {
          console.warn('Speech recognition start error:', e);
        }
      }

      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

      // MediaRecorder for raw audio capture
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          if (audioChunksRef.current.length > 0) {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.onloadend = () => {
              const audioBase64 = reader.result as string;
              setCallAudioAttachment({
                id: 'att-call-' + Math.random().toString(36).substr(2, 6),
                name: `Call_Recording_${new Date().toISOString().slice(0, 10)}.webm`,
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
          // Stop audio tracks
          stream.getTracks().forEach(t => t.stop());
        };

        recorder.start();
      }
    } catch (err) {
      console.warn('Call recording microphone error:', err);
      alert('Microphone access is required to record call audio.');
      setStep('info');
    }
  };

  const stopCallRecording = () => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);

    if (speechRecognitionRef.current) {
      try { speechRecognitionRef.current.stop(); } catch (e) {}
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    setStep('describe');
  };

  const handleProcessDescriptionAndStructure = () => {
    const fullTextToProcess = `${userDescription}. ${liveTranscript ? `Transcript: ${liveTranscript}` : ''}`;
    const extracted = extractIncidentFromRawText(fullTextToProcess || 'Phone call recording saved.');

    setEditDatetime(new Date().toISOString().slice(0, 16));
    setEditLocation(extracted.location || 'Phone Call / Speakerphone');
    setEditCategory(extracted.category || 'Verbal');
    setEditPersonName(extracted.people_involved[0]?.name || 'Individual on Call');
    setEditPersonRole(extracted.people_involved[0]?.roleOrRelationship || 'Caller');
    setEditSummary(extracted.structured_narrative.summary || 'Phone call recording logged');

    setStep('review');
  };

  const handleFinalSave = () => {
    const rawNarrativeText = userDescription.trim() 
      ? userDescription 
      : 'Call recording saved as primary evidence.';

    const newIncident: Incident = {
      id: 'inc-call-' + Math.random().toString(36).substr(2, 8),
      created_at: new Date().toISOString(),
      incident_datetime: editDatetime ? new Date(editDatetime).toISOString() : new Date().toISOString(),
      location: editLocation || 'Phone Call / Speakerphone',
      people_involved: editPersonName ? [{
        id: 'p-1',
        name: editPersonName,
        roleOrRelationship: editPersonRole || 'Individual on Call'
      }] : [],
      category: editCategory,
      narrative_raw: rawNarrativeText,
      narrative_structured: {
        summary: editSummary || 'Phone call recording logged',
        context: 'Phone call recorded on speakerphone for supporting documentation.',
        keyActions: [
          'Raw call audio recorded and attached as evidence.',
          ...(liveTranscript ? [`Automated transcript snippet: "${liveTranscript.slice(0, 100)}..."`] : [])
        ],
        impactDescription: 'Call evidence recorded to preserve exact statements.',
        recommendedFollowUp: 'Preserve raw audio file and review transcript details.'
      },
      witnesses: [],
      attachments: callAudioAttachment ? [callAudioAttachment] : [],
      user_edited: true,
      tags: ['Call Recording']
    };

    onSaveCallIncident(newIncident);
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 pb-28 space-y-5">
      
      {/* Step 1: Legal Framing & Guidance Card */}
      {step === 'info' && (
        <div className="bg-charcoal-800 border border-charcoal-700 rounded-3xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center space-x-3 text-teal-400">
            <div className="w-10 h-10 rounded-full bg-teal-950 border border-teal-500/40 flex items-center justify-center">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-charcoal-100">Record a Call</h2>
              <span className="text-xs text-charcoal-400">One-Party Consent Guidance</span>
            </div>
          </div>

          <div className="bg-charcoal-900/90 border border-teal-500/30 p-4 rounded-2xl space-y-3 text-xs text-charcoal-200 leading-relaxed">
            <div className="flex items-center space-x-2 text-teal-300 font-semibold">
              <Volume2 className="w-4 h-4 shrink-0 text-teal-400" />
              <span>Put your call on speakerphone</span>
            </div>
            <p className="text-charcoal-300">
              {LEGAL_CALL_RECORDING_INFO.mainNotice}
            </p>
          </div>

          <p className="text-[11px] text-charcoal-400 italic leading-snug">
            {LEGAL_CALL_RECORDING_INFO.legalNotice}
          </p>

          <div className="flex items-center space-x-3 pt-2">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl bg-charcoal-700 hover:bg-charcoal-600 text-charcoal-200 font-medium text-xs transition"
            >
              Cancel
            </button>
            <button
              onClick={startCallRecording}
              className="flex-1 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition shadow-lg shadow-teal-950/60 flex items-center justify-center space-x-1.5"
            >
              <Mic className="w-4 h-4" />
              <span>Start Call Recording</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Live Recording Screen */}
      {step === 'recording' && (
        <div className="bg-charcoal-800 border border-charcoal-700 rounded-3xl p-6 space-y-6 shadow-2xl text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-mono">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></div>
            <span>RECORDING CALL AUDIO — {formatTimer(recordingSeconds)}</span>
          </div>

          <div className="py-4 space-y-2">
            <div className="w-16 h-16 rounded-full bg-rose-900/40 border border-rose-500/50 flex items-center justify-center mx-auto text-rose-400 animate-pulse">
              <Mic className="w-8 h-8" />
            </div>
            <p className="text-xs text-charcoal-300 font-medium">
              Keep call on speakerphone for optimal ambient audio capture
            </p>
          </div>

          {/* Live Auto-Transcript Preview */}
          {liveTranscript && (
            <div className="bg-charcoal-900/90 border border-charcoal-700 p-3.5 rounded-2xl text-left space-y-1">
              <span className="text-[10px] text-teal-400 font-semibold uppercase block">
                Automated transcript snippet — may contain errors:
              </span>
              <p className="text-xs text-charcoal-200 italic line-clamp-3">
                "{liveTranscript}"
              </p>
            </div>
          )}

          <button
            onClick={stopCallRecording}
            className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition shadow-xl flex items-center justify-center space-x-2"
          >
            <Square className="w-5 h-5 fill-white" />
            <span>Stop & Save Call Recording</span>
          </button>
        </div>
      )}

      {/* Step 3: Prompt User for Brief Description */}
      {step === 'describe' && (
        <div className="bg-charcoal-800 border border-charcoal-700 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center space-x-2.5 text-teal-400">
            <Sparkles className="w-5 h-5" />
            <h3 className="text-base font-bold text-charcoal-100">Describe What the Call Was About</h3>
          </div>

          <p className="text-xs text-charcoal-300 leading-relaxed">
            Call audio is saved. Briefly describe who was calling and what was said so AI can structure the details for your records:
          </p>

          <textarea
            value={userDescription}
            onChange={(e) => setUserDescription(e.target.value)}
            placeholder="e.g. Call from Manager Rohan regarding appraisal ratings and late office hours..."
            rows={4}
            className="w-full bg-charcoal-900 border border-charcoal-700 rounded-2xl p-3.5 text-xs text-charcoal-100 focus:outline-none focus:border-teal-500"
          />

          {liveTranscript && (
            <div className="bg-charcoal-900/60 p-3 rounded-xl border border-charcoal-700/80 text-xs text-charcoal-400 space-y-1">
              <span className="font-semibold block text-[10px] text-teal-400">Captured Rough Transcript:</span>
              <p className="italic">"{liveTranscript}"</p>
            </div>
          )}

          <button
            onClick={handleProcessDescriptionAndStructure}
            className="w-full py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition shadow-md flex items-center justify-center space-x-1.5"
          >
            <span>Structure Call Log & Review</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 4: Final Review Modal */}
      {step === 'review' && (
        <div className="bg-charcoal-800 border border-charcoal-700 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-charcoal-700 pb-3">
            <h3 className="text-base font-bold text-charcoal-100">Review & Save Call Incident Log</h3>
            <span className="text-[10px] text-teal-400 bg-teal-950 px-2.5 py-0.5 rounded-full border border-teal-800">
              Raw Audio Attached
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-charcoal-300 font-medium mb-1">Summary</label>
              <input
                type="text"
                value={editSummary}
                onChange={(e) => setEditSummary(e.target.value)}
                className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl p-2.5 text-charcoal-100 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-charcoal-300 font-medium mb-1">Caller / Person Name</label>
                <input
                  type="text"
                  value={editPersonName}
                  onChange={(e) => setEditPersonName(e.target.value)}
                  className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl p-2.5 text-charcoal-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-charcoal-300 font-medium mb-1">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as CategoryType)}
                  className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl p-2.5 text-charcoal-100 focus:outline-none"
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
          </div>

          <button
            onClick={handleFinalSave}
            className="w-full py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition shadow-lg flex items-center justify-center space-x-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Save Call Incident Entry</span>
          </button>
        </div>
      )}

    </div>
  );
};
