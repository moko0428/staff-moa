'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { parseISO } from 'date-fns';
import { createClient } from '@/utils/supabase/client';
import { getMyPostsAction } from '@/app/(protected)/my-post/actions';
import { submitAttendanceReviewAction, getReviewsByPostAction } from '../actions';
import type { Post, AttendanceReview } from '@/types/mockData';
import type { PenaltyItem } from '../constants';
import type { ScheduleWithPost } from '../../types/scheduleTypes';
import { supabasePostToPost, parseEndTime, type SupabasePost } from '../utils/scheduleHelpers';
import { parseDateString } from '@/lib/dateUtils';

type ApplicantMap = Record<
  string,
  Array<{
    userId: string;
    userName: string;
    applicationId: string;
    avatar?: string;
    phone?: string;
    kakaoId?: string;
    gender?: string;
  }>
>;

interface ScheduleData {
  currentUserId: string | null;
  managerPosts: Post[];
  applicantsData: ApplicantMap;
}

async function fetchScheduleData(): Promise<ScheduleData> {
  const supabase = createClient();
  const { data: authData } = await supabase.auth.getUser();
  const currentUserId = authData.user?.id ?? null;

  if (!currentUserId) return { currentUserId: null, managerPosts: [], applicantsData: {} };

  const result = await getMyPostsAction();
  if (!result.ok || !result.data) {
    return { currentUserId, managerPosts: [], applicantsData: {} };
  }

  const convertedPosts = result.data.map((post) =>
    supabasePostToPost(post as SupabasePost)
  );

  const applicantsMap: ApplicantMap = {};

  await Promise.all(
    convertedPosts.map(async (post) => {
      try {
        const postIdNum = Number(post.id);
        if (isNaN(postIdNum)) return;

        const { data: schedules } = await supabase
          .from('member_schedules')
          .select('member_schedule_id, member_id')
          .eq('post_id', postIdNum)
          .eq('status', 'accepted');

        if (schedules && schedules.length > 0) {
          const memberIds = schedules.map((s) => s.member_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, name, avatar, phone, kakao_id, gender')
            .in('user_id', memberIds);

          if (profiles) {
            applicantsMap[post.id] = schedules.map((schedule) => {
              const profile = profiles.find((p) => p.user_id === schedule.member_id);
              return {
                userId: schedule.member_id,
                userName: profile?.name || '알 수 없음',
                applicationId: schedule.member_schedule_id.toString(),
                avatar: profile?.avatar || undefined,
                phone: profile?.phone || undefined,
                kakaoId: profile?.kakao_id || undefined,
                gender: profile?.gender || undefined,
              };
            });
          }
        }
      } catch (error) {
        console.error(`Failed to fetch applicants for post ${post.id}:`, error);
      }
    })
  );

  return { currentUserId, managerPosts: convertedPosts, applicantsData: applicantsMap };
}

export const useManagerScheduleData = () => {
  const [reviews, setReviews] = useState<AttendanceReview[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleWithPost | null>(null);
  const [selectedDetailSchedule, setSelectedDetailSchedule] = useState<ScheduleWithPost | null>(null);

  const { data, isLoading, isSuccess } = useQuery({
    queryKey: ['manager', 'schedule'],
    queryFn: fetchScheduleData,
  });

  const isMounted = isSuccess;
  const currentUserId = data?.currentUserId ?? null;
  const managerPosts = data?.managerPosts ?? [];
  const applicantsData = data?.applicantsData ?? {};

  const categorizedSchedules = useMemo(() => {
    if (!isMounted) return { upcoming: [], ongoing: [], completed: [] };

    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming: ScheduleWithPost[] = [];
    const ongoing: ScheduleWithPost[] = [];
    const completed: ScheduleWithPost[] = [];

    managerPosts.forEach((post) => {
      const dates = parseDateString(post.date);
      if (dates.length === 0) return;

      const postApplicants = applicantsData[post.id] || [];
      const participants = postApplicants.map((app) => {
        const review = reviews.find(
          (r) => r.postId === post.id && r.userId === app.userId
        );
        return { ...app, review };
      });

      const scheduleWithPost: ScheduleWithPost = {
        ...post,
        currentApplicants: participants.length,
        status: 'upcoming',
        participants,
      };

      const endTime = parseEndTime(post.time);
      const isRangeSchedule = post.date.includes('~');

      if (isRangeSchedule) {
        const firstDate = parseISO(dates[0]);
        const lastDate = parseISO(dates[dates.length - 1]);
        firstDate.setHours(0, 0, 0, 0);
        lastDate.setHours(0, 0, 0, 0);
        if (endTime) {
          lastDate.setHours(endTime.hours, endTime.minutes, 0, 0);
        } else {
          lastDate.setHours(23, 59, 59, 999);
        }

        if (now <= lastDate && now >= firstDate) {
          scheduleWithPost.status = 'ongoing';
          ongoing.push(scheduleWithPost);
        } else if (firstDate > now) {
          scheduleWithPost.status = 'upcoming';
          upcoming.push(scheduleWithPost);
        } else {
          scheduleWithPost.status = 'completed';
          completed.push(scheduleWithPost);
        }
      } else {
        const parsedDates = dates.map((dateStr) => {
          const d = parseISO(dateStr);
          d.setHours(0, 0, 0, 0);
          return d;
        });

        const parsedDatesWithEndTime = parsedDates.map((date) => {
          const dateWithTime = new Date(date);
          if (endTime) {
            dateWithTime.setHours(endTime.hours, endTime.minutes, 0, 0);
          } else {
            dateWithTime.setHours(23, 59, 59, 999);
          }
          return dateWithTime;
        });

        const futureDates = parsedDatesWithEndTime.filter((date) => date > now);
        const pastDates = parsedDatesWithEndTime.filter((date) => date < now);
        const todayDates = parsedDates.filter(
          (date) => date.getTime() === today.getTime()
        );
        const ongoingToday =
          todayDates.length > 0 &&
          parsedDatesWithEndTime.some(
            (date) =>
              date.getTime() >= today.getTime() &&
              date.getTime() < today.getTime() + 86400000 &&
              date > now
          );

        if (ongoingToday) {
          scheduleWithPost.status = 'ongoing';
          ongoing.push(scheduleWithPost);
        } else if (pastDates.length > 0 && futureDates.length > 0) {
          scheduleWithPost.status = 'ongoing';
          ongoing.push(scheduleWithPost);
        } else if (futureDates.length > 0) {
          scheduleWithPost.status = 'upcoming';
          upcoming.push(scheduleWithPost);
        } else if (todayDates.length > 0) {
          scheduleWithPost.status = 'completed';
          completed.push(scheduleWithPost);
        } else {
          scheduleWithPost.status = 'completed';
          completed.push(scheduleWithPost);
        }
      }
    });

    return { upcoming, ongoing, completed };
  }, [managerPosts, reviews, isMounted, applicantsData]);

  const schedulesByDate = useMemo(() => {
    const grouped: Record<string, ScheduleWithPost[]> = {};
    const allSchedules = [
      ...categorizedSchedules.upcoming,
      ...categorizedSchedules.ongoing,
      ...categorizedSchedules.completed,
    ];

    allSchedules.forEach((schedule) => {
      const dates = parseDateString(schedule.date);
      dates.forEach((formattedDate) => {
        if (!grouped[formattedDate]) grouped[formattedDate] = [];
        if (!grouped[formattedDate].some((s) => s.id === schedule.id)) {
          grouped[formattedDate].push(schedule);
        }
      });
    });

    return grouped;
  }, [categorizedSchedules]);

  const handleScheduleClick = useCallback(
    async (schedule: ScheduleWithPost) => {
      if (schedule.status === 'completed') {
        const result = await getReviewsByPostAction(Number(schedule.id));
        if (result.ok && result.data) {
          const loadedReviews: AttendanceReview[] = result.data.map((r) => ({
            id: r.review_id,
            postId: schedule.id,
            userId: r.member_id,
            score: r.score,
            comment: r.comment,
            penaltyItems: (r.penalty_items as PenaltyItem[] | null) || undefined,
            reviewedBy: currentUserId || '',
            createdAt: r.updated_at,
          }));
          setReviews(loadedReviews);
          setSelectedSchedule({
            ...schedule,
            participants: schedule.participants.map((p) => {
              const review = loadedReviews.find((r) => r.userId === p.userId);
              return review ? { ...p, review } : p;
            }),
          });
        } else {
          setSelectedSchedule(schedule);
        }
      } else {
        setSelectedDetailSchedule(schedule);
      }
    },
    [currentUserId]
  );

  const handleReviewSubmit = async (
    postId: string,
    userId: string,
    score: number,
    comment: string,
    penaltyItems: PenaltyItem[] = []
  ) => {
    setIsSubmittingReview(true);
    try {
      const result = await submitAttendanceReviewAction(
        Number(postId),
        userId,
        score,
        comment,
        penaltyItems
      );

      if (!result.ok) {
        alert(result.message);
        return;
      }

      const newReview: AttendanceReview = {
        id: result.data?.reviewId || `rev-${Date.now()}`,
        postId,
        userId,
        score,
        comment,
        penaltyItems: penaltyItems.length > 0 ? penaltyItems : undefined,
        reviewedBy: currentUserId || '',
        createdAt: new Date().toISOString(),
      };

      setReviews((prev) => {
        const existing = prev.find((r) => r.postId === postId && r.userId === userId);
        if (existing) {
          return prev.map((r) =>
            r.id === existing.id ? { ...newReview, id: existing.id } : r
          );
        }
        return [...prev, newReview];
      });

      if (selectedSchedule) {
        setSelectedSchedule({
          ...selectedSchedule,
          participants: selectedSchedule.participants.map((p) =>
            p.userId === userId ? { ...p, review: newReview } : p
          ),
        });
      }
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return {
    isMounted,
    isLoading,
    categorizedSchedules,
    schedulesByDate,
    reviews,
    isSubmittingReview,
    selectedSchedule,
    setSelectedSchedule,
    selectedDetailSchedule,
    setSelectedDetailSchedule,
    handleScheduleClick,
    handleReviewSubmit,
  };
};
