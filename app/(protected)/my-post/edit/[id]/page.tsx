'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUserStore } from '@/store/useUserStore';
import Hero from '@/app/components/Hero';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion';
import { CheckCircle2, Circle, Clipboard, FileText } from 'lucide-react';
import { useEditPost } from '../../hooks/useEditPost';
import { BasicInfoCard } from '../../components/organisms/BasicInfoCard';
import { ManagerInfoCard } from '../../components/organisms/ManagerInfoCard';
import { AdditionalInfoCard } from '../../components/organisms/AdditionalInfoCard';
import { AccessGuard } from '../../components/molecules/AccessGuard';
import { FormStatusMessage } from '../../components/molecules/FormStatusMessage';
import { FormActionBar } from '../../components/molecules/FormActionBar';
import { WorkSlotsCard } from '../../create/components/organisms/WorkSlotsCard';
import { PasteModal } from '../../create/components/organisms/PasteModal';
import { ExtractModal } from '../../create/components/organisms/ExtractModal';

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const role = useUserStore((state) => state.role);
  const roleHydrated = useUserStore((state) => state.roleHydrated);
  const isManager = role === 'manager';

  const {
    state,
    isPending,
    loading,
    title,
    setTitle,
    description,
    setDescription,
    workParts,
    managerName,
    setManagerName,
    managerContactType,
    setManagerContactType,
    managerPhone,
    setManagerPhone,
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
    status,
    setStatus,
    showPasteModal,
    setShowPasteModal,
    pasteText,
    setPasteText,
    showExtractModal,
    setShowExtractModal,
    extractedText,
    openSections,
    setOpenSections,
    pasteHighlights,
    handleAddPart,
    handleRemovePart,
    handleUpdatePart,
    handleAddShift,
    handleRemoveShift,
    handleUpdateShift,
    handleToggleShiftMode,
    handleUpdatePartTime,
    handleAddKeyword,
    handleRemoveKeyword,
    handlePasteAndParse,
    handleExtract,
    handleSubmit,
  } = useEditPost(postId, isManager);

  const sectionDone = useMemo(() => ({
    'basic-info':
      title.trim() !== '' &&
      keywords.length > 0 &&
      description.trim() !== '',
    'work-info':
      workParts.length > 0 &&
      workParts.every(
        (p) =>
          p.location.trim() !== '' &&
          p.pay_amount > 0 &&
          p.shifts.length > 0 &&
          p.shifts.every((s) =>
            s.date_end === undefined
              ? s.date !== ''
              : s.date !== '' && s.date_end !== '',
          ),
      ),
    'manager-info':
      managerName.trim() !== '' && managerPhone.trim() !== '',
  }), [title, keywords, description, workParts, managerName, managerPhone]);

  const setSectionAccordion = (sectionId: string, value: string | undefined) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (value === sectionId) next.add(sectionId);
      else next.delete(sectionId);
      return Array.from(next);
    });
  };

  const sectionProgress = useMemo(() => {
    const basicFilled =
      (title.trim() !== '' ? 1 : 0) +
      (keywords.length > 0 ? 1 : 0) +
      (description.trim() !== '' ? 1 : 0);

    let workTotal = 0;
    let workFilled = 0;
    for (const part of workParts) {
      workTotal += 3;
      if (part.location.trim() !== '') workFilled++;
      if (part.pay_amount > 0) workFilled++;
      const sharedTime = part.shifts[0];
      if (sharedTime?.start && sharedTime?.end) workFilled++;
      for (const shift of part.shifts) {
        workTotal += 1;
        const dateOk = shift.date_end === undefined
          ? shift.date !== ''
          : shift.date !== '' && shift.date_end !== '';
        if (dateOk) workFilled++;
      }
    }

    const managerFilled =
      (managerName.trim() !== '' ? 1 : 0) +
      (managerPhone.trim() !== '' ? 1 : 0);

    return {
      basic:   { filled: basicFilled,   total: 3 },
      work:    { filled: workFilled,     total: workTotal },
      manager: { filled: managerFilled,  total: 2 },
    };
  }, [title, keywords, description, workParts, managerName, managerPhone]);

  return (
    <AccessGuard title="공고 수정" roleHydrated={roleHydrated} isManager={isManager} loading={loading}>
      <div>
        <Hero title="공고 수정" description="공고 정보를 수정하세요" />

        <div className="mb-4 flex gap-2 justify-end items-center">
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={handleExtract}
          >
            <FileText className="size-3" />
            추출하기
          </Button>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => setShowPasteModal(true)}
          >
            <Clipboard className="size-3" />
            붙여넣기
          </Button>
        </div>

        <ExtractModal
          open={showExtractModal}
          onOpenChange={setShowExtractModal}
          extractedText={extractedText}
        />

        <PasteModal
          open={showPasteModal}
          onOpenChange={setShowPasteModal}
          pasteText={pasteText}
          onPasteTextChange={setPasteText}
          onApply={handlePasteAndParse}
        />

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="border rounded-none bg-card overflow-hidden">
            <Accordion
              type="single"
              collapsible
              value={openSections.includes('basic-info') ? 'basic-info' : undefined}
              onValueChange={(v) => setSectionAccordion('basic-info', v)}
            >
              <AccordionItem value="basic-info" className="border-0">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-base font-semibold">
                        기본 정보
                        {sectionDone['basic-info']
                          ? <CheckCircle2 className="size-4 text-green-500" />
                          : <Circle className="size-4 text-muted-foreground/40" />}
                      </span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {sectionProgress.basic.filled} / {sectionProgress.basic.total}
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${(sectionProgress.basic.filled / sectionProgress.basic.total) * 100}%` }}
                      />
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <BasicInfoCard
                    title={title}
                    setTitle={setTitle}
                    description={description}
                    setDescription={setDescription}
                    keywords={keywords}
                    newKeyword={newKeyword}
                    setNewKeyword={setNewKeyword}
                    handleAddKeyword={handleAddKeyword}
                    handleRemoveKeyword={handleRemoveKeyword}
                    fieldErrors={state.fieldErrors}
                    descriptionRows={10}
                    showTitleHint
                    pasteHighlights={pasteHighlights}
                    plainSection
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="border rounded-none bg-card overflow-hidden">
            <Accordion
              type="single"
              collapsible
              value={openSections.includes('work-info') ? 'work-info' : undefined}
              onValueChange={(v) => setSectionAccordion('work-info', v)}
            >
              <AccordionItem value="work-info" className="border-0">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-base font-semibold">
                        근무 정보
                        {sectionDone['work-info']
                          ? <CheckCircle2 className="size-4 text-green-500" />
                          : <Circle className="size-4 text-muted-foreground/40" />}
                      </span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {sectionProgress.work.filled} / {sectionProgress.work.total}
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{ width: sectionProgress.work.total > 0 ? `${(sectionProgress.work.filled / sectionProgress.work.total) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-0">
                  <WorkSlotsCard
                    workParts={workParts}
                    fieldErrors={state.fieldErrors}
                    pasteHighlights={pasteHighlights}
                    plainSection
                    onAddPart={handleAddPart}
                    onRemovePart={handleRemovePart}
                    onUpdatePart={handleUpdatePart}
                    onAddShift={handleAddShift}
                    onRemoveShift={handleRemoveShift}
                    onUpdateShift={handleUpdateShift}
                    onToggleShiftMode={handleToggleShiftMode}
                    onUpdatePartTime={handleUpdatePartTime}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="border rounded-none bg-card overflow-hidden">
            <Accordion
              type="single"
              collapsible
              value={openSections.includes('manager-info') ? 'manager-info' : undefined}
              onValueChange={(v) => setSectionAccordion('manager-info', v)}
            >
              <AccordionItem value="manager-info" className="border-0">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-base font-semibold">
                        담당자 정보
                        {sectionDone['manager-info']
                          ? <CheckCircle2 className="size-4 text-green-500" />
                          : <Circle className="size-4 text-muted-foreground/40" />}
                      </span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {sectionProgress.manager.filled} / {sectionProgress.manager.total}
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${(sectionProgress.manager.filled / sectionProgress.manager.total) * 100}%` }}
                      />
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ManagerInfoCard
                    managerName={managerName}
                    setManagerName={setManagerName}
                    managerContactType={managerContactType}
                    setManagerContactType={setManagerContactType}
                    managerPhone={managerPhone}
                    setManagerPhone={setManagerPhone}
                    plainSection
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="border rounded-none bg-card overflow-hidden">
            <Accordion
              type="single"
              collapsible
              value={openSections.includes('additional-info') ? 'additional-info' : undefined}
              onValueChange={(v) => setSectionAccordion('additional-info', v)}
            >
              <AccordionItem value="additional-info" className="border-0">
                <AccordionTrigger className="px-4 py-3 text-base font-semibold hover:no-underline">
                  추가 정보
                </AccordionTrigger>
                <AccordionContent>
                  <AdditionalInfoCard
                    equipments={equipments}
                    setEquipments={setEquipments}
                    qualifications={qualifications}
                    setQualifications={setQualifications}
                    preferences={preferences}
                    setPreferences={setPreferences}
                    notes={notes}
                    setNotes={setNotes}
                    externalLink={externalLink}
                    setExternalLink={setExternalLink}
                    status={status}
                    setStatus={setStatus}
                    pasteHighlights={pasteHighlights}
                    plainSection
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <FormStatusMessage message={state.message} ok={state.ok} />

          <FormActionBar
            isPending={isPending}
            submitLabel="수정하기"
            pendingLabel="수정 중..."
            onCancel={() => router.back()}
          />
        </form>
      </div>
    </AccessGuard>
  );
}
