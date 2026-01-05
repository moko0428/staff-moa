'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
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
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>서류</CardTitle>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setShowDocumentInput((v) => !v)}
        >
          항목 추가
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {showDocumentInput && (
          <div className="flex gap-2">
            <Input
              placeholder="예: 신분증 사본"
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

        {documents?.extraDocuments?.length ? (
          <div className="flex flex-wrap gap-2">
            {documents.extraDocuments.map((item, idx) => (
              <Badge
                key={`extra-doc-${idx}`}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {item}
                <button
                  type="button"
                  onClick={() => removeDocumentItem(idx)}
                  className="ml-1 hover:text-red-600"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">추가된 서류 항목이 없습니다.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentsSection;
