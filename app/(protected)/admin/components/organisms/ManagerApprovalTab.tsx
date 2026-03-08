'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/app/components/ui/avatar';
import { Input } from '@/app/components/ui/input';
import { Check, CheckCircle2, Loader2, ShieldCheck, X } from 'lucide-react';
import { useAdminManagers } from '../../hooks/useAdminManagers';

export const ManagerApprovalTab = () => {
  const {
    loadingManagers,
    managerSearch,
    setManagerSearch,
    filteredPendingManagers,
    handleManagerDecision,
  } = useAdminManagers();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <span>매니저 승인 관리</span>
            <span className="text-sm text-muted-foreground">
              대기 {filteredPendingManagers.length}명
            </span>
          </div>
          <Input
            placeholder="이름 또는 이메일로 검색"
            value={managerSearch}
            onChange={(e) => setManagerSearch(e.target.value)}
            className="h-9 text-sm"
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loadingManagers ? (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground gap-2">
            <Loader2 className="size-4 animate-spin" />
            불러오는 중...
          </div>
        ) : filteredPendingManagers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            대기 중인 매니저 승급 요청이 없습니다.
          </p>
        ) : (
          filteredPendingManagers.map((req) => (
            <div
              key={req.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  {req.photo ? (
                    <AvatarImage src={req.photo} alt={req.name} />
                  ) : null}
                  <AvatarFallback>{req.name.at(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{req.name}</span>
                  <span className="text-xs text-muted-foreground">{req.email}</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    요청일: {req.requestedAt?.slice(0, 10) || '-'}
                  </span>
                  <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                    {[
                      { label: '전화번호', ok: !!req.phone },
                      { label: '카카오 ID', ok: !!req.kakaoId },
                      { label: '회사명', ok: !!req.companyName },
                      { label: '사업자번호', ok: !!req.businessNumber },
                      { label: '인증 파일', ok: !!req.companyCertificate },
                    ].map((item) => (
                      <span
                        key={item.label}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-border"
                      >
                        {item.ok ? (
                          <Check className="size-3 text-emerald-600" />
                        ) : (
                          <X className="size-3 text-red-500" />
                        )}
                        {item.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleManagerDecision(req, 'approve')}
                >
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  <span className="text-xs">승인</span>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleManagerDecision(req, 'reject')}
                >
                  <ShieldCheck className="size-4" />
                  <span className="text-xs">거절</span>
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
