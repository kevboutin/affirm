import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const Logout = () => {
    const { logout } = useAuth();

    useEffect(() => {
        logout();
    }, [logout]);

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                gap: '1rem'
            }}
        >
            <h1>Logging out...</h1>
            <p>Please wait while we log you out.</p>
        </div>
    );
};

