import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
export default function Unauthorized() { const { user } = useAuth(); const navigate = useNavigate(); return <main className="simple-page"><div className="simple-card"><span className="panel-index">403</span><h1>Access reserved</h1><p>You don't have permission to access this workspace.</p><Button onClick={() => navigate(user?.role === 'OWNER' ? '/owner/dashboard' : '/vendor/dashboard')}>Go to dashboard</Button></div></main>; }
