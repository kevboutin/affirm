import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userManager } from '../config/auth';

export const Callback = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                await userManager.signinRedirectCallback();
                navigate('/home');
            } catch (error) {
                console.error('Error handling callback:', error);
                navigate('/');
            }
        };

        handleCallback();
    }, [navigate]);

    return <div>Processing login...</div>;
};
