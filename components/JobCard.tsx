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
import {
  BriefcaseBusiness,
  Calendar,
  Check,
  Clock,
  CreditCard,
  FileText,
  MapPin,
  Phone,
  User,
  Users,
} from 'lucide-react';
import { Separator } from './Separator';

export interface JobItem {
  id: number;
  title: string;
  content?: string;
  date?: string;
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
      )} relative overflow-hidden flex flex-col gap-2 rounded-xl border`}
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
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'shrink-0 inline-flex items-center border px-2.5 py-0.5 text-xs font-medium sm:text-sm',
              statusBadgeClassName
            )}
          >
            {item.status}
          </span>
          <div className="mt-1 flex w-full items-center justify-between gap-2">
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
          </div>
        </div>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 mt-2">
            <CardTitle className="text-lg sm:text-xl font-semibold leading-snug truncate">
              {item.title}
            </CardTitle>
            {item.content && (
              <CardDescription className="mt-1 line-clamp-2">
                {item.content}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 grid grid-cols-2 md:grid-cols-4 gap-2">
        {item.date && (
          <p className="flex items-center gap-2 text-sm text-gray-700">
            <Calendar className="size-4" />
            <span>{item.date}</span>
          </p>
        )}
        {item.time && (
          <p className="flex items-center gap-2 text-sm text-gray-700">
            <Clock className="size-4" />
            <span>{item.time}</span>
          </p>
        )}
        {item.place && (
          <p className="flex items-center gap-2 text-sm text-gray-700">
            <MapPin className="size-4" />
            <span>{item.place}</span>
          </p>
        )}

        {item.need && (
          <p className="flex items-center gap-2 text-sm text-gray-700">
            <BriefcaseBusiness className="size-4" />
            <span>{item.need}</span>
          </p>
        )}

        {item.manager && (
          <p className="flex items-center gap-2 text-sm text-gray-700">
            <User className="size-4" />
            <span className="text-gray-500">담당자:</span> {item.manager}
          </p>
        )}
        {item.managerPhone && (
          <p className="flex items-center gap-2 text-sm text-gray-700">
            <Phone className="size-4" />
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(item.managerPhone!)}
              className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
              aria-label="전화번호 복사"
              title="전화번호 복사"
            >
              <span>{item.managerPhone}</span>
            </button>
          </p>
        )}
        {item.pay && (
          <p className="flex items-center gap-2 text-sm text-gray-700">
            <CreditCard className="size-4" />
            <span>{formatNumberWithComma(item.pay)}원</span>
          </p>
        )}
      </CardContent>

      <div className="flex flex-col gap-2 px-6 py-2">
        {item.qualifications && item.qualifications.length > 0 && (
          <p className="flex items-center gap-2 text-sm text-gray-700">
            <Check className="size-4" />
            <span>{item.qualifications.join(', ')}</span>
          </p>
        )}
        {item.etc && (
          <p className="flex items-center gap-2 text-sm text-gray-700">
            <FileText className="size-4" />
            <span>{item.etc}</span>
          </p>
        )}
      </div>
      <div className="px-6">
        <Separator />
      </div>
      <CardFooter className="flex justify-between pt-0">
        <div className="flex items-center gap-2">
          <Users className="size-4" />
          <span>0/10명 지원</span>
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
      </CardFooter>
    </Card>
  );
}

export default JobCard;
