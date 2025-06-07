import { useAuth } from '../contexts/AuthContext';

export const Home = () => {
    const { user, logout } = useAuth();

    return (
        <div
            style={{
                padding: '2rem',
                maxWidth: '800px',
                margin: '0 auto'
            }}
        >
            <h1>Welcome, {user?.profile.name || 'User'}!</h1>
            <div
                style={{
                    backgroundColor: '#f8f9fa',
                    padding: '1rem',
                    borderRadius: '4px',
                    marginTop: '1rem'
                }}
            >
                <h2>Your Profile Information</h2>
                <pre
                    style={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                    }}
                >
                    {JSON.stringify(user?.profile, null, 2)}
                </pre>
            </div>
            <button
                onClick={() => logout()}
                style={{
                    marginTop: '1rem',
                    padding: '0.5rem 1rem',
                    fontSize: '1rem',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                Logout
            </button>
        </div>
    );
};
