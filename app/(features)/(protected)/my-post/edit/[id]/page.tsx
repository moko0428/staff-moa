'use client';

import { useParams, useRouter } from 'next/navigation';
import { useUserStore } from '@/store/useUserStore';
import Hero from '@/app/components/Hero';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useEditPost } from '../../hooks/useEditPost';
import { BasicInfoCard } from '../../components/organisms/BasicInfoCard';
import { ManagerInfoCard } from '../../components/organisms/ManagerInfoCard';
import { AdditionalInfoCard } from '../../components/organisms/AdditionalInfoCard';
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

  if (!roleHydrated) {
    return (
      <div className="space-y-4">
        <Hero title="공고 수정" description="매니저 전용 페이지" />
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            역할 정보를 불러오는 중입니다...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isManager) {
    return (
      <div className="space-y-4">
        <Hero title="공고 수정" description="매니저 전용 페이지" />
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            관리자 승인이 필요한 매니저 전용 페이지입니다.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Hero title="공고 수정" description="공고를 불러오는 중..." />
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="size-6 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              공고를 불러오는 중...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
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

        {state.message && (
          <div
            className={`p-3 rounded-md ${
              state.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {state.message}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            취소
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                수정 중...
              </>
            ) : (
              '수정하기'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
