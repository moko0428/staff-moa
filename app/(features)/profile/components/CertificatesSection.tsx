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
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
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
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>자격증</CardTitle>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setShowCertificateInput((v) => !v)}
        >
          항목 추가
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 border rounded-lg">
          <Label className="flex items-center gap-2 text-gray-500 mb-3">
            <Award className="size-4" />
            자격증
          </Label>
          <div className="space-y-3">
            {documents?.certificates && documents.certificates.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {documents.certificates.map((cert, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {cert}
                    {isEditing && (
                      <button
                        onClick={() => removeCertificate(index)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="size-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">등록된 자격증이 없습니다.</p>
            )}
            {showCertificateInput && (
              <div className="flex gap-2">
                <Input
                  value={newCertificate}
                  onChange={(e) => setNewCertificate(e.target.value)}
                  placeholder="예: 바리스타 2급, 컴퓨터활용능력 1급"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (!isSaving) addCertificate();
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CertificatesSection;
