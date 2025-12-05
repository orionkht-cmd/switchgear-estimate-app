import { useRef, useEffect, useState } from 'react';
import { projectApi } from '../services/apiClient';

export const useBackup = (projects = [], setProjects) => {
    const fileInputRef = useRef(null);
    const [xlsxLoaded, setXlsxLoaded] = useState(false);

    // XLSX loader
    useEffect(() => {
        if (window.XLSX) {
            setXlsxLoaded(true);
            return;
        }
        const script = document.createElement('script');
        script.src =
            'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        script.onload = () => setXlsxLoaded(true);
        document.body.appendChild(script);
    }, []);

    const handleBackup = async () => {
        const downloadJson = (label, data) => {
            const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: 'application/json',
            });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${label}_${new Date()
                .toISOString()
                .slice(0, 10)}.json`;
            link.click();
        };

        // 1차: 서버에서 최신 데이터 백업
        try {
            const data = await projectApi.backupDownload();
            downloadJson('backup', data);
            return;
        } catch (e) {
            console.warn('서버 백업 실패, 로컬 데이터로 대체 시도', e);
        }

        // 2차: 서버가 안 되면, 현재 화면에 로드된 프로젝트로 로컬 백업
        if (Array.isArray(projects) && projects.length > 0) {
            if (
                window.confirm(
                    '서버 백업에 실패했습니다.\n현재 화면에 표시된 프로젝트 목록으로 로컬 백업 파일을 저장하시겠습니까?',
                )
            ) {
                downloadJson('backup_local', projects);
            }
            return;
        }

        alert(
            '백업 실패: 서버 연결이 불가능하고, 로컬에 로드된 데이터도 없습니다.\n서버 연결 후 다시 시도해주세요.',
        );
    };

    const handleRestoreClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const name = file.name.toLowerCase();
        const isJson = name.endsWith('.json');
        const isExcel =
            name.endsWith('.xlsx') || name.endsWith('.xls');

        if (isJson) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                let data;
                try {
                    data = JSON.parse(e.target.result);
                } catch (error) {
                    alert(
                        '복원 실패: JSON 파싱 오류, 파일 형식을 확인해주세요.',
                    );
                    return;
                }

                if (
                    !Array.isArray(data) ||
                    !window.confirm(
                        `${data.length}개 데이터 복원하시겠습니까?`,
                    )
                ) {
                    return;
                }

                try {
                    // 1. 우선 서버의 대량 복구(Bulk Insert) API 시도
                    try {
                        await projectApi.backupRestore(data);
                        alert('복원 완료');
                        window.location.reload();
                        return;
                    } catch (bulkError) {
                        console.warn('서버 대량 복구 실패, 개별 복구 모드로 전환합니다.', bulkError);
                    }

                    // 2. 대량 복구 실패 시, 클라이언트에서 하나씩 생성 요청 (Client-side Loop)
                    let successCount = 0;
                    let failCount = 0;

                    for (const project of data) {
                        try {
                            // ID 충돌 방지를 위해 기존 ID를 유지하며 생성 시도
                            await projectApi.create(project);
                            successCount++;
                        } catch (itemError) {
                            console.error(`프로젝트 복구 실패: ${project.name}`, itemError);
                            failCount++;
                        }
                    }

                    if (successCount === 0) {
                        throw new Error('모든 데이터 복구에 실패했습니다. (서버 연결 확인 필요)');
                    }

                    alert(`복원 완료 (성공: ${successCount}건, 실패: ${failCount}건)`);
                    window.location.reload();

                } catch (error) {
                    console.warn('서버 복원 실패, 로컬 복원 시도', error);
                    if (
                        setProjects &&
                        window.confirm(
                            '서버 복원에 실패했습니다.\n이 파일을 기반으로 로컬에서만 임시 복원을 진행할까요?',
                        )
                    ) {
                        try {
                            setProjects(data);
                            if (typeof window !== 'undefined') {
                                window.localStorage.setItem(
                                    'offlineProjectsSnapshot',
                                    JSON.stringify(data),
                                );
                            }
                            alert(
                                '로컬 복원이 완료되었습니다.\n서버 연결 후 동일한 파일로 다시 복원하면 서버 DB도 재구성됩니다.',
                            );
                        } catch (e) {
                            alert(
                                '로컬 복원에도 실패했습니다. 파일 형식과 브라우저 저장 용량을 확인해주세요.',
                            );
                        }
                    } else {
                        alert(
                            '복원 실패: 서버 연결을 확인한 후 다시 시도해주세요.',
                        );
                    }
                }
            };
            reader.readAsText(file);
            return;
        }

        if (isExcel) {
            if (!window.XLSX) {
                alert(
                    '엑셀 라이브러리 로딩 중입니다. 잠시 후 다시 시도해주세요.',
                );
                return;
            }

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = window.XLSX.read(data, {
                        type: 'array',
                    });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    const rows =
                        window.XLSX.utils.sheet_to_json(sheet, {
                            defval: '',
                        });

                    if (!rows || rows.length === 0) {
                        alert(
                            '엑셀 시트에 데이터가 없습니다.',
                        );
                        return;
                    }

                    const sample = rows[0];
                    if (!Object.prototype.hasOwnProperty.call(sample, '프로젝트명')) {
                        alert(
                            '지원되지 않는 엑셀 형식입니다.\n"프로젝트목록_*.xlsx" 형식의 백업 파일을 사용해주세요.',
                        );
                        return;
                    }

                    const todayIso = new Date().toISOString();

                    const toNumber = (value) => {
                        if (
                            value === undefined ||
                            value === null ||
                            value === ''
                        ) {
                            return 0;
                        }
                        const str = String(value).replace(
                            /[^0-9-]/g,
                            '',
                        );
                        const n = parseInt(str, 10);
                        return Number.isNaN(n) ? 0 : n;
                    };

                    const toIso = (value) => {
                        if (!value) return todayIso;
                        if (value instanceof Date) {
                            return value.toISOString();
                        }
                        if (typeof value === 'number') {
                            const d = new Date(
                                (value - 25569) * 86400 * 1000,
                            );
                            return d.toISOString();
                        }
                        const d = new Date(value);
                        if (!Number.isNaN(d.getTime())) {
                            return d.toISOString();
                        }
                        return todayIso;
                    };

                    const projectsFromExcel = rows.map((row) => ({
                        name: row['프로젝트명'] || '',
                        client: row['발주처'] || '',
                        ledgerName: row['소속대장'] || '',
                        salesRep: row['영업담당'] || '',
                        manager: row['설계담당'] || '',
                        status: row['상태'] || '진행중',
                        contractAmount: toNumber(row['계약금액']),
                        finalCost: toNumber(row['최종실행원가']),
                        createdAt: row['생성일']
                            ? toIso(row['생성일'])
                            : todayIso,
                        updatedAt: row['최근수정']
                            ? toIso(row['최근수정'])
                            : todayIso,
                    }));

                    if (
                        !projectsFromExcel.length ||
                        !window.confirm(
                            `${projectsFromExcel.length}개 데이터 복원하시겠습니까?`,
                        )
                    ) {
                        return;
                    }

                    try {
                        await projectApi.backupRestore(projectsFromExcel);
                        alert('엑셀 백업에서 복원 완료');
                        window.location.reload();
                    } catch (error) {
                        console.warn(
                            '서버 엑셀 복원 실패, 로컬 복원 시도',
                            error,
                        );
                        if (
                            setProjects &&
                            window.confirm(
                                '서버 복원에 실패했습니다.\n이 엑셀 데이터를 기반으로 로컬에서만 임시 복원을 진행할까요?',
                            )
                        ) {
                            try {
                                setProjects(projectsFromExcel);
                                if (typeof window !== 'undefined') {
                                    window.localStorage.setItem(
                                        'offlineProjectsSnapshot',
                                        JSON.stringify(projectsFromExcel),
                                    );
                                }
                                alert(
                                    '로컬 복원이 완료되었습니다.\n서버 연결 후 동일 엑셀 파일로 다시 복원하면 서버 DB도 재구성됩니다.',
                                );
                            } catch (e) {
                                alert(
                                    '로컬 복원에도 실패했습니다. 파일 형식과 브라우저 저장 용량을 확인해주세요.',
                                );
                            }
                        } else {
                            alert(
                                '복원 실패: 서버 연결을 확인한 후 다시 시도해주세요.',
                            );
                        }
                    }
                } catch (error) {
                    console.error(error);
                    alert(
                        '엑셀 복원 실패: 파일 형식 또는 내용을 확인해주세요.',
                    );
                }
            };
            reader.readAsArrayBuffer(file);
            return;
        }

        alert(
            '지원하지 않는 파일 형식입니다. JSON 또는 XLSX 파일을 선택해주세요.',
        );
    };

    return {
        fileInputRef,
        xlsxLoaded,
        handleBackup,
        handleRestoreClick,
        handleFileChange,
    };
};
