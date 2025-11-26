import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface AuthContextType {
  token: string | null;
  username: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Get base URL and remove /api suffix for auth endpoints
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9000/api';
const AUTH_BASE_URL = API_BASE_URL.replace(/\/api$/, '');

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem('auth_username'));
  const [isLoading, setIsLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('auth_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${AUTH_BASE_URL}/auth/verify`, {
          headers: {
            'Authorization': `Bearer ${storedToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setToken(storedToken);
          setUsername(data.username);
        } else {
          // Token is invalid, clear it
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_username');
          setToken(null);
          setUsername(null);
        }
      } catch {
        // Network error, keep token for now (might be offline)
        console.log('Could not verify token, keeping current state');
      }

      setIsLoading(false);
    };

    verifyToken();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const response = await fetch(`${AUTH_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_username', data.username);
        setToken(data.token);
        setUsername(data.username);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error. Is the backend running?'
      };
    }
  }, []);

  const logout = useCallback(() => {
    // Call logout endpoint (fire and forget)
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      fetch(`${AUTH_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${storedToken}`,
        },
      }).catch(() => {
        // Ignore errors on logout
      });
    }

    // Clear local state
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_username');
    setToken(null);
    setUsername(null);
  }, []);

  const value: AuthContextType = {
    token,
    username,
    isAuthenticated: !!token,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
