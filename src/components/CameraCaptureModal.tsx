import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, AlertCircle, Sparkles, Loader2, Check } from 'lucide-react';
import { Attachment } from '../types';

interface CameraCaptureModalProps {
  isOpen: boolean;
  locationText?: string;
  onCapture: (attachment: Attachment) => void;
  onClose: () => void;
  onFallbackToUpload: () => void;
}

export const watermarkCanvas = (
  sourceCanvas: HTMLCanvasElement,
  locationText?: string
): string => {
  const ctx = sourceCanvas.getContext('2d');
  if (!ctx) return sourceCanvas.toDataURL('image/jpeg', 0.85);

  const w = sourceCanvas.width;
  const h = sourceCanvas.height;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const timeStr = now.toLocaleTimeString('en-GB', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  let watermarkText = `📷 ${dateStr}, ${timeStr}`;
  if (locationText && locationText.trim() && locationText !== 'Unspecified location') {
    watermarkText += ` — ${locationText.trim()}`;
  }

  const fontSize = Math.max(14, Math.round(h * 0.035));
  ctx.font = `600 ${fontSize}px sans-serif`;

  const textMetrics = ctx.measureText(watermarkText);
  const padX = fontSize * 0.8;
  const padY = fontSize * 0.5;
  const rectWidth = textMetrics.width + padX * 2;
  const rectHeight = fontSize + padY * 2;

  const margin = fontSize * 0.8;
  const rectX = w - rectWidth - margin;
  const rectY = h - rectHeight - margin;

  // Background box
  ctx.fillStyle = 'rgba(15, 23, 42, 0.80)';
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(rectX, rectY, rectWidth, rectHeight, 8);
  } else {
    ctx.rect(rectX, rectY, rectWidth, rectHeight);
  }
  ctx.fill();

  // Watermark text
  ctx.fillStyle = '#f8fafc';
  ctx.textBaseline = 'middle';
  ctx.fillText(watermarkText, rectX + padX, rectY + padY + fontSize / 2);

  return sourceCanvas.toDataURL('image/jpeg', 0.85);
};

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  locationText,
  onCapture,
  onClose,
  onFallbackToUpload
}) => {
  const [step, setStep] = useState<'explainer' | 'camera'>('explainer');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setStep('explainer');
      setCameraError(null);
    }
  }, [isOpen]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    setIsStartingCamera(true);
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported on this browser');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;
      setStep('camera');
      setIsStartingCamera(false);

      // Attach stream to video element after render
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.warn('Video play error:', e));
        }
      }, 100);
    } catch (err) {
      console.warn('Camera access error:', err);
      setIsStartingCamera(false);
      setCameraError('Camera access needed to take a photo — you can upload one instead');
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
    const watermarkedDataUrl = watermarkCanvas(canvas, locationText);

    const newAttachment: Attachment = {
      id: 'att-' + Math.random().toString(36).substr(2, 6),
      name: `Live_Capture_${new Date().toISOString().slice(0, 10)}.jpg`,
      type: 'image',
      dataUrl: watermarkedDataUrl,
      size: Math.round((watermarkedDataUrl.length * 3) / 4),
      uploadedAt: new Date().toISOString(),
      isLiveCapture: true,
      captureMethod: 'camera'
    };

    stopCamera();
    onCapture(newAttachment);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-charcoal-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-charcoal-800 border border-charcoal-700 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative">
        <button
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="absolute top-4 right-4 text-charcoal-400 hover:text-charcoal-100"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'explainer' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-teal-400">
              <div className="w-10 h-10 rounded-full bg-teal-950 border border-teal-500/40 flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-charcoal-100">Live Photo Capture</h3>
                <span className="text-xs text-charcoal-400">Forensic Timestamp Watermarking</span>
              </div>
            </div>

            <div className="bg-charcoal-900/80 border border-charcoal-700 p-4 rounded-xl space-y-2 text-xs text-charcoal-300 leading-relaxed">
              <p>
                <strong>Camera Permission Explanation:</strong> EvidenceHer needs camera access to let you capture a timestamped photo. This photo stays on your device.
              </p>
              <p className="text-[11px] text-teal-400/90">
                • A tamper-proof timestamp (date, time & location) will be burned directly into the image pixels.
              </p>
            </div>

            {cameraError && (
              <div className="bg-amber-950/80 border border-amber-500/50 rounded-xl p-3 text-xs text-amber-200 space-y-2">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{cameraError}</span>
                </div>
                <button
                  onClick={() => {
                    stopCamera();
                    onFallbackToUpload();
                    onClose();
                  }}
                  className="w-full py-1.5 bg-amber-900/60 hover:bg-amber-800/80 text-amber-200 rounded-lg text-xs font-medium transition"
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
                className="flex-1 py-2.5 rounded-xl bg-charcoal-700 hover:bg-charcoal-600 text-charcoal-200 font-medium text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={startCamera}
                disabled={isStartingCamera}
                className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs transition shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isStartingCamera ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Requesting...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>Grant Camera Access</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 'camera' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider flex items-center space-x-1">
                <Camera className="w-4 h-4" />
                <span>Live View Finder</span>
              </span>
              <span className="text-[10px] text-charcoal-400">Timestamp preview active</span>
            </div>

            <div className="relative rounded-xl overflow-hidden bg-black border border-charcoal-700 min-h-[240px] flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-auto max-h-[320px] object-cover"
              />
              <div className="absolute bottom-2 right-2 bg-charcoal-950/80 border border-charcoal-700/80 px-2.5 py-1 rounded-lg text-[10px] text-white font-mono shadow-md">
                📷 {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString('en-GB')}
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                className="flex-1 py-2.5 rounded-xl bg-charcoal-700 hover:bg-charcoal-600 text-charcoal-200 font-medium text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={handleTakePhoto}
                className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition shadow-lg shadow-teal-900/50 flex items-center justify-center space-x-1.5"
              >
                <Camera className="w-4 h-4" />
                <span>Capture & Watermark</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
