'use client';

interface PostStatsGridProps {
  total: number;
  recruiting: number;
  completed: number;
}

export const PostStatsGrid = ({
  total,
  recruiting,
  completed,
}: PostStatsGridProps) => {
  return (
    <div className="grid grid-cols-3 gap-4 mb-4">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <p className="text-sm text-muted-foreground mb-2">전체 공고</p>
        <p className="text-2xl text-foreground">{total}개</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6">
        <p className="text-sm text-muted-foreground mb-2">모집중</p>
        <p className="text-2xl text-green-600">{recruiting}개</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6">
        <p className="text-sm text-muted-foreground mb-2">완료</p>
        <p className="text-2xl text-muted-foreground">{completed}개</p>
      </div>
    </div>
  );
};
