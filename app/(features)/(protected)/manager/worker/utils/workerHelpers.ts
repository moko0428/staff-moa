import type { ApplicantData, ApplicationWithPost } from '../types';

export const calculateAge = (birthDate: string | null): number | null => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

export const isPastSchedule = (input: {
  postDate?: string;
  workSlots?: Array<{ date: string; end_time?: string }>;
}): boolean => {
  const now = new Date();

  if (input.workSlots && input.workSlots.length > 0) {
    const lastSlot = input.workSlots[input.workSlots.length - 1];
    const endTime =
      typeof lastSlot.end_time === 'string' && /^\d{2}:\d{2}$/.test(lastSlot.end_time)
        ? lastSlot.end_time
        : '23:59';
    const lastWorkDateTime = new Date(`${lastSlot.date}T${endTime}:00`);
    if (!Number.isNaN(lastWorkDateTime.getTime())) {
      return now > lastWorkDateTime;
    }
  }

  if (input.postDate) {
    const lastWorkDateTime = new Date(`${input.postDate}T23:59:00`);
    if (!Number.isNaN(lastWorkDateTime.getTime())) {
      return now > lastWorkDateTime;
    }
  }

  return false;
};

export const convertToApplicationWithPost = (data: ApplicantData): ApplicationWithPost => {
  const profile = data.profiles;
  const post = data.posts;

  const rawExperiences = profile?.experiences;
  const experiences = Array.isArray(rawExperiences)
    ? rawExperiences.filter(
        (item): item is { title?: string; date?: string; location?: string } =>
          typeof item === 'object' && item !== null,
      )
    : undefined;

  const rawDocuments = profile?.documents;
  const documents =
    typeof rawDocuments === 'object' && rawDocuments !== null
      ? (rawDocuments as {
          idCard?: string;
          bankbook?: string;
          healthCertificate?: string;
          certificates?: string[];
          language?: string[];
          extraDocuments?: string[];
        })
      : undefined;

  const age = calculateAge(profile?.birth_date || null);

  return {
    id: data.member_schedule_id,
    postId: data.post_id,
    applicantId: data.member_id,
    applicantName: profile?.name || '알 수 없음',
    postTitle: post?.title || '',
    postDate: post?.work_date || '',
    postLocation: post?.location || '',
    postStatus: post?.status,
    workSlots: Array.isArray(post?.work_slots)
      ? (
          post.work_slots as Array<{
            date: string;
            start_time?: string;
            end_time?: string;
          }>
        ).map((slot) => ({
          date: slot.date,
          start_time: slot.start_time,
          end_time: slot.end_time,
        }))
      : undefined,
    appliedAt: data.created_at,
    status: data.status,
    message: data.message,
    applicantInfo: profile
      ? {
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          photo: profile.avatar,
          attendanceScore: profile.attendance_score,
          age,
          gender: profile.gender,
          kakaoId: profile.kakao_id,
          introduction: profile.bio,
          experiences,
          documents,
          profileVisibility:
            typeof profile?.profile_visibility === 'object' &&
            profile?.profile_visibility !== null
              ? (profile.profile_visibility as Record<string, boolean>)
              : undefined,
        }
      : undefined,
    applicantPhoto: profile?.avatar || undefined,
    applicantAttendanceScore: profile?.attendance_score,
    applicantKakaoId: profile?.kakao_id || undefined,
    applicantGender: profile?.gender || undefined,
    applicantAge: age || undefined,
  };
};
