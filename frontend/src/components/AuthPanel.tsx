import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useLogin, useLogout, useMe, useRegister } from '../hooks/useAuth';
import './AuthPanel.css';

type AuthMode = 'login' | 'register';

const AuthPanel = () => {
  const { data: user, isLoading } = useMe();
  const login = useLogin();
  const register = useRegister();
  const logout = useLogout();

  const [mode, setMode] = useState<AuthMode>('login');
  const validationSchema = yup.object({
    email: yup.string().trim().email('Invalid email format').required('Email is required'),
    password: yup
      .string()
      .min(6, 'Password should be at least 6 characters')
      .max(128, 'Password is too long')
      .required('Password is required'),
  });

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<{ email: string; password: string }>({
    defaultValues: {
      email: '',
      password: '',
    },
    resolver: yupResolver(validationSchema),
  });

  const isSubmitting = login.isPending || register.isPending;
  const errorMessage =
    (login.error instanceof Error && login.error.message) ||
    (register.error instanceof Error && register.error.message) ||
    '';

  const onSubmit = (payload: { email: string; password: string }) => {
    if (mode === 'login') {
      login.mutate(payload);
    } else {
      register.mutate(payload);
    }
  };

  if (isLoading) {
    return (
      <div className="auth-panel">
        <div className="auth-loading">Loading user...</div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="auth-panel">
        <div className="auth-user">
          <span className="auth-user-email">Signed in as {user.email}</span>
          <button className="auth-button" onClick={() => logout.mutate()} disabled={logout.isPending}>
            Log out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-panel">
      <div className="auth-tabs">
        <button
          className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
          onClick={() => setMode('login')}
        >
          Login
        </button>
        <button
          className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
          onClick={() => setMode('register')}
        >
          Register
        </button>
      </div>

      <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
        <input
          className="auth-input"
          type="email"
          placeholder="Email"
          {...registerField('email', {
            required: 'Email is required',
          })}
        />
        <input
          className="auth-input"
          type="password"
          placeholder="Password"
          {...registerField('password', {
            required: 'Password is required',
            minLength: {
              value: 6,
              message: 'Password should be at least 6 characters',
            },
          })}
        />
        <button className="auth-button" type="submit" disabled={isSubmitting}>
          {mode === 'login' ? 'Log in' : 'Create account'}
        </button>
      </form>

      {(errors.email?.message || errors.password?.message || errorMessage) && (
        <div className="auth-error">
          {errors.email?.message || errors.password?.message || errorMessage}
        </div>
      )}
    </div>
  );
};

export default AuthPanel;
