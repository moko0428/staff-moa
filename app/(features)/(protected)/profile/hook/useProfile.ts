'use client';

import { useEffect, useMemo, useState } from 'react';
import { User } from '@/types/mockData';
import { createClient } from '@/utils/supabase/client';
import { useUpload } from '@/hooks/useUpload';
import { useUserStore } from '@/store/useUserStore';
import { importExperiencesAction } from '@/app/(features)/(protected)/worker/schedule/actions';
import { toast } from 'sonner';

type ExperienceItem = User['experiences'] extends Array<infer E> ? E : never;

export const useProfile = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isReRequesting, setIsReRequesting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [newLanguage, setNewLanguage] = useState('');
  const [newCertificate, setNewCertificate] = useState('');
  const [newDocumentLabel, setNewDocumentLabel] = useState('');
  const [newExperience, setNewExperience] = useState({
    title: '',
    date: '',
    location: '',
  });
  const [showCertificateInput, setShowCertificateInput] = useState(false);
  const [showLanguageInput, setShowLanguageInput] = useState(false);
  const [showDocumentInput, setShowDocumentInput] = useState(false);
  const [showExperienceInput, setShowExperienceInput] = useState(false);
  const [isLoadingExperiences, setIsLoadingExperiences] = useState(false);

  const supabase = useMemo(() => createClient(), []);
  const { uploadProfileImage, removeProfileImage } = useUpload();
  const setRole = useUserStore((state) => state.setRole);

  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) {
          setCurrentUser(null);
          setRole(null);
          return;
        }

        const meta = (data.user.user_metadata ?? {}) as Partial<User>;

        // 프로필 테이블 우선 읽기 (role/company_verify_status 등 신뢰)
        const { data: profileRow } = await supabase
          .from('profiles')
          .select(
            '*'
          )
          .eq('user_id', data.user.id)
          .maybeSingle();

        // Supabase jsonb → 타입 안전한 경력 배열로 변환
        const normalizeExperiences = (
          value: unknown
        ): User['experiences'] | undefined => {
          if (!value) return undefined;
          if (!Array.isArray(value)) return undefined;

          const typed = value.filter(
            (item): item is ExperienceItem =>
              typeof item === 'object' &&
              item !== null &&
              typeof (item as { title?: unknown }).title === 'string' &&
              typeof (item as { date?: unknown }).date === 'string' &&
              typeof (item as { location?: unknown }).location === 'string'
          );

          return typed.length ? typed : undefined;
        };

        const profileExperiences = normalizeExperiences(
          profileRow?.experiences as unknown
        );
        const metaExperiences = normalizeExperiences(
          (meta as Partial<User>).experiences
        );

        const profile: User = {
          id: data.user.id,
          email: data.user.email ?? '',
          name: profileRow?.name || meta.name || data.user.email || '사용자',
          role:
            (profileRow?.role as User['role'] | undefined) ??
            (meta.role as User['role'] | undefined) ??
            'member',
          photo: profileRow?.avatar ?? meta.photo,
          attendanceScore:
            profileRow?.attendance_score ?? meta.attendanceScore ?? 50,
          createdAt: data.user.created_at ?? new Date().toISOString(),
          introduction: profileRow?.bio ?? meta.introduction,
          phone: profileRow?.phone ?? meta.phone,
          kakaoId: profileRow?.kakao_id ?? meta.kakaoId,
          mbti: profileRow?.mbti ?? meta.mbti,
          gender:
            (profileRow?.gender as User['gender']) ??
            (meta.gender as User['gender']),
          birthDate: profileRow?.birth_date ?? meta.birthDate,
          age: meta.age,
          personality: profileRow?.personality ?? meta.personality,
          features: profileRow?.features ?? meta.features,
          experiences: profileExperiences ?? metaExperiences ?? [],
          height: profileRow?.height ?? meta.height,
          weight: profileRow?.weight ?? meta.weight,
          companyName: profileRow?.company_name ?? meta.companyName,
          businessNumber: profileRow?.business_number ?? meta.businessNumber,
          companyCertificate:
            profileRow?.company_certificate ?? meta.companyCertificate,
          companyVerifyStatus:
            (profileRow?.company_verify_status as User['companyVerifyStatus']) ??
            meta.companyVerifyStatus ??
            'pending',
          documents:
            (profileRow?.documents as User['documents']) ??
            meta.documents ??
            {},
        };

        setCurrentUser(profile);
        setRole(profile.role);
      } catch {
        setCurrentUser(null);
        setRole(null);
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUser();
  }, [supabase, setRole]);

  const savePartialData = async (
    data: Record<string, unknown>,
    successMessage?: string
  ) => {
    if (!currentUser) return false;
    setIsSaving(true);
    try {
      // profiles 테이블 업데이트를 위한 컬럼 매핑
      const profileData: Record<string, unknown> = {};

      // 필드 매핑 (camelCase -> snake_case)
      if (data.photo !== undefined) profileData.avatar = data.photo;
      if (data.introduction !== undefined) profileData.bio = data.introduction;
      if (data.kakaoId !== undefined) profileData.kakao_id = data.kakaoId;
      if (data.birthDate !== undefined) profileData.birth_date = data.birthDate;
      if (data.companyName !== undefined) profileData.company_name = data.companyName;
      if (data.businessNumber !== undefined) profileData.business_number = data.businessNumber;
      if (data.companyCertificate !== undefined) profileData.company_certificate = data.companyCertificate;
      if (data.companyVerifyStatus !== undefined) profileData.company_verify_status = data.companyVerifyStatus;

      // 직접 매핑되는 필드들
      const directFields = ['name', 'email', 'phone', 'mbti', 'gender', 'height', 'weight', 'personality', 'features', 'documents', 'experiences'];
      directFields.forEach(field => {
        if (data[field] !== undefined) {
          profileData[field] = data[field];
        }
      });

      // profiles 테이블 업데이트
      if (Object.keys(profileData).length > 0) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('user_id', currentUser.id);

        if (profileError) {
          console.error('프로필 저장 실패:', profileError);
          toast.error('저장에 실패했습니다.');
          return false;
        }
      }

      // user_metadata도 동기화 (best-effort)
      const { error: metadataError } = await supabase.auth.updateUser({ data });
      if (metadataError) {
        console.error('메타데이터 동기화 경고:', metadataError);
        // metadata 실패는 무시 (profiles가 single source of truth)
      }

      if (successMessage) toast.success(successMessage);
      return true;
    } catch (err) {
      console.error('저장 중 오류:', err);
      toast.error('저장에 실패했습니다.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompanyCertUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;
    setCurrentUser({
      ...currentUser,
      companyCertificate: file.name,
    });
  };

  const handleBirthDateChange = (birthDate: string) => {
    if (!currentUser) return;
    const age = calculateAge(birthDate);
    setCurrentUser({
      ...currentUser,
      birthDate,
      age,
    });
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    setIsSaving(true);
    try {
      // profiles 테이블에 저장 (single source of truth)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: currentUser.name,
          email: currentUser.email,
          phone: currentUser.phone ?? null,
          kakao_id: currentUser.kakaoId ?? null,
          mbti: currentUser.mbti ?? null,
          birth_date: currentUser.birthDate ?? null,
          gender: currentUser.gender ?? null,
          height: currentUser.height ?? null,
          weight: currentUser.weight ?? null,
          bio: currentUser.introduction ?? null,
          company_name: currentUser.companyName ?? null,
          business_number: currentUser.businessNumber ?? null,
          company_certificate: currentUser.companyCertificate ?? null,
          company_verify_status: currentUser.companyVerifyStatus ?? 'pending',
          personality: currentUser.personality ?? null,
          features: currentUser.features ?? null,
          documents: currentUser.documents ?? {},
          experiences: currentUser.experiences ?? [],
        })
        .eq('user_id', currentUser.id);

      if (profileError) {
        console.error('프로필 저장 실패:', profileError);
        toast.error('프로필 저장에 실패했습니다.');
        return;
      }

      // user_metadata도 동기화 (best-effort)
      const metadataPayload = {
        name: currentUser.name,
        phone: currentUser.phone ?? '',
        kakaoId: currentUser.kakaoId ?? '',
        mbti: currentUser.mbti ?? '',
        birthDate: currentUser.birthDate ?? '',
        age: currentUser.age ?? null,
        gender: currentUser.gender ?? '',
        height: currentUser.height ?? null,
        weight: currentUser.weight ?? null,
        introduction: currentUser.introduction ?? '',
        companyName: currentUser.companyName ?? '',
        businessNumber: currentUser.businessNumber ?? '',
        companyCertificate: currentUser.companyCertificate ?? '',
        companyVerifyStatus: currentUser.companyVerifyStatus ?? 'pending',
        role: currentUser.role,
        attendanceScore: currentUser.attendanceScore ?? 50,
        photo: currentUser.photo ?? '',
        personality: currentUser.personality ?? '',
        features: currentUser.features ?? '',
        documents: currentUser.documents ?? {},
        experiences: currentUser.experiences ?? [],
      };

      await supabase.auth.updateUser({
        data: metadataPayload,
      });

      toast.success('프로필이 저장되었습니다.');
      setIsEditing(false);
    } catch (err) {
      console.error('프로필 저장 중 오류:', err);
      toast.error('프로필 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (
    field: keyof User,
    value: string | number | undefined
  ) => {
    if (!currentUser) return;
    setCurrentUser({
      ...currentUser,
      [field]: value,
    });
  };

  const addLanguage = async () => {
    if (!newLanguage.trim() || !currentUser) return;

    const currentLanguages = currentUser.documents?.language || [];
    const updatedLanguages = [...currentLanguages, newLanguage.trim()];
    setCurrentUser({
      ...currentUser,
      documents: {
        ...currentUser.documents,
        language: updatedLanguages,
      },
    });
    setNewLanguage('');
    await savePartialData({
      documents: {
        ...currentUser.documents,
        language: updatedLanguages,
      },
    });
  };

  const removeLanguage = async (index: number) => {
    if (!currentUser) return;
    const currentLanguages = currentUser.documents?.language || [];
    const updatedLanguages = currentLanguages.filter((_, i) => i !== index);
    setCurrentUser({
      ...currentUser,
      documents: {
        ...currentUser.documents,
        language: updatedLanguages,
      },
    });
    await savePartialData({
      documents: {
        ...currentUser.documents,
        language: updatedLanguages,
      },
    });
  };

  const addCertificate = async () => {
    if (!newCertificate.trim() || !currentUser) return;

    const currentCertificates = currentUser.documents?.certificates || [];
    const updatedCertificates = [...currentCertificates, newCertificate.trim()];
    setCurrentUser({
      ...currentUser,
      documents: {
        ...currentUser.documents,
        certificates: updatedCertificates,
      },
    });
    setNewCertificate('');
    await savePartialData({
      documents: {
        ...currentUser.documents,
        certificates: updatedCertificates,
      },
    });
  };

  const removeCertificate = async (index: number) => {
    if (!currentUser) return;
    const currentCertificates = currentUser.documents?.certificates || [];
    const updatedCertificates = currentCertificates.filter(
      (_, i) => i !== index
    );
    setCurrentUser({
      ...currentUser,
      documents: {
        ...currentUser.documents,
        certificates: updatedCertificates,
      },
    });
    await savePartialData({
      documents: {
        ...currentUser.documents,
        certificates: updatedCertificates,
      },
    });
  };

  const addDocumentItem = async () => {
    if (!newDocumentLabel.trim() || !currentUser) return;
    const currentExtra = currentUser.documents?.extraDocuments ?? [];
    const updated = [...currentExtra, newDocumentLabel.trim()];
    setCurrentUser({
      ...currentUser,
      documents: {
        ...currentUser.documents,
        extraDocuments: updated,
      },
    });
    setNewDocumentLabel('');
    await savePartialData({
      documents: {
        ...currentUser.documents,
        extraDocuments: updated,
      },
    });
  };

  const removeDocumentItem = async (index: number) => {
    if (!currentUser) return;
    const currentExtra = currentUser.documents?.extraDocuments ?? [];
    const updated = currentExtra.filter((_, i) => i !== index);
    setCurrentUser({
      ...currentUser,
      documents: {
        ...currentUser.documents,
        extraDocuments: updated,
      },
    });
    await savePartialData({
      documents: {
        ...currentUser.documents,
        extraDocuments: updated,
      },
    });
  };

  const addExperienceManual = async () => {
    if (
      !currentUser ||
      !newExperience.title.trim() ||
      !newExperience.date.trim() ||
      !newExperience.location.trim()
    )
      return;

    const currentExperiences = currentUser.experiences || [];
    const updatedExperiences = [
      ...currentExperiences,
      {
        title: newExperience.title.trim(),
        date: newExperience.date.trim(),
        location: newExperience.location.trim(),
      },
    ];

    setCurrentUser({
      ...currentUser,
      experiences: updatedExperiences,
    });
    setNewExperience({ title: '', date: '', location: '' });
    setShowExperienceInput(false);
    await savePartialData({ experiences: updatedExperiences });
  };

  const removeExperience = async (index: number) => {
    if (!currentUser || !currentUser.experiences) return;

    const updatedExperiences = currentUser.experiences.filter(
      (_, i) => i !== index
    );
    setCurrentUser({
      ...currentUser,
      experiences: updatedExperiences,
    });
    await savePartialData({ experiences: updatedExperiences });
  };

  const loadExperiencesFromSchedules = async () => {
    if (!currentUser) return;

    setIsLoadingExperiences(true);

    try {
      // 서버 액션 호출
      const result = await importExperiencesAction();

      if (result.ok) {
        // 프로필 데이터 다시 불러오기
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', data.user.id)
            .single();

          if (profile) {
            setCurrentUser({
              ...currentUser,
              experiences: (profile.experiences as User['experiences']) || [],
            });
          }
        }
        toast.success(result.message);
      } else {
        toast.error(result.message || '경력 불러오기에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to load experiences:', error);
      toast.error('경력 불러오기 중 오류가 발생했습니다.');
    } finally {
      setIsLoadingExperiences(false);
    }
  };

  const handleProfileImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    setIsUploadingPhoto(true);
    try {
      const publicUrl = await uploadProfileImage({
        file,
        role: currentUser.role as 'member' | 'pending_manager' | 'manager' | 'admin' | 'rejected_manager',
        userId: currentUser.id,
        prevUrl: currentUser.photo,
      });
      setCurrentUser({
        ...currentUser,
        photo: publicUrl,
      });
      await savePartialData({ photo: publicUrl });
    } catch (err) {
      console.error(err);
      toast.error('프로필 이미지 업로드에 실패했습니다.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemoveProfileImage = async () => {
    if (!currentUser || !currentUser.photo) return;
    setIsUploadingPhoto(true);
    try {
      await removeProfileImage(currentUser.photo);
      setCurrentUser({ ...currentUser, photo: undefined });
      await savePartialData({ photo: null });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleReRequestManagerApproval = async () => {
    if (!currentUser) return;
    setIsReRequesting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          company_verify_status: 'pending',
          role: 'pending_manager',
        })
        .eq('user_id', currentUser.id);
      if (error) throw error;

      setCurrentUser({
        ...currentUser,
        companyVerifyStatus: 'pending',
        role: 'pending_manager',
      });
      setRole('pending_manager');
      toast.success('재요청이 접수되었습니다. 승인 대기 목록에 반영됩니다.');
    } catch (err) {
      console.error('재요청 실패', err);
      toast.error('재요청에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsReRequesting(false);
    }
  };

  return {
    supabase,
    currentUser,
    setCurrentUser,
    isEditing,
    setIsEditing,
    isLoadingUser,
    isSaving,
    isUploadingPhoto,
    isReRequesting,
    newLanguage,
    setNewLanguage,
    newCertificate,
    setNewCertificate,
    newDocumentLabel,
    setNewDocumentLabel,
    newExperience,
    setNewExperience,
    showCertificateInput,
    setShowCertificateInput,
    showLanguageInput,
    setShowLanguageInput,
    showDocumentInput,
    setShowDocumentInput,
    showExperienceInput,
    setShowExperienceInput,
    isLoadingExperiences,
    handleBirthDateChange,
    handleSaveProfile,
    handleInputChange,
    addLanguage,
    removeLanguage,
    addCertificate,
    removeCertificate,
    addDocumentItem,
    removeDocumentItem,
    addExperienceManual,
    removeExperience,
    loadExperiencesFromSchedules,
    handleCompanyCertUpload,
    handleProfileImageUpload,
    handleRemoveProfileImage,
    handleReRequestManagerApproval,
  };
};
