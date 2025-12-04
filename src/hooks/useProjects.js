import { useState, useEffect, useMemo } from 'react';
import { onSnapshot, query } from 'firebase/firestore';
import { db, appId } from '../firebase';
import { getProjectsCollection } from '../services/projects';
import { getProjectYear } from '../utils/projectYear';

export const useProjects = (user, setLoading) => {
    const [projects, setProjects] = useState([]);
    const [isConnected, setIsConnected] = useState(false);

    // Search & Sort State
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState({
        key: 'createdAt',
        direction: 'desc',
    });
    const [selectedYear, setSelectedYear] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedCompany, setSelectedCompany] = useState('all');

    // --- Projects subscription ---
    useEffect(() => {
        if (!user || !db) return;
        const q = query(getProjectsCollection(db, appId));
        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                setIsConnected(true);
                const projectsData = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                projectsData.sort(
                    (a, b) =>
                        (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
                );
                setProjects(projectsData);
                setLoading(false);
            },
            (error) => {
                setIsConnected(false);
                console.error('Firestore Error:', error);
                alert(
                    '데이터 로드 실패: Firestore 보안 규칙(Rules)을 확인해주세요.',
                );
                setLoading(false);
            },
        );
        return () => unsubscribe();
    }, [user, setLoading]);

    // --- Derived values ---
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
            data.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                if (sortConfig.key === 'amount') {
                    aValue =
                        a.revisions?.[a.revisions.length - 1]?.amount || 0;
                    bValue =
                        b.revisions?.[b.revisions.length - 1]?.amount || 0;
                } else if (sortConfig.key === 'contractAmount') {
                    aValue = a.contractAmount || 0;
                    bValue = b.contractAmount || 0;
                } else if (sortConfig.key === 'manager') {
                    aValue = (a.salesRep || '') + (a.manager || '');
                    bValue = (b.salesRep || '') + (b.manager || '');
                }

                if (aValue < bValue)
                    return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue)
                    return sortConfig.direction === 'asc' ? 1 : -1;
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
