import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthContext';
import { supabase } from '@/lib/supabase';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  },
  auth: {
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    resetPassword: jest.fn(),
  },
}));

// Mock Sentry
jest.mock('@sentry/react-native', () => ({
  setUser: jest.fn(),
}));

describe('AuthContext', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    user_metadata: { name: 'Test User' },
  };

  const mockSession = {
    user: mockUser,
    access_token: 'token-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should start with loading state', () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      });

      const wrapper = ({ children }: any) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.loading).toBe(true);
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
    });
  });

  describe('Sign In', () => {
    it('should sign in successfully', async () => {
      const { auth } = require('@/lib/supabase');

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      });

      auth.signIn.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const wrapper = ({ children }: any) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      let signInResult;
      await act(async () => {
        signInResult = await result.current.signIn('test@example.com', 'password123');
      });

      expect(auth.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(signInResult).toEqual({
        data: { session: mockSession },
        error: null,
      });
    });

    it('should handle sign in error', async () => {
      const { auth } = require('@/lib/supabase');

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      });

      const mockError = { message: 'Invalid credentials' };
      auth.signIn.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const wrapper = ({ children }: any) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      let signInResult;
      await act(async () => {
        signInResult = await result.current.signIn('wrong@example.com', 'wrongpass');
      });

      expect(signInResult).toEqual({
        data: null,
        error: mockError,
      });
    });
  });

  describe('Sign Up', () => {
    it('should sign up successfully', async () => {
      const { auth } = require('@/lib/supabase');

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      });

      auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const wrapper = ({ children }: any) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      let signUpResult;
      await act(async () => {
        signUpResult = await result.current.signUp(
          'newuser@example.com',
          'password123',
          { name: 'New User' }
        );
      });

      expect(auth.signUp).toHaveBeenCalledWith(
        'newuser@example.com',
        'password123',
        { name: 'New User' }
      );
      expect(signUpResult).toEqual({
        data: { user: mockUser },
        error: null,
      });
    });

    it('should handle sign up error (email in use)', async () => {
      const { auth } = require('@/lib/supabase');

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      });

      const mockError = { message: 'Email already registered' };
      auth.signUp.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const wrapper = ({ children }: any) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      let signUpResult;
      await act(async () => {
        signUpResult = await result.current.signUp('existing@example.com', 'password123');
      });

      expect(signUpResult).toEqual({
        data: null,
        error: mockError,
      });
    });
  });

  describe('Sign Out', () => {
    it('should sign out successfully', async () => {
      const { auth } = require('@/lib/supabase');

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
      });

      (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      });

      auth.signOut.mockResolvedValue({});

      const wrapper = ({ children }: any) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(auth.signOut).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
    });
  });

  describe('Password Reset', () => {
    it('should request password reset successfully', async () => {
      const { auth } = require('@/lib/supabase');

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      });

      auth.resetPassword.mockResolvedValue({
        data: {},
        error: null,
      });

      const wrapper = ({ children }: any) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      let resetResult;
      await act(async () => {
        resetResult = await result.current.resetPassword('test@example.com');
      });

      expect(auth.resetPassword).toHaveBeenCalledWith('test@example.com');
      expect(resetResult).toEqual({
        data: {},
        error: null,
      });
    });
  });

  describe('Auth State Changes', () => {
    it('should update user when auth state changes', async () => {
      let authCallback: any;

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        authCallback = callback;
        return {
          data: { subscription: { unsubscribe: jest.fn() } },
        };
      });

      const wrapper = ({ children }: any) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Simulate auth state change (user signs in)
      act(() => {
        authCallback('SIGNED_IN', mockSession);
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.session).toEqual(mockSession);
      });
    });

    it('should clear user when auth state changes to signed out', async () => {
      let authCallback: any;

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
      });

      (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        authCallback = callback;
        return {
          data: { subscription: { unsubscribe: jest.fn() } },
        };
      });

      const wrapper = ({ children }: any) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      // Simulate auth state change (user signs out)
      act(() => {
        authCallback('SIGNED_OUT', null);
      });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.session).toBeNull();
      });
    });
  });
});
