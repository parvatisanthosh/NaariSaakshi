import React, { useState } from 'react';
import { PhoneCall, X, MapPin, Settings, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';

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

    if (navigator.geolocation) {
      setIsLocatingSms(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocatingSms(false);
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const msg = `I may need help. My current location: https://maps.google.com/?q=${lat},${lng}`;
          const cleanPhone = trustedPhone.replace(/[^0-9+]/g, '');
          window.location.href = `sms:${cleanPhone}?body=${encodeURIComponent(msg)}`;
        },
        (err) => {
          setIsLocatingSms(false);
          console.warn('Geolocation error for SMS:', err);
          const msg = `I may need help. Please check on me.`;
          const cleanPhone = trustedPhone.replace(/[^0-9+]/g, '');
          window.location.href = `sms:${cleanPhone}?body=${encodeURIComponent(msg)}`;
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      const msg = `I may need help. Please check on me.`;
      const cleanPhone = trustedPhone.replace(/[^0-9+]/g, '');
      window.location.href = `sms:${cleanPhone}?body=${encodeURIComponent(msg)}`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-charcoal-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-charcoal-800 border border-charcoal-700 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-charcoal-700 pb-3">
          <div className="flex items-center space-x-3 text-rose-400">
            <div className="w-10 h-10 rounded-full bg-rose-950/80 border border-rose-500/40 flex items-center justify-center">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-charcoal-100">Emergency Assistance</h3>
              <span className="text-xs text-charcoal-400">Direct Helplines & Rapid Call</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-charcoal-400 hover:text-charcoal-100 rounded-full bg-charcoal-900 border border-charcoal-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 National Helplines */}
        <div className="space-y-2.5">
          <a
            href="tel:112"
            className="w-full p-4 rounded-2xl bg-rose-950/90 hover:bg-rose-900 border border-rose-500/50 text-rose-100 flex items-center justify-between shadow-lg transition active:scale-[0.98] group"
          >
            <div className="flex items-center space-x-3">
              <PhoneCall className="w-5 h-5 text-rose-400 shrink-0" />
              <div className="text-left">
                <span className="font-bold text-sm block">Call 112 — Emergency</span>
                <span className="text-xs text-rose-200/80">Police, Fire & Medical Services</span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold bg-rose-900/80 px-3 py-1 rounded-full border border-rose-400/50 group-hover:bg-rose-800">
              112 →
            </span>
          </a>

          <a
            href="tel:181"
            className="w-full p-3.5 rounded-2xl bg-charcoal-900 hover:bg-charcoal-850 border border-charcoal-700 text-charcoal-100 flex items-center justify-between transition active:scale-[0.98] group"
          >
            <div className="flex items-center space-x-3">
              <PhoneCall className="w-4 h-4 text-teal-400 shrink-0" />
              <div className="text-left">
                <span className="font-semibold text-xs block">Call 181 — Women's Helpline</span>
                <span className="text-[11px] text-charcoal-400">Support, Legal Aid & Counselling</span>
              </div>
            </div>
            <span className="text-xs font-mono text-charcoal-300 bg-charcoal-800 px-2.5 py-1 rounded-full border border-charcoal-700">
              181 →
            </span>
          </a>

          <a
            href="tel:1091"
            className="w-full p-3.5 rounded-2xl bg-charcoal-900 hover:bg-charcoal-850 border border-charcoal-700 text-charcoal-100 flex items-center justify-between transition active:scale-[0.98] group"
          >
            <div className="flex items-center space-x-3">
              <PhoneCall className="w-4 h-4 text-teal-400 shrink-0" />
              <div className="text-left">
                <span className="font-semibold text-xs block">Call 1091 — Women in Distress</span>
                <span className="text-[11px] text-charcoal-400">Immediate Safety Response</span>
              </div>
            </div>
            <span className="text-xs font-mono text-charcoal-300 bg-charcoal-800 px-2.5 py-1 rounded-full border border-charcoal-700">
              1091 →
            </span>
          </a>
        </div>

        {/* Trusted Contact Option */}
        <div className="pt-2 border-t border-charcoal-700/80 space-y-2">
          {trustedPhone ? (
            <div className="space-y-2">
              <a
                href={`tel:${trustedPhone.replace(/[^0-9+]/g, '')}`}
                className="w-full p-3.5 rounded-2xl bg-teal-950/80 hover:bg-teal-900 border border-teal-500/50 text-teal-100 flex items-center justify-between transition active:scale-[0.98]"
              >
                <div className="flex items-center space-x-2.5">
                  <PhoneCall className="w-4 h-4 text-teal-400 shrink-0" />
                  <div className="text-left">
                    <span className="font-semibold text-xs block">Call {trustedName || 'Trusted Contact'}</span>
                    <span className="text-[10px] text-teal-300/80 font-mono">{trustedPhone}</span>
                  </div>
                </div>
                <span className="text-xs font-semibold bg-teal-900 px-2.5 py-1 rounded-full border border-teal-500/40">
                  Call →
                </span>
              </a>

              <button
                onClick={handleShareLocationSms}
                disabled={isLocatingSms}
                className="w-full p-3.5 rounded-2xl bg-charcoal-900 hover:bg-charcoal-850 border border-charcoal-700 text-teal-300 flex items-center justify-between transition active:scale-[0.98] text-xs font-medium"
              >
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>
                    {isLocatingSms ? 'Locating...' : `Share location via SMS to ${trustedName || 'Trusted Contact'}`}
                  </span>
                </div>
                {isLocatingSms ? (
                  <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                ) : (
                  <span className="text-[11px] font-mono text-charcoal-300 bg-charcoal-800 px-2 py-0.5 rounded border border-charcoal-700">
                    SMS →
                  </span>
                )}
              </button>
            </div>
          ) : (
            <div className="bg-charcoal-900/90 border border-charcoal-700 p-3.5 rounded-2xl flex items-center justify-between text-xs">
              <div className="text-left pr-2">
                <span className="text-charcoal-200 font-medium block">Add a trusted contact</span>
                <span className="text-[10px] text-charcoal-400">Set up a contact in Settings for 1-tap calls & location SMS here.</span>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
                className="px-3 py-1.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 border border-charcoal-700 text-teal-400 font-medium text-[11px] shrink-0 flex items-center space-x-1 transition"
              >
                <span>Settings</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-charcoal-400 text-center pt-2 border-t border-charcoal-700/60 leading-tight">
          These are national helplines. In immediate danger, call 112 first.
        </p>

      </div>
    </div>
  );
};
