// 수주/진행 통계 계산 헬퍼
export const calculateStatsFromList = (dataList) => {
  const ongoing = dataList.filter(
    (p) => p.status === '진행중' || p.status === 'In Progress'
  ).length;

  const won = dataList.filter(
    (p) => p.status === '수주' || p.status === 'Won'
  ).length;

  let totalWonAmount = 0;
  let totalWonProfit = 0;

  dataList.forEach((p) => {
    if (p.status === '수주' || p.status === 'Won') {
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

