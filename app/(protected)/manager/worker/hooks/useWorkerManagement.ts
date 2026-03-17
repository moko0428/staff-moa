'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getApplicantsAction,
  getManagedWorkersAction,
  getWorkerManagementBatchAction,
  updateApplicantStatusAction,
  toggleFavoriteAction,
  toggleBlacklistAction,
} from '../actions';
import {
  convertToApplicationWithPost,
  calculateAge,
} from '../utils/workerHelpers';
import type {
  ApplicationWithPost,
  ApplicationStatus,
  ApplicantData,
  GroupedWorker,
  TabType,
} from '../types';

async function fetchWorkerData(): Promise<ApplicationWithPost[]> {
  const [applicantsResult, managedResult] = await Promise.all([
    getApplicantsAction(),
    getManagedWorkersAction(),
  ]);

  const convertedData =
    applicantsResult.ok && applicantsResult.data
      ? applicantsResult.data.map((item) =>
          convertToApplicationWithPost(item as unknown as ApplicantData)
        )
      : [];

  const applicantIds = convertedData.map((app) => app.applicantId);
  const batchResult = await getWorkerManagementBatchAction(applicantIds);
  const managementMap: Record<string, ApplicationWithPost['workerManagement']> =
    batchResult.ok && batchResult.data ? batchResult.data : {};

  const applicationsWithManagement = convertedData.map((app) => ({
    ...app,
    workerManagement: managementMap[app.applicantId],
  }));

  const existingWorkerIds = new Set(convertedData.map((app) => app.applicantId));
  const managedWorkers =
    managedResult.ok && managedResult.data ? managedResult.data : [];

  const extraApplications: ApplicationWithPost[] = managedWorkers
    .filter((mw) => !existingWorkerIds.has(mw.worker_id))
    .map((mw) => ({
      id: `managed-${mw.worker_id}`,
      postId: 0,
      applicantId: mw.worker_id,
      applicantName: mw.profile?.name || '알 수 없음',
      postTitle: '',
      postDate: '',
      postLocation: '',
      appliedAt: '',
      status: 'accepted' as ApplicationStatus,
      applicantPhoto: mw.profile?.avatar || undefined,
      applicantAttendanceScore: mw.profile?.attendance_score,
      applicantKakaoId: mw.profile?.kakao_id || undefined,
      applicantGender: mw.profile?.gender || undefined,
      applicantAge: calculateAge(mw.profile?.birth_date || null) || undefined,
      applicantInfo: mw.profile
        ? {
            name: mw.profile.name,
            email: mw.profile.email,
            phone: mw.profile.phone,
            attendanceScore: mw.profile.attendance_score,
            gender: mw.profile.gender,
            kakaoId: mw.profile.kakao_id,
          }
        : undefined,
      workerManagement: {
        rating: mw.rating,
        notes: mw.notes,
        is_favorite: mw.is_favorite,
        is_blacklisted: mw.is_blacklisted,
      },
    }));

  return [...applicationsWithManagement, ...extraApplications];
}

