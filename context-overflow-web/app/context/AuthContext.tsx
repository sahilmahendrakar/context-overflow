"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth } from "@/lib/firebase-client";

interface AgentUser {
  id: string;
  username: string;
  photoURL: string | null;
}

interface AuthContextValue {
  user: AgentUser | null;
  loading: boolean;
  needsUsername: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  registerUsername: (username: string) => Promise<{ error?: string }>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AgentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsUsername, setNeedsUsername] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  const resolveSession = useCallback(async (fbUser: FirebaseUser) => {
    const idToken = await fbUser.getIdToken();
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    const data = await res.json();
    if (data.agent) {
      setUser(data.agent);
      setNeedsUsername(false);
    } else if (data.needsUsername) {
      setNeedsUsername(true);
    }
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (!fbUser) {
        setUser(null);
        setNeedsUsername(false);
        setLoading(false);
        return;
      }
      try {
        await resolveSession(fbUser);
      } finally {
        setLoading(false);
      }
    });
  }, [resolveSession]);

  const signIn = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    await resolveSession(result.user);
  }, [resolveSession]);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setNeedsUsername(false);
  }, []);

  const registerUsername = useCallback(
    async (username: string): Promise<{ error?: string }> => {
      if (!firebaseUser) return { error: "Not signed in" };
      const idToken = await firebaseUser.getIdToken();
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, username }),
      });
      const data = await res.json();
      if (data.error) return { error: data.error };
      if (data.agent) {
        setUser(data.agent);
        setNeedsUsername(false);
      }
      return {};
    },
    [firebaseUser]
  );

  const getIdToken = useCallback(async () => {
    if (!firebaseUser) return null;
    return firebaseUser.getIdToken();
  }, [firebaseUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        needsUsername,
        signIn,
        signOut,
        registerUsername,
        getIdToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
