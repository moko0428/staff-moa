'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Post } from '@/types/mockData';
import { X, Plus, Save, Link as LinkIcon } from 'lucide-react';

export interface LinkItem {
  text: string;
  url: string;
}

export interface DateTimeItem {
  date: string;
  time: string;
}

interface PostFormProps {
  formData: Partial<Post>;
  onFormDataChange: (field: string, value: string | number | string[]) => void;
  dateTimeList: DateTimeItem[];
  onDateTimeChange: (
    index: number,
    field: 'date' | 'time',
    value: string
  ) => void;
  onAddDateTime: () => void;
  onRemoveDateTime: (index: number) => void;
  links: LinkItem[];
  onAddLink: () => void;
  onRemoveLink: (index: number) => void;
  newLinkText: string;
  newLinkUrl: string;
  onNewLinkTextChange: (text: string) => void;
  onNewLinkUrlChange: (url: string) => void;
  onLinkKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  newKeyword: string;
  onNewKeywordChange: (keyword: string) => void;
  onAddKeyword: () => void;
  onRemoveKeyword: (keyword: string) => void;
  onKeywordKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export default function PostForm({
  formData,
  onFormDataChange,
  dateTimeList,
  onDateTimeChange,
  onAddDateTime,
  onRemoveDateTime,
  links,
  onAddLink,
  onRemoveLink,
  newLinkText,
  newLinkUrl,
  onNewLinkTextChange,
  onNewLinkUrlChange,
  onLinkKeyPress,
  newKeyword,
  onNewKeywordChange,
  onAddKeyword,
  onRemoveKeyword,
  onKeywordKeyPress,
  onSubmit,
  onCancel,
}: PostFormProps) {
  return (
    <form onSubmit={onSubmit} className="bg-white rounded-xl shadow-sm p-6">
      <div className="space-y-6">
        {/* 제목 */}
        <div className="space-y-2">
          <Label htmlFor="title">
            제목 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => onFormDataChange('title', e.target.value)}
            required
          />
        </div>

        {/* 설명 */}
        <div className="space-y-2">
          <Label htmlFor="description">
            업무 내용 <span className="text-red-500">*</span>
          </Label>
          <textarea
            id="description"
            className="w-full min-h-[100px] px-3 py-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            value={formData.description}
            onChange={(e) => onFormDataChange('description', e.target.value)}
            required
          />
        </div>

        {/* 날짜, 시간 (여러 개 추가 가능) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>
              날짜 및 시간 <span className="text-red-500">*</span>
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddDateTime}
            >
              <Plus className="size-4" />
              추가
            </Button>
          </div>
          {dateTimeList.map((item, index) => (
            <div key={index} className="grid grid-cols-2 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor={`date-${index}`}>
                  날짜 {index === 0 && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id={`date-${index}`}
                  type="date"
                  value={item.date}
                  onChange={(e) =>
                    onDateTimeChange(index, 'date', e.target.value)
                  }
                  required={index === 0}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`time-${index}`}>
                  시간 {index === 0 && <span className="text-red-500">*</span>}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id={`time-${index}`}
                    value={item.time}
                    onChange={(e) =>
                      onDateTimeChange(index, 'time', e.target.value)
                    }
                    placeholder="예: 09:00 - 18:00"
                    required={index === 0}
                    className="flex-1"
                  />
                  {dateTimeList.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveDateTime(index)}
                      className="shrink-0"
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 장소 */}
        <div className="space-y-2">
          <Label htmlFor="location">
            장소 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => onFormDataChange('location', e.target.value)}
            required
          />
        </div>

        {/* 급여, 지급일 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="salary">
              급여 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="salary"
              type="number"
              value={formData.salary || ''}
              onChange={(e) =>
                onFormDataChange('salary', Number(e.target.value))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentDate">지급일</Label>
            <Input
              id="paymentDate"
              type="date"
              value={formData.paymentDate}
              onChange={(e) => onFormDataChange('paymentDate', e.target.value)}
            />
          </div>
        </div>

        {/* 모집 인원 */}
        <div className="space-y-2">
          <Label htmlFor="recruitCount">모집 인원</Label>
          <Input
            id="recruitCount"
            type="number"
            min="1"
            value={formData.recruitCount || 1}
            onChange={(e) =>
              onFormDataChange('recruitCount', Number(e.target.value))
            }
          />
        </div>

