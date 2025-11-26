'use client';

import { useState, useEffect } from 'react';
import { Post } from '@/types/mockData';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Edit, Trash2, Calendar, Users, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MyPostCardProps {
  post: Post;
  onEdit?: (post: Post) => void;
  onDelete?: (postId: string) => void;
  onStatusToggle?: (postId: string, newStatus: Post['status']) => void;
}

export default function MyPostCard({
  post,
  onEdit,
  onDelete,
  onStatusToggle,
}: MyPostCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPost, setEditedPost] = useState<Post>(post);
  const [isUrgent, setIsUrgent] = useState(post.status === 'urgent');
  const [isCompleted, setIsCompleted] = useState(post.status === 'completed');
  const [previousStatus, setPreviousStatus] = useState<Post['status']>(
    post.status === 'completed' ? 'recruiting' : post.status
  );
  const [newKeyword, setNewKeyword] = useState('');

  // post 상태가 변경되면 로컬 상태 업데이트
  useEffect(() => {
    setIsUrgent(post.status === 'urgent');
    setIsCompleted(post.status === 'completed');
    if (post.status !== 'completed') {
      setPreviousStatus(post.status);
    }
  }, [post.status]);

  const handleUrgentToggle = (checked: boolean) => {
    if (isCompleted) return; // 모집 완료 상태에서는 급구 토글 비활성화

    setIsUrgent(checked);
    const newStatus = checked ? 'urgent' : 'recruiting';
    setPreviousStatus(newStatus);
    onStatusToggle?.(post.id, newStatus);
  };

  const handleCompletedToggle = (checked: boolean) => {
    setIsCompleted(checked);
    if (checked) {
      // 모집 완료로 변경
      onStatusToggle?.(post.id, 'completed');
    } else {
      // 이전 상태로 복원
      onStatusToggle?.(post.id, previousStatus);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('정말 삭제하시겠습니까?')) {
      onDelete?.(post.id);
    }
  };

  const handleSave = () => {
    onEdit?.(editedPost);
    setIsEditing(false);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setEditedPost(post);
    setIsEditing(false);
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !editedPost.keywords.includes(newKeyword.trim())) {
      setEditedPost({
        ...editedPost,
        keywords: [...editedPost.keywords, newKeyword.trim()],
      });
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (keywordToRemove: string) => {
    setEditedPost({
      ...editedPost,
      keywords: editedPost.keywords.filter((k) => k !== keywordToRemove),
    });
  };

  const handleKeywordKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const statusBadge = {
    urgent: {
      label: '급구',
      className: 'bg-red-100 text-red-700 border-red-200',
    },
    recruiting: {
      label: '모집중',
      className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    },
    completed: {
      label: '완료',
      className: 'bg-gray-100 text-gray-600 border-gray-200',
    },
  }[post.status];

  return (
    <>
      <Card
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setIsOpen(true)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge className={cn('text-xs', statusBadge.className)}>
                  {statusBadge.label}
                </Badge>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">급구</span>
                  <Switch
                    checked={isUrgent}
                    disabled={isCompleted}
                    onCheckedChange={handleUrgentToggle}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">모집 완료</span>
                  <Switch
                    checked={isCompleted}
                    onCheckedChange={handleCompletedToggle}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  className="ml-auto h-8 w-8 text-gray-500 hover:text-destructive hover:bg-destructive/10"
                  aria-label="삭제"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {post.title}
              </h3>
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                <Calendar className="size-4" />
                <span>작성일: {post.createdAt}</span>
              </div>
              <div className="flex items-center gap-2 mt-2 text-sm">
                <Users className="size-4 text-gray-500" />
                <span className="text-gray-700 font-medium">
                  지원 현황: {post.currentApplicants}/{post.recruitCount}명
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? '공고 수정' : '공고 상세'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? '공고 정보를 수정할 수 있습니다.'
                : '공고 상세 정보를 확인하세요.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="title">제목</Label>
                  <Input
                    id="title"
                    value={editedPost.title}
                    onChange={(e) =>
                      setEditedPost({ ...editedPost, title: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">설명</Label>
                  <textarea
                    id="description"
                    className="w-full min-h-[100px] px-3 py-2 border rounded-md resize-none"
                    value={editedPost.description}
                    onChange={(e) =>
                      setEditedPost({
                        ...editedPost,
                        description: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">날짜</Label>
                    <Input
                      id="date"
                      type="date"
                      value={editedPost.date}
                      onChange={(e) =>
                        setEditedPost({ ...editedPost, date: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time">시간</Label>
                    <Input
                      id="time"
                      value={editedPost.time}
                      onChange={(e) =>
                        setEditedPost({ ...editedPost, time: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">장소</Label>
                  <Input
                    id="location"
                    value={editedPost.location}
                    onChange={(e) =>
                      setEditedPost({ ...editedPost, location: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salary">급여</Label>
                  <Input
                    id="salary"
                    type="number"
                    value={editedPost.salary}
                    onChange={(e) =>
                      setEditedPost({
                        ...editedPost,
                        salary: Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recruitCount">모집 인원</Label>
                    <Input
                      id="recruitCount"
                      type="number"
                      value={editedPost.recruitCount}
                      onChange={(e) =>
                        setEditedPost({
                          ...editedPost,
                          recruitCount: Number(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentApplicants">현재 지원자</Label>
                    <Input
                      id="currentApplicants"
                      type="number"
                      value={editedPost.currentApplicants}
                      onChange={(e) =>
                        setEditedPost({
                          ...editedPost,
                          currentApplicants: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preparation">준비물</Label>
                  <Input
                    id="preparation"
                    value={editedPost.preparation}
                    onChange={(e) =>
                      setEditedPost({
                        ...editedPost,
                        preparation: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requirements">자격 요건</Label>
                  <Input
                    id="requirements"
                    value={editedPost.requirements || ''}
                    onChange={(e) =>
                      setEditedPost({
                        ...editedPost,
                        requirements: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferences">우대 사항</Label>
                  <Input
                    id="preferences"
                    value={editedPost.preferences || ''}
                    onChange={(e) =>
                      setEditedPost({
                        ...editedPost,
                        preferences: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">기타 사항</Label>
                  <textarea
                    id="notes"
                    className="w-full min-h-[80px] px-3 py-2 border rounded-md resize-none"
                    value={editedPost.notes || ''}
                    onChange={(e) =>
                      setEditedPost({ ...editedPost, notes: e.target.value })
                    }
                  />
                </div>

                {/* 키워드 추가/삭제 섹션 */}
                <div className="space-y-2">
                  <Label>키워드</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {editedPost.keywords.map((keyword) => (
                      <Badge
                        key={keyword}
                        variant="outline"
                        className="flex items-center gap-1 pr-1"
                      >
                        <span>{keyword}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyword(keyword)}
                          className="ml-1 rounded-full hover:bg-gray-200 p-0.5 transition-colors"
                          aria-label={`${keyword} 삭제`}
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyPress={handleKeywordKeyPress}
                      placeholder="키워드 입력 후 Enter 또는 추가 버튼 클릭"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddKeyword}
                      disabled={!newKeyword.trim()}
                    >
                      <Plus className="size-4" />
                      추가
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Badge className={cn('text-xs', statusBadge.className)}>
                    {statusBadge.label}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    작성일: {post.createdAt}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
                  <p className="text-gray-700">{post.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">날짜:</span>{' '}
                    <span className="font-medium">{post.date}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">시간:</span>{' '}
                    <span className="font-medium">{post.time}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">장소:</span>{' '}
                    <span className="font-medium">{post.location}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">급여:</span>{' '}
                    <span className="font-medium">
                      {post.salary.toLocaleString()}원
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">모집 인원:</span>{' '}
                    <span className="font-medium">
                      {post.currentApplicants}/{post.recruitCount}명
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">지급일:</span>{' '}
                    <span className="font-medium">{post.paymentDate}</span>
                  </div>
                </div>

                {post.preparation && (
                  <div>
                    <span className="text-gray-500">준비물:</span>{' '}
                    <span className="font-medium">{post.preparation}</span>
                  </div>
                )}

                {post.requirements && (
                  <div>
                    <span className="text-gray-500">자격 요건:</span>{' '}
                    <span className="font-medium">{post.requirements}</span>
                  </div>
                )}

                {post.preferences && (
                  <div>
                    <span className="text-gray-500">우대 사항:</span>{' '}
                    <span className="font-medium">{post.preferences}</span>
                  </div>
                )}

                {post.notes && (
                  <div>
                    <span className="text-gray-500">기타 사항:</span>{' '}
                    <span className="font-medium">{post.notes}</span>
                  </div>
                )}

                <div>
                  <span className="text-gray-500">키워드:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {post.keywords.map((keyword) => (
                      <Badge key={keyword} variant="outline">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-gray-500">담당자:</span>{' '}
                  <span className="font-medium">{post.managerInfo.name}</span>
                  <span className="text-gray-500 ml-4">연락처:</span>{' '}
                  <span className="font-medium">{post.managerInfo.phone}</span>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancel}>
                  취소
                </Button>
                <Button onClick={handleSave}>저장</Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  닫기
                </Button>
                <Button onClick={handleEdit}>
                  <Edit className="size-4" />
                  수정
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
