import { useState, useEffect } from 'react';
import {
    signInAnonymously,
    onAuthStateChanged,
    signInWithCustomToken,
} from 'firebase/auth';
import { auth } from '../firebase';

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(null);

    useEffect(() => {
        if (!auth) return;
        const initAuth = async () => {
            try {
                if (
                    typeof __initial_auth_token !== 'undefined' &&
                    __initial_auth_token
                ) {
                    await signInWithCustomToken(auth, __initial_auth_token);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (error) {
                console.error('Auth Failed:', error);
                setAuthError(error.message);
                setLoading(false);
            }
        };
        initAuth();
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
            if (!u) {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    return { user, loading, setLoading, authError };
};
