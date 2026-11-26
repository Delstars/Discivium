import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ActionName, AppStateSnapshot, UserRole } from '../types/api';
import {
  ApiError,
  downloadProtectedFile,
  fetchSession,
  fetchState,
  loginAccount,
  logoutAccount,
  postAction,
  uploadActionWithProgress,
} from '../lib/apiClient';
import { getDesignPreviewSnapshot } from '../lib/previewFixtures';

export type ThemeMode = 'light' | 'dark';

export interface RouteState {
  section: string;
  courseId?: number;
}

export interface ToastMessage {
  id: number;
  kind: 'success' | 'error' | 'info';
  text: string;
}

const PREFS_KEY = 'discivium_ui_appearance_v1';

interface StoredAppearancePrefs {
  theme: ThemeMode;
  sidebarCollapsed: boolean;
}

function loadAppearancePrefs(): StoredAppearancePrefs {
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return { theme: 'light', sidebarCollapsed: false };
    const parsed = JSON.parse(raw) as Partial<StoredAppearancePrefs>;
    return {
      theme: parsed.theme === 'dark' ? 'dark' : 'light',
      sidebarCollapsed: Boolean(parsed.sidebarCollapsed),
    };
  } catch {
    return { theme: 'light', sidebarCollapsed: false };
  }
}

function saveAppearancePrefs(prefs: StoredAppearancePrefs) {
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage quota or privacy-mode errors.
  }
}

