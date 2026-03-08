'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';

interface Props {
  age?: number | null;
  birthDate?: string | null;
  gender?: string | null;
  isEditing: boolean;
  isSaving: boolean;
  onBirthDateChange: (v: string) => void;
  onGenderChange: (v: string) => void;
  onSave: () => void;
  onCancelEdit: () => void;
}

export function PersonalInfoCard({
  age,
  birthDate,
  gender,
  isEditing,
  isSaving,
  onBirthDateChange,
  onGenderChange,
  onSave,
  onCancelEdit,
}: Props) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>개인 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground mb-2">나이</Label>
              {isEditing ? (
                <div>
                  <Input
                    value={birthDate || ''}
                    type="date"
                    onChange={(e) => onBirthDateChange(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">생년월일을 선택해주세요</p>
                </div>
              ) : (
                <p className="font-semibold">{age ? `${age}세` : '-'}</p>
              )}
            </div>
            <div>
              <Label className="text-muted-foreground mb-2">성별</Label>
              {isEditing ? (
                <select
                  className="w-full rounded-md border border-border px-3 py-2 text-sm"
                  value={gender || ''}
                  onChange={(e) => onGenderChange(e.target.value || '')}
                >
                  <option value="">선택</option>
                  <option value="남성">남자</option>
                  <option value="여성">여자</option>
                </select>
              ) : (
                <p className="font-semibold">{gender}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {isEditing && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancelEdit}>취소</Button>
          <Button onClick={onSave} disabled={isSaving}>{isSaving ? '저장 중...' : '저장'}</Button>
        </div>
      )}
    </>
  );
}
