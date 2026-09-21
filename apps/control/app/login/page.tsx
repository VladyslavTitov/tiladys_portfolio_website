'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Login() {
  const [message, setMessage] = useState('');
  const router = useRouter();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('Checking…');
    const body = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      router.push('/dashboard');
      router.refresh();
    } else {
      setMessage('Login failed or temporarily locked.');
    }
  }

  return (
    <main className="login">
      <div className="login-shell">
        <div className="login-brand"><Image src="/brand/logo.svg" alt="TiLADYS" width={260} height={72} priority /><p>Business Control</p></div>
        <form onSubmit={submit} aria-labelledby="login-title">
          <h1 id="login-title">Secure Control Panel</h1>
          <p className="login-intro">Sign in to manage your TiLADYS workspace.</p>
          <label>Email<input name="email" type="email" required autoComplete="username" /></label>
          <label>Password<input name="password" type="password" required autoComplete="current-password" /></label>
          <label>Secret phrase<input name="secretWord" type="password" required autoComplete="off" /></label>
          <button type="submit">Sign in</button>
          <p aria-live="polite">{message}</p>
        </form>
      </div>
    </main>
  );
}
