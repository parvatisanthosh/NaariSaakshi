import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Video, Square, EyeOff, MapPin, AlertCircle, Shield, FileText, Check, Loader2, ArrowLeft, RefreshCw, Play, ChevronLeft, Share2, MoreHorizontal, CheckSquare, Info } from 'lucide-react';
import { Incident, Attachment } from '../types';

interface QuickCaptureScreenProps {
  onSaveQuickCapture: (newDraft: Incident, toastMessage?: string) => void;
  onCancel: () => void;
  trustedContactName?: string;
  trustedContactPhone?: string;
  hasSeenTutorial?: boolean;
  onAcknowledgeTutorial?: () => void;
}

export const QuickCaptureScreen: React.FC<QuickCaptureScreenProps> = ({
  onSaveQuickCapture,
  onCancel,
  trustedContactName,
  trustedContactPhone,
  hasSeenTutorial,
  onAcknowledgeTutorial
}) => {
  const [step, setStep] = useState<'recording' | 'preview'>('recording');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isDisguised, setIsDisguised] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [shareLocationOptIn, setShareLocationOptIn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  // Keyboard Escape exit state & hold progress
  const [escHoldProgress, setEscHoldProgress] = useState(0);
  const escTimerRef = useRef<any>(null);
  const escIntervalRef = useRef<any>(null);
  const isEscHoldingRef = useRef(false);
  const escPressesRef = useRef<number[]>([]);

  // Long-press exit gesture state (touch/mouse fallback)
  const [longPressProgress, setLongPressProgress] = useState(0);
  const longPressTimerRef = useRef<any>(null);
  const progressIntervalRef = useRef<any>(null);
  const isDirectExitRunningRef = useRef(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    startQuickCaptureRecording();

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
      cancelLongPress();
      cancelEscTimer();
    };
  }, []);

  // Hardware / Browser level interrupt detection (tab switch, screen lock, window blur, beforeunload)
  useEffect(() => {
    const handleInterrupt = () => {
      if (document.visibilityState === 'hidden' && step === 'recording') {
        handleDirectSaveAndExit('Auto-saved recording on tab switch / screen lock');
      }
    };

    const handleBlur = () => {
      if (step === 'recording') {
        handleDirectSaveAndExit('Auto-saved recording on background focus loss');
      }
    };

    const handleBeforeUnload = () => {
      if (step === 'recording') {
        handleDirectSaveAndExit('Auto-saved recording before window close');
      }
    };

    document.addEventListener('visibilitychange', handleInterrupt);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleInterrupt);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [step, coords]);

  // Keyboard Escape exit listener (1.5s Hold OR 3x Quick Press)
  useEffect(() => {
    if (!isDisguised) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();

        // Check 3x quick Escape press shortcut
        const now = Date.now();
        escPressesRef.current = [...escPressesRef.current.filter(t => now - t < 2000), now];
        if (escPressesRef.current.length >= 3) {
          cancelEscTimer();
          handleDirectSaveAndExit('Discreet recording saved via 3x Escape shortcut');
          return;
        }

        // Start 1.5s hold timer if not already holding
        if (!isEscHoldingRef.current) {
          isEscHoldingRef.current = true;
          const startTime = Date.now();
          const DURATION = 1500; // 1.5 seconds

          setEscHoldProgress(0);
          if (escIntervalRef.current) clearInterval(escIntervalRef.current);

          escIntervalRef.current = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const pct = Math.min((elapsed / DURATION) * 100, 100);
            setEscHoldProgress(pct);
          }, 30);

          escTimerRef.current = setTimeout(() => {
            cancelEscTimer();
            handleDirectSaveAndExit('Discreet recording saved to Timeline');
          }, DURATION);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancelEscTimer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelEscTimer();
    };
  }, [isDisguised, coords]);

  const cancelEscTimer = () => {
    isEscHoldingRef.current = false;
    if (escTimerRef.current) {
      clearTimeout(escTimerRef.current);
      escTimerRef.current = null;
    }
    if (escIntervalRef.current) {
      clearInterval(escIntervalRef.current);
      escIntervalRef.current = null;
    }
    setEscHoldProgress(0);
  };

  // Status Bar & Document Title concealment when disguise mode is active
  useEffect(() => {
    if (isDisguised) {
      const originalTitle = document.title;
      document.title = 'Notes';

      let metaTheme = document.querySelector('meta[name="theme-color"]');
      let originalThemeColor = metaTheme?.getAttribute('content');
      if (metaTheme) {
        metaTheme.setAttribute('content', '#F2F2F7');
      } else {
        metaTheme = document.createElement('meta');
        metaTheme.setAttribute('name', 'theme-color');
        metaTheme.setAttribute('content', '#F2F2F7');
        document.head.appendChild(metaTheme);
      }

      return () => {
        document.title = originalTitle || 'NaariSaakshi — Private Incident Journal';
        if (metaTheme) {
          metaTheme.setAttribute('content', originalThemeColor || '#0B090E');
        }
      };
    }
  }, [isDisguised]);

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
      setStep('recording');
      setElapsedSeconds(0);
      setRecordedVideoUrl(null);
      setRecordedBlob(null);
      isDirectExitRunningRef.current = false;

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera/Microphone API not supported on this device');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true
      });

      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn('Video playback warning:', e));
      }

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          videoChunksRef.current.push(event.data);
        }
      };

      recorder.start(1000);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.warn('Quick Capture start error:', err);
      setCameraError('Camera/Microphone permission required for Quick Capture. You can upload files manually.');
    }
  };

  // Trigger Disguise mode with check for tutorial
  const handleOpenDisguise = () => {
    if (!hasSeenTutorial) {
      setShowTutorialModal(true);
    } else {
      setIsDisguised(true);
    }
  };

  const handleConfirmTutorialAndStart = () => {
    if (onAcknowledgeTutorial) {
      onAcknowledgeTutorial();
    }
    setShowTutorialModal(false);
    setIsDisguised(true);
  };

  // Long Press Exit Gesture logic (2-3 seconds long press)
  const startLongPress = (e: React.TouchEvent | React.MouseEvent) => {
    cancelLongPress();

    const startTime = Date.now();
    const DURATION = 2000; // 2 seconds

    setLongPressProgress(0);

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / DURATION) * 100, 100);
      setLongPressProgress(progress);
    }, 40);

    longPressTimerRef.current = setTimeout(() => {
      cancelLongPress();
      setLongPressProgress(100);
      handleDirectSaveAndExit('Discreet recording saved to Timeline');
    }, DURATION);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setLongPressProgress(0);
  };

  // Direct save and exit without confirmation dialog
  const handleDirectSaveAndExit = (toastMsg = 'Quick Capture recording saved to Timeline') => {
    if (isDirectExitRunningRef.current) return;
    isDirectExitRunningRef.current = true;

    if (timerRef.current) clearInterval(timerRef.current);
    cancelLongPress();

    const finishAndSave = () => {
      cleanupStream();
      const blob = new Blob(videoChunksRef.current, { type: 'video/webm' });
      console.log('[QuickCapture] MediaRecorder stopped. Total Blob size:', blob.size, 'bytes');

      const createDraft = (dataUrl?: string) => {
        console.log('[QuickCapture] Base64 dataUrl generated. Length:', dataUrl ? dataUrl.length : 0, 'chars');
        const videoAttachment: Attachment = {
          id: 'att-qc-' + Math.random().toString(36).substr(2, 6),
          name: `Discreet_Capture_${new Date().toISOString().slice(0, 10)}.webm`,
          type: 'video',
          dataUrl,
          size: blob.size,
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
          narrative_raw: 'Discreet video recording captured in-the-moment.',
          narrative_structured: {
            summary: 'Discreet Quick Capture — saved automatically',
            context: 'Recorded live in-the-moment using disguise mode.',
            keyActions: ['Live video/audio evidence recorded discreetly.'],
            impactDescription: 'Evidence preserved safely to local storage.',
            recommendedFollowUp: 'Open when safe to complete narrative details, people involved, and review.'
          },
          witnesses: [],
          attachments: dataUrl ? [videoAttachment] : [],
          user_edited: false,
          tags: ['Quick Capture', 'Discreet'],
          isQuickCaptureDraft: true
        };

        onSaveQuickCapture(newDraft, toastMsg);
      };

      if (blob.size > 0) {
        const reader = new FileReader();
        reader.onloadend = () => {
          createDraft(reader.result as string);
        };
        reader.readAsDataURL(blob);
      } else {
        createDraft(undefined);
      }
    };

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {
        finishAndSave();
      };
      mediaRecorderRef.current.stop();
    } else {
      finishAndSave();
    }
  };

  const handleShareLocationSms = () => {
    if (!trustedContactPhone || !coords) return;
    const msg = `Quick Capture initiated. My current location: https://maps.google.com/?q=${coords.lat},${coords.lng}`;
    const cleanPhone = trustedContactPhone.replace(/[^0-9+]/g, '');
    window.location.href = `sms:${cleanPhone}?body=${encodeURIComponent(msg)}`;
  };

  const handleStopRecordingToPreview = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (shareLocationOptIn && coords && trustedContactPhone) {
      handleShareLocationSms();
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {
        generatePreview();
      };
      mediaRecorderRef.current.stop();
    } else {
      generatePreview();
    }
  };

  const generatePreview = () => {
    cleanupStream();
    const blob = new Blob(videoChunksRef.current, { type: 'video/webm' });
    setRecordedBlob(blob);

    const reader = new FileReader();
    reader.onloadend = () => {
      setRecordedVideoUrl(reader.result as string);
      setStep('preview');
    };
    if (blob.size > 0) {
      reader.readAsDataURL(blob);
    } else {
      setStep('preview');
    }
  };

  const handleFinalSubmit = () => {
    setIsSaving(true);

    const videoAttachment: Attachment = {
      id: 'att-qc-' + Math.random().toString(36).substr(2, 6),
      name: `QuickCapture_Video_${new Date().toISOString().slice(0, 10)}.webm`,
      type: 'video',
      dataUrl: recordedVideoUrl || undefined,
      size: recordedBlob?.size || 0,
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
      attachments: recordedVideoUrl ? [videoAttachment] : [],
      user_edited: false,
      tags: ['Quick Capture'],
      isQuickCaptureDraft: true
    };

    setIsSaving(false);
    onSaveQuickCapture(newDraft, 'Quick Capture recording saved to Timeline');
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
            className="px-6 py-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-200 text-xs font-medium transition flex items-center justify-center space-x-1.5 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Timeline</span>
          </button>
        </div>
      </div>
    );
  }

  // Realistic System Notes App Disguise Screen (Mundane To-Do / Grocery List) mounted via Portal directly to document.body
  if (isDisguised) {
    const currentProgress = Math.max(escHoldProgress, longPressProgress);

    return createPortal(
      <div
        className="fixed inset-0 z-[999999] w-screen h-screen bg-[#F2F2F7] text-[#1C1C1E] flex flex-col font-sans select-none overflow-hidden touch-none"
        onMouseDown={startLongPress}
        onMouseUp={cancelLongPress}
        onMouseLeave={cancelLongPress}
        onTouchStart={startLongPress}
        onTouchEnd={cancelLongPress}
        onTouchCancel={cancelLongPress}
      >
        {/* Subtle top progress bar during Escape hold or touch hold gesture */}
        {currentProgress > 0 && (
          <div className="w-full bg-[#E5E5EA] h-1.5 fixed top-0 left-0 right-0 z-[1000000] overflow-hidden">
            <div
              className="bg-[#007AFF] h-full transition-all duration-75 ease-out"
              style={{ width: `${currentProgress}%` }}
            />
          </div>
        )}

        {/* Realistic OS Notes Top Header Bar */}
        <div className="bg-[#F2F2F7]/90 backdrop-blur-md px-4 py-3 border-b border-[#C6C6C8]/60 flex items-center justify-between pt-6">
          <button className="flex items-center space-x-1 text-[#D98A2B] hover:opacity-80 active:opacity-60 text-sm font-medium">
            <ChevronLeft className="w-5 h-5 text-[#D98A2B]" />
            <span>Notes</span>
          </button>

          <div className="flex items-center space-x-5 text-[#D98A2B]">
            <Share2 className="w-4 h-4 text-[#D98A2B]" />
            <MoreHorizontal className="w-5 h-5 text-[#D98A2B]" />
          </div>
        </div>

        {/* Realistic Note Document Content */}
        <div className="flex-1 px-6 py-5 overflow-y-auto space-y-4 max-w-xl mx-auto w-full text-slate-800 font-sans">
          <div>
            <h1 className="text-2xl font-bold text-[#1C1C1E] tracking-tight">Grocery & Daily To-Do</h1>
            <p className="text-[12px] text-[#8E8E93] mt-1 font-normal">Yesterday at 4:15 PM</p>
          </div>

          <div className="space-y-3 text-sm text-[#2C2C2E] leading-relaxed pt-2">
            <div className="flex items-center space-x-3">
              <CheckSquare className="w-4 h-4 text-[#8E8E93] shrink-0" />
              <span>Dry cleaning pickup (4th Street location)</span>
            </div>

            <div className="flex items-center space-x-3">
              <CheckSquare className="w-4 h-4 text-[#8E8E93] shrink-0" />
              <span>Pay electricity & Wi-Fi bills before Friday</span>
            </div>

            <div className="flex items-center space-x-3">
              <CheckSquare className="w-4 h-4 text-[#8E8E93] shrink-0" />
              <span>Call mom regarding Sunday family lunch</span>
            </div>

            <div className="flex items-center space-x-3">
              <CheckSquare className="w-4 h-4 text-[#8E8E93] shrink-0" />
              <span>Buy almond milk, eggs, sourdough bread, fresh apples</span>
            </div>

            <div className="flex items-center space-x-3">
              <CheckSquare className="w-4 h-4 text-[#8E8E93] shrink-0" />
              <span>Water balcony plants in the evening</span>
            </div>

            <div className="flex items-center space-x-3">
              <CheckSquare className="w-4 h-4 text-[#8E8E93] shrink-0" />
              <span>Return library books</span>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E5E5EA] space-y-2 text-xs text-[#6C6C70]">
            <p className="font-semibold text-[#3A3A3C]">Additional Reminders:</p>
            <p>• Check mailbox before heading upstairs.</p>
            <p>• Confirm plumber appointment for Thursday morning.</p>
          </div>
        </div>

        {/* Minimal Bottom Status Bar */}
        <div className="px-6 py-3 border-t border-[#C6C6C8]/60 bg-[#F2F2F7] flex items-center justify-between text-[11px] text-[#8E8E93] font-sans">
          <span>6 Items</span>
          <span className="text-[10px] opacity-60">Hold Escape 1.5s or press Esc 3x to exit</span>
        </div>
      </div>,
      document.body
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 pb-28 space-y-5">
      
      {/* Tutorial Modal Overlay for First Time Disguise Mode */}
      {showTutorialModal && (
        <div className="fixed inset-0 z-50 bg-bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-black/10 rounded-3xl w-full max-w-md p-8 space-y-6 shadow-2xl text-cream-ink">
            <div className="flex items-center space-x-3 text-magenta">
              <div className="w-10 h-10 rounded-2xl bg-magenta text-bg-black font-bold flex items-center justify-center shadow-md">
                <Shield className="w-5 h-5 text-bg-black" />
              </div>
              <h3 className="font-display text-2xl text-cream-ink leading-tight">DISGUISE MODE EXIT GESTURE</h3>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-cream-ink/90 font-medium leading-relaxed bg-cream/40 p-4 rounded-2xl border border-black/10">
              <p className="font-bold text-magenta text-sm">
                How to stop recording and exit disguise mode:
              </p>
              <p className="text-cream-ink">
                • <strong>Hold the Escape key for 1.5 seconds</strong>, OR
              </p>
              <p className="text-cream-ink">
                • <strong>Press Escape 3 times quickly</strong>, OR
              </p>
              <p className="text-cream-ink">
                • <em>Touch / mouse:</em> Hold down anywhere on screen for 2 seconds.
              </p>
              <p className="text-xs text-cream-ink/80 border-t border-black/10 pt-2">
                Recording will immediately stop, save to your Timeline, and return to the main app without any confirmation popups.
              </p>
              <p className="text-xs text-cream-ink/80">
                • <em>Safety net:</em> Switching tabs, locking screen, or closing window also auto-saves immediately.
              </p>
            </div>

            <button
              onClick={handleConfirmTutorialAndStart}
              className="w-full py-4 rounded-full bg-magenta hover:bg-magenta-deep text-bg-black font-display font-bold text-base tracking-wider transition shadow-lg"
            >
              I UNDERSTAND — ENTER DISGUISE
            </button>
          </div>
        </div>
      )}

      {/* Top Back Navigation Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-magenta hover:text-magenta-deep transition"
        >
          <ArrowLeft className="w-4 h-4 text-magenta" />
          <span>Back to Timeline</span>
        </button>
      </div>

      {step === 'recording' && (
        <>
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
              onClick={handleOpenDisguise}
              className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-charcoal-900/90 hover:bg-charcoal-800 border border-charcoal-700 text-[11px] text-charcoal-300 flex items-center space-x-1 transition shadow-md"
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

          {/* Stop & Review Action Button */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleStopRecordingToPreview}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-700 via-rose-600 to-rose-700 hover:from-rose-600 hover:to-rose-500 text-white font-bold text-sm transition shadow-xl shadow-rose-950/60 flex items-center justify-center space-x-2 active:scale-95"
            >
              <Square className="w-5 h-5 text-white fill-white" />
              <span>Stop & Review Video Recording</span>
            </button>

            <p className="text-[10px] text-charcoal-400 text-center leading-relaxed">
              Tapping stop will pause recording and let you preview/play back your video before saving to timeline.
            </p>
          </div>
        </>
      )}

      {/* Step Preview: Watch Recorded Video & Retake / Submit */}
      {step === 'preview' && (
        <div className="bg-charcoal-800 border border-charcoal-700 rounded-3xl p-6 space-y-5 shadow-2xl">
          <div className="flex items-center justify-between border-b border-charcoal-700 pb-3">
            <div className="flex items-center space-x-2 text-teal-400">
              <Video className="w-5 h-5" />
              <h3 className="text-base font-bold text-charcoal-100">Preview Recorded Video</h3>
            </div>
            <span className="text-[10px] text-teal-300 bg-teal-950 px-2.5 py-0.5 rounded-full border border-teal-800">
              Ready to Save
            </span>
          </div>

          <div className="space-y-3">
            {recordedVideoUrl ? (
              <div className="rounded-2xl overflow-hidden bg-black border border-charcoal-700 max-h-80 flex items-center justify-center shadow-lg">
                <video
                  src={recordedVideoUrl}
                  controls
                  autoPlay={false}
                  className="w-full h-auto max-h-80 object-contain"
                />
              </div>
            ) : (
              <div className="p-8 text-center bg-charcoal-900 rounded-2xl text-xs text-charcoal-400">
                No video data recorded.
              </div>
            )}
            <p className="text-[11px] text-charcoal-300 text-center">
              Play back your recorded evidence video above to verify before submitting.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={startQuickCaptureRecording}
              className="w-full sm:flex-1 py-3 rounded-xl bg-charcoal-700 hover:bg-charcoal-600 text-charcoal-200 font-semibold text-xs transition flex items-center justify-center space-x-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retake Video</span>
            </button>

            <button
              onClick={handleFinalSubmit}
              disabled={isSaving}
              className="w-full sm:flex-1 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition shadow-lg flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Quick Capture Entry</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
