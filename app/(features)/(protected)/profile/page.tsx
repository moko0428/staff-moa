'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Hero from '@/app/components/Hero';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import {
  User as UserIcon,
  Mail,
  Phone,
  MessageSquare,
  Building2,
  Ruler,
  Smile,
  Star,
  Plus,
  X,
  CreditCard,
  FileCheck,
  Weight,
} from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/app/components/ui/avatar';
import Link from 'next/link';
import ExperienceSection from './components/ExperienceSection';
import DocumentsSection from './components/DocumentsSection';
import CertificatesSection from './components/CertificatesSection';
import LanguageSection from './components/LanguageSection';
import { useUserStore } from '@/store/useUserStore';
import { useProfile } from './hook/useProfile';
import {
  getMyFollowersAction,
  getMyFollowingAction,
  getProfileForModalAction,
  removeMyFollowerAction,
  removeMyFollowingAction,
} from './actions';
import ProfileModal from '@/app/components/profile-modal';

const formatBusinessNumber = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length > 5) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  }
  if (digits.length > 3) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
  return digits;
};

export default function ProfilePage() {
  const {
    currentUser,
    isEditing,
    setIsEditing,
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
    isUploadingPhoto,
    isReRequesting,
    isLoadingUser,
    isSaving,
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
  } = useProfile();
  const roleFromStore = useUserStore((state) => state.role);
  const effectiveRole = roleFromStore ?? currentUser?.role ?? null;
  const isMember = effectiveRole === 'member';
  const isPendingManager = effectiveRole === 'pending_manager';
  const isManager = effectiveRole === 'manager';
  const isAdmin = effectiveRole === 'admin';

  const [followerCount, setFollowerCount] = useState<number>(0);
  const [followers, setFollowers] = useState<
    Array<{
      userId: string;
      name: string | null;
      avatar: string | null;
      role: string;
    }>
  >([]);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false);
  const [followerSearch, setFollowerSearch] = useState('');

  const [followingCount, setFollowingCount] = useState<number>(0);
  const [followings, setFollowings] = useState<
    Array<{
      userId: string;
      name: string | null;
      avatar: string | null;
      role: string;
    }>
  >([]);
  const [isLoadingFollowings, setIsLoadingFollowings] = useState(false);
  const [followingSearch, setFollowingSearch] = useState('');

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalUser, setProfileModalUser] = useState<{
    id: string;
    name: string | null;
    email: string | null;
    photo?: string | null;
    role: string;
    introduction?: string | null;
    attendanceScore?: number | null;
    followerCount?: number;
  } | null>(null);

  const openProfileModal = async (userId: string) => {
    const result = await getProfileForModalAction(userId);
    if (!result.ok || !result.data) {
      toast.error(result.message || '프로필을 불러오는데 실패했습니다.');
      return;
    }
    setProfileModalUser(result.data);
    setIsProfileModalOpen(true);
  };

  useEffect(() => {
    const fetchFollowers = async () => {
      if (!isManager) return;
      setIsLoadingFollowers(true);
      try {
        const result = await getMyFollowersAction();
        if (result.ok && result.data) {
          setFollowerCount(result.data.count);
          setFollowers(result.data.followers);
        }
      } finally {
        setIsLoadingFollowers(false);
      }
    };

    fetchFollowers();
  }, [isManager]);

  useEffect(() => {
    const fetchFollowings = async () => {
      if (!isMember) return;
      setIsLoadingFollowings(true);
      try {
        const result = await getMyFollowingAction();
        if (result.ok && result.data) {
          setFollowingCount(result.data.count);
          setFollowings(result.data.followings);
        }
      } finally {
        setIsLoadingFollowings(false);
      }
    };

    fetchFollowings();
  }, [isMember]);

  const filteredFollowers = useMemo(() => {
    const q = followerSearch.trim().toLowerCase();
    if (!q) return followers;
    return followers.filter((f: { name: string | null }) =>
      (f.name || '').toLowerCase().includes(q)
    );
  }, [followers, followerSearch]);

  const filteredFollowings = useMemo(() => {
    const q = followingSearch.trim().toLowerCase();
    if (!q) return followings;
    return followings.filter((f: { name: string | null }) =>
      (f.name || '').toLowerCase().includes(q)
    );
  }, [followings, followingSearch]);

  const handleRemoveFollowing = async (managerId: string) => {
    if (!confirm('팔로잉을 삭제하시겠습니까?')) return;
    const result = await removeMyFollowingAction(managerId);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    setFollowings((prev) => prev.filter((f) => f.userId !== managerId));
    setFollowingCount((prev) => Math.max(0, prev - 1));
  };

  const handleRemoveFollower = async (followerId: string) => {
    if (!confirm('팔로워를 삭제하시겠습니까?')) return;
    const result = await removeMyFollowerAction(followerId);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    setFollowers((prev) => prev.filter((f) => f.userId !== followerId));
    setFollowerCount((prev) => Math.max(0, prev - 1));
  };

  const companyInfoFilled =
    !!currentUser?.companyName?.trim() &&
    (currentUser?.businessNumber?.replace(/\D/g, '').length ?? 0) === 10 &&
    !!currentUser?.companyCertificate?.trim();
  const companyStatusRaw = currentUser?.companyVerifyStatus ?? 'pending';
  const companyBadge = !companyInfoFilled
    ? { label: '미입력', variant: 'secondary' as const }
    : companyStatusRaw === 'approved'
    ? { label: '인증 완료', variant: 'default' as const }
    : { label: '인증 처리중', variant: 'outline' as const };

  if (isLoadingUser) {
    return (
      <div>
        <Hero title="프로필" description="내 프로필 정보" />
        <div className="flex justify-center items-center min-h-[400px]">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div>
        <Hero title="프로필" description="내 프로필 정보" />
        <div className="flex flex-col items-center justify-center gap-4 min-h-[400px] text-muted-foreground">
          <p>로그인이 필요합니다.</p>
          <div className="flex gap-2">
            <Link href="/auth/login" className="text-primary underline">
              로그인
            </Link>
            <span className="text-muted-foreground">|</span>
            <Link href="/auth/join" className="text-primary underline">
              회원가입
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 필수 정보 누락 여부 확인
  const requiredFields: Array<[string, unknown]> = [];

  if (isMember) {
    requiredFields.push(
      ['전화번호', currentUser.phone],
      ['성별', currentUser.gender],
      ['자기소개', currentUser.introduction],
      ['생년월일', currentUser.birthDate],
      ['키', currentUser.height],
      ['몸무게', currentUser.weight]
    );
  }

  if (isManager || isPendingManager) {
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

  return (
    <div>
      <Hero
        title="프로필"
        description={
          isMember ? '내 프로필 정보를 관리하세요' : '매니저 프로필 정보'
        }
      />

      {isPendingManager && companyStatusRaw === 'rejected' && (
        <Card className="mb-4 border-red-200 bg-red-50">
          <CardContent className="py-3">
            <div className="flex flex-col gap-1 text-sm text-red-700">
              <p className="font-semibold">승인 요청이 거절되었습니다.</p>
              <p className="text-xs">
                프로필 정보를 보완한 뒤 재요청을 진행해주세요.
              </p>
              <div className="mt-2">
                <Button
                  size="sm"
                  onClick={handleReRequestManagerApproval}
                  disabled={isReRequesting}
                >
                  {isReRequesting ? '재요청 중...' : '재요청'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!isAdmin &&
        ((isMember && missingFields.length > 0) ||
          (isPendingManager && missingFields.length > 0)) && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="py-4">
              <div className="flex flex-col gap-2 text-sm text-amber-900">
                <p className="font-semibold">
                  {isMember
                    ? '프로필을 모두 채우면 지원 성공 확률이 올라가요.'
                    : '프로필을 모두 채우면 회사 인증을 승인 받을 수 있어요.'}
                </p>
                <p>
                  아직 입력되지 않은 항목: {missingFields.join(', ')}
                  {missingFields.length >= 3 && ' 등'}
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
                {isEditing ? (
                  <Input
                    value={currentUser.name ?? ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="이름"
                    className="text-2xl font-bold h-12 text-center mb-2"
                  />
                ) : (
                  <h2 className="text-2xl font-bold mb-2">{currentUser.name}</h2>
                )}
                <Badge variant="outline" className="mb-4">
                  {effectiveRole === 'member' && '스탭'}
                  {effectiveRole === 'manager' && '매니저'}
                  {effectiveRole === 'admin' && '관리자'}
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
        </div>

        {/* 상세 정보 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 스탭 팔로잉 (기본 정보 위) */}
          {isMember && (
            <Card>
              <CardHeader className="flex items-center justify-between flex-row">
                <CardTitle>팔로잉</CardTitle>
                <Badge variant="secondary">
                  {isLoadingFollowings ? '...' : `${followingCount}명`}
                </Badge>
              </CardHeader>
              <CardContent>
                {isLoadingFollowings ? (
                  <p className="text-sm text-muted-foreground">
                    불러오는 중...
                  </p>
                ) : followings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    아직 팔로우한 매니저가 없습니다.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <Input
                      placeholder="팔로잉(매니저) 이름 검색"
                      value={followingSearch}
                      onChange={(e) => setFollowingSearch(e.target.value)}
                    />

                    {filteredFollowings.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        검색 결과가 없습니다.
                      </p>
                    ) : (
                      <div
                        className={
                          filteredFollowings.length >= 5
                            ? 'space-y-2 max-h-[360px] overflow-y-auto pr-1'
                            : 'space-y-2'
                        }
                      >
                        {filteredFollowings.map((f) => (
                          <div
                            key={f.userId}
                            role="button"
                            tabIndex={0}
                            onClick={() => openProfileModal(f.userId)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                openProfileModal(f.userId);
                              }
                            }}
                            className="flex items-center justify-between gap-3 rounded-md border p-3 cursor-pointer hover:bg-accent"
                          >
                            <div className="min-w-0 flex items-center gap-3">
                              <Avatar className="size-10">
                                <AvatarImage src={f.avatar ?? undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                  {(f.name || 'U').charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-medium truncate">
                                  {f.name || '이름 없음'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {f.role === 'manager' ? '매니저' : f.role}
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFollowing(f.userId);
                              }}
                            >
                              삭제
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 매니저 팔로워 (기본 정보 위) */}
          {isManager && (
            <Card>
              <CardHeader className="flex items-center justify-between flex-row">
                <CardTitle>팔로워</CardTitle>
                <Badge variant="secondary">
                  {isLoadingFollowers ? '...' : `${followerCount}명`}
                </Badge>
              </CardHeader>
              <CardContent>
                {isLoadingFollowers ? (
                  <p className="text-sm text-muted-foreground">
                    불러오는 중...
                  </p>
                ) : followers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    아직 팔로워가 없습니다.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <Input
                      placeholder="팔로워 이름 검색"
                      value={followerSearch}
                      onChange={(e) => setFollowerSearch(e.target.value)}
                    />

                    {filteredFollowers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        검색 결과가 없습니다.
                      </p>
                    ) : (
                      <div
                        className={
                          filteredFollowers.length >= 5
                            ? 'space-y-2 max-h-[360px] overflow-y-auto pr-1'
                            : 'space-y-2'
                        }
                      >
                        {filteredFollowers.map((f) => (
                          <div
                            key={f.userId}
                            role="button"
                            tabIndex={0}
                            onClick={() => openProfileModal(f.userId)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                openProfileModal(f.userId);
                              }
                            }}
                            className="flex items-center justify-between gap-3 rounded-md border p-3 cursor-pointer hover:bg-accent"
                          >
                            <div className="min-w-0 flex items-center gap-3">
                              <Avatar className="size-10">
                                <AvatarImage src={f.avatar ?? undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                  {(f.name || 'U').charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-medium truncate">
                                  {f.name || '이름 없음'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {f.role === 'member'
                                    ? '스탭'
                                    : f.role === 'manager'
                                    ? '매니저'
                                    : f.role === 'admin'
                                    ? '관리자'
                                    : f.role}
                                </p>
                              </div>
                            </div>

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFollower(f.userId);
                              }}
                            >
                              삭제
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-2 text-muted-foreground mb-2">
                    <UserIcon className="size-4" />
                    이름
                  </Label>
                  {isEditing ? (
                    <Input
                      value={currentUser.name ?? ''}
                      onChange={(e) =>
                        handleInputChange('name', e.target.value)
                      }
                      placeholder="이름"
                    />
                  ) : (
                    <p className="font-semibold">{currentUser.name ?? '-'}</p>
                  )}
                </div>
                <div>
                  <Label className="flex items-center gap-2 text-muted-foreground mb-2">
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
                  <Label className="flex items-center gap-2 text-muted-foreground mb-2">
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
                  <Label className="flex items-center gap-2 text-muted-foreground mb-2">
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
                    <Label className="flex items-center gap-2 text-muted-foreground mb-2">
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
              {(isManager || isPendingManager) && (
                <p className="text-sm text-muted-foreground text-right">
                  프로필을 모두 채우면 기업 신뢰도가 상승해요.
                </p>
              )}
            </CardContent>
          </Card>

          {isAdmin && isEditing && (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                취소
              </Button>
              <Button onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? '저장 중...' : '저장'}
              </Button>
            </div>
          )}

          {/* 매니저 회사 정보 */}
          {(isManager || isPendingManager) && (
            <Card>
              <CardHeader className="flex items-center justify-between flex-row">
                <CardTitle>회사 정보</CardTitle>
                <Badge variant={companyBadge.variant}>
                  {companyBadge.label}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-2 text-muted-foreground mb-2">
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
                    <Label className="flex items-center gap-2 text-muted-foreground mb-2">
                      <CreditCard className="size-4" />
                      사업자등록번호
                    </Label>
                    {isEditing ? (
                      <Input
                        value={formatBusinessNumber(
                          currentUser.businessNumber ?? ''
                        )}
                        placeholder="숫자 10자리 (예: 123-45-67890)"
                        onChange={(e) =>
                          handleInputChange(
                            'businessNumber',
                            formatBusinessNumber(e.target.value)
                          )
                        }
                      />
                    ) : (
                      <p className="font-semibold">
                        {currentUser.businessNumber
                          ? formatBusinessNumber(currentUser.businessNumber)
                          : '-'}
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <Label className="flex items-center gap-2 text-muted-foreground mb-2">
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
                          <p className="text-sm text-muted-foreground">
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
                    <Label className="flex items-center gap-2 text-muted-foreground mb-2">
                      인증 상태
                    </Label>
                    <select
                      className="w-full rounded-md border border-border px-3 py-2 text-sm"
                      value={companyStatusRaw}
                      disabled={!companyInfoFilled}
                      onChange={(e) =>
                        handleInputChange('companyVerifyStatus', e.target.value)
                      }
                    >
                      <option value="pending">인증 처리중</option>
                      <option value="approved">인증 완료</option>
                    </select>
                    {!companyInfoFilled && (
                      <p className="text-xs text-muted-foreground mt-1">
                        회사명·사업자등록번호·인증 파일을 모두 입력해야 승인할
                        수 있습니다.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {(isManager || isPendingManager) && isEditing && (
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                취소
              </Button>
              <Button onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? '저장 중...' : '저장'}
              </Button>
            </div>
          )}

          {/* 스탭 전용 정보 */}
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
                      <Label className="text-muted-foreground mb-2">나이</Label>
                      {isEditing ? (
                        <div>
                          <Input
                            value={currentUser.birthDate || ''}
                            type="date"
                            onChange={(e) =>
                              handleBirthDateChange(e.target.value)
                            }
                          />
                          <p className="text-xs text-muted-foreground mt-1">
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
                      <Label className="text-muted-foreground mb-2">성별</Label>
                      {isEditing ? (
                        <select
                          className="w-full rounded-md border border-border px-3 py-2 text-sm"
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
                      <Label className="flex items-center gap-2 text-muted-foreground mb-2">
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
                      <Label className="flex items-center gap-2 text-muted-foreground mb-2">
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
                    <Label className="flex items-center gap-2 text-muted-foreground mb-2">
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
                    <Label className="flex items-center gap-2 text-muted-foreground mb-2">
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

              <ExperienceSection
                currentUser={currentUser}
                isEditing={isEditing}
                showExperienceInput={showExperienceInput}
                setShowExperienceInput={setShowExperienceInput}
                newExperience={newExperience}
                setNewExperience={setNewExperience}
                isLoadingExperiences={isLoadingExperiences}
                loadExperiencesFromSchedules={loadExperiencesFromSchedules}
                addExperienceManual={addExperienceManual}
                removeExperience={removeExperience}
                isSaving={isSaving}
              />

              <DocumentsSection
                documents={currentUser.documents}
                showDocumentInput={showDocumentInput}
                setShowDocumentInput={setShowDocumentInput}
                newDocumentLabel={newDocumentLabel}
                setNewDocumentLabel={setNewDocumentLabel}
                addDocumentItem={addDocumentItem}
                removeDocumentItem={removeDocumentItem}
                isSaving={isSaving}
              />

              <CertificatesSection
                documents={currentUser.documents}
                showCertificateInput={showCertificateInput}
                setShowCertificateInput={setShowCertificateInput}
                newCertificate={newCertificate}
                setNewCertificate={setNewCertificate}
                addCertificate={addCertificate}
                removeCertificate={removeCertificate}
                isEditing={isEditing}
                isSaving={isSaving}
              />

              <LanguageSection
                documents={currentUser.documents}
                showLanguageInput={showLanguageInput}
                setShowLanguageInput={setShowLanguageInput}
                newLanguage={newLanguage}
                setNewLanguage={setNewLanguage}
                addLanguage={addLanguage}
                removeLanguage={removeLanguage}
                isEditing={isEditing}
                isSaving={isSaving}
              />
            </>
          )}
        </div>
      </div>

      {profileModalUser && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={profileModalUser}
          currentUserId={currentUser?.id}
        />
      )}
    </div>
  );
}
