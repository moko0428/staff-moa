'use client';

import { useState, useEffect } from 'react';
import Hero from '@/components/Hero';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { mockUsers, mockApplications, mockPosts } from '@/lib/mockData';
import { User } from '@/types/mockData';
import { parseDateString } from '@/lib/dateUtils';
import {
  User as UserIcon,
  Mail,
  Phone,
  MessageSquare,
  Briefcase,
  CheckCircle2,
  XCircle,
  Building2,
  Ruler,
  Weight,
  Smile,
  Star,
  FileText,
  Languages,
  IdCard,
  CreditCard,
  FileCheck,
  Car,
  Award,
  Plus,
  X,
  Calendar as CalendarIcon,
  MapPin,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newLanguage, setNewLanguage] = useState('');
  const [newCertificate, setNewCertificate] = useState('');
  const [isLoadingExperiences, setIsLoadingExperiences] = useState(false);

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
    try {
      const userId =
        typeof window !== 'undefined'
          ? localStorage.getItem('userId') || 'member-1'
          : 'member-1';
      const user = mockUsers.find((u) => u.id === userId);
      if (user) {
        // 생년월일이 있으면 나이 자동 계산
        if (user.birthDate) {
          const calculatedAge = calculateAge(user.birthDate);
          setCurrentUser({ ...user, age: calculatedAge });
        } else {
          setCurrentUser(user);
        }
      }
    } catch {
      const user = mockUsers.find((u) => u.id === 'member-1');
      if (user) {
        // 생년월일이 있으면 나이 자동 계산
        if (user.birthDate) {
          const calculatedAge = calculateAge(user.birthDate);
          setCurrentUser({ ...user, age: calculatedAge });
        } else {
          setCurrentUser(user);
        }
      }
    }
  }, []);

  if (!currentUser) {
    return (
      <div>
        <Hero title="프로필" description="내 프로필 정보" />
        <div className="flex justify-center items-center min-h-[400px]">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  const isMember = currentUser.role === 'member';
  const isManager = currentUser.role === 'manager';

  // 파일 업로드 핸들러 (시뮬레이션)
  const handleFileUpload = (
    docType: keyof NonNullable<User['documents']>,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    // 실제로는 서버에 업로드하고 URL을 받아야 하지만, 여기서는 시뮬레이션
    const fakeUrl = `/uploads/${currentUser.id}-${docType}-${Date.now()}.jpg`;

    setCurrentUser({
      ...currentUser,
      documents: {
        ...currentUser.documents,
        [docType]: fakeUrl,
      },
    });
  };

  // 파일 삭제 함수
  const removeDocument = (docType: keyof NonNullable<User['documents']>) => {
    if (!currentUser) return;

    setCurrentUser({
      ...currentUser,
      documents: {
        ...currentUser.documents,
        [docType]: undefined,
      },
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
  const addLanguage = () => {
    if (!newLanguage.trim() || !currentUser) return;

    const currentLanguages = currentUser.documents?.language || [];
    setCurrentUser({
      ...currentUser,
      documents: {
        ...currentUser.documents,
        language: [...currentLanguages, newLanguage.trim()],
      },
    });
    setNewLanguage('');
  };

  // 언어 삭제 함수
  const removeLanguage = (index: number) => {
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
  };

  // 자격증 추가 함수
  const addCertificate = () => {
    if (!newCertificate.trim() || !currentUser) return;

    const currentCertificates = currentUser.documents?.certificates || [];
    setCurrentUser({
      ...currentUser,
      documents: {
        ...currentUser.documents,
        certificates: [...currentCertificates, newCertificate.trim()],
      },
    });
    setNewCertificate('');
  };

  // 자격증 삭제 함수
  const removeCertificate = (index: number) => {
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
  };

  // 경력 삭제 함수
  const removeExperience = (index: number) => {
    if (!currentUser || !currentUser.experiences) return;

    const updatedExperiences = currentUser.experiences.filter(
      (_, i) => i !== index
    );
    setCurrentUser({
      ...currentUser,
      experiences: updatedExperiences,
    });
  };

  // 내 스케줄에서 경력 불러오기
  const loadExperiencesFromSchedules = () => {
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

      alert(`${filtered.length}개의 경력이 추가되었습니다.`);
    } catch (error) {
      console.error('Failed to load experiences:', error);
      alert('경력 불러오기에 실패했습니다.');
    } finally {
      setIsLoadingExperiences(false);
    }
  };

  // 프로필 이미지 업로드 핸들러
  const handleProfileImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    // 이미지 파일인지 확인
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    // FileReader를 사용하여 이미지 미리보기
    const reader = new FileReader();
    reader.onloadend = () => {
      setCurrentUser({
        ...currentUser,
        photo: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <Hero
        title="프로필"
        description={
          isMember ? '내 프로필 정보를 관리하세요' : '매니저 프로필 정보'
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 프로필 카드 */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <Avatar className="w-32 h-32">
                    <AvatarImage
                      src={currentUser.photo || '/images/default-avatar.png'}
                      alt={currentUser.name}
                    />
                    <AvatarFallback className="text-2xl">
                      {currentUser.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button
                      type="button"
                      size="sm"
                      className="absolute bottom-0 right-0 rounded-full w-10 h-10 p-0"
                      onClick={() =>
                        document.getElementById('profile-image-upload')?.click()
                      }
                    >
                      <Plus className="size-4" />
                    </Button>
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
                <div className="flex items-center gap-2 mb-4">
                  <Star className="size-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-lg font-semibold">
                    {currentUser.attendanceScore}점
                  </span>
                </div>
                <Button
                  className="w-full"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? '편집 취소' : '프로필 수정'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 매니저 회사 정보 */}
          {isManager && currentUser.companyName && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="size-5" />
                  회사 정보
                </CardTitle>
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
                {isManager && (
                  <div className="md:col-span-2">
                    <Label className="flex items-center gap-2 text-gray-500 mb-2">
                      <Building2 className="size-4" />
                      회사명 (선택)
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
                )}
              </div>
            </CardContent>
          </Card>

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
                        <Input
                          value={currentUser.gender}
                          onChange={(e) =>
                            handleInputChange('gender', e.target.value)
                          }
                        />
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

              {/* 경력 및 소개 */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>경력 및 자기소개</CardTitle>
                    {isEditing && (
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
                          : '내 경력 불러오기'}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="flex items-center gap-2 text-gray-500 mb-2">
                      <Briefcase className="size-4" />
                      경력
                    </Label>
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
                  <div>
                    <Label className="flex items-center gap-2 text-gray-500 mb-2">
                      <FileText className="size-4" />
                      자기소개
                    </Label>
                    {isEditing ? (
                      <Textarea
                        value={currentUser.introduction}
                        placeholder="자기소개를 입력하세요"
                        rows={3}
                        onChange={(e) =>
                          handleInputChange('introduction', e.target.value)
                        }
                      />
                    ) : (
                      <p className="text-sm leading-relaxed">
                        {currentUser.introduction || '-'}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 서류 및 자격 */}
              <Card>
                <CardHeader>
                  <CardTitle>서류 및 자격증</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* 신분증 사본 */}
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {currentUser.documents?.idCard ? (
                          <CheckCircle2 className="size-5 text-green-500" />
                        ) : (
                          <XCircle className="size-5 text-red-500" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <IdCard className="size-4 text-gray-500" />
                            <span className="text-sm font-medium">
                              신분증 사본
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {currentUser.documents?.idCard
                              ? '제출 완료'
                              : '미제출'}
                          </p>
                        </div>
                      </div>
                      {isEditing && (
                        <div className="flex gap-2">
                          {currentUser.documents?.idCard ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => removeDocument('idCard')}
                            >
                              <X className="size-4 mr-1" />
                              삭제
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                document
                                  .getElementById('upload-idCard')
                                  ?.click()
                              }
                            >
                              <Plus className="size-4 mr-1" />
                              업로드
                            </Button>
                          )}
                          <input
                            id="upload-idCard"
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) => handleFileUpload('idCard', e)}
                          />
                        </div>
                      )}
                    </div>

                    {/* 통장 사본 */}
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {currentUser.documents?.bankbook ? (
                          <CheckCircle2 className="size-5 text-green-500" />
                        ) : (
                          <XCircle className="size-5 text-red-500" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <CreditCard className="size-4 text-gray-500" />
                            <span className="text-sm font-medium">
                              통장 사본
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {currentUser.documents?.bankbook
                              ? '제출 완료'
                              : '미제출'}
                          </p>
                        </div>
                      </div>
                      {isEditing && (
                        <div className="flex gap-2">
                          {currentUser.documents?.bankbook ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => removeDocument('bankbook')}
                            >
                              <X className="size-4 mr-1" />
                              삭제
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                document
                                  .getElementById('upload-bankbook')
                                  ?.click()
                              }
                            >
                              <Plus className="size-4 mr-1" />
                              업로드
                            </Button>
                          )}
                          <input
                            id="upload-bankbook"
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) => handleFileUpload('bankbook', e)}
                          />
                        </div>
                      )}
                    </div>

                    {/* 보건증 */}
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {currentUser.documents?.healthCertificate ? (
                          <CheckCircle2 className="size-5 text-green-500" />
                        ) : (
                          <XCircle className="size-5 text-red-500" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <FileCheck className="size-4 text-gray-500" />
                            <span className="text-sm font-medium">보건증</span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {currentUser.documents?.healthCertificate
                              ? '제출 완료'
                              : '미제출'}
                          </p>
                        </div>
                      </div>
                      {isEditing && (
                        <div className="flex gap-2">
                          {currentUser.documents?.healthCertificate ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                removeDocument('healthCertificate')
                              }
                            >
                              <X className="size-4 mr-1" />
                              삭제
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                document
                                  .getElementById('upload-healthCertificate')
                                  ?.click()
                              }
                            >
                              <Plus className="size-4 mr-1" />
                              업로드
                            </Button>
                          )}
                          <input
                            id="upload-healthCertificate"
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) =>
                              handleFileUpload('healthCertificate', e)
                            }
                          />
                        </div>
                      )}
                    </div>

                    {/* 운전면허증 */}
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {currentUser.documents?.driverLicense ? (
                          <CheckCircle2 className="size-5 text-green-500" />
                        ) : (
                          <XCircle className="size-5 text-red-500" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <Car className="size-4 text-gray-500" />
                            <span className="text-sm font-medium">
                              운전면허증
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {currentUser.documents?.driverLicense
                              ? '보유'
                              : '미보유'}
                          </p>
                        </div>
                      </div>
                      {isEditing && (
                        <div className="flex gap-2">
                          {currentUser.documents?.driverLicense ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => removeDocument('driverLicense')}
                            >
                              <X className="size-4 mr-1" />
                              삭제
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                document
                                  .getElementById('upload-driverLicense')
                                  ?.click()
                              }
                            >
                              <Plus className="size-4 mr-1" />
                              업로드
                            </Button>
                          )}
                          <input
                            id="upload-driverLicense"
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) =>
                              handleFileUpload('driverLicense', e)
                            }
                          />
                        </div>
                      )}
                    </div>

                    {/* 자격증 */}
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
                        {isEditing && (
                          <div className="flex gap-2">
                            <Input
                              value={newCertificate}
                              onChange={(e) =>
                                setNewCertificate(e.target.value)
                              }
                              placeholder="예: 바리스타 2급, 컴퓨터활용능력 1급"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addCertificate();
                                }
                              }}
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={addCertificate}
                              disabled={!newCertificate.trim()}
                            >
                              <Plus className="size-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 어학 능력 */}
                  <div className="mt-6">
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
                      {isEditing && (
                        <div className="flex gap-2">
                          <Input
                            value={newLanguage}
                            onChange={(e) => setNewLanguage(e.target.value)}
                            placeholder="예: 영어(중급), 일본어(초급)"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addLanguage();
                              }
                            }}
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={addLanguage}
                            disabled={!newLanguage.trim()}
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

          {/* 저장 버튼 */}
          {isEditing && (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                취소
              </Button>
              <Button onClick={() => setIsEditing(false)}>저장</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
