import React from 'react';

const StatusBadge = ({ status }) => {
  const styles = {
    진행중: 'bg-blue-100 text-blue-800 border-blue-200',
    수주: 'bg-green-100 text-green-800 border-green-200',
    실주: 'bg-red-100 text-red-800 border-red-200',
    보류: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const label =
    {
      'In Progress': '진행중',
      Won: '수주',
      Lost: '실주',
      Hold: '보류',
    }[status] || status;

  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium border ${
        styles[label] || styles.보류
      }`}
    >
      {label}
    </span>
  );
};

export default StatusBadge;

