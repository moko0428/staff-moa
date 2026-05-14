'use client';

import React from 'react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { FileText, Plus, X } from 'lucide-react';
import { User } from '@/types/mockData';

type Props = {
  documents: User['documents'];
  showDocumentInput: boolean;
  setShowDocumentInput: (v: boolean | ((prev: boolean) => boolean)) => void;
  newDocumentLabel: string;
  setNewDocumentLabel: (v: string) => void;
  addDocumentItem: () => Promise<void>;
  removeDocumentItem: (index: number) => Promise<void>;
  isSaving: boolean;
};

const DocumentsSection: React.FC<Props> = ({
  documents,
  showDocumentInput,
  setShowDocumentInput,
  newDocumentLabel,
  setNewDocumentLabel,
  addDocumentItem,
  removeDocumentItem,
  isSaving,
}) => {
  const list = documents?.extraDocuments ?? [];

  return (
    <Card>
      <CardContent className="p-4">
        {/* 섹션 헤더 */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
            <FileText className="size-4 text-red-500" />
          </div>
          <span className="font-bold flex-1">
            서류
            {list.length > 0 && (
              <span className="text-muted-foreground font-normal text-sm ml-2">{list.length}건</span>
            )}
          </span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => setShowDocumentInput((v) => !v)}
          >
            <Plus className="size-4" />
          </Button>
        </div>

        {showDocumentInput && (
          <div className="flex gap-2 mb-3">
            <Input
              placeholder="예: 주민등록등본, 통장사본"
              value={newDocumentLabel}
              onChange={(e) => setNewDocumentLabel(e.target.value)}
            />
            <Button
              type="button"
              size="sm"
              onClick={addDocumentItem}
              disabled={!newDocumentLabel.trim() || isSaving}
            >
              추가
            </Button>
          </div>
        )}

        {list.length > 0 ? (
          <div className="flex flex-wrap gap-2 mt-2">
            {list.map((item, idx) => (
              <span
                key={`doc-${idx}`}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm"
              >
                <span className="font-medium">{item}</span>
                <Badge variant="secondary" className="text-xs">
                  제출완료
                </Badge>
                <button
                  type="button"
                  onClick={() => removeDocumentItem(idx)}
                  className="ml-0.5 text-muted-foreground hover:text-destructive"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">추가된 서류 항목이 없습니다.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentsSection;
