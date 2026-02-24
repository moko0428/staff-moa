import JobCard, { type JobItem } from '@/app/components/JobCard';
import { Card, CardContent } from '@/app/components/ui/card';
import PostListSkeleton from './PostListSkeleton';

interface PostListProps {
  items: JobItem[];
  isLoading: boolean;
}

const PostList = ({ items, isLoading }: PostListProps) => {
  if (isLoading) return <PostListSkeleton />;

  if (items.length === 0) {
    return (
      <Card className="mb-3">
        <CardContent className="py-6 text-center">
          <p className="text-sm text-muted-foreground">조건에 맞는 공고가 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
      {items.map((item) => (
        <JobCard key={item.id} item={item} />
      ))}
    </div>
  );
};

export default PostList;
