import { getSupabase } from './supabaseClient';

const LOCAL_PIN_KEY = 'khata_security_pin';
const BIOMETRIC_CREDENTIAL_ID_KEY = 'khata_biometric_cred_id';
const AUTH_STATE_KEY = 'khata_auth_unlocked';

// Convert buffer to Base64URL string
const bufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

// Convert Base64URL string to Uint8Array
const base64ToBuffer = (base64) => {
  let str = base64.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  const binary = window.atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

export const authService = {
  // Check if WebAuthn Biometric (Touch ID / Face ID / Fingerprint) is supported on this device/browser
  async isBiometricAvailable() {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      return false;
    }
    try {
      if (PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
        return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      }
      return true;
    } catch {
      return false;
    }
  },

  // Check if biometric credential is already registered on this device
  hasBiometricEnrolled() {
    return Boolean(localStorage.getItem(BIOMETRIC_CREDENTIAL_ID_KEY));
  },

  // Enroll biometric (Touch ID / Fingerprint sensor)
  async registerBiometric(username = 'KhataBook Owner') {
    if (!window.PublicKeyCredential) {
      throw new Error('Biometric authentication is not supported on this browser.');
    }

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const userId = new Uint8Array(16);
    window.crypto.getRandomValues(userId);

    const publicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'KhataBook Digital Ledger',
        id: window.location.hostname,
      },
      user: {
        id: userId,
        name: username,
        displayName: username,
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },  // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Uses Touch ID / device fingerprint
        userVerification: 'preferred',
        requireResidentKey: false,
      },
      timeout: 60000,
      attestation: 'none',
    };

    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    });

    if (!credential) {
      throw new Error('Biometric registration was cancelled or failed.');
    }

    const credIdBase64 = bufferToBase64(credential.rawId);
    localStorage.setItem(BIOMETRIC_CREDENTIAL_ID_KEY, credIdBase64);
    return true;
  },

  // Authenticate with Fingerprint / Touch ID
  async authenticateBiometric() {
    if (!window.PublicKeyCredential) {
      throw new Error('Biometrics not supported on this browser.');
    }

    const credIdBase64 = localStorage.getItem(BIOMETRIC_CREDENTIAL_ID_KEY);
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const publicKeyCredentialRequestOptions = {
      challenge,
      timeout: 60000,
      userVerification: 'preferred',
      rpId: window.location.hostname,
    };

    if (credIdBase64) {
      publicKeyCredentialRequestOptions.allowCredentials = [
        {
          id: base64ToBuffer(credIdBase64),
          type: 'public-key',
          transports: ['internal'],
        },
      ];
    }

    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    });

    if (!assertion) {
      throw new Error('Fingerprint verification failed.');
    }

    this.setUnlocked(true);
    return true;
  },

  // Security PIN methods
  isPinConfigured() {
    return Boolean(localStorage.getItem(LOCAL_PIN_KEY));
  },

  setPin(pin) {
    if (!pin || pin.length < 4) {
      throw new Error('PIN must be at least 4 digits');
    }
    localStorage.setItem(LOCAL_PIN_KEY, pin);
    this.setUnlocked(true);
    return true;
  },

  verifyPin(inputPin) {
    const savedPin = localStorage.getItem(LOCAL_PIN_KEY);
    // Default fallback pin for first time demo if none set is 1234
    if (!savedPin) {
      if (inputPin === '1234') {
        localStorage.setItem(LOCAL_PIN_KEY, '1234');
        this.setUnlocked(true);
        return true;
      }
      return false;
    }
    if (savedPin === inputPin) {
      this.setUnlocked(true);
      return true;
    }
    return false;
  },

  clearPin() {
    localStorage.removeItem(LOCAL_PIN_KEY);
  },

  // Lock / Unlock session management
  isUnlocked() {
    return sessionStorage.getItem(AUTH_STATE_KEY) === 'true';
  },

  setUnlocked(unlocked) {
    if (unlocked) {
      sessionStorage.setItem(AUTH_STATE_KEY, 'true');
    } else {
      sessionStorage.removeItem(AUTH_STATE_KEY);
    }
  },

  lock() {
    this.setUnlocked(false);
  },

  // Supabase Auth Integration
  async getSupabaseUser() {
    const supabase = getSupabase();
    if (!supabase) return null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch {
      return null;
    }
  },

  async loginWithSupabase(email, password) {
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error('Supabase is not configured yet. Configure URL and Key in Settings.');
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
    this.setUnlocked(true);
    return data.user;
  },

  async registerWithSupabase(email, password) {
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error('Supabase is not configured yet. Configure URL and Key in Settings.');
    }
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    if (error) throw error;
    this.setUnlocked(true);
    return data.user;
  },

  async logoutSupabase() {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
    this.lock();
  },
};
