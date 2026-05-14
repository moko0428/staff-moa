'use client';

import React from 'react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Award, Plus, X } from 'lucide-react';
import { User } from '@/types/mockData';

type Props = {
  documents: User['documents'];
  showCertificateInput: boolean;
  setShowCertificateInput: (v: boolean | ((prev: boolean) => boolean)) => void;
  newCertificate: string;
  setNewCertificate: (v: string) => void;
  addCertificate: () => Promise<void>;
  removeCertificate: (index: number) => Promise<void>;
  isEditing: boolean;
  isSaving: boolean;
};

const CertificatesSection: React.FC<Props> = ({
  documents,
  showCertificateInput,
  setShowCertificateInput,
  newCertificate,
  setNewCertificate,
  addCertificate,
  removeCertificate,
  isEditing,
  isSaving,
}) => {
  const list = documents?.certificates ?? [];

  return (
    <Card>
      <CardContent className="p-4">
        {/* 섹션 헤더 */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
            <Award className="size-4 text-red-500" />
          </div>
          <span className="font-bold flex-1">
            자격증
            {list.length > 0 && (
              <span className="text-muted-foreground font-normal text-sm ml-2">{list.length}개</span>
            )}
          </span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => setShowCertificateInput((v) => !v)}
          >
            <Plus className="size-4" />
          </Button>
        </div>

        {showCertificateInput && (
          <div className="flex gap-2 mb-3">
            <Input
              value={newCertificate}
              onChange={(e) => setNewCertificate(e.target.value)}
              placeholder="예: 컴퓨터활용능력 1급, 운전면허 1종"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  if (!isSaving && newCertificate.trim()) addCertificate();
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              onClick={addCertificate}
              disabled={!newCertificate.trim() || isSaving}
            >
              <Plus className="size-4" />
            </Button>
          </div>
        )}

        {list.length > 0 ? (
          <div className="flex flex-wrap gap-2 mt-2">
            {list.map((cert, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm"
              >
                <span className="font-medium">{cert}</span>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => removeCertificate(index)}
                    className="ml-1 text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">등록된 자격증이 없습니다.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default CertificatesSection;