        {/* 담당자 정보 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="managerName">
              담당자 이름 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="managerName"
              value={formData.managerInfo?.name || ''}
              onChange={(e) =>
                onFormDataChange('managerInfo.name', e.target.value)
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="managerPhone">
              담당자 연락처 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="managerPhone"
              value={formData.managerInfo?.phone || ''}
              onChange={(e) =>
                onFormDataChange('managerInfo.phone', e.target.value)
              }
              placeholder="010-1234-5678"
              required
            />
          </div>
        </div>

        {/* 준비물 */}
        <div className="space-y-2">
          <Label htmlFor="preparation">준비물</Label>
          <Input
            id="preparation"
            value={formData.preparation || ''}
            onChange={(e) => onFormDataChange('preparation', e.target.value)}
          />
        </div>

        {/* 자격 요건 */}
        <div className="space-y-2">
          <Label htmlFor="requirements">자격 요건</Label>
          <Input
            id="requirements"
            value={formData.requirements || ''}
            onChange={(e) => onFormDataChange('requirements', e.target.value)}
          />
        </div>

        {/* 우대 사항 */}
        <div className="space-y-2">
          <Label htmlFor="preferences">우대 사항</Label>
          <Input
            id="preferences"
            value={formData.preferences || ''}
            onChange={(e) => onFormDataChange('preferences', e.target.value)}
          />
        </div>

        {/* 기타 사항 */}
        <div className="space-y-2">
          <Label htmlFor="notes">기타 사항</Label>
          <textarea
            id="notes"
            className="w-full min-h-[80px] px-3 py-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            value={formData.notes || ''}
            onChange={(e) => onFormDataChange('notes', e.target.value)}
          />
        </div>

        {/* 링크 추가 */}
        <div className="space-y-2">
          <Label>링크</Label>
          <div className="space-y-2 mb-2">
            {links.map((link, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 border rounded-md bg-gray-50"
              >
                <LinkIcon className="size-4 text-gray-500 shrink-0" />
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-sm text-blue-600 hover:underline truncate"
                >
                  {link.text}
                </a>
                <span className="text-xs text-gray-400 truncate max-w-[200px]">
                  {link.url}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveLink(index)}
                  className="ml-2 rounded-full hover:bg-gray-200 p-1 transition-colors shrink-0"
                  aria-label="링크 삭제"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="text"
              value={newLinkText}
              onChange={(e) => onNewLinkTextChange(e.target.value)}
              onKeyPress={onLinkKeyPress}
              placeholder="링크 텍스트"
              className="flex-1"
            />
            <Input
              type="url"
              value={newLinkUrl}
              onChange={(e) => onNewLinkUrlChange(e.target.value)}
              onKeyPress={onLinkKeyPress}
              placeholder="https://example.com"
              className="flex-1"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddLink}
            disabled={!newLinkText.trim() || !newLinkUrl.trim()}
            className="w-full"
          >
            <Plus className="size-4" />
            링크 추가
          </Button>
        </div>

        {/* 키워드 */}
        <div className="space-y-2">
          <Label>키워드</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.keywords?.map((keyword) => (
              <Badge
                key={keyword}
                variant="outline"
                className="flex items-center gap-1 pr-1"
              >
                <span>{keyword}</span>
                <button
                  type="button"
                  onClick={() => onRemoveKeyword(keyword)}
                  className="ml-1 rounded-full hover:bg-gray-200 p-0.5 transition-colors"
                  aria-label={`${keyword} 삭제`}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              type="text"
              value={newKeyword}
              onChange={(e) => onNewKeywordChange(e.target.value)}
              onKeyPress={onKeywordKeyPress}
              placeholder="키워드 입력 후 Enter 또는 추가 버튼 클릭"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddKeyword}
              disabled={!newKeyword.trim()}
            >
              <Plus className="size-4" />
              추가
            </Button>
          </div>
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex justify-end gap-2 mt-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" variant="default">
          <Save className="size-4" />
          저장
        </Button>
      </div>
    </form>
  );
}
