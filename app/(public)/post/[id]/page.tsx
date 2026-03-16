'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import ReportModal from '@/app/components/ReportModal';
import ProfileModal from '@/app/components/profile-modal';
import PostActionBar from './components/molecules/PostActionBar';
import BottomActionBar from './components/molecules/BottomActionBar';
import PostHeader from './components/organisms/PostHeader';
import PostDetailBody from './components/organisms/PostDetailBody';
import PostSidebar from './components/organisms/PostSidebar';
import ApplyModal from './components/organisms/ApplyModal';
import LoginPromptModal from './components/organisms/LoginPromptModal';
import PostDetailSkeleton from './components/organisms/PostDetailSkeleton';
import { usePostDetail } from './hooks/usePostDetail';

const PostDetailPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const router = useRouter();

  const {
    post,
    isLoading,
    isFavorite,
    applyOpen,
    setApplyOpen,
    currentUser,
    currentUserId,
    applicationMessage,
    setApplicationMessage,
    hasApplied,
    reportOpen,
    setReportOpen,
    hasReported,
    markAsReported,
    profileModalOpen,
    setProfileModalOpen,
    loginPromptOpen,
    setLoginPromptOpen,
    profileModalUser,
    isMember,
    isManager,
    roleHydrated,
    toggleFavorite,
    handleSubmitApplication,
    handleDeletePost,
    handleShare,
    handleAuthorProfileClick,
  } = usePostDetail(id);

  if (isLoading) return <PostDetailSkeleton />;

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">존재하지 않는 공고입니다.</p>
        <Button onClick={() => router.push('/post')}>
          <ArrowLeft className="size-4 mr-2" />
          공고 목록으로
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <PostActionBar
        isMember={isMember}
        roleHydrated={roleHydrated}
        currentUserId={currentUserId}
        authorId={post.author_id}
        hasReported={hasReported}
        onBack={() => router.push('/post')}
        onDelete={handleDeletePost}
        onShare={handleShare}
        onReport={() => setReportOpen(true)}
      />

      <PostHeader post={post} onAuthorClick={handleAuthorProfileClick} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PostDetailBody post={post} />
        <PostSidebar post={post} />
      </div>

      {/* 지원하기 모달 */}
      <ApplyModal
        open={applyOpen}
        onOpenChange={setApplyOpen}
        title={post.title}
        currentUser={currentUser}
        applicationMessage={applicationMessage}
        onMessageChange={setApplicationMessage}
        onSubmit={handleSubmitApplication}
      />

      {/* 신고하기 모달 */}
      <ReportModal
        open={reportOpen}
        onOpenChange={setReportOpen}
        postId={post.post_id}
        postTitle={post.title}
        onReported={markAsReported}
      />

      {profileModalUser && (
        <ProfileModal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          user={profileModalUser}
          currentUserId={currentUserId ?? undefined}
        />
      )}

      <LoginPromptModal
        open={loginPromptOpen}
        onOpenChange={setLoginPromptOpen}
        currentUserId={currentUserId}
        onLogin={() => router.push('/auth')}
      />

      {!isManager && (
        <BottomActionBar
          isMember={isMember}
          roleHydrated={roleHydrated}
          status={post.status}
          hasApplied={hasApplied}
          isFavorite={isFavorite}
          onApply={() => setApplyOpen(true)}
          onToggleFavorite={toggleFavorite}
        />
      )}
    </div>
  );
};

export default PostDetailPage;
