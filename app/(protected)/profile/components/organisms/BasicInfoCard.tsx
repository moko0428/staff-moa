'use client';

import { Card, CardContent } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { UserCircle } from 'lucide-react';

interface Props {
  email: string;
  phone?: string | null;
  kakaoId?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  isEditing: boolean;
  isMember: boolean;
  isManagerOrPending: boolean;
  onEmailChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onKakaoIdChange: (v: string) => void;
  onBirthDateChange: (v: string) => void;
  onGenderChange: (v: string) => void;
}

const InfoRow = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-center gap-3 py-3">
    <span className="w-20 shrink-0 text-sm text-muted-foreground">{label}</span>
    <div className="flex-1 min-w-0">{children}</div>
  </div>
);

const InfoValue = ({ value }: { value?: string | null }) => (
  <span className="text-sm font-semibold">{value || '-'}</span>
);

export function BasicInfoCard({
  email,
  phone,
  kakaoId,
  birthDate,
  gender,
  isEditing,
  isMember,
  isManagerOrPending,
  onEmailChange,
  onPhoneChange,
  onKakaoIdChange,
  onBirthDateChange,
  onGenderChange,
}: Props) {
  const formatBirthDate = (date: string | null | undefined) => {
    if (!date) return '-';
    return date.replace(/-/g, '.');
  };

  return (
    <Card>
      <CardContent className="p-4">
        {/* 섹션 헤더 */}
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
            <UserCircle className="size-4 text-red-500" />
          </div>
          <span className="font-bold">개인 정보</span>
        </div>

        <div className="divide-y divide-border">
          <InfoRow label="휴대폰">
            {isEditing ? (
              <Input
                value={phone ?? ''}
                onChange={(e) => onPhoneChange(e.target.value)}
                placeholder="010-0000-0000"
                className="h-8"
              />
            ) : (
              <InfoValue value={phone} />
            )}
          </InfoRow>

          <InfoRow label="이메일">
            {isEditing ? (
              <Input
                value={email}
                type="email"
                onChange={(e) => onEmailChange(e.target.value)}
                className="h-8"
              />
            ) : (
              <InfoValue value={email} />
            )}
          </InfoRow>

          {isMember && (
            <InfoRow label="생년월일">
              {isEditing ? (
                <Input
                  value={birthDate || ''}
                  type="date"
                  onChange={(e) => onBirthDateChange(e.target.value)}
                  className="h-8"
                />
              ) : (
                <InfoValue value={formatBirthDate(birthDate)} />
              )}
            </InfoRow>
          )}

          {isMember && (
            <InfoRow label="성별">
              {isEditing ? (
                <select
                  className="w-full rounded-md border border-border px-3 h-8 text-sm bg-background"
                  value={gender || ''}
                  onChange={(e) => onGenderChange(e.target.value || '')}
                >
                  <option value="">선택</option>
                  <option value="남성">남성</option>
                  <option value="여성">여성</option>
                </select>
              ) : (
                <InfoValue value={gender} />
              )}
            </InfoRow>
          )}

          <InfoRow label="카카오 ID">
            {isEditing ? (
              <Input
                value={kakaoId ?? ''}
                onChange={(e) => onKakaoIdChange(e.target.value)}
                placeholder="카카오톡 ID"
                className="h-8"
              />
            ) : (
              <InfoValue value={kakaoId} />
            )}
          </InfoRow>
        </div>

        {isManagerOrPending && (
          <p className="text-xs text-muted-foreground mt-3 text-right">
            프로필을 모두 채우면 기업 신뢰도가 상승해요.
          </p>
        )}

      </CardContent>
    </Card>
  );
}
