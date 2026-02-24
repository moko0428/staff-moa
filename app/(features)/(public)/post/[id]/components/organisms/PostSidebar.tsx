import RecruitmentStatus from '../molecules/RecruitmentStatus';
import ManagerInfo from '../molecules/ManagerInfo';
import ApplySection from '../molecules/ApplySection';
import { PostData } from '../../types';

interface PostSidebarProps {
  post: PostData;
  isMember: boolean;
  roleHydrated: boolean;
  currentUserId: string | null;
  hasApplied: boolean;
  onApply: () => void;
}

const PostSidebar = ({
  post,
  isMember,
  roleHydrated,
  currentUserId,
  hasApplied,
  onApply,
}: PostSidebarProps) => (
  <div className="space-y-6">
    <RecruitmentStatus
      currentApplicants={post.currentApplicants || 0}
      recruitCount={post.recruit_count}
    />
    <ManagerInfo
      managerName={post.manager_name}
      managerPhone={post.manager_phone}
      managerContactType={post.manager_contact_type}
    />
    <ApplySection
      isMember={isMember}
      roleHydrated={roleHydrated}
      currentUserId={currentUserId}
      status={post.status}
      hasApplied={hasApplied}
      onApply={onApply}
    />
  </div>
);

export default PostSidebar;
