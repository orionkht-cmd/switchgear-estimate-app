import { useState, useEffect } from 'react';

const COMPANY_ALIASES_KEY = 'companyAliases';

const loadJsonObject = (key, fallback) => {
    try {
        if (typeof window !== 'undefined') {
            const saved = window.localStorage.getItem(key);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    return parsed;
                }
            }
        }
    } catch (e) {
        console.warn(`Failed to load ${key} from localStorage`, e);
    }
    return fallback;
};

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
    const [companyAliases, setCompanyAliases] = useState(() =>
        loadJsonObject(COMPANY_ALIASES_KEY, {}),
    );

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

    useEffect(() => {
        try {
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(
                    COMPANY_ALIASES_KEY,
                    JSON.stringify(companyAliases),
                );
            }
        } catch (e) {
            console.warn('Failed to save company aliases to localStorage', e);
        }
    }, [companyAliases]);

    return { companies, setCompanies, companyAliases, setCompanyAliases };
};
