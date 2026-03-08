import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import JobCard from '@/app/components/JobCard';
import { Heart, Search, ArrowUpDown, Loader2 } from 'lucide-react';
import { postToJobItem } from '../../utils/postConverters';
import type { SortOrder, ConvertedPost } from '../../types';
import type { Post } from '@/types/mockData';

type Props = {
  isLoading: boolean;
  isLoadingMatched: boolean;
  favoritePosts: Post[];
  matchedPosts: Post[];
  filteredAndSortedPosts: Post[];
  filteredMatchedPosts: Post[];
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  sortOrder: SortOrder;
  setSortOrder: (v: SortOrder) => void;
};

export function PostsTab({
  isLoading,
  isLoadingMatched,
  favoritePosts,
  matchedPosts,
  filteredAndSortedPosts,
  filteredMatchedPosts,
  searchTerm,
  setSearchTerm,
  sortOrder,
  setSortOrder,
}: Props) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="size-12 text-muted-foreground/50 mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">관심 목록을 불러오는 중...</p>
        </CardContent>
      </Card>
    );
  }

  if (favoritePosts.length === 0 && matchedPosts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Heart className="size-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">관심 목록이 비어있습니다</p>
          <p className="text-sm text-muted-foreground/80 mb-4">
            관심 공고를 저장하거나, 관심 키워드/팔로우 매니저를 설정해보세요.
          </p>
          <Button onClick={() => (window.location.href = '/post')}>공고 둘러보기</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* 검색 및 필터 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground/80" />
                <Input
                  placeholder="제목, 장소, 키워드로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select
                value={sortOrder}
                onValueChange={(value) => setSortOrder(value as SortOrder)}
              >
                <SelectTrigger>
                  <ArrowUpDown className="size-4 mr-2" />
                  <SelectValue placeholder="정렬 기준" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">최신순</SelectItem>
                  <SelectItem value="oldest">오래된순</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-8">
        {/* 맞춤 공고 */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">맞춤 공고</h3>
          {isLoadingMatched ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Loader2 className="size-10 text-muted-foreground/50 mx-auto mb-3 animate-spin" />
                <p className="text-muted-foreground">맞춤 공고를 불러오는 중...</p>
              </CardContent>
            </Card>
          ) : filteredMatchedPosts.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  아직 매칭된 공고가 없습니다. 키워드/매니저를 설정해보세요.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredMatchedPosts.map((post) => (
                <JobCard key={`matched-${post.id}`} item={postToJobItem(post as ConvertedPost)} />
              ))}
            </div>
          )}
        </div>

        {/* 저장한 공고 */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">저장한 공고</h3>
          {filteredAndSortedPosts.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  저장한 공고가 없습니다. 공고 카드의 하트를 눌러 저장하세요.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredAndSortedPosts.map((post) => (
                <JobCard key={post.id} item={postToJobItem(post as ConvertedPost)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