function parseHashRoute(): RouteState {
  const hash = window.location.hash.replace(/^#\/?/, '').trim();
  if (!hash) return { section: 'overview' };
  const parts = hash.split('/').filter(Boolean);
  if (parts[0] === 'course' && parts[1] && /^\d+$/.test(parts[1])) {
    return { section: 'course', courseId: Number(parts[1]) };
  }
  return { section: parts[0] };
}

function formatHashRoute(route: RouteState): string {
  if (route.section === 'course' && route.courseId) {
    return `#/course/${route.courseId}`;
  }
  return `#/${route.section}`;
}

interface AppContextValue {
  booting: boolean;
  refreshing: boolean;
  state: AppStateSnapshot | null;
  connectionError: string | null;
  sessionNotice: string | null;
  previewRole: UserRole | null;
  route: RouteState;
  theme: ThemeMode;
  sidebarCollapsed: boolean;
  toast: ToastMessage | null;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  navigate: (section: string, courseId?: number) => void;
  dismissToast: () => void;
  notify: (kind: ToastMessage['kind'], text: string) => void;
  refreshState: () => Promise<void>;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  enterDesignPreview: (role: UserRole) => void;
  exitDesignPreview: () => void;
  executeAction: (
    action: ActionName,
    payload: Record<string, unknown>,
    successMessage?: string
  ) => Promise<void>;
  executeUpload: (
    action: 'submit' | 'resource',
    formData: FormData,
    onProgress?: (percent: number | null) => void,
    successMessage?: string
  ) => Promise<void>;
  executeDownload: (url: string, fallbackFilename: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const initialPrefs = useMemo(() => loadAppearancePrefs(), []);
  const [theme, setThemeState] = useState<ThemeMode>(initialPrefs.theme);
  const [sidebarCollapsed, setSidebarCollapsedState] = useState<boolean>(
    initialPrefs.sidebarCollapsed
  );
  const [booting, setBooting] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [state, setState] = useState<AppStateSnapshot | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const [previewRole, setPreviewRole] = useState<UserRole | null>(null);
  const [route, setRoute] = useState<RouteState>(() => parseHashRoute());
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    saveAppearancePrefs({ theme, sidebarCollapsed });
  }, [theme, sidebarCollapsed]);

  useEffect(() => {
    const onHashChange = () => setRoute(parseHashRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const notify = useCallback((kind: ToastMessage['kind'], text: string) => {
    setToast({ id: Date.now(), kind, text });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => {
      setToast((current) => (current?.id === toast.id ? null : current));
    }, 5500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const navigate = useCallback((section: string, courseId?: number) => {
    const next: RouteState = courseId ? { section, courseId } : { section };
    setRoute(next);
    const hash = formatHashRoute(next);
    if (window.location.hash !== hash) {
      window.location.hash = hash;
    }
  }, []);

  const handleUnauthorized = useCallback((message?: string) => {
    setState(null);
    setPreviewRole(null);
    setSessionNotice(
      message || 'Your session expired or you were signed out. Please authenticate again.'
    );
  }, []);

  const refreshState = useCallback(async () => {
    if (previewRole) {
      setState(getDesignPreviewSnapshot(previewRole));
      return;
    }
    setRefreshing(true);
    try {
      const snapshot = await fetchState();
      setState(snapshot);
      setConnectionError(null);
      setSessionNotice(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        handleUnauthorized(err.message);
      } else if (err instanceof ApiError) {
        setConnectionError(err.message);
        notify('error', err.message);
      } else {
        const msg = 'Unexpected error while loading state from server.';
        setConnectionError(msg);
        notify('error', msg);
      }
    } finally {
      setRefreshing(false);
    }
  }, [previewRole, handleUnauthorized, notify]);

  useEffect(() => {
    let active = true;
    (async () => {
      setBooting(true);
      try {
        const session = await fetchSession();
        if (!active) return;
        setConnectionError(null);
        if (session.authenticated) {
          const snapshot = await fetchState();
          if (!active) return;
          setState(snapshot);
        } else {
          setState(null);
        }
      } catch (err) {
        if (!active) return;
        setState(null);
        setConnectionError(
          err instanceof ApiError
            ? err.message
            : 'Unable to reach /api/session. Run the Python backend to authenticate.'
        );
      } finally {
        if (active) setBooting(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(
    async (username: string, password: string) => {
      setPreviewRole(null);
      setSessionNotice(null);
      setConnectionError(null);
      await loginAccount(username.trim(), password);
      const snapshot = await fetchState();
      setState(snapshot);
      navigate('overview');
      notify('success', `Signed in as ${snapshot.user.name}.`);
    },
    [navigate, notify]
  );

  const signOut = useCallback(async () => {
    if (previewRole) {
      setPreviewRole(null);
      setState(null);
      navigate('overview');
      notify('info', 'Exited offline Design Preview Mode.');
      return;
    }
    const csrf = state?.csrf ?? '';
    try {
      if (csrf) {
        await logoutAccount(csrf);
      }
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 401)) {
        notify('error', 'Sign-out was not confirmed by the server. Your session may still be active; retry sign-out.');
        return;
      }
    }
    setState(null);
    setSessionNotice(null);
    navigate('overview');
    notify('info', 'Signed out. Sign in with another account to switch roles.');
  }, [previewRole, state?.csrf, navigate, notify]);

  const enterDesignPreview = useCallback(
    (role: UserRole) => {
      setPreviewRole(role);
      setState(getDesignPreviewSnapshot(role));
      setSessionNotice(null);
      navigate('overview');
      notify(
        'info',
        'Design Preview Mode enabled (read-only offline fixtures). Live API mutations are disabled.'
      );
    },
    [navigate, notify]
  );

  const exitDesignPreview = useCallback(() => {
    setPreviewRole(null);
    setState(null);
    navigate('overview');
  }, [navigate]);

  const executeAction = useCallback(
    async (
      action: ActionName,
      payload: Record<string, unknown>,
      successMessage?: string
    ) => {
      if (previewRole) {
        throw new ApiError(
          403,
          'Design Preview Mode is read-only. Exit preview and connect to the live Python backend to execute actions.'
        );
      }
      if (!state?.csrf) {
        handleUnauthorized('Missing active session token. Please sign in again.');
        throw new ApiError(401, 'Not authenticated.');
      }
      try {
        await postAction(action, payload, state.csrf);
        try {
          const fresh = await fetchState();
          setState(fresh);
          if (successMessage) notify('success', successMessage);
        } catch (refreshError) {
          if (refreshError instanceof ApiError && refreshError.status === 401) {
            handleUnauthorized(refreshError.message);
          }
          notify('info', 'Server confirmed the action, but refreshing data failed. Refresh before taking another action.');
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          handleUnauthorized(err.message);
        }
        notify('error', err instanceof Error ? err.message : 'Action failed.');
        throw err;
      }
    },
    [previewRole, state?.csrf, handleUnauthorized, notify]
  );

  const executeUpload = useCallback(
    async (
      action: 'submit' | 'resource',
      formData: FormData,
      onProgress?: (percent: number | null) => void,
      successMessage?: string
    ) => {
      if (previewRole) {
        throw new ApiError(
          403,
          'Design Preview Mode is read-only. Exit preview and sign in against the live Python backend to upload files.'
        );
      }
      if (!state?.csrf) {
        handleUnauthorized('Missing active session token. Please sign in again.');
        throw new ApiError(401, 'Not authenticated.');
      }
      try {
        await uploadActionWithProgress(action, formData, state.csrf, onProgress);
        try {
          const fresh = await fetchState();
          setState(fresh);
          if (successMessage) notify('success', successMessage);
        } catch (refreshError) {
          if (refreshError instanceof ApiError && refreshError.status === 401) {
            handleUnauthorized(refreshError.message);
          }
          notify('info', 'Server confirmed the action, but refreshing data failed. Refresh before taking another action.');
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          handleUnauthorized(err.message);
        }
        notify('error', err instanceof Error ? err.message : 'Action failed.');
        throw err;
      }
    },
    [previewRole, state?.csrf, handleUnauthorized, notify]
  );

  const executeDownload = useCallback(
    async (url: string, fallbackFilename: string) => {
      if (previewRole) {
        notify(
          'error',
          'File downloads require the live Python backend. Exit Design Preview Mode to download actual files.'
        );
        return;
      }
      try {
        const downloaded = await downloadProtectedFile(url, fallbackFilename);
        notify('success', `Downloaded ${downloaded}.`);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          handleUnauthorized(err.message);
        }
        const message =
          err instanceof ApiError ? err.message : 'Unable to download file from server.';
        notify('error', message);
        throw err;
      }
    },
    [previewRole, handleUnauthorized, notify]
  );

  const setTheme = useCallback((mode: ThemeMode) => setThemeState(mode), []);
  const toggleTheme = useCallback(
    () => setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark')),
    []
  );
  const setSidebarCollapsed = useCallback(
    (collapsed: boolean) => setSidebarCollapsedState(collapsed),
    []
  );
  const dismissToast = useCallback(() => setToast(null), []);

  const value = useMemo<AppContextValue>(
    () => ({
      booting,
      refreshing,
      state,
      connectionError,
      sessionNotice,
      previewRole,
      route,
      theme,
      sidebarCollapsed,
      toast,
      setTheme,
      toggleTheme,
      setSidebarCollapsed,
      navigate,
      dismissToast,
      notify,
      refreshState,
      signIn,
      signOut,
      enterDesignPreview,
      exitDesignPreview,
      executeAction,
      executeUpload,
      executeDownload,
    }),
    [
      booting,
      refreshing,
      state,
      connectionError,
      sessionNotice,
      previewRole,
      route,
      theme,
      sidebarCollapsed,
      toast,
      setTheme,
      toggleTheme,
      setSidebarCollapsed,
      navigate,
      dismissToast,
      notify,
      refreshState,
      signIn,
      signOut,
      enterDesignPreview,
      exitDesignPreview,
      executeAction,
      executeUpload,
      executeDownload,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return ctx;
}
