'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface JobItem {
  id: number;
  title: string;
  content?: string;
  partTime?: string[];
  time?: string;
  need?: string;
  place?: string;
  pay?: string;
  TO?: string;
  manager?: string;
  managerPhone?: string;
  etc?: string;
  categories: string[];
  qualifications?: string[];
  status: '급구' | '모집' | '모집완료';
}

interface JobCardProps {
  item: JobItem;
}

export function JobCard({ item }: JobCardProps) {
  const statusClassName =
    item.status === '급구'
      ? 'border-red-300/70 bg-red-50'
      : item.status === '모집완료'
      ? 'bg-gray-200'
      : '';

  const enabledHoverClasses =
    item.status !== '모집완료'
      ? 'transition shadow-sm hover:shadow-md hover:-translate-y-0.5'
      : '';

  const statusBadgeClassName =
    item.status === '급구'
      ? 'bg-red-100 text-red-700 border-red-200'
      : item.status === '모집완료'
      ? 'bg-gray-100 text-gray-600 border-gray-200'
      : 'bg-emerald-100 text-emerald-700 border-emerald-200';

  const formatNumberWithComma = (value: string | undefined) => {
    if (!value) return undefined;
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return value;
    return numeric.toLocaleString('ko-KR');
  };

  return (
    <Card
      aria-disabled={item.status === '모집완료'}
      className={`${cn(
        statusClassName,
        enabledHoverClasses,
        item.status === '모집완료' && 'pointer-events-none'
      )} relative overflow-hidden flex flex-col gap-4 rounded-xl border`}
    >
      {item.status === '모집완료' && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gray-200/10 backdrop-blur-sm"
        >
          <span className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-widest text-gray-500 opacity-80">
            모집 완료
          </span>
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-lg sm:text-xl font-semibold leading-snug truncate">
              {item.title}
            </CardTitle>
            {item.content && (
              <CardDescription className="mt-1 line-clamp-2">
                {item.content}
              </CardDescription>
            )}
          </div>
          <span
            className={cn(
              'shrink-0 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
              statusBadgeClassName
            )}
          >
            {item.status}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {item.pay && (
          <p className="mb-2 text-base sm:text-lg font-semibold text-gray-900">
            급여: {formatNumberWithComma(item.pay)}원
          </p>
        )}
        {item.partTime && (
          <p className="text-sm text-gray-700">
            <span className="text-gray-500">날짜:</span>{' '}
            {item.partTime.join(', ')}
          </p>
        )}
        {item.time && (
          <p className="text-sm text-gray-700">
            <span className="text-gray-500">시간:</span> {item.time}
          </p>
        )}
        {item.place && (
          <p className="text-sm text-gray-700">
            <span className="text-gray-500">장소:</span> {item.place}
          </p>
        )}
        {item.need && (
          <p className="text-sm text-gray-700">
            <span className="text-gray-500">준비물:</span> {item.need}
          </p>
        )}
        {item.TO && (
          <p className="text-sm text-gray-700">
            <span className="text-gray-500">TO:</span> {item.TO}
          </p>
        )}
        {item.manager && (
          <p className="text-sm text-gray-700">
            <span className="text-gray-500">담당자:</span> {item.manager}
          </p>
        )}
        {item.managerPhone && (
          <p className="text-sm text-gray-700">
            <span className="text-gray-500">담당자 전화번호:</span>{' '}
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(item.managerPhone!)}
              className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
              aria-label="전화번호 복사"
              title="전화번호 복사"
            >
              {item.managerPhone}
            </button>
          </p>
        )}
        {item.qualifications && item.qualifications.length > 0 && (
          <div className="mt-3">
            <p className="font-semibold text-sm text-gray-900">자격 요건</p>
            <ul className="mt-1 list-disc list-inside text-sm text-gray-700 space-y-1">
              {item.qualifications.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </div>
        )}
        {item.etc && (
          <p className="mt-2 text-sm text-gray-700">
            <span className="text-gray-500">기타:</span> {item.etc}
          </p>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <div className="mt-1 flex w-full items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {item.categories.map((c) => (
              <span
                key={c}
                className="text-xs sm:text-sm text-gray-700 border border-gray-300 rounded-full px-2.5 py-0.5 bg-gray-100"
              >
                {c}
              </span>
            ))}
          </div>
          <Button
            type="button"
            variant="default"
            size="sm"
            disabled={item.status === '모집완료'}
            aria-label="지원하기"
            title={
              item.status === '모집완료'
                ? '모집이 완료되어 지원할 수 없습니다'
                : '지원하기'
            }
          >
            지원하기
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export default JobCard;
