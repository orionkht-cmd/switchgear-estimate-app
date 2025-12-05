import { useState, useEffect } from 'react';

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(null);

    useEffect(() => {
        // 백엔드 API 키 기반으로 동작하므로
        // 로컬 고정 사용자만 유지합니다.
        setUser({ uid: 'local-user' });
    }, []);

    return { user, loading, setLoading, authError };
};
