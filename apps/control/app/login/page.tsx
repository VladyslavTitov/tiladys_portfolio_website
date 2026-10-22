'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Login() {
  const [pending,setPending]=useState(false);const [visible,setVisible]=useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(pending)return;setPending(true);
    setMessage('Checking…');
    try {
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
    }catch{setMessage('Connection failed. Your input is retained.');}finally{setPending(false);}
  }

  return (
    <main className="login">
      <div className="login-shell">
        <div className="login-brand"><Image src="/brand/icon.svg" alt="TiLADYS" width={260} height={72} priority /><p>Business Control</p></div>
        <form onSubmit={submit} aria-labelledby="login-title">
          <h1 id="login-title">Secure Control Panel</h1>
          <p className="login-intro">Sign in to manage your TiLADYS workspace.</p>
          <label>Email<input name="email" type="email" required autoComplete="username" /></label>
          <label>Password<input name="password" type={visible?'text':'password'} required autoComplete="current-password" /></label>
          <label>Secret phrase<input name="secretWord" type={visible?'text':'password'} required autoComplete="off" /></label>
          <label className="admin-checkbox"><input type="checkbox" checked={visible} onChange={e=>setVisible(e.target.checked)}/>Show credentials</label><button type="submit" disabled={pending}>{pending?'Checking…':'Sign in'}</button>
          <p aria-live="polite">{message}</p>
        </form>
      </div>
    </main>
  );
}
