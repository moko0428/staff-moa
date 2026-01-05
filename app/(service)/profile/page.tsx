'use client';

import { useEffect, useMemo, useState } from 'react';
import Hero from '@/components/Hero';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { mockApplications, mockPosts } from '@/lib/mockData';
import { User, UserRole } from '@/types/mockData';
import { parseDateString } from '@/lib/dateUtils';
import {
  User as UserIcon,
  Mail,
  Phone,
  MessageSquare,
  Briefcase,
  Building2,
  Ruler,
  Weight,
  Smile,
  Star,
  Languages,
  Award,
  CreditCard,
  FileCheck,
  Plus,
  X,
  Calendar as CalendarIcon,
  MapPin,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import React from 'react';

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
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
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  // 생년월일로부터 나이 계산
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
          return;
        }

        const meta = (data.user.user_metadata ?? {}) as {
          name?: string;
          role?: 'member' | 'manager' | 'admin';
          introduction?: string;
          phone?: string;
          kakaoId?: string;
          mbti?: string;
          gender?: '남성' | '여성';
          height?: number;
          weight?: number;
          birthDate?: string;
          age?: number;
          photo?: string;
          personality?: string;
          features?: string;
          experiences?: Array<{
            title: string;
            date: string;
            location: string;
          }>;
          documents?: {
            idCard?: string;
            bankbook?: string;
            healthCertificate?: string;
            certificates?: string[];
            language?: string[];
            extraDocuments?: string[];
          };
          companyName?: string;
          businessNumber?: string;
          companyCertificate?: string;
          companyVerifyStatus?: 'pending' | 'approved' | 'rejected';
          attendanceScore?: number;
        };

        const profile: User = {
          id: data.user.id,
          email: data.user.email ?? '',
          name: meta.name || data.user.email || '사용자',
          role: meta.role ?? 'member',
          photo: meta.photo,
          attendanceScore: meta.attendanceScore ?? 50,
          createdAt: data.user.created_at ?? new Date().toISOString(),
          introduction: meta.introduction,
          phone: meta.phone,
          kakaoId: meta.kakaoId,
          mbti: meta.mbti,
          gender: meta.gender,
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
      } catch {
        setCurrentUser(null);
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUser();
  }, [supabase]);

  if (isLoadingUser) {
    return (
      <div>
        <Hero title="프로필" description="내 프로필 정보" />
        <div className="flex justify-center items-center min-h-[400px]">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div>
        <Hero title="프로필" description="내 프로필 정보" />
        <div className="flex flex-col items-center justify-center gap-4 min-h-[400px] text-gray-600">
          <p>로그인이 필요합니다.</p>
          <div className="flex gap-2">
            <Link href="/auth/login" className="text-primary underline">
              로그인
            </Link>
            <span className="text-gray-400">|</span>
            <Link href="/auth/join" className="text-primary underline">
              회원가입
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isMember = currentUser.role === 'member';
  const isManager = currentUser.role === 'manager';
  const isAdmin = currentUser.role === 'admin';

  // 필수 정보 누락 여부 확인
  const requiredFields: Array<[string, unknown]> = [];

  if (isMember) {
    requiredFields.push(
      ['전화번호', currentUser.phone],
      ['성별', currentUser.gender],
      ['자기소개', currentUser.introduction],
      ['생년월일', currentUser.birthDate],
      ['키', currentUser.height],
      ['몸무게', currentUser.weight],
      ['신분증 사본', currentUser.documents?.idCard],
      ['통장 사본', currentUser.documents?.bankbook],
      ['보건증', currentUser.documents?.healthCertificate]
    );
  }

  if (isManager) {
    requiredFields.push(
      ['전화번호', currentUser.phone],
      ['회사명', currentUser.companyName],
      ['사업자등록번호', currentUser.businessNumber],
      ['기업인증 파일', currentUser.companyCertificate]
    );
  }

  const missingFields = requiredFields
    .filter(
      ([, value]) => value === undefined || value === null || value === ''
    )
    .map(([label]) => label);

  const avatarSrc = currentUser.photo ?? null;

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

  // 회사 인증 파일 업로드 핸들러
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

  // 생년월일 변경 핸들러
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
      };

      const { error } = await supabase.auth.updateUser({
        // 이메일 변경까지 포함하면 추가 인증 절차가 필요하므로 제외
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

  // 입력 필드 변경 핸들러
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

  // 언어 추가 함수
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

  // 언어 삭제 함수
  const removeLanguage = async (index: number) => {
    if (!currentUser || !currentUser.documents?.language) return;

    const updatedLanguages = currentUser.documents.language.filter(
      (_, i) => i !== index
    );
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

  // 서류 커스텀 항목 추가/삭제
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

  // 자격증 추가 함수
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

  // 자격증 삭제 함수
  const removeCertificate = async (index: number) => {
    if (!currentUser || !currentUser.documents?.certificates) return;

    const updatedCertificates = currentUser.documents.certificates.filter(
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

  // 경력 직접 추가
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

  // 경력 삭제 함수
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

  // 내 스케줄에서 경력 불러오기
  const loadExperiencesFromSchedules = async () => {
    if (!currentUser) return;

    setIsLoadingExperiences(true);

    try {
      // mockApplications와 mockPosts를 사용하여 완료된 스케줄 가져오기
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

        // parseDateString으로 날짜 파싱
        const dates = parseDateString(post.date);

        dates.forEach((dateStr) => {
          const scheduleDate = new Date(dateStr);
          const [startTime] = post.time.split('~');
          const scheduleDateTime = new Date(scheduleDate);
          const [hours, minutes] = startTime.trim().split(':');
          scheduleDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

          // 완료된 스케줄만 추가
          if (scheduleDateTime < now) {
            newExperiences.push({
              title: post.title,
              date: dateStr,
              location: post.location,
            });
          }
        });
      });

      // 중복 제거 및 날짜순 정렬
      const uniqueExperiences = newExperiences
        .filter(
          (exp, index, self) =>
            index ===
            self.findIndex((e) => e.title === exp.title && e.date === exp.date)
        )
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

      // 기존 경력과 합치기 (중복 제거)
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

  const getBucketInfo = (role: UserRole) => {
    // 단일 버킷(profiles) 내 역할별 폴더 분리
    const bucket = 'profiles';
    const folder = role === 'manager' ? 'manager' : 'member';
    return { bucket, folder };
  };

  const extractBucketPath = (url?: string | null) => {
    if (!url) return null;
    const match = url.match(/\/object\/public\/([^/]+)\/(.+)$/);
    if (!match) return null;
    return { bucket: match[1], path: match[2] };
  };

  const sanitizeFileName = (name: string) => {
    // 한글/공백/특수문자를 모두 안전한 ASCII로 변환
    const base = name
      .normalize('NFKD')
      .replace(/[^\w.-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return base || `file-${Date.now()}`;
  };

  // 프로필 이미지 업로드 핸들러 (스토리지 업로드 & 메타 저장)
  const handleProfileImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const { bucket, folder } = getBucketInfo(currentUser.role);
      const safeName = sanitizeFileName(file.name);
      const filePath = `${folder}/${currentUser.id}/${Date.now()}-${safeName}`;

      // 이전 이미지 삭제
      const prev = extractBucketPath(currentUser.photo);
      if (prev) {
        await supabase.storage.from(prev.bucket).remove([prev.path]);
      }

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { upsert: true });
      if (uploadError) {
        console.error(uploadError);
        alert('프로필 이미지 업로드에 실패했습니다.');
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(filePath);

      setCurrentUser({
        ...currentUser,
        photo: publicUrl,
      });
      await savePartialData({ photo: publicUrl });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemoveProfileImage = async () => {
    if (!currentUser || !currentUser.photo) return;
    setIsUploadingPhoto(true);
    try {
      const prev = extractBucketPath(currentUser.photo);
      if (prev) {
        await supabase.storage.from(prev.bucket).remove([prev.path]);
      }
      setCurrentUser({ ...currentUser, photo: undefined });
      await savePartialData({ photo: null });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  return (
    <div>
      <Hero
        title="프로필"
        description={
          isMember ? '내 프로필 정보를 관리하세요' : '매니저 프로필 정보'
        }
      />

      {!isAdmin &&
        currentUser.role === 'member' &&
        missingFields.length > 0 && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="py-4">
              <div className="flex flex-col gap-2 text-sm text-amber-900">
                <p className="font-semibold">
                  프로필을 모두 채우면 지원 성공 확률이 올라가요.
                </p>
                <p>
                  아직 입력되지 않은 항목: {missingFields.join(', ')}
                  {missingFields.length >= 3 && ' 등'}
                </p>
                <p className="text-xs text-amber-800">
                  기본 정보·증빙 서류를 채워 두면 매칭과 승인 속도가 빨라집니다.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 프로필 카드 */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <Avatar className="w-32 h-32">
                    {avatarSrc ? (
                      <AvatarImage src={avatarSrc} alt={currentUser.name} />
                    ) : null}
                    <AvatarFallback className="text-2xl">
                      {currentUser.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <div className="absolute bottom-0 right-0 flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-full w-10 h-10 p-0"
                        onClick={() =>
                          document
                            .getElementById('profile-image-upload')
                            ?.click()
                        }
                        disabled={isUploadingPhoto}
                      >
                        <Plus className="size-4" />
                      </Button>
                      {currentUser.photo && (
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="rounded-full w-10 h-10 p-0"
                          onClick={handleRemoveProfileImage}
                          disabled={isUploadingPhoto}
                        >
                          <X className="size-4" />
                        </Button>
                      )}
                    </div>
                  )}
                  <input
                    id="profile-image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfileImageUpload}
                  />
                </div>
                <h2 className="text-2xl font-bold mb-2">{currentUser.name}</h2>
                <Badge variant="outline" className="mb-4">
                  {currentUser.role === 'member' && '일반 회원'}
                  {currentUser.role === 'manager' && '매니저'}
                  {currentUser.role === 'admin' && '관리자'}
                </Badge>
                {isMember && (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <Star className="size-5 text-yellow-500 fill-yellow-500" />
                      <span className="text-lg font-semibold">
                        {currentUser.attendanceScore}점
                      </span>
                    </div>
                    <div className="w-full pb-4 flex items-center justify-center">
                      {isEditing ? (
                        <Textarea
                          value={currentUser.introduction}
                          placeholder="자기소개를 입력하세요"
                          rows={3}
                          onChange={(e) =>
                            handleInputChange('introduction', e.target.value)
                          }
                          className="resize-none text-sm"
                        />
                      ) : (
                        <p className="text-sm leading-relaxed">
                          {currentUser.introduction || '-'}
                        </p>
                      )}
                    </div>
                  </>
                )}
                <Button
                  className="w-full"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? '편집 취소' : '프로필 수정'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 매니저 회사 정보 (요약) */}
          {isManager && currentUser.companyName && (
            <Card className="mt-6">
              <CardHeader className="flex items-center justify-between flex-row">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="size-5" />
                  회사 정보
                </CardTitle>
                <Badge
                  variant={
                    currentUser.companyVerifyStatus === 'approved'
                      ? 'default'
                      : currentUser.companyVerifyStatus === 'rejected'
                      ? 'destructive'
                      : 'outline'
                  }
                >
                  {currentUser.companyVerifyStatus === 'approved'
                    ? '인증 완료'
                    : currentUser.companyVerifyStatus === 'rejected'
                    ? '인증 거절'
                    : '인증 처리중'}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{currentUser.companyName}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 상세 정보 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-2 text-gray-500 mb-2">
                    <UserIcon className="size-4" />
                    이름
                  </Label>
                  {isEditing ? (
                    <Input
                      value={currentUser.name}
                      onChange={(e) =>
                        handleInputChange('name', e.target.value)
                      }
                    />
                  ) : (
                    <p className="font-semibold">{currentUser.name}</p>
                  )}
                </div>
                <div>
                  <Label className="flex items-center gap-2 text-gray-500 mb-2">
                    <Mail className="size-4" />
                    이메일
                  </Label>
                  {isEditing ? (
                    <Input
                      value={currentUser.email}
                      type="email"
                      onChange={(e) =>
                        handleInputChange('email', e.target.value)
                      }
                    />
                  ) : (
                    <p className="font-semibold">{currentUser.email}</p>
                  )}
                </div>
                <div>
                  <Label className="flex items-center gap-2 text-gray-500 mb-2">
                    <Phone className="size-4" />
                    전화번호
                  </Label>
                  {isEditing ? (
                    <Input
                      value={currentUser.phone}
                      onChange={(e) =>
                        handleInputChange('phone', e.target.value)
                      }
                    />
                  ) : (
                    <p className="font-semibold">{currentUser.phone}</p>
                  )}
                </div>
                <div>
                  <Label className="flex items-center gap-2 text-gray-500 mb-2">
                    <MessageSquare className="size-4" />
                    카카오톡 ID
                  </Label>
                  {isEditing ? (
                    <Input
                      value={currentUser.kakaoId}
                      onChange={(e) =>
                        handleInputChange('kakaoId', e.target.value)
                      }
                    />
                  ) : (
                    <p className="font-semibold">
                      {currentUser.kakaoId || '-'}
                    </p>
                  )}
                </div>
                {isMember && (
                  <div>
                    <Label className="flex items-center gap-2 text-gray-500 mb-2">
                      MBTI
                    </Label>
                    {isEditing ? (
                      <Input
                        value={currentUser.mbti}
                        onChange={(e) =>
                          handleInputChange('mbti', e.target.value)
                        }
                      />
                    ) : (
                      <p className="font-semibold">{currentUser.mbti || '-'}</p>
                    )}
                  </div>
                )}
              </div>
              {isManager && (
                <p className="text-sm text-gray-500 text-right">
                  프로필을 모두 채우면 기업 신뢰도가 상승해요.
                </p>
              )}
            </CardContent>
          </Card>

          {/* 매니저 회사 정보 */}
          {isManager && (
            <Card>
              <CardHeader className="flex items-center justify-between flex-row">
                <CardTitle>회사 정보</CardTitle>
                <Badge
                  variant={
                    currentUser.companyVerifyStatus === 'approved'
                      ? 'default'
                      : currentUser.companyVerifyStatus === 'rejected'
                      ? 'destructive'
                      : 'outline'
                  }
                >
                  {currentUser.companyVerifyStatus === 'approved'
                    ? '인증 완료'
                    : currentUser.companyVerifyStatus === 'rejected'
                    ? '인증 거절'
                    : '인증 처리중'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-2 text-gray-500 mb-2">
                      <Building2 className="size-4" />
                      회사명
                    </Label>
                    {isEditing ? (
                      <Input
                        value={currentUser.companyName}
                        placeholder="회사명 입력"
                        onChange={(e) =>
                          handleInputChange('companyName', e.target.value)
                        }
                      />
                    ) : (
                      <p className="font-semibold">
                        {currentUser.companyName || '-'}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="flex items-center gap-2 text-gray-500 mb-2">
                      <CreditCard className="size-4" />
                      사업자등록번호
                    </Label>
                    {isEditing ? (
                      <Input
                        value={currentUser.businessNumber}
                        placeholder="'-' 없이 숫자만 입력"
                        onChange={(e) =>
                          handleInputChange('businessNumber', e.target.value)
                        }
                      />
                    ) : (
                      <p className="font-semibold">
                        {currentUser.businessNumber || '-'}
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <Label className="flex items-center gap-2 text-gray-500 mb-2">
                      <FileCheck className="size-4" />
                      기업인증 파일
                    </Label>
                    {isEditing ? (
                      <div className="flex items-center gap-3">
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleCompanyCertUpload}
                        />
                        {currentUser.companyCertificate && (
                          <p className="text-sm text-gray-600">
                            {currentUser.companyCertificate}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="font-semibold">
                        {currentUser.companyCertificate || '-'}
                      </p>
                    )}
                  </div>
                </div>
                {isEditing && isAdmin && (
                  <div>
                    <Label className="flex items-center gap-2 text-gray-500 mb-2">
                      인증 상태
                    </Label>
                    <select
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      value={currentUser.companyVerifyStatus}
                      onChange={(e) =>
                        handleInputChange(
                          'companyVerifyStatus',
                          e.target.value as User['companyVerifyStatus']
                        )
                      }
                    >
                      <option value="pending">인증 처리중</option>
                      <option value="approved">인증 완료</option>
                      <option value="rejected">인증 거절</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      관리자만 상태를 변경할 수 있습니다.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 일반 회원 전용 정보 */}
          {isMember && (
            <>
              {/* 신체 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle>신체 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-gray-500 mb-2">나이</Label>
                      {isEditing ? (
                        <div>
                          <Input
                            value={currentUser.birthDate || ''}
                            type="date"
                            onChange={(e) =>
                              handleBirthDateChange(e.target.value)
                            }
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            생년월일을 선택해주세요
                          </p>
                        </div>
                      ) : (
                        <p className="font-semibold">
                          {currentUser.age ? `${currentUser.age}세` : '-'}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="text-gray-500 mb-2">성별</Label>
                      {isEditing ? (
                        <select
                          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                          value={currentUser.gender || ''}
                          onChange={(e) =>
                            handleInputChange('gender', e.target.value || '')
                          }
                        >
                          <option value="">선택</option>
                          <option value="남성">남자</option>
                          <option value="여성">여자</option>
                        </select>
                      ) : (
                        <p className="font-semibold">{currentUser.gender}</p>
                      )}
                    </div>
                    <div>
                      <Label className="flex items-center gap-2 text-gray-500 mb-2">
                        <Ruler className="size-4" />키
                      </Label>
                      {isEditing ? (
                        <Input
                          value={currentUser.height}
                          type="number"
                          onChange={(e) =>
                            handleInputChange('height', Number(e.target.value))
                          }
                        />
                      ) : (
                        <p className="font-semibold">{currentUser.height}cm</p>
                      )}
                    </div>
                    <div>
                      <Label className="flex items-center gap-2 text-gray-500 mb-2">
                        <Weight className="size-4" />
                        몸무게
                      </Label>
                      {isEditing ? (
                        <Input
                          value={currentUser.weight}
                          type="number"
                          onChange={(e) =>
                            handleInputChange('weight', Number(e.target.value))
                          }
                        />
                      ) : (
                        <p className="font-semibold">{currentUser.weight}kg</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 성격 및 특징 */}
              <Card>
                <CardHeader>
                  <CardTitle>성격 및 특징</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="flex items-center gap-2 text-gray-500 mb-2">
                      <Smile className="size-4" />
                      성격
                    </Label>
                    {isEditing ? (
                      <Textarea
                        value={currentUser.personality}
                        placeholder="성격을 입력하세요"
                        rows={2}
                        onChange={(e) =>
                          handleInputChange('personality', e.target.value)
                        }
                      />
                    ) : (
                      <p className="text-sm leading-relaxed">
                        {currentUser.personality || '-'}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="flex items-center gap-2 text-gray-500 mb-2">
                      <Star className="size-4" />
                      특징
                    </Label>
                    {isEditing ? (
                      <Textarea
                        value={currentUser.features}
                        placeholder="특징을 입력하세요"
                        rows={2}
                        onChange={(e) =>
                          handleInputChange('features', e.target.value)
                        }
                      />
                    ) : (
                      <p className="text-sm leading-relaxed">
                        {currentUser.features || '-'}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 저장 버튼: 성격/특징 아래, 경력 위에 배치 */}
              {isEditing && (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    취소
                  </Button>
                  <Button onClick={handleSaveProfile} disabled={isSaving}>
                    {isSaving ? '저장 중...' : '저장'}
                  </Button>
                </div>
              )}

              {/* 경력 및 소개 */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>경력</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setShowExperienceInput((v) => !v)}
                      >
                        항목 추가
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={loadExperiencesFromSchedules}
                        disabled={isLoadingExperiences}
                      >
                        <Briefcase className="size-4 mr-2" />
                        {isLoadingExperiences
                          ? '불러오는 중...'
                          : '경력 불러오기'}
                      </Button>
                    </div>
                  </div>
                  {showExperienceInput && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                      <Input
                        placeholder="경력 제목"
                        value={newExperience.title}
                        onChange={(e) =>
                          setNewExperience((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                      />
                      <Input
                        type="date"
                        placeholder="날짜"
                        value={newExperience.date}
                        onChange={(e) =>
                          setNewExperience((prev) => ({
                            ...prev,
                            date: e.target.value,
                          }))
                        }
                      />
                      <div className="flex gap-2">
                        <Input
                          placeholder="장소"
                          value={newExperience.location}
                          onChange={(e) =>
                            setNewExperience((prev) => ({
                              ...prev,
                              location: e.target.value,
                            }))
                          }
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={addExperienceManual}
                          disabled={
                            !newExperience.title.trim() ||
                            !newExperience.date.trim() ||
                            !newExperience.location.trim() ||
                            isSaving
                          }
                        >
                          추가
                        </Button>
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="space-y-3">
                      {currentUser.experiences &&
                      currentUser.experiences.length > 0 ? (
                        <div className="space-y-2">
                          {currentUser.experiences.map((exp, index) => (
                            <div
                              key={index}
                              className="flex items-start justify-between p-3 border rounded-lg bg-gray-50"
                            >
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm">
                                  {exp.title}
                                </h4>
                                <div className="flex gap-4 mt-1 text-xs text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <CalendarIcon className="size-3" />
                                    <span>
                                      {new Date(exp.date).toLocaleDateString(
                                        'ko-KR',
                                        {
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric',
                                        }
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="size-3" />
                                    <span>{exp.location}</span>
                                  </div>
                                </div>
                              </div>
                              {isEditing && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeExperience(index)}
                                >
                                  <X className="size-4 text-red-500" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          등록된 경력이 없습니다.
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 서류 */}
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

                  {currentUser.documents?.extraDocuments?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {currentUser.documents.extraDocuments.map((item, idx) => (
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
                    <p className="text-sm text-gray-500">
                      추가된 서류 항목이 없습니다.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* 자격증 */}
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
                      {currentUser.documents?.certificates &&
                      currentUser.documents.certificates.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {currentUser.documents.certificates.map(
                            (cert, index) => (
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
                            )
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          등록된 자격증이 없습니다.
                        </p>
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

              {/* 어학 능력 */}
              <Card>
                <CardHeader className="flex items-center justify-between">
                  <CardTitle>어학 능력</CardTitle>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowLanguageInput((v) => !v)}
                  >
                    항목 추가
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 border rounded-lg">
                    <Label className="flex items-center gap-2 text-gray-500 mb-3">
                      <Languages className="size-4" />
                      어학 능력
                    </Label>
                    <div className="space-y-3">
                      {currentUser.documents?.language &&
                      currentUser.documents.language.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {currentUser.documents.language.map((lang, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              {lang}
                              {isEditing && (
                                <button
                                  onClick={() => removeLanguage(index)}
                                  className="ml-1 hover:text-red-600"
                                >
                                  <X className="size-3" />
                                </button>
                              )}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          등록된 어학 능력이 없습니다.
                        </p>
                      )}
                      {showLanguageInput && (
                        <div className="flex gap-2">
                          <Input
                            value={newLanguage}
                            onChange={(e) => setNewLanguage(e.target.value)}
                            placeholder="예: 영어(중급), 일본어(초급)"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (!isSaving) addLanguage();
                              }
                            }}
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={addLanguage}
                            disabled={!newLanguage.trim() || isSaving}
                          >
                            <Plus className="size-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
