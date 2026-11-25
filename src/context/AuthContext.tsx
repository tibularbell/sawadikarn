import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';
import { UserProfile } from '../types/medical';

export interface SheetSyncStatePayload {
  googleSpreadsheetId?: string;
  googleSpreadsheetTitle?: string;
  googleSpreadsheetUrl?: string;
  lastSheetSyncAt?: string;
  lastSheetSyncStatus?: 'idle' | 'success' | 'error';
  lastSheetSyncError?: string;
}

interface AuthContextValue {
  firebaseUser: User | null;
  dbUser: UserProfile | null;
  workspaceAccessToken: string | null;
  loading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  connectGoogleSheets: () => Promise<string | null>;
  clearWorkspaceAccessToken: () => void;
  updateSheetSyncState: (payload: SheetSyncStatePayload) => Promise<void>;
  signOut: () => Promise<void>;
  apiFetch: <T = unknown>(url: string, options?: RequestInit) => Promise<T>;
  apiDownload: (url: string, fallbackFilename: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<UserProfile | null>(null);
  const [workspaceAccessToken, setWorkspaceAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const apiFetch = useCallback(
    async <T = unknown>(url: string, options: RequestInit = {}): Promise<T> => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('กรุณาเข้าสู่ระบบก่อนดำเนินการ');
      }
      const idToken = await currentUser.getIdToken();
      const headers = new Headers(options.headers || {});
      headers.set('Authorization', `Bearer ${idToken}`);
      if (options.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }

      const res = await fetch(url, {
        ...options,
        headers,
      });

      const contentType = res.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await res.json() : null;

      if (!res.ok) {
        throw new Error(data?.error || `เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ (${res.status})`);
      }

      return data as T;
    },
    []
  );

  const apiDownload = useCallback(
    async (url: string, fallbackFilename: string): Promise<void> => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('กรุณาเข้าสู่ระบบก่อนดำเนินการ');
      }
      const idToken = await currentUser.getIdToken();
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `ไม่สามารถดาวน์โหลดไฟล์ได้ (${res.status})`);
      }

      const disposition = res.headers.get('content-disposition') || '';
      const filenameMatch = disposition.match(/filename="?([^"]+)"?/i);
      const filename = filenameMatch?.[1] || fallbackFilename;

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    },
    []
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setAuthError(null);

      if (!user) {
        setDbUser(null);
        setWorkspaceAccessToken(null);
        setLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setDbUser(data.user);
        } else {
          const errData = await res.json().catch(() => ({}));
          setAuthError(errData.error || 'ไม่สามารถเชื่อมต่อบัญชีผู้ใช้กับฐานข้อมูลได้');
        }
      } catch (err: any) {
        setAuthError(err?.message || 'เกิดข้อผิดพลาดในการยืนยันตัวตน');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setWorkspaceAccessToken(credential.accessToken);
      }
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setAuthError(err?.message || 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้');
      }
    }
  }, []);

  const connectGoogleSheets = useCallback(async (): Promise<string | null> => {
    const result = await signInWithPopup(auth, googleAuthProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('ไม่ได้รับสิทธิ์การเข้าถึง Google Sheets จากบัญชี Google');
    }
    setWorkspaceAccessToken(credential.accessToken);
    return credential.accessToken;
  }, []);

  const clearWorkspaceAccessToken = useCallback(() => {
    setWorkspaceAccessToken(null);
  }, []);

  const updateSheetSyncState = useCallback(
    async (payload: SheetSyncStatePayload) => {
      const data = await apiFetch<{ user: UserProfile | null }>('/api/sheets/status', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      if (data?.user) {
        setDbUser(data.user);
      }
    },
    [apiFetch]
  );

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setDbUser(null);
    setWorkspaceAccessToken(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        dbUser,
        workspaceAccessToken,
        loading,
        authError,
        signInWithGoogle,
        connectGoogleSheets,
        clearWorkspaceAccessToken,
        updateSheetSyncState,
        signOut,
        apiFetch,
        apiDownload,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
