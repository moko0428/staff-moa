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
  recruitCount: number;
  setRecruitCount: (v: number) => void;
  genderType: 'any' | 'separated';
  setGenderType: (v: 'any' | 'separated') => void;
  recruitMale: number;
  setRecruitMale: (v: number) => void;
  recruitFemale: number;
  setRecruitFemale: (v: number) => void;
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
  recruitCount,
  setRecruitCount,
  genderType,
  setGenderType,
  recruitMale,
  setRecruitMale,
  recruitFemale,
  setRecruitFemale,
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
    <Card
      className={cn(
        plainSection && 'border-0 shadow-none bg-transparent',
      )}
    >
      {!plainSection && (
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {/* 제목 */}
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
            className={hl('title')}
            required
          />
          {fieldErrors?.title && (
            <p className="text-sm text-red-500 mt-1">{fieldErrors.title}</p>
          )}
        </div>

        {/* 키워드 (필수) */}
        <div>
          <Label>
            키워드 <span className="text-red-500">*</span>
          </Label>
          <small className="text-sm text-muted-foreground block mb-1">
            효율적인 매칭을 위해 키워드를 1개 이상 입력해주세요.
          </small>
          <div className="flex gap-2 mb-2">
            <Input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
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
            className={hl('description')}
            required
          />
          {fieldErrors?.description && (
            <p className="text-sm text-red-500 mt-1">
              {fieldErrors.description}
            </p>
          )}
        </div>

        {/* 모집 인원 + 성별 */}
        <div>
          <Label>
            모집인원 <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center gap-2 mb-2 mt-1">
            <Button
              type="button"
              size="sm"
              variant={genderType === 'any' ? 'default' : 'outline'}
              onClick={() => setGenderType('any')}
            >
              무관
            </Button>
            <Button
              type="button"
              size="sm"
              variant={genderType === 'separated' ? 'default' : 'outline'}
              onClick={() => setGenderType('separated')}
            >
              남/여 구분
            </Button>
          </div>

          {genderType === 'any' ? (
            <Input
              id="recruit_count"
              type="number"
              min="1"
              value={recruitCount}
              onChange={(e) => setRecruitCount(Number(e.target.value))}
              className={hl('recruit_count')}
              required
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="recruit_male" className="text-sm">남성</Label>
                <Input
                  id="recruit_male"
                  type="number"
                  min="0"
                  value={recruitMale}
                  onChange={(e) => {
                    const m = Number(e.target.value);
                    setRecruitMale(m);
                    setRecruitCount(m + recruitFemale);
                  }}
                />
              </div>
              <div>
                <Label htmlFor="recruit_female" className="text-sm">여성</Label>
                <Input
                  id="recruit_female"
                  type="number"
                  min="0"
                  value={recruitFemale}
                  onChange={(e) => {
                    const f = Number(e.target.value);
                    setRecruitFemale(f);
                    setRecruitCount(recruitMale + f);
                  }}
                />
              </div>
              <p className="col-span-2 text-sm text-muted-foreground">
                총 모집인원: {recruitMale + recruitFemale}명
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
