import { useState, useEffect } from 'react';

export const useCompanySettings = () => {
    const defaultCompanies = ['골드텍', '한양기전공업', '한양기전', '새봄엔지니어링'];

    const [companies, setCompanies] = useState(() => {
        try {
            if (typeof window !== 'undefined') {
                const saved = window.localStorage.getItem('companiesList');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        return parsed;
                    }
                }
            }
        } catch (e) {
            console.warn('Failed to load companies from localStorage', e);
        }
        return defaultCompanies;
    });

    useEffect(() => {
        try {
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(
                    'companiesList',
                    JSON.stringify(companies),
                );
            }
        } catch (e) {
            console.warn('Failed to save companies to localStorage', e);
        }
    }, [companies]);

    return { companies, setCompanies };
};
