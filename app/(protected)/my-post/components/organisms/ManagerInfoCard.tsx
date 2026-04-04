'use client';

import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { cn } from '@/lib/utils';

interface ManagerInfoCardProps {
  managerName: string;
  setManagerName: (v: string) => void;
  managerContactType: 'phone' | 'kakao' | 'email' | 'other';
  setManagerContactType: (v: 'phone' | 'kakao' | 'email' | 'other') => void;
  managerPhone: string;
  setManagerPhone: (v: string) => void;
  /** 아코디언 등에서 상단 제목·카드 테두리 중복 제거 */
  plainSection?: boolean;
}

export const ManagerInfoCard = ({
  managerName,
  setManagerName,
  managerContactType,
  setManagerContactType,
  managerPhone,
  setManagerPhone,
  plainSection = false,
}: ManagerInfoCardProps) => {
  return (
    <Card className={cn(plainSection && 'border-0 shadow-none bg-transparent')}>
      {!plainSection && (
        <CardHeader>
          <CardTitle>담당자 정보</CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="manager_name">
            담당자 이름 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="manager_name"
            value={managerName}
            onChange={(e) => setManagerName(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="manager_phone">
            담당자 연락처 <span className="text-red-500">*</span>
          </Label>
          <div className="flex gap-2 items-stretch">
            <Input
              id="manager_phone"
              className="min-w-0 flex-1"
              type={
                managerContactType === 'email'
                  ? 'email'
                  : managerContactType === 'phone'
                    ? 'tel'
                    : 'text'
              }
              value={managerPhone}
              onChange={(e) => setManagerPhone(e.target.value)}
              placeholder={
                managerContactType === 'phone'
                  ? '010-1234-5678'
                  : managerContactType === 'kakao'
                    ? '카카오톡 ID'
                    : managerContactType === 'email'
                      ? 'example@email.com'
                      : '연락처 정보'
              }
              required
            />
            <Select
              value={managerContactType}
              onValueChange={(value) =>
                setManagerContactType(
                  value as 'phone' | 'kakao' | 'email' | 'other',
                )
              }
            >
              <SelectTrigger
                id="manager_contact_type"
                aria-label="연락처 유형"
                className="w-[9.5rem] shrink-0"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phone">전화번호</SelectItem>
                <SelectItem value="kakao">카카오톡 ID</SelectItem>
                <SelectItem value="email">이메일</SelectItem>
                <SelectItem value="other">기타</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
