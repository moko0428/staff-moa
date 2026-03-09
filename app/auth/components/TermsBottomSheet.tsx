'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import TermsBottomSheet, { type TermsType } from '@/app/components/TermsBottomSheet';

interface TermsAgreeSectionProps {
  serviceChecked: boolean;
  privacyChecked: boolean;
  onServiceChange: (checked: boolean) => void;
  onPrivacyChange: (checked: boolean) => void;
  fieldError?: string;
}

export const TermsAgreeSection = ({
  serviceChecked,
  privacyChecked,
  onServiceChange,
  onPrivacyChange,
  fieldError,
}: TermsAgreeSectionProps) => {
  const [openTerms, setOpenTerms] = useState<TermsType | null>(null);
  const allChecked = serviceChecked && privacyChecked;

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="serviceAgree"
            checked={serviceChecked}
            onChange={(e) => onServiceChange(e.target.checked)}
            className="size-4 rounded border-gray-300 accent-primary shrink-0"
          />
          <label htmlFor="serviceAgree" className="text-sm leading-tight font-medium flex-1">
            서비스 이용약관 동의 (필수)
          </label>
          <button
            type="button"
            onClick={() => setOpenTerms('service')}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="privacyAgree"
            checked={privacyChecked}
            onChange={(e) => onPrivacyChange(e.target.checked)}
            className="size-4 rounded border-gray-300 accent-primary shrink-0"
          />
          <label htmlFor="privacyAgree" className="text-sm leading-tight font-medium flex-1">
            개인정보 처리방침 동의 (필수)
          </label>
          <button
            type="button"
            onClick={() => setOpenTerms('privacy')}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        {allChecked && <input type="hidden" name="termsAgree" value="on" />}
        {fieldError && <p className="text-xs text-red-500">{fieldError}</p>}
      </div>

      <TermsBottomSheet
        open={openTerms !== null}
        termsType={openTerms ?? 'service'}
        onClose={() => setOpenTerms(null)}
      />
    </>
  );
};
