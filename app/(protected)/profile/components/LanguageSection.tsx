'use client';

import React from 'react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Globe, Plus, X } from 'lucide-react';
import { User } from '@/types/mockData';

type Props = {
  documents: User['documents'];
  showLanguageInput: boolean;
  setShowLanguageInput: (v: boolean | ((prev: boolean) => boolean)) => void;
  newLanguage: string;
  setNewLanguage: (v: string) => void;
  addLanguage: () => Promise<void>;
  removeLanguage: (index: number) => Promise<void>;
  isEditing: boolean;
  isSaving: boolean;
};

const parseLanguage = (entry: string) => {
  const match = entry.match(/^([^(]+)(\(.+\))?$/);
  if (match) {
    return { name: match[1].trim(), level: match[2]?.replace(/[()]/g, '').trim() };
  }
  return { name: entry, level: undefined };
};

const LanguageSection: React.FC<Props> = ({
  documents,
  showLanguageInput,
  setShowLanguageInput,
  newLanguage,
  setNewLanguage,
  addLanguage,
  removeLanguage,
  isEditing,
  isSaving,
}) => {
  const list = documents?.language ?? [];

  return (
    <Card>
      <CardContent className="p-4">
        {/* 섹션 헤더 */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
            <Globe className="size-4 text-red-500" />
          </div>
          <span className="font-bold flex-1">
            어학
            {list.length > 0 && (
              <span className="text-muted-foreground font-normal text-sm ml-2">{list.length}개</span>
            )}
          </span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => setShowLanguageInput((v) => !v)}
          >
            <Plus className="size-4" />
          </Button>
        </div>

        {showLanguageInput && (
          <div className="flex gap-2 mb-3">
            <Input
              value={newLanguage}
              onChange={(e) => setNewLanguage(e.target.value)}
              placeholder="예: 영어(TOEIC 850), 일본어(JLPT N3)"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  if (!isSaving && newLanguage.trim()) addLanguage();
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              onClick={addLanguage}
              disabled={!newLanguage.trim() || isSaving}
            >
              <Plus className="size-4" />
            </Button>
          </div>
        )}

        {list.length > 0 ? (
          <div className="flex flex-wrap gap-2 mt-2">
            {list.map((lang, index) => {
              const { name, level } = parseLanguage(lang);
              return (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm"
                >
                  <span className="font-medium">{name}</span>
                  {level && (
                    <span className="text-muted-foreground text-xs">{level}</span>
                  )}
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => removeLanguage(index)}
                      className="ml-1 text-muted-foreground hover:text-destructive"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </span>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">등록된 어학 능력이 없습니다.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default LanguageSection;
