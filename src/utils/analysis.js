import { formatCurrency, calculateMargin } from './format';

export const refineRevisionNote = (note) => {
  if (!note) return '';

  const trimmed = note.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';

  if (/[.!?]$/.test(trimmed)) return trimmed;
  return `${trimmed}.`;
};

export const analyzeProject = (project) => {
  if (!project) return '';

  const lastRev =
    project.revisions && project.revisions.length > 0
      ? project.revisions[project.revisions.length - 1]
      : null;

  const baseAmount = project.contractAmount || lastRev?.amount || 0;
  const cost = project.finalCost || 0;
  const margin = calculateMargin(baseAmount, cost);
  const marginValue = parseFloat(margin) || 0;

  const lines = [];

  lines.push(`프로젝트명: ${project.name || '-'}`);
  lines.push(
    `계약금액: ${formatCurrency(
      baseAmount
    )}, 실행원가: ${formatCurrency(cost)}, 마진율: ${margin}%`
  );

  if (!project.finalCost) {
    lines.push(
      '실행원가가 입력되지 않았습니다. 견적 대비 실제 원가를 입력하면 보다 정확한 분석이 가능합니다.'
    );
  }

  if (marginValue < 5) {
    lines.push(
      '마진이 매우 낮습니다. 주요 자재/인건비 원가를 재검토하고 추가 비용 반영 가능성을 검토하세요.'
    );
  } else if (marginValue < 10) {
    lines.push(
      '마진이 낮은 편입니다. 공사 범위 변경, 추가 옵션 등 리스크 요인을 다시 확인하는 것이 좋습니다.'
    );
  } else if (marginValue < 20) {
    lines.push(
      '보통 수준의 마진입니다. 일정 관리와 대금 회수 계획에 집중하여 리스크를 관리하세요.'
    );
  } else {
    lines.push(
      '마진이 충분한 편입니다. 발주처 요구사항 변경에 대비한 버퍼를 유지하면서 품질과 납기를 관리하세요.'
    );
  }

  return lines.join('\n');
};

