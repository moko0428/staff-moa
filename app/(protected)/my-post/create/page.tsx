'use client';

import { Suspense } from 'react';
import { useUserStore } from '@/store/useUserStore';
import Hero from '@/app/components/Hero';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Clipboard, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCreatePost } from '../hooks/useCreatePost';
import { BasicInfoCard } from '../components/organisms/BasicInfoCard';
import { ManagerInfoCard } from '../components/organisms/ManagerInfoCard';
import { AdditionalInfoCard } from '../components/organisms/AdditionalInfoCard';
import { AccessGuard } from '../components/molecules/AccessGuard';
import { FormStatusMessage } from '../components/molecules/FormStatusMessage';
import { FormActionBar } from '../components/molecules/FormActionBar';
import { WorkSlotsCard } from './components/organisms/WorkSlotsCard';
import { PasteModal } from './components/organisms/PasteModal';
import { ExtractModal } from './components/organisms/ExtractModal';

function CreatePostContent() {
  const router = useRouter();
  const role = useUserStore((state) => state.role);
  const roleHydrated = useUserStore((state) => state.roleHydrated);
  const isManager = role === 'manager';

  const {
    state,
    formAction,
    isPending,
    isRepostMode,
    title,
    setTitle,
    description,
    setDescription,
    workSlots,
    workType,
    selectedSingleDate,
    selectedRange,
    multiDraftDate,
    setMultiDraftDate,
    multiDraftStart,
    setMultiDraftStart,
    multiDraftEnd,
    setMultiDraftEnd,
    recruitCount,
    setRecruitCount,
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
    switchToSingle,
    switchToRange,
    switchToMulti,
    handleSingleDateSelect,
    handleRangeSelect,
    updateMultiSlotTime,
    upsertMultiSlot,
    removeMultiSlot,
    patchCommonFields,
    handleAddKeyword,
    handleRemoveKeyword,
    handlePasteAndParse,
    handleExtract,
    handleSubmit,
  } = useCreatePost();

  return (
    <AccessGuard
      title={isRepostMode ? '재공고 작성' : '새 공고 작성'}
      roleHydrated={roleHydrated}
      isManager={isManager}
    >
      <div>
        <Hero
          title={isRepostMode ? '재공고 작성' : '새 공고 작성'}
          description={
            isRepostMode
              ? '기존 공고를 기반으로 새 공고를 작성합니다'
              : '새로운 공고를 작성하세요'
          }
        />

        {isRepostMode && (
          <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
            <span className="font-medium">재공고 수정 중</span> - 기존 공고
            내용을 수정하여 새로운 공고로 등록합니다.
          </div>
        )}

        <div className="mb-4 flex gap-2 justify-end items-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExtract}
          >
            <FileText className="size-4 mr-2" />
            추출하기
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPasteModal(true)}
          >
            <Clipboard className="size-4 mr-2" />
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

        <form action={formAction} onSubmit={handleSubmit} className="space-y-6">
          <BasicInfoCard
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            recruitCount={recruitCount}
            setRecruitCount={setRecruitCount}
            fieldErrors={state.fieldErrors}
            descriptionRows={10}
            showTitleHint
          />

          <WorkSlotsCard
            workType={workType}
            workSlots={workSlots}
            selectedSingleDate={selectedSingleDate}
            selectedRange={selectedRange}
            multiDraftDate={multiDraftDate}
            multiDraftStart={multiDraftStart}
            multiDraftEnd={multiDraftEnd}
            fieldErrors={state.fieldErrors}
            onSwitchToSingle={switchToSingle}
            onSwitchToRange={switchToRange}
            onSwitchToMulti={switchToMulti}
            onSingleDateSelect={handleSingleDateSelect}
            onRangeSelect={handleRangeSelect}
            onMultiDraftDateSelect={setMultiDraftDate}
            onMultiDraftStartChange={setMultiDraftStart}
            onMultiDraftEndChange={setMultiDraftEnd}
            onUpsertMultiSlot={upsertMultiSlot}
            onUpdateMultiSlotTime={updateMultiSlotTime}
            onRemoveMultiSlot={removeMultiSlot}
            onPatchCommonFields={patchCommonFields}
          />

          <ManagerInfoCard
            managerName={managerName}
            setManagerName={setManagerName}
            managerContactType={managerContactType}
            setManagerContactType={setManagerContactType}
            managerPhone={managerPhone}
            setManagerPhone={setManagerPhone}
          />

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
            keywords={keywords}
            newKeyword={newKeyword}
            setNewKeyword={setNewKeyword}
            handleAddKeyword={handleAddKeyword}
            handleRemoveKeyword={handleRemoveKeyword}
            status={status}
            setStatus={setStatus}
          />

          <FormStatusMessage message={state.message} ok={state.ok} />

          <FormActionBar
            isPending={isPending}
            submitLabel={isRepostMode ? '재공고 작성하기' : '작성하기'}
            pendingLabel={isRepostMode ? '재공고 작성 중...' : '작성 중...'}
            onCancel={() => router.back()}
          />
        </form>
      </div>
    </AccessGuard>
  );
}

export default function CreatePostPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Hero title="공고 작성" description="공고를 불러오는 중..." />
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              페이지를 불러오는 중입니다...
            </CardContent>
          </Card>
        </div>
      }
    >
      <CreatePostContent />
    </Suspense>
  );
}
