'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Languages, Plus, X } from 'lucide-react';
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
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>어학 능력</CardTitle>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setShowLanguageInput((v) => !v)}
        >
          항목 추가
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 border rounded-lg">
          <Label className="flex items-center gap-2 text-gray-500 mb-3">
            <Languages className="size-4" />
            어학 능력
          </Label>
          <div className="space-y-3">
            {documents?.language && documents.language.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {documents.language.map((lang, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {lang}
                    {isEditing && (
                      <button
                        onClick={() => removeLanguage(index)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="size-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                등록된 어학 능력이 없습니다.
              </p>
            )}
            {showLanguageInput && (
              <div className="flex gap-2">
                <Input
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  placeholder="예: 영어(중급), 일본어(초급)"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (!isSaving) addLanguage();
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LanguageSection;
