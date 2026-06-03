'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { AuthModal } from '@/components/auth/auth-modal';

const AuthGateContext = createContext(null);

export const useAuthGate = () => {
  const ctx = useContext(AuthGateContext);
  if (!ctx) throw new Error('useAuthGate must be used within <AuthGateProvider>');
  return ctx;
};

export function AuthGateProvider({ children }) {
  const { user, isLoading } = useAuth();
  const [modal, setModal] = useState(null); 
  const pendingRef = useRef(null);

  const openAuth = useCallback((opts = {}) => {
    pendingRef.current = null;
    setModal({ title: opts.title, description: opts.description });
  }, []);

  const requireAuth = useCallback(
    (action, opts = {}) => {
      if (user) {
        action?.();
        return;
      }
      pendingRef.current = action ?? null;
      setModal({ title: opts.title, description: opts.description });
    },
    [user],
  );

  const close = useCallback(() => {
    setModal(null);
    pendingRef.current = null;
  }, []);

  const onAuthed = useCallback(() => {
    setModal(null);
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (pending) setTimeout(() => pending(), 0);
  }, []);

  const value = useMemo(
    () => ({ user, isAuthed: Boolean(user), isLoading, requireAuth, openAuth }),
    [user, isLoading, requireAuth, openAuth],
  );

  return (
    <AuthGateContext.Provider value={value}>
      {children}
      {modal && (
        <AuthModal
          title={modal.title}
          description={modal.description}
          onClose={close}
          onAuthed={onAuthed}
        />
      )}
    </AuthGateContext.Provider>
  );
}
