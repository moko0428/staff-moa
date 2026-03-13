'use client';

import { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Building2, CreditCard, FileCheck, ImagePlus, X } from 'lucide-react';
import { formatBusinessNumber } from '../../utils/profileUtils';
import Image from 'next/image';
import type { ChangeEvent } from 'react';

interface Props {
  companyName?: string | null;
  businessNumber?: string | null;
  companyCertificate?: string | null;
  companyVerifyStatus: string;
  companyBadgeLabel: string;
  companyBadgeVariant: 'secondary' | 'default' | 'outline';
  companyInfoFilled: boolean;
  isEditing: boolean;
  isAdmin: boolean;
  isSaving: boolean;
  isReRequesting?: boolean;
  isPendingManagerRejected?: boolean;
  coverImage?: string | null;
  isUploadingCover?: boolean;
  onCompanyNameChange: (v: string) => void;
  onBusinessNumberChange: (v: string) => void;
  onCompanyCertUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  onVerifyStatusChange?: (v: string) => void;
  onSave: () => void;
  onCancelEdit: () => void;
  onReRequest?: () => void;
  onCoverImageUpload?: (file: File) => void;
  onRemoveCoverImage?: () => void;
}

export function CompanyInfoCard({
  companyName,
  businessNumber,
  companyCertificate,
  companyVerifyStatus,
  companyBadgeLabel,
  companyBadgeVariant,
  companyInfoFilled,
  isEditing,
  isAdmin,
  isSaving,
  isReRequesting,
  isPendingManagerRejected,
  coverImage,
  isUploadingCover,
  onCompanyNameChange,
  onBusinessNumberChange,
  onCompanyCertUpload,
  onVerifyStatusChange,
  onSave,
  onCancelEdit,
  onReRequest,
  onCoverImageUpload,
  onRemoveCoverImage,
}: Props) {
  const coverInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      {isPendingManagerRejected && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-3">
            <div className="flex flex-col gap-1 text-sm text-red-700">
              <p className="font-semibold">승인 요청이 거절되었습니다.</p>
              <p className="text-xs">프로필 정보를 보완한 뒤 재요청을 진행해주세요.</p>
              <div className="mt-2">
                <Button size="sm" onClick={onReRequest} disabled={isReRequesting}>
                  {isReRequesting ? '재요청 중...' : '재요청'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex items-center justify-between flex-row">
          <CardTitle>회사 정보</CardTitle>
          <Badge variant={companyBadgeVariant}>{companyBadgeLabel}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2 text-muted-foreground mb-2">
                <Building2 className="size-4" />회사명
              </Label>
              {isEditing ? (
                <Input
                  value={companyName ?? ''}
                  placeholder="회사명 입력"
                  onChange={(e) => onCompanyNameChange(e.target.value)}
                />
              ) : (
                <p className="font-semibold">{companyName || '-'}</p>
              )}
            </div>
            <div>
              <Label className="flex items-center gap-2 text-muted-foreground mb-2">
                <CreditCard className="size-4" />사업자등록번호
              </Label>
              {isEditing ? (
                <Input
                  value={formatBusinessNumber(businessNumber ?? '')}
                  placeholder="숫자 10자리 (예: 123-45-67890)"
                  onChange={(e) => onBusinessNumberChange(formatBusinessNumber(e.target.value))}
                />
              ) : (
                <p className="font-semibold">
                  {businessNumber ? formatBusinessNumber(businessNumber) : '-'}
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <Label className="flex items-center gap-2 text-muted-foreground mb-2">
                <FileCheck className="size-4" />기업인증 파일
              </Label>
              {isEditing ? (
                <div className="flex items-center gap-3">
                  <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={onCompanyCertUpload} />
                  {companyCertificate && (
                    <p className="text-sm text-muted-foreground">{companyCertificate}</p>
                  )}
                </div>
              ) : (
                <p className="font-semibold">{companyCertificate || '-'}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label className="flex items-center gap-2 text-muted-foreground mb-2">
                <ImagePlus className="size-4" />커버 이미지
              </Label>
            {coverImage ? (
              <div className="relative h-36 w-full overflow-hidden rounded-lg border border-border">
                <Image src={coverImage} alt="커버 이미지" fill className="object-cover" />
                {isEditing && (
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 size-7"
                    onClick={onRemoveCoverImage}
                    disabled={isUploadingCover}
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </div>
            ) : (
              isEditing ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={isUploadingCover}
                >
                  <ImagePlus className="size-4 mr-2" />
                  {isUploadingCover ? '업로드 중...' : '이미지 선택'}
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">-</p>
              )
            )}
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && onCoverImageUpload) onCoverImageUpload(file);
                e.target.value = '';
              }}
            />
            </div>
          </div>

          {isEditing && isAdmin && onVerifyStatusChange && (
            <div>
              <Label className="flex items-center gap-2 text-muted-foreground mb-2">인증 상태</Label>
              <select
                className="w-full rounded-md border border-border px-3 py-2 text-sm"
                value={companyVerifyStatus}
                disabled={!companyInfoFilled}
                onChange={(e) => onVerifyStatusChange(e.target.value)}
              >
                <option value="pending">인증 처리중</option>
                <option value="approved">인증 완료</option>
              </select>
              {!companyInfoFilled && (
                <p className="text-xs text-muted-foreground mt-1">
                  회사명·사업자등록번호·인증 파일을 모두 입력해야 승인할 수 있습니다.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {isEditing && (
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onCancelEdit}>취소</Button>
          <Button onClick={onSave} disabled={isSaving}>{isSaving ? '저장 중...' : '저장'}</Button>
        </div>
      )}
    </>
  );
}
