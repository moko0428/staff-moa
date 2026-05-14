'use client';

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Briefcase, Trash2, Plus } from 'lucide-react';
import { User } from '@/types/mockData';

type ExperienceItem = { title: string; date: string; location: string };
type GroupedExperience = { title: string; count: number; firstIndex: number; firstExp: ExperienceItem };

type Props = {
  currentUser: User;
  isEditing: boolean;
  showExperienceInput: boolean;
  setShowExperienceInput: (v: boolean | ((prev: boolean) => boolean)) => void;
  newExperience: { title: string; date: string; location: string };
  setNewExperience: (
    updater:
      | { title: string; date: string; location: string }
      | ((prev: { title: string; date: string; location: string }) => {
          title: string;
          date: string;
          location: string;
        })
  ) => void;
  isLoadingExperiences: boolean;
  loadExperiencesFromSchedules: () => Promise<void>;
  addExperienceManual: () => Promise<void>;
  removeExperience: (index: number) => Promise<void>;
  isSaving: boolean;
};

const formatExpDate = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}.${m}`;
};

const ExperienceSection: React.FC<Props> = ({
  currentUser,
  isEditing,
  showExperienceInput,
  setShowExperienceInput,
  newExperience,
  setNewExperience,
  isLoadingExperiences,
  loadExperiencesFromSchedules,
  addExperienceManual,
  removeExperience,
  isSaving,
}) => {
  const groupedExperiences = useMemo((): GroupedExperience[] => {
    const list = currentUser.experiences ?? [];
    if (list.length === 0) return [];
    const map = new Map<string, { indices: number[]; firstExp: ExperienceItem }>();
    list.forEach((exp, index) => {
      const key = exp.title.trim() || '(제목 없음)';
      const existing = map.get(key);
      if (existing) {
        existing.indices.push(index);
      } else {
        map.set(key, { indices: [index], firstExp: exp });
      }
    });
    return Array.from(map.entries()).map(([key, { indices, firstExp }]) => ({
      title: key,
      count: indices.length,
      firstIndex: indices[0],
      firstExp,
    }));
  }, [currentUser.experiences]);

  const listLength = groupedExperiences.length;

  return (
    <Card>
      <CardContent className="p-4">
        {/* 섹션 헤더 */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
            <Briefcase className="size-4 text-red-500" />
          </div>
          <span className="font-bold flex-1">
            경력
            {listLength > 0 && (
              <span className="text-muted-foreground font-normal text-sm ml-2">{listLength}건</span>
            )}
          </span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-xs text-muted-foreground"
              onClick={loadExperiencesFromSchedules}
              disabled={isLoadingExperiences}
            >
              {isLoadingExperiences ? '불러오는 중...' : '경력 불러오기'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => setShowExperienceInput((v) => !v)}
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </div>

        {showExperienceInput && (
          <div className="mb-3 grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input
              placeholder="경력 제목"
              value={newExperience.title}
              onChange={(e) =>
                setNewExperience((prev) => ({ ...prev, title: e.target.value }))
              }
            />
            <Input
              type="date"
              value={newExperience.date}
              onChange={(e) =>
                setNewExperience((prev) => ({ ...prev, date: e.target.value }))
              }
            />
            <div className="flex gap-2">
              <Input
                placeholder="장소 / 업체명"
                value={newExperience.location}
                onChange={(e) =>
                  setNewExperience((prev) => ({ ...prev, location: e.target.value }))
                }
              />
              <Button
                type="button"
                size="sm"
                onClick={addExperienceManual}
                disabled={
                  !newExperience.title.trim() ||
                  !newExperience.date.trim() ||
                  !newExperience.location.trim() ||
                  isSaving
                }
              >
                추가
              </Button>
            </div>
          </div>
        )}

        {listLength > 0 ? (
          <div className={listLength >= 3 ? 'max-h-60 overflow-y-auto' : ''}>
            <div className="divide-y divide-border">
              {groupedExperiences.map((group) => (
                <div
                  key={`${group.title}-${group.firstIndex}`}
                  className="flex items-start justify-between py-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{group.title}</p>
                    {group.firstExp.location && (
                      <p className="text-xs text-muted-foreground mt-0.5">{group.firstExp.location}</p>
                    )}
                    {group.firstExp.date && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatExpDate(group.firstExp.date)}
                        {group.count > 1 && ` · ${group.count}회`}
                      </p>
                    )}
                  </div>
                  {isEditing && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeExperience(group.firstIndex)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">등록된 경력이 없습니다.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ExperienceSection;
