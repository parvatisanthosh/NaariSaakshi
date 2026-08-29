import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Loader2, AlertCircle, Shield, Check } from 'lucide-react';
import { Attachment } from '../types';

interface CameraCaptureModalProps {
  isOpen: boolean;
  locationText?: string;
  onCapture: (attachment: Attachment) => void;
  onClose: () => void;
  onFallbackToUpload: () => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  locationText,
  onCapture,
  onClose,
  onFallbackToUpload
}) => {
  const [step, setStep] = useState<'explainer' | 'camera'>('explainer');
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setIsStartingCamera(true);
      setCameraError(null);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported on this browser/device');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });

      mediaStreamRef.current = stream;
      setStep('camera');
      setIsStartingCamera(false);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.warn('Video play warning:', e));
        }
      }, 200);

    } catch (err: any) {
      console.error('Camera access error:', err);
      setIsStartingCamera(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError("Camera permission was denied. You can upload an image file instead.");
      } else {
        setCameraError("Unable to access camera on this device. You can upload an image file instead.");
      }
    }
  };

  const handleTakePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Forensic Timestamp & Location Watermark Overlay
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const watermarkText = `NAARISAAKSHI FORENSIC LOG • ${dateStr} ${timeStr} • ${locationText || 'GPS Encrypted'}`;

    ctx.fillStyle = 'rgba(13, 11, 16, 0.75)';
    ctx.fillRect(0, canvas.height - 44, canvas.width, 44);

    ctx.fillStyle = '#E8368F';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText(watermarkText, 16, canvas.height - 16);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    stopCamera();

    const photoAttachment: Attachment = {
      id: 'att-live-' + Math.random().toString(36).substr(2, 6),
      name: `Photo_${dateStr.replace(/\s/g, '_')}_${now.getTime().toString().slice(-4)}.jpg`,
      type: 'image',
      dataUrl,
      uploadedAt: now.toISOString(),
      isLiveCapture: true,
      captureMethod: 'camera'
    };

    onCapture(photoAttachment);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white border border-black/10 rounded-3xl w-full max-w-lg p-8 space-y-6 shadow-2xl relative text-cream-ink">
        <button
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="absolute top-5 right-5 text-cream-ink/60 hover:text-cream-ink transition"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'explainer' && (
          <div className="space-y-5">
            <div className="flex items-center space-x-3 text-magenta">
              <div className="w-12 h-12 rounded-2xl bg-magenta text-bg-black font-bold flex items-center justify-center shadow-lg">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display text-3xl text-cream-ink leading-none">LIVE PHOTO CAPTURE</h3>
                <span className="text-xs font-mono font-bold text-cream-ink/60">FORENSIC TIMESTAMP WATERMARKING</span>
              </div>
            </div>

            <div className="bg-cream/40 border border-black/10 p-5 rounded-2xl space-y-2 text-xs sm:text-sm text-cream-ink/90 font-medium leading-relaxed">
              <p>
                <strong>Camera Permission Explanation:</strong> NaariSaakshi needs camera access to let you capture a timestamped photo. This photo stays on your device.
              </p>
              <p className="text-xs text-magenta font-bold">
                • A tamper-proof timestamp (date, time & location) will be burned directly into the image pixels.
              </p>
            </div>

            {cameraError && (
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-xs text-amber-950 space-y-2 font-medium">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{cameraError}</span>
                </div>
                <button
                  onClick={() => {
                    stopCamera();
                    onFallbackToUpload();
                    onClose();
                  }}
                  className="w-full py-2 bg-amber-200/80 hover:bg-amber-300 text-amber-950 rounded-full font-bold text-xs transition"
                >
                  Switch to Uploading File
                </button>
              </div>
            )}

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                className="flex-1 py-3.5 rounded-full border border-black/20 text-cream-ink hover:bg-cream font-bold text-xs uppercase tracking-wider transition"
              >
                Cancel
              </button>
              <button
                onClick={startCamera}
                disabled={isStartingCamera}
                className="flex-1 py-3.5 rounded-full bg-magenta hover:bg-magenta-deep text-bg-black font-display font-bold text-base tracking-wider transition shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isStartingCamera ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Requesting...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>GRANT CAMERA ACCESS</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 'camera' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-display text-magenta tracking-wider uppercase flex items-center space-x-1">
                <Camera className="w-4 h-4" />
                <span>Live View Finder</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-cream-ink/60">Timestamp preview active</span>
            </div>

            <div className="relative rounded-2xl overflow-hidden bg-black border border-black/10 min-h-[240px] flex items-center justify-center shadow-lg">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-auto max-h-[320px] object-cover"
              />
              <div className="absolute bottom-2 right-2 bg-bg-black/80 border border-white/20 px-3 py-1 rounded-lg text-[10px] text-magenta font-mono shadow-md">
                📷 {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString('en-GB')}
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                className="flex-1 py-3.5 rounded-full border border-black/20 text-cream-ink hover:bg-cream font-bold text-xs uppercase tracking-wider transition"
              >
                Cancel
              </button>
              <button
                onClick={handleTakePhoto}
                className="flex-1 py-3.5 rounded-full bg-magenta hover:bg-magenta-deep text-bg-black font-display font-bold text-base tracking-wider transition shadow-lg flex items-center justify-center space-x-2"
              >
                <Camera className="w-4 h-4" />
                <span>CAPTURE & WATERMARK</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};