import { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { projectApi } from '../services/apiClient';
import { getProjectYear } from '../utils/projectYear';

// --- LocalStorage Memory Cache ---
let cachedProjects = null;

const getLocalProjects = () => {
    if (cachedProjects) return cachedProjects;
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem('offlineProjectsSnapshot');
        if (raw) {
            cachedProjects = JSON.parse(raw);
            return cachedProjects;
        }
    } catch (e) {
        return null;
    }
    return null;
};

const setLocalProjects = (data) => {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem('offlineProjectsSnapshot', JSON.stringify(data));
        cachedProjects = data;
    } catch (e) { }
};

export const useProjects = (user, setLoading) => {
    // Search & Sort State
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState({
        key: 'createdAt',
        direction: 'desc',
    });
    const [selectedYear, setSelectedYear] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedCompany, setSelectedCompany] = useState('all');

    // --- SWR Data Fetching ---
    const {
        data: projects = [],
        mutate: setProjects,
        error,
        isValidating
    } = useSWR(
        user ? '/api/projects' : null,
        () => projectApi.list(),
        {
            revalidateOnFocus: false,
            dedupingInterval: 2000,
            fallbackData: getLocalProjects() || [],
            onSuccess: (data) => {
                setLocalProjects(data);
            }
        }
    );

    const isConnected = !error;

    // Sync loading state with App
    useEffect(() => {
        setLoading(isValidating && projects.length === 0);
    }, [isValidating, projects.length, setLoading]);

    // Derived values
    const projectYears = useMemo(() => {
        const years = new Set();
        projects.forEach((p) => {
            const year = getProjectYear(p);
            if (year) years.add(year);
        });
        return Array.from(years).sort();
    }, [projects]);

    const yearFilteredProjects = useMemo(() => {
        if (selectedYear === 'all') return projects;
        return projects.filter((p) => getProjectYear(p) === selectedYear);
    }, [projects, selectedYear]);

    const filteredAndSortedProjects = useMemo(() => {
        let data = [...yearFilteredProjects];

        if (selectedCompany !== 'all') {
            data = data.filter((p) => p.ledgerName === selectedCompany);
        }

        if (selectedStatus !== 'all') {
            const statusMap = {
                '설계': 'design',
                '계약': 'contract',
                '제작': 'production',
                '납품': 'delivery',
                '완료': 'collection'
            };

            if (statusMap[selectedStatus]) {
                const key = statusMap[selectedStatus];
                data = data.filter((p) => (p.progress && p.progress[key]) || p.status === selectedStatus);
            } else {
                data = data.filter((p) => p.status === selectedStatus);
            }
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            data = data.filter(
                (p) =>
                    (p.name && p.name.toLowerCase().includes(q)) ||
                    (p.salesRep && p.salesRep.toLowerCase().includes(q)) ||
                    (p.client && p.client.toLowerCase().includes(q)),
            );
        }

        if (sortConfig.key) {
            const { key: sortKey, direction: sortDir } = sortConfig;
            data.sort((a, b) => {
                let aValue = a[sortKey];
                let bValue = b[sortKey];

                if (sortKey === 'amount') {
                    const aRev = a.revisions;
                    const bRev = b.revisions;
                    aValue = aRev?.[aRev.length - 1]?.amount || 0;
                    bValue = bRev?.[bRev.length - 1]?.amount || 0;
                } else if (sortKey === 'contractAmount') {
                    aValue = a.contractAmount || 0;
                    bValue = b.contractAmount || 0;
                } else if (sortKey === 'manager') {
                    aValue = (a.salesRep || '') + (a.manager || '');
                    bValue = (b.salesRep || '') + (b.manager || '');
                }

                const aHasValue = aValue !== undefined && aValue !== null && aValue !== '';
                const bHasValue = bValue !== undefined && bValue !== null && bValue !== '';

                if (!aHasValue && !bHasValue) return 0;
                if (!aHasValue) return 1;
                if (!bHasValue) return -1;

                if (aValue < bValue)
                    return sortDir === 'asc' ? -1 : 1;
                if (aValue > bValue)
                    return sortDir === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return data;
    }, [
        yearFilteredProjects,
        searchQuery,
        sortConfig,
        selectedCompany,
        selectedStatus,
    ]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    return {
        projects,
        setProjects,
        isConnected,
        searchQuery,
        setSearchQuery,
        sortConfig,
        handleSort,
        selectedYear,
        setSelectedYear,
        selectedStatus,
        setSelectedStatus,
        selectedCompany,
        setSelectedCompany,
        projectYears,
        yearFilteredProjects,
        filteredAndSortedProjects,
    };
};
