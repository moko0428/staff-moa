import RecruitmentStatus from '../molecules/RecruitmentStatus';
import { PostData } from '../../types';

interface PostSidebarProps {
  post: PostData;
}

const PostSidebar = ({ post }: PostSidebarProps) => (
  <div className="space-y-6">
    <RecruitmentStatus
      currentApplicants={post.currentApplicants || 0}
      recruitCount={post.recruit_count}
    />
  </div>
);

export default PostSidebar;
