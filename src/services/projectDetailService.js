import { updateDoc, deleteDoc } from 'firebase/firestore';
import { db, appId } from '../firebase';
import { getProjectDoc } from './projects';
import { formatCurrency, calculateMargin } from '../utils/format';

export const deleteProjectById = (projectId) => {
  return deleteDoc(getProjectDoc(db, appId, projectId));
};

export const updateProjectFields = (projectId, data) => {
  return updateDoc(getProjectDoc(db, appId, projectId), data);
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

