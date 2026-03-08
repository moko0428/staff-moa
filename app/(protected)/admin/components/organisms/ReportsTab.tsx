'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Loader2, Trash2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useAdminReports } from '../../hooks/useAdminReports';
import { REPORT_REASON_LABELS } from '../../report-constants';

export const ReportsTab = () => {
  const {
    loadingReports,
    reportSearch,
    setReportSearch,
    filteredReportedPosts,
    handleReportDelete,
    handleReportDismiss,
  } = useAdminReports();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <span>신고 관리</span>
            <span className="text-sm text-muted-foreground">
              신고 많은 순 정렬 · 총 {filteredReportedPosts.length}건
            </span>
          </div>
          <Input
            placeholder="제목, 지역 또는 작성자로 검색"
            value={reportSearch}
            onChange={(e) => setReportSearch(e.target.value)}
            className="h-9 text-sm"
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loadingReports ? (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground gap-2">
            <Loader2 className="size-4 animate-spin" />
            불러오는 중...
          </div>
        ) : filteredReportedPosts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            처리 대기 중인 신고가 없습니다.
          </p>
        ) : (
          filteredReportedPosts.map((report) => (
            <div
              key={report.post_id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border px-4 py-3"
            >
              <Link
                href={`/post/${report.post_id}`}
                className="flex-1 cursor-pointer hover:bg-muted rounded-md -mx-2 px-2 py-1 transition-colors"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm line-clamp-1">
                    {report.post_title}
                  </span>
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5">
                    신고 {report.report_count}건
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {report.post_location}
                </p>
                <p className="text-xs text-red-500 mt-0.5 line-clamp-2">
                  신고 사유:{' '}
                  {report.reasons.map((reason) => REPORT_REASON_LABELS[reason]).join(', ')}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  작성자: {report.post_author_name}
                </p>
              </Link>
              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleReportDelete(report.post_id)}
                >
                  <Trash2 className="size-4" />
                  <span className="text-xs">처리(삭제)</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReportDismiss(report.post_id)}
                >
                  <XCircle className="size-4" />
                  <span className="text-xs">기각</span>
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
