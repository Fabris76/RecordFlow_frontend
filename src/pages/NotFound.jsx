import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
export default function NotFound() { const { user } = useAuth(); const navigate = useNavigate(); return <main className="simple-page"><div className="simple-card"><span className="panel-index">404</span><h1>Page not found</h1><p>That address does not lead to a workspace page.</p><Button onClick={() => navigate(user ? (user.role === 'OWNER' ? '/owner/dashboard' : '/vendor/dashboard') : '/login')}>Go to dashboard</Button></div></main>; }