export const useWorkerManagement = (isManager: boolean) => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');
  const [selectedApplication, setSelectedApplication] =
    useState<ApplicationWithPost | null>(null);
  const [selectedWorkerProfile, setSelectedWorkerProfile] =
    useState<GroupedWorker | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const { data: applications = [], isLoading, isSuccess } = useQuery({
    queryKey: ['manager', 'workers'],
    queryFn: fetchWorkerData,
    enabled: isManager,
  });

  const isMounted = isSuccess;

  const groupedWorkers = useMemo(() => {
    if (!isMounted) return [];

    let filtered = applications;

    if (activeTab === 'all') {
      filtered = filtered.filter(
        (app) => app.postStatus === 'recruiting' || app.postStatus === 'urgent'
      );
    } else if (activeTab === 'favorite') {
      filtered = filtered.filter((app) => app.workerManagement?.is_favorite);
    } else if (activeTab === 'blacklist') {
      filtered = filtered.filter((app) => app.workerManagement?.is_blacklisted);
    }

    if (activeTab === 'all' && statusFilter !== 'all') {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (app) =>
          app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.postTitle.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const workerMap = new Map<string, GroupedWorker>();

    filtered.forEach((app) => {
      const existing = workerMap.get(app.applicantId);
      const scheduleItem = {
        id: app.id,
        postId: app.postId,
        postTitle: app.postTitle,
        postDate: app.postDate,
        postLocation: app.postLocation,
        postStatus: app.postStatus,
        appliedAt: app.appliedAt,
        status: app.status,
        message: app.message,
      };

      if (existing) {
        existing.schedules.push(scheduleItem);
      } else {
        workerMap.set(app.applicantId, {
          applicantId: app.applicantId,
          applicantName: app.applicantName,
          applicantPhoto: app.applicantPhoto,
          applicantAttendanceScore: app.applicantAttendanceScore,
          applicantKakaoId: app.applicantKakaoId,
          applicantGender: app.applicantGender,
          applicantAge: app.applicantAge,
          applicantInfo: app.applicantInfo,
          workerManagement: app.workerManagement,
          schedules: [scheduleItem],
        });
      }
    });

    workerMap.forEach((worker) => {
      worker.schedules.sort((a, b) => {
        const aDate = a.postDate ? new Date(a.postDate).getTime() : 0;
        const bDate = b.postDate ? new Date(b.postDate).getTime() : 0;
        if (aDate !== bDate) return bDate - aDate;
        return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime();
      });
    });

    return Array.from(workerMap.values()).sort((a, b) => {
      const aLatest = new Date(a.schedules[0]?.appliedAt || 0).getTime();
      const bLatest = new Date(b.schedules[0]?.appliedAt || 0).getTime();
      return bLatest - aLatest;
    });
  }, [applications, searchTerm, activeTab, statusFilter, isMounted]);

  const statistics = useMemo(() => {
    const activeApplications = applications.filter(
      (app) => app.postStatus === 'recruiting' || app.postStatus === 'urgent'
    );
    const uniqueApplicantCount = new Set(
      activeApplications.map((app) => app.applicantId).filter((id): id is string => !!id)
    ).size;
    return {
      totalApplications: activeApplications.length,
      uniqueApplicants: uniqueApplicantCount,
      pending: activeApplications.filter((app) => app.status === 'pending').length,
      accepted: activeApplications.filter((app) => app.status === 'accepted').length,
      rejected: activeApplications.filter((app) => app.status === 'rejected').length,
    };
  }, [applications]);

  const updateApplicationsCache = (updater: (old: ApplicationWithPost[]) => ApplicationWithPost[]) => {
    queryClient.setQueryData<ApplicationWithPost[]>(
      ['manager', 'workers'],
      (old) => (old ? updater(old) : [])
    );
  };

  const handleStatusChange = useCallback(
    async (applicationId: string, newStatus: ApplicationStatus) => {
      try {
        const result = await updateApplicantStatusAction(applicationId, newStatus);
        if (result.ok) {
          updateApplicationsCache((prev) =>
            prev.map((app) =>
              app.id === applicationId ? { ...app, status: newStatus } : app
            )
          );
          if (selectedApplication?.id === applicationId) {
            setSelectedApplication({ ...selectedApplication, status: newStatus });
          }
          toast.success(result.message);
        } else {
          toast.error(result.message || '상태 변경에 실패했습니다.');
        }
      } catch (error) {
        console.error('Failed to update status:', error);
        toast.error('상태 변경 중 오류가 발생했습니다.');
      }
    },
    [selectedApplication] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleToggleFavorite = useCallback(async (applicantId: string) => {
    const result = await toggleFavoriteAction(applicantId);
    if (result.ok) {
      updateApplicationsCache((prev) =>
        prev.map((app) =>
          app.applicantId === applicantId
            ? {
                ...app,
                workerManagement: {
                  ...app.workerManagement,
                  is_favorite: !app.workerManagement?.is_favorite,
                },
              }
            : app
        )
      );
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleBlacklist = useCallback(async (applicantId: string) => {
    const result = await toggleBlacklistAction(applicantId);
    if (result.ok) {
      updateApplicationsCache((prev) =>
        prev.map((app) =>
          app.applicantId === applicantId
            ? {
                ...app,
                workerManagement: {
                  ...app.workerManagement,
                  is_blacklisted: !app.workerManagement?.is_blacklisted,
                },
              }
            : app
        )
      );
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDataChange = useCallback(
    (workerId: string, data: Partial<ApplicationWithPost['workerManagement']>) => {
      updateApplicationsCache((prev) =>
        prev.map((app) =>
          app.applicantId === workerId
            ? { ...app, workerManagement: { ...app.workerManagement, ...data } }
            : app
        )
      );
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleNotesChange = useCallback(
    (workerId: string, notes: string) => {
      updateApplicationsCache((prev) =>
        prev.map((app) =>
          app.applicantId === workerId
            ? { ...app, workerManagement: { ...app.workerManagement, notes } }
            : app
        )
      );
      setSelectedWorkerProfile((prev) =>
        prev && prev.applicantId === workerId
          ? { ...prev, workerManagement: { ...prev.workerManagement, notes } }
          : prev
      );
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return {
    isMounted,
    isLoading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    selectedApplication,
    setSelectedApplication,
    selectedWorkerProfile,
    setSelectedWorkerProfile,
    applications,
    activeTab,
    setActiveTab,
    groupedWorkers,
    statistics,
    handleStatusChange,
    handleToggleFavorite,
    handleToggleBlacklist,
    handleDataChange,
    handleNotesChange,
  };
};
