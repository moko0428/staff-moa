'use client';

import { useEffect, useMemo, useState } from 'react';
import { mockApplications, mockPosts } from '@/lib/mockData';
import { User } from '@/types/mockData';
import { parseDateString } from '@/lib/dateUtils';
import { createClient } from '@/utils/supabase/client';
import { useUpload } from '@/hooks/useUpload';
import { useUserStore } from '@/store/useUserStore';

export const useProfile = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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

        const profile: User = {
          id: data.user.id,
          email: data.user.email ?? '',
          name: meta.name || data.user.email || '사용자',
          role: (meta.role as User['role']) ?? 'member',
          photo: meta.photo,
          attendanceScore: meta.attendanceScore ?? 50,
          createdAt: data.user.created_at ?? new Date().toISOString(),
          introduction: meta.introduction,
          phone: meta.phone,
          kakaoId: meta.kakaoId,
          mbti: meta.mbti,
          gender: meta.gender as User['gender'],
          birthDate: meta.birthDate,
          age: meta.age,
          personality: meta.personality,
          features: meta.features,
          experiences: meta.experiences ?? [],
          height: meta.height,
          weight: meta.weight,
          companyName: meta.companyName,
          businessNumber: meta.businessNumber,
          companyCertificate: meta.companyCertificate,
          companyVerifyStatus: meta.companyVerifyStatus ?? 'pending',
          documents: meta.documents ?? {},
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
  }, [supabase]);

  const savePartialData = async (
    data: Record<string, unknown>,
    successMessage?: string
  ) => {
    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ data });
      if (error) {
        console.error('자동 저장 실패:', error);
        alert('자동 저장에 실패했습니다.');
        return false;
      }
      if (successMessage) alert(successMessage);
      return true;
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
      const payload = {
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

      const { error } = await supabase.auth.updateUser({
        data: payload,
      });

      if (error) {
        alert('프로필 저장에 실패했습니다.');
        return;
      }

      alert('프로필이 저장되었습니다.');
      setIsEditing(false);
    } catch {
      alert('프로필 저장에 실패했습니다.');
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
      const acceptedApplications = mockApplications.filter(
        (app) => app.applicantId === currentUser.id && app.status === 'accepted'
      );

      const now = new Date();
      const newExperiences: Array<{
        title: string;
        date: string;
        location: string;
      }> = [];

      acceptedApplications.forEach((app) => {
        const post = mockPosts.find((p) => p.id === app.postId);
        if (!post) return;

        const dates = parseDateString(post.date);

        dates.forEach((dateStr) => {
          const scheduleDate = new Date(dateStr);
          const [startTime] = post.time.split('~');
          const scheduleDateTime = new Date(scheduleDate);
          const [hours, minutes] = startTime.trim().split(':');
          scheduleDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

          if (scheduleDateTime < now) {
            newExperiences.push({
              title: post.title,
              date: dateStr,
              location: post.location,
            });
          }
        });
      });

      const uniqueExperiences = newExperiences
        .filter(
          (exp, index, self) =>
            index ===
            self.findIndex((e) => e.title === exp.title && e.date === exp.date)
        )
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

      const currentExperiences = currentUser.experiences || [];
      const existingKeys = new Set(
        currentExperiences.map((e) => `${e.title}-${e.date}`)
      );
      const filtered = uniqueExperiences.filter(
        (e) => !existingKeys.has(`${e.title}-${e.date}`)
      );
      const combined = [...currentExperiences, ...filtered];

      setCurrentUser({
        ...currentUser,
        experiences: combined,
      });

      await savePartialData({ experiences: combined });
      alert(`${filtered.length}개의 경력이 추가되었습니다.`);
    } catch (error) {
      console.error('Failed to load experiences:', error);
      alert('경력 불러오기에 실패했습니다.');
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
        role: currentUser.role,
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
      alert('프로필 이미지 업로드에 실패했습니다.');
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

  return {
    supabase,
    currentUser,
    setCurrentUser,
    isEditing,
    setIsEditing,
    isLoadingUser,
    isSaving,
    isUploadingPhoto,
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
  };
};
