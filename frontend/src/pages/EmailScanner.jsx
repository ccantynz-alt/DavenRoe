import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function EmailScanner() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/email-intelligence', { replace: true }); }, [navigate]);
  return null;
}
