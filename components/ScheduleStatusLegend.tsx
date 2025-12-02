export function ScheduleStatusLegend() {
  return (
    <div className="flex flex-wrap gap-3 text-xs">
      <div className="flex items-center gap-2">
        <div className="size-4 rounded bg-blue-200 border border-gray-300 flex items-center justify-center">
          <span className="text-xs font-bold text-blue-700">1</span>
        </div>
        <span className="text-xs">예정</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="size-4 rounded bg-orange-200 border border-gray-300 flex items-center justify-center">
          <span className="text-xs font-bold text-orange-700">1</span>
        </div>
        <span className="text-xs">진행중</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="size-4 rounded bg-green-200 border border-gray-300 flex items-center justify-center">
          <span className="text-xs font-bold text-green-700">1</span>
        </div>
        <span className="text-xs">완료</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="size-4 rounded bg-white border border-gray-300 flex items-center justify-center">
          <span className="text-xs text-gray-900">1</span>
        </div>
        <span className="text-xs">스케줄 없음</span>
      </div>
    </div>
  );
}
