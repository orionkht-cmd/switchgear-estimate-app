import { useCallback, useState, useEffect } from 'react';
import { projectApi } from '../services/apiClient';

const COMPANIES_KEY = 'companiesList';
const COMPANY_ALIASES_KEY = 'companyAliases';
const HIDDEN_COMPANIES_KEY = 'hiddenCompanies';
const defaultCompanies = ['골드텍', '한양기전공업', '한양기전', '새봄엔지니어링', '기타'];

const mergeDefaultCompanies = (companies = []) =>
    Array.from(new Set([...companies.filter(Boolean), ...defaultCompanies]));

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

const loadJsonArray = (key, fallback) => {
    try {
        if (typeof window !== 'undefined') {
            const saved = window.localStorage.getItem(key);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
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
    const [companies, setCompanies] = useState(() => {
        try {
            if (typeof window !== 'undefined') {
                const saved = window.localStorage.getItem(COMPANIES_KEY);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        return mergeDefaultCompanies(parsed);
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
    const [hiddenCompanies, setHiddenCompanies] = useState(() =>
        loadJsonArray(HIDDEN_COMPANIES_KEY, []),
    );
    const persistLocalSettings = useCallback((nextSettings) => {
        try {
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(
                    COMPANIES_KEY,
                    JSON.stringify(nextSettings.companies),
                );
                window.localStorage.setItem(
                    COMPANY_ALIASES_KEY,
                    JSON.stringify(nextSettings.companyAliases),
                );
                window.localStorage.setItem(
                    HIDDEN_COMPANIES_KEY,
                    JSON.stringify(nextSettings.hiddenCompanies),
                );
            }
        } catch (e) {
            console.warn('Failed to save company settings to localStorage', e);
        }
    }, []);

    const applySettings = useCallback((nextSettings) => {
        const normalized = {
            companies: mergeDefaultCompanies(nextSettings.companies || []),
            companyAliases: nextSettings.companyAliases || {},
            hiddenCompanies: Array.isArray(nextSettings.hiddenCompanies)
                ? nextSettings.hiddenCompanies
                : [],
        };
        setCompanies(normalized.companies);
        setCompanyAliases(normalized.companyAliases);
        setHiddenCompanies(normalized.hiddenCompanies);
        persistLocalSettings(normalized);
        return normalized;
    }, [persistLocalSettings]);

    useEffect(() => {
        let isMounted = true;

        projectApi.getCompanySettings()
            .then((settings) => {
                if (isMounted) {
                    applySettings(settings || {});
                }
            })
            .catch((e) => {
                console.warn('Failed to load company settings from backend', e);
            });

        return () => {
            isMounted = false;
        };
    }, [applySettings]);

    const saveCompanySettings = useCallback(async (
        nextCompanies,
        nextAliases = companyAliases,
        nextHiddenCompanies = hiddenCompanies,
    ) => {
        const optimisticSettings = applySettings({
            companies: nextCompanies,
            companyAliases: nextAliases,
            hiddenCompanies: nextHiddenCompanies,
        });

        try {
            const savedSettings = await projectApi.updateCompanySettings(optimisticSettings);
            applySettings(savedSettings || optimisticSettings);
        } catch (e) {
            console.warn('Failed to save company settings to backend', e);
            throw e;
        }
    }, [applySettings, companyAliases, hiddenCompanies]);

    useEffect(() => {
        try {
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(
                    COMPANIES_KEY,
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

    useEffect(() => {
        try {
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(
                    HIDDEN_COMPANIES_KEY,
                    JSON.stringify(hiddenCompanies),
                );
            }
        } catch (e) {
            console.warn('Failed to save hidden companies to localStorage', e);
        }
    }, [hiddenCompanies]);

    return {
        companies,
        setCompanies,
        companyAliases,
        setCompanyAliases,
        hiddenCompanies,
        setHiddenCompanies,
        saveCompanySettings,
    };
};
