import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';

export default function Login() {
  const { login } = useAuth(); const navigate = useNavigate();
  const [phone, setPhone] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [submitting, setSubmitting] = useState(false); const [showPassword, setShowPassword] = useState(false);
  async function handleSubmit(event) {
    event.preventDefault(); setError('');
    if (!phone.trim()) return setError('Enter your phone number.');
    if (!password) return setError('Enter your password.');
    setSubmitting(true);
    try { const user = await login(phone.trim(), password); navigate(user.role === 'OWNER' ? '/owner/dashboard' : '/vendor/dashboard', { replace: true }); }
    catch (loginError) { setError(loginError.message || 'Unable to sign in. Please try again.'); }
    finally { setSubmitting(false); }
  }
  return <main className="auth-page"><section className="auth-visual"><div className="auth-visual-grid" /><div className="auth-visual-content"><div className="brand-lockup"><span className="brand-logo"><img src="/recordflow-logo.png" alt="RecordFlow logo" /></span><span>RecordFlow</span></div><div className="auth-visual-copy"><p className="auth-visual-label">Business operations, made clear.</p><h1>Move money with confidence.</h1><p>One focused workspace for the owner and the vendors who keep your business moving.</p></div><div className="auth-proof"><div><strong>24/7</strong><span>visibility</span></div><div><strong>100%</strong><span>in control</span></div><div><strong>01</strong><span>workspace</span></div></div><div className="visual-rule" /><span className="auth-visual-note">Secure operations <i /> Daily clarity <i /> Better control</span></div></section><section className="auth-panel"><div className="auth-form-wrap"><div className="auth-form-heading"><p className="eyebrow">Welcome back</p><span className="secure-badge"><span /> Secure sign in</span></div><h2>Sign in to your workspace</h2><p className="auth-intro">Enter your details to access your business dashboard.</p><form onSubmit={handleSubmit} noValidate><label htmlFor="phone">Phone number</label><div className="input-wrap"><span className="input-icon" aria-hidden="true">+233</span><input id="phone" name="phone" type="tel" autoComplete="username" placeholder="24 000 0000" value={phone} onChange={(event) => setPhone(event.target.value)} disabled={submitting} /></div><label htmlFor="password">Password</label><div className="input-wrap"><input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={submitting} /><button className="password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} disabled={submitting} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button></div><ErrorMessage>{error}</ErrorMessage><Button type="submit" disabled={submitting}>{submitting ? 'Signing in...' : <>Sign in <span aria-hidden="true">-&gt;</span></>}</Button></form><div className="auth-support"><span className="support-icon">?</span><span>Need help accessing your account?<br /><strong>Contact your administrator</strong></span></div><p className="auth-footer">RecordFlow <span /> Secure business management</p></div></section></main>;
}
