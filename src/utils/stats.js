// 수주/진행 통계 계산 헬퍼
export const calculateStatsFromList = (dataList) => {
  const ongoing = dataList.filter((p) => p.status === '설계').length;

  const wonStatuses = ['계약', '제작', '납품', '완료'];
  const won = dataList.filter((p) => wonStatuses.includes(p.status)).length;

  let totalWonAmount = 0;
  let totalWonProfit = 0;

  dataList.forEach((p) => {
    if (wonStatuses.includes(p.status)) {
      const amount =
        p.contractAmount ||
        p.revisions?.[p.revisions.length - 1]?.amount ||
        0;

      totalWonAmount += amount;
      totalWonProfit += amount - (p.finalCost || 0);
    }
  });

  const avgMargin =
    totalWonAmount > 0
      ? ((totalWonProfit / totalWonAmount) * 100).toFixed(1)
      : 0;

  return { ongoing, won, totalWonAmount, avgMargin };
};

