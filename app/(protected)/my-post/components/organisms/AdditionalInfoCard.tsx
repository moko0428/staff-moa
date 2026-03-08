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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { X } from 'lucide-react';

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
  keywords: string[];
  newKeyword: string;
  setNewKeyword: (v: string) => void;
  handleAddKeyword: () => void;
  handleRemoveKeyword: (kw: string) => void;
  status: 'recruiting' | 'completed' | 'urgent';
  setStatus: (v: 'recruiting' | 'completed' | 'urgent') => void;
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
  keywords,
  newKeyword,
  setNewKeyword,
  handleAddKeyword,
  handleRemoveKeyword,
  status,
  setStatus,
}: AdditionalInfoCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>추가 정보</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="equipments">준비물 (복장 등)</Label>
          <Input
            id="equipments"
            value={equipments}
            onChange={(e) => setEquipments(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="qualifications">자격 요건</Label>
          <Textarea
            id="qualifications"
            value={qualifications}
            onChange={(e) => setQualifications(e.target.value)}
            rows={3}
          />
        </div>
        <div>
          <Label htmlFor="preferences">우대 사항</Label>
          <Textarea
            id="preferences"
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            rows={3}
          />
        </div>
        <div>
          <Label htmlFor="notes">기타 사항</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>
        <div>
          <Label htmlFor="external_link">링크 (선택사항)</Label>
          <Input
            id="external_link"
            type="url"
            value={externalLink}
            onChange={(e) => setExternalLink(e.target.value)}
            placeholder="https://example.com"
          />
        </div>
        <div>
          <Label>키워드</Label>
          <small className="text-sm text-muted-foreground">
            효율적인 매칭을 위해 키워드를 입력해주세요.
          </small>
          <div className="flex gap-2 mb-2">
            <Input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyPress={(e) => {
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
          {keywords.length > 0 && (
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
          )}
        </div>
        <div>
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
