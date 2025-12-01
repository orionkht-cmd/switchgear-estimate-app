export const formatCurrency = (amount) => {
  if (!amount) return '0';

  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const calculateMargin = (amount, cost) => {
  if (!amount || !cost) return 0;

  return (((amount - cost) / amount) * 100).toFixed(1);
};

