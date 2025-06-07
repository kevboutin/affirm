import { useAuth } from '../contexts/AuthContext';

export const Login = () => {
    const { login } = useAuth();

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
            <h1>Welcome to Affirm</h1>
            <button
                onClick={() => login()}
                style={{
                    padding: '0.5rem 1rem',
                    fontSize: '1rem',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                Login with OpenID Connect
            </button>
        </div>
    );
};
