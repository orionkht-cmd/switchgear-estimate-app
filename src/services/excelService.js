import { formatCurrency } from '../utils/format';

export const exportProjectListToExcel = (projects) => {
    if (!window.XLSX) {
        alert('엑셀 라이브러리 로딩 중입니다. 잠시 후 다시 시도해주세요.');
        return;
    }
    const wb = window.XLSX.utils.book_new();
    const data = projects.map((p) => ({
        상태: p.status,
        프로젝트명: p.name,
        발주처: p.client,
        소속대장: p.ledgerName,
        영업담당: p.salesRep,
        설계담당: p.manager,
        계약금액: p.contractAmount || 0,
        최종실행원가: p.finalCost || 0,
        생성일: p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString() : '',
        최근수정: p.updatedAt?.toDate ? p.updatedAt.toDate().toLocaleDateString() : '',
    }));
    const ws = window.XLSX.utils.json_to_sheet(data);
    window.XLSX.utils.book_append_sheet(wb, ws, '프로젝트목록');
    window.XLSX.writeFile(wb, `프로젝트목록_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const exportProjectToExcel = (project) => {
    if (!window.XLSX || !project) {
        alert('엑셀 로딩중');
        return;
    }

    const revisions = [...(project.revisions || [])].reverse();
    const wb = window.XLSX.utils.book_new();
    const wsData = [
        ['프로젝트 관리 카드'],
        [`대장(소속): ${project.ledgerName}`],
        [
            `프로젝트명: ${project.name}`,
            `계약금액: ${formatCurrency(project.contractAmount)}`,
        ],
        [`발주처: ${project.client}`, `담당자: ${project.manager}`],
        [`최종 실행원가: ${formatCurrency(project.finalCost || 0)}`],
        [],
        ['Rev', '날짜', '수정 사유', '견적금액', '이익금', '이익률'],
    ];

    revisions.forEach((rev) => {
        wsData.push([
            rev.rev,
            rev.date,
            rev.note,
            rev.amount,
            rev.amount - (project.finalCost || 0),
            0,
        ]);
    });

    const ws = window.XLSX.utils.aoa_to_sheet(wsData);
    window.XLSX.utils.book_append_sheet(wb, ws, '이력');
    window.XLSX.writeFile(wb, `${project.name}_관리카드.xlsx`);
};
