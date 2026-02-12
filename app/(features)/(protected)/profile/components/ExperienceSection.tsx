'use client';

import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Briefcase, Calendar as CalendarIcon, MapPin, Trash2 } from 'lucide-react';
import { User } from '@/types/mockData';

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
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>경력</CardTitle>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowExperienceInput((v) => !v)}
            >
              항목 추가
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={loadExperiencesFromSchedules}
              disabled={isLoadingExperiences}
            >
              <Briefcase className="size-4 mr-2" />
              {isLoadingExperiences ? '불러오는 중...' : '경력 불러오기'}
            </Button>
          </div>
        </div>
        {showExperienceInput && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input
              placeholder="경력 제목"
              value={newExperience.title}
              onChange={(e) =>
                setNewExperience((prev) => ({
                  ...prev,
                  title: e.target.value,
                }))
              }
            />
            <Input
              type="date"
              placeholder="날짜"
              value={newExperience.date}
              onChange={(e) =>
                setNewExperience((prev) => ({
                  ...prev,
                  date: e.target.value,
                }))
              }
            />
            <div className="flex gap-2">
              <Input
                placeholder="장소"
                value={newExperience.location}
                onChange={(e) =>
                  setNewExperience((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
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
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {currentUser.experiences && currentUser.experiences.length > 0 ? (
            <div className="space-y-2">
              {currentUser.experiences.map((exp, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between p-3 border rounded-lg bg-muted"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{exp.title}</h4>
                    {(exp.date || exp.location) && (
                      <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                        {exp.date && (
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="size-3" />
                            <span>
                              {new Date(exp.date).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                              })}
                            </span>
                          </div>
                        )}
                        {exp.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="size-3" />
                            <span>{exp.location}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-red-500"
                      aria-label="경력 삭제"
                      onClick={() => removeExperience(index)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">등록된 경력이 없습니다.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExperienceSection;
