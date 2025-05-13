import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

function RefrshHandler({ setIsAuthenticated }) {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (localStorage.getItem('token')) {
            setIsAuthenticated(true);
            if (
                location.pathname === '/' ||
                location.pathname === '/login' ||
                location.pathname === '/signup'
            ) {
                navigate('/student-dashboard', { replace: false });
            }
        }
    }, [location, navigate, setIsAuthenticated]);

    return null;
}

export default RefrshHandler;
