'use client';

import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Button } from '@/app/components/ui/button';
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

interface AdditionalInfoCardProps {
  equipments: string;
  setEquipments: (v: string) => void;
  qualifications: string;
  setQualifications: (v: string) => void;
  preferences: string;
  setPreferences: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  externalLink: string;
  setExternalLink: (v: string) => void;
  status: 'recruiting' | 'completed' | 'urgent';
  setStatus: (v: 'recruiting' | 'completed' | 'urgent') => void;
  pasteHighlights?: Set<string>;
  /** 아코디언 등에서 상단 제목·카드 테두리 중복 제거 */
  plainSection?: boolean;
}

export const AdditionalInfoCard = ({
  equipments,
  setEquipments,
  qualifications,
  setQualifications,
  preferences,
  setPreferences,
  notes,
  setNotes,
  externalLink,
  setExternalLink,
  status,
  setStatus,
  pasteHighlights,
  plainSection = false,
}: AdditionalInfoCardProps) => {
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
          <CardTitle>추가 정보</CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="equipments">준비물 (복장 등)</Label>
          <Input
            id="equipments"
            value={equipments}
            onChange={(e) => setEquipments(e.target.value)}
            className={hl('equipments')}
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="qualifications">자격 요건</Label>
          <Textarea
            id="qualifications"
            value={qualifications}
            onChange={(e) => setQualifications(e.target.value)}
            rows={3}
            className={hl('qualifications')}
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="preferences">우대 사항</Label>
          <Textarea
            id="preferences"
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            rows={3}
            className={hl('preferences')}
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="notes">기타 사항</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className={hl('notes')}
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="external_link">링크 (선택사항)</Label>
          <Input
            id="external_link"
            type="url"
            value={externalLink}
            onChange={(e) => setExternalLink(e.target.value)}
            placeholder="https://example.com"
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="status">공고 상태</Label>
          <Select
            value={status}
            onValueChange={(v) =>
              setStatus(v as 'recruiting' | 'completed' | 'urgent')
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recruiting">모집중</SelectItem>
              <SelectItem value="urgent">급구</SelectItem>
              <SelectItem value="completed">모집완료</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
