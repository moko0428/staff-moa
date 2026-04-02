'use client';

import { useParams, useRouter } from 'next/navigation';
import { useUserStore } from '@/store/useUserStore';
import Hero from '@/app/components/Hero';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion';
import { useEditPost } from '../../hooks/useEditPost';
import { BasicInfoCard } from '../../components/organisms/BasicInfoCard';
import { ManagerInfoCard } from '../../components/organisms/ManagerInfoCard';
import { AdditionalInfoCard } from '../../components/organisms/AdditionalInfoCard';
import { AccessGuard } from '../../components/molecules/AccessGuard';
import { FormStatusMessage } from '../../components/molecules/FormStatusMessage';
import { FormActionBar } from '../../components/molecules/FormActionBar';
import { EditWorkSlotsCard } from '../components/organisms/EditWorkSlotsCard';

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
    workSlots,
    genderType,
    setGenderType,
    recruitCount,
    setRecruitCount,
    recruitMale,
    setRecruitMale,
    recruitFemale,
    setRecruitFemale,
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
    handleAddWorkSlot,
    handleRemoveWorkSlot,
    handleWorkSlotChange,
    handleAddPart,
    handleRemovePart,
    handleUpdatePart,
    handleAddKeyword,
    handleRemoveKeyword,
    handleSubmit,
  } = useEditPost(postId, isManager);

  return (
    <AccessGuard title="공고 수정" roleHydrated={roleHydrated} isManager={isManager} loading={loading}>
      <div>
        <Hero title="공고 수정" description="공고 정보를 수정하세요" />

        <form onSubmit={handleSubmit} className="space-y-2 mt-4">
          <Accordion
            type="multiple"
            defaultValue={['basic-info', 'work-info', 'manager-info', 'additional-info']}
            className="border rounded-lg bg-card divide-y"
          >
            {/* 기본 정보 */}
            <AccordionItem value="basic-info" className="border-0">
              <AccordionTrigger className="px-4 py-3 text-base font-semibold hover:no-underline">
                기본 정보
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <BasicInfoCard
                  title={title}
                  setTitle={setTitle}
                  description={description}
                  setDescription={setDescription}
                  recruitCount={recruitCount}
                  setRecruitCount={setRecruitCount}
                  genderType={genderType}
                  setGenderType={setGenderType}
                  recruitMale={recruitMale}
                  setRecruitMale={setRecruitMale}
                  recruitFemale={recruitFemale}
                  setRecruitFemale={setRecruitFemale}
                  keywords={keywords}
                  newKeyword={newKeyword}
                  setNewKeyword={setNewKeyword}
                  handleAddKeyword={handleAddKeyword}
                  handleRemoveKeyword={handleRemoveKeyword}
                  fieldErrors={state.fieldErrors}
                />
              </AccordionContent>
            </AccordionItem>

            {/* 근무 정보 */}
            <AccordionItem value="work-info" className="border-0">
              <AccordionTrigger className="px-4 py-3 text-base font-semibold hover:no-underline">
                근무 정보
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <EditWorkSlotsCard
                  workSlots={workSlots}
                  fieldErrors={state.fieldErrors}
                  onAddWorkSlot={handleAddWorkSlot}
                  onRemoveWorkSlot={handleRemoveWorkSlot}
                  onWorkSlotChange={handleWorkSlotChange}
                  onAddPart={handleAddPart}
                  onRemovePart={handleRemovePart}
                  onUpdatePart={handleUpdatePart}
                />
              </AccordionContent>
            </AccordionItem>

            {/* 담당자 정보 */}
            <AccordionItem value="manager-info" className="border-0">
              <AccordionTrigger className="px-4 py-3 text-base font-semibold hover:no-underline">
                담당자 정보
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <ManagerInfoCard
                  managerName={managerName}
                  setManagerName={setManagerName}
                  managerContactType={managerContactType}
                  setManagerContactType={setManagerContactType}
                  managerPhone={managerPhone}
                  setManagerPhone={setManagerPhone}
                />
              </AccordionContent>
            </AccordionItem>

            {/* 추가 정보 */}
            <AccordionItem value="additional-info" className="border-0">
              <AccordionTrigger className="px-4 py-3 text-base font-semibold hover:no-underline">
                추가 정보
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
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
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

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
