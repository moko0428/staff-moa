'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { User as UserIcon, Mail, Phone, MessageSquare } from 'lucide-react';

interface Props {
  name: string;
  email: string;
  phone?: string | null;
  kakaoId?: string | null;
  isEditing: boolean;
  isManagerOrPending: boolean;
  onNameChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onKakaoIdChange: (v: string) => void;
}

export function BasicInfoCard({
  name,
  email,
  phone,
  kakaoId,
  isEditing,
  isManagerOrPending,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  onKakaoIdChange,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>기본 정보</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="flex items-center gap-2 text-muted-foreground mb-2">
              <UserIcon className="size-4" />이름
            </Label>
            {isEditing ? (
              <Input value={name ?? ''} onChange={(e) => onNameChange(e.target.value)} placeholder="이름" />
            ) : (
              <p className="font-semibold">{name ?? '-'}</p>
            )}
          </div>
          <div>
            <Label className="flex items-center gap-2 text-muted-foreground mb-2">
              <Mail className="size-4" />이메일
            </Label>
            {isEditing ? (
              <Input value={email} type="email" onChange={(e) => onEmailChange(e.target.value)} />
            ) : (
              <p className="font-semibold">{email}</p>
            )}
          </div>
          <div>
            <Label className="flex items-center gap-2 text-muted-foreground mb-2">
              <Phone className="size-4" />전화번호
            </Label>
            {isEditing ? (
              <Input value={phone ?? ''} onChange={(e) => onPhoneChange(e.target.value)} />
            ) : (
              <p className="font-semibold">{phone ?? '-'}</p>
            )}
          </div>
          <div>
            <Label className="flex items-center gap-2 text-muted-foreground mb-2">
              <MessageSquare className="size-4" />카카오톡 ID
            </Label>
            {isEditing ? (
              <Input value={kakaoId ?? ''} onChange={(e) => onKakaoIdChange(e.target.value)} />
            ) : (
              <p className="font-semibold">{kakaoId || '-'}</p>
            )}
          </div>
        </div>
        {isManagerOrPending && (
          <p className="text-sm text-muted-foreground text-right">
            프로필을 모두 채우면 기업 신뢰도가 상승해요.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
