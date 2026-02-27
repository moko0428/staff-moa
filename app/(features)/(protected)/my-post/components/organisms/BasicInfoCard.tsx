'use client';

import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';

interface BasicInfoCardProps {
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  recruitCount: number;
  setRecruitCount: (v: number) => void;
  fieldErrors?: Record<string, string>;
  descriptionRows?: number;
  showTitleHint?: boolean;
}

export const BasicInfoCard = ({
  title,
  setTitle,
  description,
  setDescription,
  recruitCount,
  setRecruitCount,
  fieldErrors,
  descriptionRows = 5,
  showTitleHint = false,
}: BasicInfoCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>기본 정보</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="title">
            제목 <span className="text-red-500">*</span>
          </Label>
          {showTitleHint && (
            <small className="text-muted-foreground">최대 24자</small>
          )}
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          {fieldErrors?.title && (
            <p className="text-sm text-red-500 mt-1">{fieldErrors.title}</p>
          )}
        </div>

        <div>
          <Label htmlFor="description">
            업무 내용 <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={descriptionRows}
            placeholder={showTitleHint ? '업무 내용을 자세히 작성해주세요.' : undefined}
            required
          />
          {fieldErrors?.description && (
            <p className="text-sm text-red-500 mt-1">
              {fieldErrors.description}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="recruit_count">
            모집인원 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="recruit_count"
            type="number"
            min="1"
            value={recruitCount}
            onChange={(e) => setRecruitCount(Number(e.target.value))}
            required
          />
        </div>
      </CardContent>
    </Card>
  );
};
