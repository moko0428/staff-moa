'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/app/components/ui/dialog';
import { Eye, Trash2 } from 'lucide-react';
import { useAdminPosts } from '../../hooks/useAdminPosts';

export const PostsTab = () => {
  const {
    loadingPosts,
    postSearch,
    setPostSearch,
    postStatusFilter,
    setPostStatusFilter,
    selectedPost,
    setSelectedPost,
    visiblePosts,
    filteredPosts,
    deletePost,
  } = useAdminPosts();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <span>게시글 관리</span>
              <span className="text-sm text-muted-foreground">
                총 {filteredPosts.length}건 / 전체 {visiblePosts.length}건
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <Input
                placeholder="제목 또는 지역으로 검색"
                value={postSearch}
                onChange={(e) => setPostSearch(e.target.value)}
                className="h-9 text-sm"
              />
              <Select
                value={postStatusFilter}
                onValueChange={(value) =>
                  setPostStatusFilter(
                    value as 'all' | 'recruiting' | 'completed' | 'urgent'
                  )
                }
              >
                <SelectTrigger className="h-9 w-full sm:w-40 text-xs">
                  <SelectValue placeholder="상태 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="recruiting">모집중</SelectItem>
                  <SelectItem value="completed">완료</SelectItem>
                  <SelectItem value="urgent">긴급</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loadingPosts ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              불러오는 중...
            </div>
          ) : filteredPosts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              조건에 맞는 게시글이 없습니다.
            </p>
          ) : (
            filteredPosts.map((post) => (
              <div
                key={post.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border px-4 py-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{post.title}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                      {post.status === 'recruiting'
                        ? '모집중'
                        : post.status === 'completed'
                        ? '완료'
                        : '긴급'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {post.location} · {post.workDate} · {post.workTimeStart} ~{' '}
                    {post.workTimeEnd}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    작성자: {post.authorName}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPost(post)}
                  >
                    <Eye className="size-4" />
                    <span className="text-xs">자세히 보기</span>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deletePost(post.id)}
                  >
                    <Trash2 className="size-4" />
                    <span className="text-xs">삭제</span>
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* 게시글 자세히 보기 모달 */}
      <Dialog
        open={!!selectedPost}
        onOpenChange={(open) => !open && setSelectedPost(null)}
      >
        <DialogContent>
          {selectedPost && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-semibold">
                  {selectedPost.title}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {selectedPost.location} · {selectedPost.workDate} ·{' '}
                  {selectedPost.workTimeStart} ~ {selectedPost.workTimeEnd}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-3 space-y-2 text-sm">
                <p className="text-foreground whitespace-pre-line">
                  {selectedPost.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  급여 {Number(selectedPost.payAmount).toLocaleString()}원 (
                  {selectedPost.payType === 'hourly'
                    ? '시급'
                    : selectedPost.payType === 'daily'
                    ? '일급'
                    : selectedPost.payType === 'weekly'
                    ? '주급'
                    : '월급'}
                  ) · 모집 {selectedPost.recruitCount}명
                </p>
                <p className="text-xs text-muted-foreground">
                  작성자: {selectedPost.authorName}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
