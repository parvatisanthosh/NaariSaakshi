import React, { useState, useEffect, useRef } from 'react';
import { Video, Square, EyeOff, MapPin, AlertCircle, Shield, FileText, Check, Loader2 } from 'lucide-react';
import { Incident, Attachment } from '../types';

interface QuickCaptureScreenProps {
  onSaveQuickCapture: (newDraft: Incident) => void;
  onCancel: () => void;
  trustedContactName?: string;
  trustedContactPhone?: string;
}

export const QuickCaptureScreen: React.FC<QuickCaptureScreenProps> = ({
  onSaveQuickCapture,
  onCancel,
  trustedContactName,
  trustedContactPhone
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isDisguised, setIsDisguised] = useState(false);
  const [shareLocationOptIn, setShareLocationOptIn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // Browser Security Feature: The browser will display its native camera/mic indicator (red dot/bar)
    // in the address bar or status bar. This is required by browser security policies and cannot be suppressed.
    startQuickCaptureRecording();

    // Acquire current location in background for draft metadata
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => console.warn('Quick Capture geolocation error:', err),
        { timeout: 8000 }
      );
    }

    return () => {
      cleanupStream();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const cleanupStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const startQuickCaptureRecording = async () => {
    try {
      videoChunksRef.current = [];
      setCameraError(null);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera/Microphone API not supported on this device');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });

      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn('Video playback warning:', e));
      }

      // MediaRecorder with 1000ms timeslice to periodically flush chunks
      // so if recording is interrupted, captured data is preserved up to that moment
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          videoChunksRef.current.push(event.data);
        }
      };

      recorder.start(1000); // Flush chunks every 1 second

      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.warn('Quick Capture start error:', err);
      setCameraError('Camera/Microphone permission required for Quick Capture. You can upload files manually.');
    }
  };

  const handleShareLocationSms = () => {
    if (!trustedContactPhone || !coords) return;
    const msg = `Quick Capture initiated. My current location: https://maps.google.com/?q=${coords.lat},${coords.lng}`;
    const cleanPhone = trustedContactPhone.replace(/[^0-9+]/g, '');
    window.location.href = `sms:${cleanPhone}?body=${encodeURIComponent(msg)}`;
  };

  const handleStopAndSave = () => {
    setIsSaving(true);

    if (shareLocationOptIn && coords && trustedContactPhone) {
      handleShareLocationSms();
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {
        finalizeDraftAndSave();
      };
      mediaRecorderRef.current.stop();
    } else {
      finalizeDraftAndSave();
    }
  };

  const finalizeDraftAndSave = () => {
    cleanupStream();

    const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' });
    const reader = new FileReader();

    const saveDraftWithDataUrl = (dataUrl?: string) => {
      const videoAttachment: Attachment = {
        id: 'att-qc-' + Math.random().toString(36).substr(2, 6),
        name: `QuickCapture_Video_${new Date().toISOString().slice(0, 10)}.webm`,
        type: 'video',
        dataUrl,
        size: videoBlob.size,
        uploadedAt: new Date().toISOString(),
        isLiveCapture: true,
        captureMethod: 'camera'
      };

      const nowIso = new Date().toISOString();
      const newDraft: Incident = {
        id: 'inc-qc-' + Math.random().toString(36).substr(2, 8),
        created_at: nowIso,
        incident_datetime: nowIso,
        location: coords ? `GPS (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})` : 'Quick Capture Location',
        latitude: coords?.lat,
        longitude: coords?.lng,
        people_involved: [],
        category: 'Other',
        narrative_raw: 'Quick Capture video recording saved in-the-moment.',
        narrative_structured: {
          summary: 'Quick Capture — needs details',
          context: 'Recorded live in-the-moment using Quick Capture mode.',
          keyActions: ['Live video/audio evidence recorded.'],
          impactDescription: 'In-the-moment evidence preserved.',
          recommendedFollowUp: 'Open when safe to complete narrative details, people involved, and review.'
        },
        witnesses: [],
        attachments: videoChunksRef.current.length > 0 ? [videoAttachment] : [],
        user_edited: false,
        tags: ['Quick Capture'],
        isQuickCaptureDraft: true
      };

      setIsSaving(false);
      onSaveQuickCapture(newDraft);
    };

    if (videoBlob.size > 0) {
      reader.onloadend = () => {
        saveDraftWithDataUrl(reader.result as string);
      };
      reader.readAsDataURL(videoBlob);
    } else {
      saveDraftWithDataUrl(undefined);
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  if (cameraError) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center space-y-6">
        <div className="bg-amber-950/80 border border-amber-500/50 rounded-3xl p-6 space-y-4">
          <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="text-base font-semibold text-amber-200">{cameraError}</h3>
          <button
            onClick={onCancel}
            className="px-6 py-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-200 text-xs font-medium transition"
          >
            Return to Timeline
          </button>
        </div>
      </div>
    );
  }

  // Disguise Screen View (Fake Plain Notes UI)
  if (isDisguised) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 text-slate-100 flex flex-col p-4 space-y-4 font-sans select-none">
        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-200">Notes — Project Standup</span>
          </div>
          <button
            onClick={handleStopAndSave}
            disabled={isSaving}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-600 transition"
          >
            {isSaving ? 'Saving...' : 'Done'}
          </button>
        </div>

        {/* Fake Notes Body */}
        <div className="flex-1 space-y-3 text-xs text-slate-400 font-mono pt-2">
          <p>• Reviewed sprint task board and open backlog items.</p>
          <p>• Action items assigned for Q3 documentation update.</p>
          <p>• Follow up with engineering team on API schema changes.</p>
          <p>• Next sync scheduled for Tuesday 10:00 AM.</p>
        </div>

        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span>Recording active in background</span>
          <button
            onClick={() => setIsDisguised(false)}
            className="text-slate-400 hover:text-slate-200 underline"
          >
            Show Viewfinder
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 pb-28 space-y-5">
      
      {/* Header Banner */}
      <div className="bg-rose-950/80 border border-rose-500/40 rounded-2xl p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></div>
          <div>
            <h2 className="text-sm font-bold text-rose-100 uppercase tracking-wider">Quick Capture Active</h2>
            <span className="text-[10px] text-rose-300/80 font-mono">Recording video + audio in-the-moment</span>
          </div>
        </div>

        <div className="text-right font-mono font-bold text-lg text-rose-200">
          {formatTimer(elapsedSeconds)}
        </div>
      </div>

      {/* Live Video Preview Window */}
      <div className="relative rounded-2xl overflow-hidden bg-black border border-charcoal-700 aspect-video shadow-2xl flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        <div className="absolute top-3 left-3 bg-charcoal-950/80 border border-charcoal-700/80 px-2.5 py-1 rounded-lg text-[10px] text-rose-300 font-mono flex items-center space-x-1.5">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></div>
          <span>REC {formatTimer(elapsedSeconds)}</span>
        </div>

        {/* Disguise Toggle Button */}
        <button
          onClick={() => setIsDisguised(true)}
          className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-charcoal-900/90 hover:bg-charcoal-800 border border-charcoal-700 text-[11px] text-charcoal-300 flex items-center space-x-1 transition"
        >
          <EyeOff className="w-3.5 h-3.5 text-teal-400" />
          <span>Disguise Screen</span>
        </button>
      </div>

      {/* Optional Location Share Control */}
      {trustedContactPhone && (
        <div className="bg-charcoal-800/80 border border-charcoal-700/80 rounded-xl p-3.5 space-y-2 text-xs">
          <label className="flex items-start space-x-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={shareLocationOptIn}
              onChange={(e) => setShareLocationOptIn(e.target.checked)}
              className="mt-0.5 rounded bg-charcoal-900 border-charcoal-600 text-teal-600 focus:ring-teal-500 shrink-0"
            />
            <div className="text-charcoal-200">
              <span className="font-semibold block text-xs">
                Share initial location link with {trustedContactName || 'Trusted Contact'}
              </span>
              <span className="text-[10px] text-charcoal-400 block">
                Opens SMS with your location link ({coords ? `${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)}` : 'getting GPS...'})
              </span>
            </div>
          </label>
        </div>
      )}

      {/* Stop & Save Action Button */}
      <div className="space-y-3 pt-2">
        <button
          onClick={handleStopAndSave}
          disabled={isSaving}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-700 via-rose-600 to-rose-700 hover:from-rose-600 hover:to-rose-500 text-white font-bold text-sm transition shadow-xl shadow-rose-950/60 flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Saving Evidence Draft...</span>
            </>
          ) : (
            <>
              <Square className="w-5 h-5 text-white fill-white" />
              <span>Stop & Save Quick Capture</span>
            </>
          )}
        </button>

        <p className="text-[10px] text-charcoal-400 text-center leading-relaxed">
          Browser camera indicator is active per browser security rules. Video draft will be saved locally so you can add details later when you're safe.
        </p>
      </div>

    </div>
  );
};
