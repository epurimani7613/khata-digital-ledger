import React, { useState, useEffect } from 'react';
import { 
  Fingerprint, 
  Lock, 
  KeyRound, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  Delete,
  CheckCircle2,
  LockKeyhole
} from 'lucide-react';
import { authService } from '../services/authService';

export const AuthScreen = ({ onUnlock, isCloud }) => {
  const [activeTab, setActiveTab] = useState('PIN'); // 'PIN' | 'SUPABASE'
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isBiometricRegistered, setIsBiometricRegistered] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [shake, setShake] = useState(false);

  // Custom PIN Setup State (No default PIN!)
  const [isPinSet, setIsPinSet] = useState(authService.isPinConfigured());
  const [pinSetupStep, setPinSetupStep] = useState(1); // 1 = Enter, 2 = Confirm
  const [firstEnteredPin, setFirstEnteredPin] = useState('');

  // Supabase Auth State
  const [authMode, setAuthMode] = useState('LOGIN'); // 'LOGIN' | 'SIGNUP'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check biometric support on mount
  useEffect(() => {
    async function checkBio() {
      const supported = await authService.isBiometricAvailable();
      setIsBiometricSupported(supported);
      setIsBiometricRegistered(authService.hasBiometricEnrolled());
    }
    checkBio();
  }, []);

  const triggerShake = (msg) => {
    setErrorMsg(msg);
    setShake(true);
    setPin('');
    setTimeout(() => setShake(false), 500);
  };

  // Handle PIN input
  const handlePinPress = (digit) => {
    setErrorMsg('');
    if (digit === 'CLEAR') {
      setPin('');
      return;
    }
    if (digit === 'BACKSPACE') {
      setPin((prev) => prev.slice(0, -1));
      return;
    }
    if (pin.length >= 4) return;

    const nextPin = pin + digit;
    setPin(nextPin);

    // Auto action when 4 digits reached
    if (nextPin.length === 4) {
      if (!isPinSet) {
        // Initial PIN Creation Flow
        if (pinSetupStep === 1) {
          setTimeout(() => {
            setFirstEnteredPin(nextPin);
            setPin('');
            setPinSetupStep(2);
          }, 150);
        } else {
          // Confirm step
          setTimeout(() => {
            if (nextPin === firstEnteredPin) {
              authService.setPin(nextPin);
              setIsPinSet(true);
              setSuccessMsg('Security PIN created successfully!');
              setTimeout(() => onUnlock(), 400);
            } else {
              triggerShake('PINs did not match. Please re-enter.');
              setPinSetupStep(1);
              setFirstEnteredPin('');
            }
          }, 150);
        }
      } else {
        // Normal Unlock Flow
        setTimeout(() => verifyEnteredPin(nextPin), 150);
      }
    }
  };

  const verifyEnteredPin = (enteredPin) => {
    const isValid = authService.verifyPin(enteredPin);
    if (isValid) {
      setSuccessMsg('Unlocked successfully!');
      setTimeout(() => onUnlock(), 250);
    } else {
      triggerShake('Incorrect PIN. Please try again.');
    }
  };

  // Biometric Unlock / Fingerprint Handler
  const handleBiometricAuth = async () => {
    setErrorMsg('');
    setIsScanning(true);
    try {
      if (!isBiometricRegistered) {
        // First time: Enroll fingerprint on device
        const registered = await authService.registerBiometric();
        if (registered) {
          setIsBiometricRegistered(true);
          setSuccessMsg('Fingerprint registered & unlocked!');
          setTimeout(() => onUnlock(), 500);
        }
      } else {
        // Authenticate existing fingerprint
        await authService.authenticateBiometric();
        setSuccessMsg('Fingerprint recognized!');
        setTimeout(() => onUnlock(), 400);
      }
    } catch (err) {
      console.warn('Biometric error:', err);
      setErrorMsg(err.message || 'Fingerprint verification failed.');
    } finally {
      setIsScanning(false);
    }
  };

  // Supabase Auth Handler
  const handleSupabaseSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!email || !password) {
      setErrorMsg('Please enter email and password.');
      return;
    }
    setIsSubmitting(true);
    try {
      if (authMode === 'LOGIN') {
        await authService.loginWithSupabase(email, password);
        setSuccessMsg('Logged in via Supabase!');
      } else {
        await authService.registerWithSupabase(email, password);
        setSuccessMsg('Account created successfully!');
      }
      setTimeout(() => onUnlock(), 400);
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-between p-4 sm:p-6 select-none overflow-y-auto ledger-scroll">
      {/* Top Branding */}
      <div className="w-full max-w-sm flex items-center justify-between pt-2">
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-emerald-500/20">
            ₹
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-white tracking-tight">KhataBook PRO</h1>
            <p className="text-[11px] text-slate-400">Digital Business Ledger</p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-900 border border-slate-800 text-slate-300">
          <Lock className="w-3 h-3 text-emerald-400" />
          <span>{isPinSet ? 'Secured' : 'Setup Required'}</span>
        </div>
      </div>

      {/* Main Lock Card */}
      <div className={`w-full max-w-sm my-auto pt-4 pb-2 transition-transform ${shake ? 'animate-bounce' : ''}`}>
        {/* Toggle Mode Tabs */}
        {isPinSet && (
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 mb-6">
            <button
              onClick={() => {
                setActiveTab('PIN');
                setErrorMsg('');
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'PIN'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
              <span>PIN & Fingerprint</span>
            </button>

            {isCloud && (
              <button
                onClick={() => {
                  setActiveTab('SUPABASE');
                  setErrorMsg('');
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'SUPABASE'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                <span>Supabase Login</span>
              </button>
            )}
          </div>
        )}

        {/* Status Messages */}
        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-950/70 border border-rose-600/50 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-600/50 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TAB 1: PIN & FINGERPRINT */}
        {activeTab === 'PIN' && (
          <div className="flex flex-col items-center">
            {/* Biometric Touch ID / Fingerprint Button (Single Owner Locked) */}
            {isBiometricSupported && (
              <div className="mb-6 flex flex-col items-center">
                <button
                  type="button"
                  onClick={handleBiometricAuth}
                  disabled={isScanning}
                  className={`w-20 h-20 rounded-full border-2 flex items-center justify-center relative transition-all active:scale-90 ${
                    isScanning
                      ? 'border-emerald-400 bg-emerald-950/80 shadow-[0_0_30px_rgba(16,185,129,0.5)]'
                      : isBiometricRegistered
                      ? 'border-emerald-500/80 bg-slate-900/90 hover:bg-emerald-950/30 shadow-lg shadow-emerald-500/10'
                      : 'border-slate-700 hover:border-emerald-500 bg-slate-900/90'
                  }`}
                >
                  <Fingerprint
                    className={`w-10 h-10 transition-all ${
                      isScanning ? 'text-emerald-300 scale-110 animate-pulse' : 'text-emerald-400'
                    }`}
                  />
                  <span className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping pointer-events-none"></span>
                </button>
                <span className="text-xs font-semibold text-slate-300 mt-2.5">
                  {isScanning
                    ? 'Verifying Owner Fingerprint...'
                    : isBiometricRegistered
                    ? 'Unlock with Owner Fingerprint'
                    : 'Enroll Owner Fingerprint (1 User Only)'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {isBiometricRegistered
                    ? 'Secured for Sole Owner'
                    : 'Only one user fingerprint permitted'}
                </span>
              </div>
            )}

            {/* If Setting PIN for the first time */}
            {!isPinSet && (
              <div className="mb-4 text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-950/80 border border-emerald-600/40 text-emerald-400 flex items-center justify-center mb-2 shadow-lg">
                  <LockKeyhole className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">Create Security PIN</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {pinSetupStep === 1
                    ? 'Choose your custom 4-digit security PIN'
                    : 'Confirm your 4-digit PIN'}
                </p>
              </div>
            )}

            {/* PIN Indicator Dots */}
            <div className="flex items-center space-x-4 mb-4">
              {[0, 1, 2, 3].map((idx) => {
                const filled = pin.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                      filled
                        ? 'bg-emerald-400 border-emerald-400 scale-110 shadow-sm shadow-emerald-400/50'
                        : 'border-slate-700 bg-slate-900'
                    }`}
                  />
                );
              })}
            </div>

            {isPinSet && (
              <div className="text-[11px] text-slate-400 mb-3 text-center">
                Enter your 4-digit security PIN to unlock
              </div>
            )}

            {/* Quick PIN Keypad Grid */}
            <div className="w-full grid grid-cols-3 gap-2.5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handlePinPress(digit)}
                  className="h-13 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-white font-bold text-xl hover:bg-slate-800 active:bg-slate-700 active:scale-95 transition shadow-sm"
                >
                  {digit}
                </button>
              ))}

              <button
                onClick={() => handlePinPress('CLEAR')}
                className="h-13 py-3 rounded-2xl bg-slate-900 border border-slate-800/80 text-amber-400 font-bold text-xs uppercase hover:bg-slate-800 active:scale-95 transition"
              >
                Clear
              </button>

              <button
                onClick={() => handlePinPress('0')}
                className="h-13 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-white font-bold text-xl hover:bg-slate-800 active:bg-slate-700 active:scale-95 transition shadow-sm"
              >
                0
              </button>

              <button
                onClick={() => handlePinPress('BACKSPACE')}
                className="h-13 py-3 rounded-2xl bg-slate-900 border border-slate-800/80 text-slate-300 hover:text-rose-400 hover:bg-slate-800 active:scale-95 transition flex items-center justify-center"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: SUPABASE CLOUD LOGIN */}
        {activeTab === 'SUPABASE' && (
          <form onSubmit={handleSupabaseSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@business.com"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-1.5 active:scale-95 transition"
            >
              <span>{isSubmitting ? 'Verifying...' : authMode === 'LOGIN' ? 'Sign In to Ledger' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setAuthMode(authMode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')}
                className="text-xs text-slate-400 hover:text-emerald-400 transition"
              >
                {authMode === 'LOGIN' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Footer Security Badges */}
      <div className="w-full max-w-sm text-center py-2 border-t border-slate-900 text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <span>End-to-End Encrypted Digital Ledger</span>
      </div>
    </div>
  );
};
