import { User, checkProfile, getAuthToken, logout } from '@/services/auth-service';
import React, { createContext, useContext, useEffect } from 'react';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isSignedIn: boolean;
  signIn: (user: User, token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  isSignedIn: false,
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(
    (prevState: any, action: any) => {
      switch (action.type) {
        case 'RESTORE_TOKEN':
          return {
            ...prevState,
            user: action.payload.user,
            token: action.payload.token,
            isSignedIn: !!action.payload.token,
            isLoading: false,
          };
        case 'SIGN_IN':
          return {
            ...prevState,
            isSignedIn: true,
            user: action.payload.user,
            token: action.payload.token,
          };
        case 'SIGN_OUT':
          return {
            ...prevState,
            isSignedIn: false,
            user: null,
            token: null,
          };
        default:
          return prevState;
      }
    },
    {
      isLoading: true,
      isSignedIn: false,
      user: null,
      token: null,
    }
  );

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const token = await getAuthToken();
        if (token) {
          try {
            const user = await checkProfile(token);
            dispatch({ type: 'RESTORE_TOKEN', payload: { user, token } });
          } catch (error) {
            console.error('Token doğrulama hatası:', error);
            await logout();
            dispatch({ type: 'RESTORE_TOKEN', payload: { user: null, token: null } });
          }
        } else {
          dispatch({ type: 'RESTORE_TOKEN', payload: { user: null, token: null } });
        }
      } catch (error) {
        console.error('Önyükleme hatası:', error);
        dispatch({ type: 'RESTORE_TOKEN', payload: { user: null, token: null } });
      }
    };

    bootstrapAsync();
  }, []);

  const authContext: AuthContextType = {
    user: state.user,
    token: state.token,
    isLoading: state.isLoading,
    isSignedIn: state.isSignedIn,
    signIn: async (user: User, token: string) => {
      dispatch({ type: 'SIGN_IN', payload: { user, token } });
    },
    signOut: async () => {
      try {
        await logout();
        dispatch({ type: 'SIGN_OUT' });
      } catch (error) {
        console.error('Çıkış hatası:', error);
      }
    },
  };

  return <AuthContext.Provider value={authContext}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
