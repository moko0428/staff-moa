'use client';

import { useParams, useRouter } from 'next/navigation';
import { useUserStore } from '@/store/useUserStore';
import Hero from '@/app/components/Hero';
import { Button } from '@/app/components/ui/button';
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
    formType,
    setFormType,
    title,
    setTitle,
    description,
    setDescription,
    workSlots,
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
    handleAddWorkSlot,
    handleRemoveWorkSlot,
    handleWorkSlotChange,
    handleAddKeyword,
    handleRemoveKeyword,
    handleSubmit,
  } = useEditPost(postId, isManager);

  return (
    <AccessGuard title="공고 수정" roleHydrated={roleHydrated} isManager={isManager} loading={loading}>
      <div>
        <Hero title="공고 수정" description="공고 정보를 수정하세요" />

        <div className="mb-4 flex gap-2">
          <Button
            type="button"
            variant={formType === 'basic' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFormType('basic')}
          >
            기본 양식
          </Button>
          <Button
            type="button"
            variant={formType === 'free' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFormType('free')}
          >
            자유 양식
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <BasicInfoCard
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            recruitCount={recruitCount}
            setRecruitCount={setRecruitCount}
            fieldErrors={state.fieldErrors}
          />

          <EditWorkSlotsCard
            workSlots={workSlots}
            fieldErrors={state.fieldErrors}
            onAddWorkSlot={handleAddWorkSlot}
            onRemoveWorkSlot={handleRemoveWorkSlot}
            onWorkSlotChange={handleWorkSlotChange}
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
            submitLabel="수정하기"
            pendingLabel="수정 중..."
            onCancel={() => router.back()}
          />
        </form>
      </div>
    </AccessGuard>
  );
}
