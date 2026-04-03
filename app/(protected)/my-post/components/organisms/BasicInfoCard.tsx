'use client';

import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BasicInfoCardProps {
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  keywords: string[];
  newKeyword: string;
  setNewKeyword: (v: string) => void;
  handleAddKeyword: () => void;
  handleRemoveKeyword: (kw: string) => void;
  fieldErrors?: Record<string, string>;
  descriptionRows?: number;
  showTitleHint?: boolean;
  pasteHighlights?: Set<string>;
  /** 아코디언 등에서 상단 제목·카드 테두리 중복 제거 */
  plainSection?: boolean;
}

export const BasicInfoCard = ({
  title,
  setTitle,
  description,
  setDescription,
  keywords,
  newKeyword,
  setNewKeyword,
  handleAddKeyword,
  handleRemoveKeyword,
  fieldErrors,
  descriptionRows = 5,
  showTitleHint = false,
  pasteHighlights,
  plainSection = false,
}: BasicInfoCardProps) => {
  const hl = (id: string) =>
    pasteHighlights?.has(id) ? 'ring-2 ring-blue-400' : '';

  return (
    <Card className={cn(plainSection && 'border-0 shadow-none bg-transparent')}>
      {!plainSection && (
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {/* 제목 */}
        <div className="flex flex-col gap-0.5">
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
            className={hl('title')}
            required
          />
          {fieldErrors?.title && (
            <p className="text-sm text-red-500 mt-1">{fieldErrors.title}</p>
          )}
        </div>

        {/* 키워드 (필수) */}
        <div className="flex flex-col gap-0.5">
          <Label>
            키워드 <span className="text-red-500">*</span>
          </Label>
          <small className="text-sm text-muted-foreground block">
            효율적인 매칭을 위해 키워드를 1개 이상 입력해주세요.
          </small>
          <div className="flex gap-2">
            <Input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  handleAddKeyword();
                }
              }}
              placeholder="키워드 입력 후 Enter"
            />
            <Button type="button" onClick={handleAddKeyword}>
              추가
            </Button>
          </div>
          {keywords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {keywords.map((kw) => (
                <Badge
                  key={kw}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {kw}
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyword(kw)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              아직 추가된 키워드가 없습니다.
            </p>
          )}
          {fieldErrors?.keywords && (
            <p className="text-sm text-red-500 mt-1">{fieldErrors.keywords}</p>
          )}
        </div>

        {/* 업무 내용 */}
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="description">
            업무 내용 <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={descriptionRows}
            placeholder={
              showTitleHint ? '업무 내용을 자세히 작성해주세요.' : undefined
            }
            className={hl('description')}
            required
          />
          {fieldErrors?.description && (
            <p className="text-sm text-red-500 mt-1">
              {fieldErrors.description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
