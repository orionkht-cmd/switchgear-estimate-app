import { useState, useEffect, useMemo } from 'react';
import { projectApi } from '../services/apiClient';
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

    // --- Projects load ---
    useEffect(() => {
        if (!user) return;
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            try {
                const data = await projectApi.list();
                if (cancelled) return;
                setProjects(data || []);
                setIsConnected(true);
                if (typeof window !== 'undefined') {
                    try {
                        window.localStorage.setItem(
                            'offlineProjectsSnapshot',
                            JSON.stringify(data || []),
                        );
                    } catch (e) {
                        // ignore storage errors
                    }
                }
            } catch (error) {
                console.error('API Error:', error);
                if (!cancelled) {
                    setIsConnected(false);
                    let restored = false;
                    if (typeof window !== 'undefined') {
                        try {
                            const raw =
                                window.localStorage.getItem(
                                    'offlineProjectsSnapshot',
                                );
                            if (raw) {
                                const stored = JSON.parse(raw);
                                if (Array.isArray(stored)) {
                                    setProjects(stored);
                                    restored = true;
                                    alert(
                                        '서버 연결 실패: 마지막으로 저장된 로컬 스냅샷을 불러왔습니다.',
                                    );
                                }
                            }
                        } catch (e) {
                            // ignore parse errors
                        }
                    }
                    if (!restored) {
                        alert(
                            '데이터 로드 실패: 서버 연결을 확인해주세요.',
                        );
                    }
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        load();

        return () => {
            cancelled = true;
        };
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
