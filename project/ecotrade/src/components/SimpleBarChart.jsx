import React from 'react';

const SimpleBarChart = ({ data = [], labelKey = 'label', valueKey = 'value', color = '#4881F8', emptyText = 'No data yet' }) => {
  if (!data.length) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
        {emptyText}
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d[valueKey] || 0), 1);

  return (
    <div className="h-64 flex items-end gap-3 px-2">
      {data.map((item) => {
        const value = item[valueKey] || 0;
        const height = `${Math.max((value / max) * 100, 4)}%`;
        return (
          <div key={item[labelKey]} className="flex-1 flex flex-col items-center gap-2 min-w-0">
            <span className="text-xs font-bold text-gray-600">{value}</span>
            <div className="w-full flex items-end justify-center" style={{ height: '180px' }}>
              <div
                className="w-full max-w-[48px] rounded-t-lg transition-all"
                style={{ height, backgroundColor: color }}
                title={`${item[labelKey]}: ${value}`}
              />
            </div>
            <span className="text-[10px] text-gray-500 font-medium text-center truncate w-full" title={item[labelKey]}>
              {String(item[labelKey]).replace(/_/g, ' ')}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default SimpleBarChart;
