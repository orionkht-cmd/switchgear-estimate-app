import React from 'react';

const StatusBadge = ({ status }) => {
  const styles = {
    진행중: 'bg-blue-100 text-blue-800 border-blue-200',
    수주: 'bg-green-100 text-green-800 border-green-200',
    계약: 'bg-blue-100 text-blue-800 border-blue-200',
    제작: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    납품: 'bg-purple-100 text-purple-800 border-purple-200',
    수금: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    실주: 'bg-red-100 text-red-800 border-red-200',
    보류: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const label =
    {
      'In Progress': '진행중',
      Won: '수주',
      Lost: '실주',
      Hold: '보류',
      '수금': '완료', // Display 'Collection' as 'Completed'
    }[status] || status;

  // Map '완료' back to '수금' style key or just use the label if it matches
  const styleKey = label === '완료' ? '수금' : label;

  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium border whitespace-nowrap ${styles[styleKey] || styles.보류
        }`}
    >
      {label}
    </span>
  );
};

export default StatusBadge;

