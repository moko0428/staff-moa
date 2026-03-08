import PostCardSkeleton from '../molecules/PostCardSkeleton';

const PostListSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <PostCardSkeleton key={i} />
    ))}
  </div>
);

export default PostListSkeleton;
