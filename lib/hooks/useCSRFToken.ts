import { useEffect, useState } from 'react';
import * as React from 'react';

/**
 * Hook to manage CSRF tokens for form submissions
 * Automatically retrieves and includes CSRF token in requests
 */
export function useCSRFToken() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Get CSRF token from cookie
    const getToken = () => {
      if (typeof document === 'undefined') return null;
      
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'csrf_token') {
          return value;
        }
      }
      return null;
    };

    setToken(getToken());
  }, []);

  /**
   * Get headers object with CSRF token included
   */
  const getCSRFHeaders = (): HeadersInit => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['x-csrf-token'] = token;
    }

    return headers;
  };

  /**
   * Fetch wrapper that automatically includes CSRF token
   */
  const csrfFetch = async (url: string, options: RequestInit = {}) => {
    const headers = {
      ...getCSRFHeaders(),
      ...(options.headers || {}),
    };

    return fetch(url, {
      ...options,
      headers,
    });
  };

  /**
   * Add CSRF token to FormData
   */
  const addCSRFToFormData = (formData: FormData): FormData => {
    if (token) {
      formData.append('csrf_token', token);
    }
    return formData;
  };

  return {
    token,
    getCSRFHeaders,
    csrfFetch,
    addCSRFToFormData,
    hasToken: !!token,
  };
}

/**
 * Higher-order component to protect forms with CSRF tokens
 * Note: Simplified - use useCSRFToken hook directly in components instead
 */
interface WithCSRFProps {
  onSubmit: (e: React.FormEvent, csrfToken: string | null) => void | Promise<void>;
}

export function withCSRF<P extends WithCSRFProps>(
  Component: React.ComponentType<P>
): React.ComponentType<Omit<P, 'csrfToken'>> {
  return function WrappedComponent(props: Omit<P, 'csrfToken'>) {
    const { token } = useCSRFToken();

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      props.onSubmit(e, token);
    };

    return React.createElement(Component, { ...props, onSubmit: handleSubmit } as unknown as P);
  };
}

/**
 * Validate CSRF token on the client before submission
 * This is a client-side check; server must also validate
 */
export function validateCSRFTokenClient(token: string | null): boolean {
  if (!token) {
    console.warn('CSRF token not found. Request may be rejected by server.');
    return false;
  }

  if (token.length !== 64) {
    console.warn('CSRF token format invalid. Request may be rejected by server.');
    return false;
  }

  return true;
}
