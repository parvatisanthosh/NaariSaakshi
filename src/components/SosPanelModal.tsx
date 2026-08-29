import React, { useState } from 'react';
import { PhoneCall, X, ShieldAlert, MapPin, Loader2, Phone } from 'lucide-react';

interface SosPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  trustedName?: string;
  trustedPhone?: string;
  onOpenSettings: () => void;
}

export const SosPanelModal: React.FC<SosPanelModalProps> = ({
  isOpen,
  onClose,
  trustedName,
  trustedPhone,
  onOpenSettings
}) => {
  const [isLocatingSms, setIsLocatingSms] = useState(false);

  if (!isOpen) return null;

  const handleShareLocationSms = () => {
    if (!trustedPhone) return;
    const cleanPhone = trustedPhone.replace(/[^0-9+]/g, '');

    setIsLocatingSms(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocatingSms(false);
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const msg = `EMERGENCY ALERT: I may need help. My current GPS location: https://maps.google.com/?q=${lat},${lng}`;
          window.location.href = `sms:${cleanPhone}?body=${encodeURIComponent(msg)}`;
        },
        () => {
          setIsLocatingSms(false);
          const msg = `EMERGENCY ALERT: I may need help. Please check in on me immediately.`;
          window.location.href = `sms:${cleanPhone}?body=${encodeURIComponent(msg)}`;
        },
        { timeout: 8000 }
      );
    } else {
      setIsLocatingSms(false);
      const msg = `EMERGENCY ALERT: I may need help. Please check in on me immediately.`;
      window.location.href = `sms:${cleanPhone}?body=${encodeURIComponent(msg)}`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white border border-black/10 rounded-3xl w-full max-w-lg p-6 sm:p-8 space-y-6 shadow-2xl relative text-cream-ink">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/10 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-2xl text-cream-ink leading-none">EMERGENCY ASSISTANCE</h3>
              <span className="text-xs font-mono font-bold text-cream-ink/60">DIRECT HELPLINES & RAPID CALL</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-cream-ink/60 hover:text-cream-ink rounded-full bg-cream transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Rapid Call Helplines */}
        <div className="space-y-3">
          <a
            href="tel:112"
            className="w-full p-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-between shadow-lg transition active:scale-[0.98] group"
          >
            <div className="flex items-center space-x-3">
              <PhoneCall className="w-5 h-5 text-white shrink-0" />
              <div className="text-left">
                <span className="font-bold text-base block font-display tracking-wider">CALL 112 — EMERGENCY</span>
                <span className="text-xs text-white/90">Police, Fire & Medical Services</span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold bg-white/20 px-3 py-1 rounded-full border border-white/30 group-hover:bg-white/30">
              112 →
            </span>
          </a>

          <a
            href="tel:181"
            className="w-full p-4 rounded-2xl bg-cream hover:bg-cream/80 border border-black/10 text-cream-ink flex items-center justify-between transition active:scale-[0.98] group"
          >
            <div className="flex items-center space-x-3">
              <PhoneCall className="w-4 h-4 text-magenta shrink-0" />
              <div className="text-left">
                <span className="font-bold text-sm block font-display tracking-wider">CALL 181 — WOMEN'S HELPLINE</span>
                <span className="text-xs text-cream-ink/70">Support, Legal Aid & Counselling</span>
              </div>
            </div>
            <span className="text-xs font-mono text-cream-ink font-bold bg-white px-3 py-1 rounded-full border border-black/10">
              181 →
            </span>
          </a>

          <a
            href="tel:1091"
            className="w-full p-4 rounded-2xl bg-cream hover:bg-cream/80 border border-black/10 text-cream-ink flex items-center justify-between transition active:scale-[0.98] group"
          >
            <div className="flex items-center space-x-3">
              <PhoneCall className="w-4 h-4 text-magenta shrink-0" />
              <div className="text-left">
                <span className="font-bold text-sm block font-display tracking-wider">CALL 1091 — WOMEN IN DISTRESS</span>
                <span className="text-xs text-cream-ink/70">Immediate Safety Response</span>
              </div>
            </div>
            <span className="text-xs font-mono text-cream-ink font-bold bg-white px-3 py-1 rounded-full border border-black/10">
              1091 →
            </span>
          </a>
        </div>

        {/* Trusted Contact Option */}
        <div className="pt-3 border-t border-black/10 space-y-3">
          {trustedPhone ? (
            <div className="space-y-2">
              <a
                href={`tel:${trustedPhone.replace(/[^0-9+]/g, '')}`}
                className="w-full p-4 rounded-2xl bg-magenta text-bg-black hover:bg-magenta-deep flex items-center justify-between transition active:scale-[0.98] shadow-md"
              >
                <div className="flex items-center space-x-3">
                  <PhoneCall className="w-5 h-5 text-bg-black shrink-0" />
                  <div className="text-left">
                    <span className="font-bold text-sm block font-display tracking-wider">CALL {trustedName || 'TRUSTED CONTACT'}</span>
                    <span className="text-xs font-mono text-bg-black/80 font-semibold">{trustedPhone}</span>
                  </div>
                </div>
                <span className="text-xs font-bold bg-bg-black text-magenta px-3 py-1 rounded-full">
                  CALL →
                </span>
              </a>

              <button
                onClick={handleShareLocationSms}
                disabled={isLocatingSms}
                className="w-full p-4 rounded-2xl bg-cream hover:bg-cream/80 border border-black/10 text-cream-ink flex items-center justify-between transition active:scale-[0.98] text-xs font-semibold"
              >
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-magenta shrink-0" />
                  <span>
                    {isLocatingSms ? 'Locating...' : `Share location via SMS to ${trustedName || 'Trusted Contact'}`}
                  </span>
                </div>
                {isLocatingSms ? (
                  <Loader2 className="w-4 h-4 animate-spin text-magenta" />
                ) : (
                  <span className="text-xs font-mono text-cream-ink bg-white px-2.5 py-1 rounded-full border border-black/10 font-bold">
                    SMS →
                  </span>
                )}
              </button>
            </div>
          ) : (
            <div className="bg-cream border border-black/10 p-4 rounded-2xl flex items-center justify-between text-xs">
              <div className="text-left pr-2 space-y-0.5">
                <span className="text-cream-ink font-bold block text-sm">Add a trusted contact</span>
                <span className="text-xs text-cream-ink/70">Set up a contact in Settings for 1-tap calls & location SMS here.</span>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
                className="px-4 py-2 rounded-full bg-magenta text-bg-black font-bold text-xs shrink-0 transition shadow-sm"
              >
                Configure
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};