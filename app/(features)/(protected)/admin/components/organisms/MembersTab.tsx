'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/app/components/ui/avatar';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { ShieldBan } from 'lucide-react';
import { useAdminMembers } from '../../hooks/useAdminMembers';

export const MembersTab = () => {
  const {
    members,
    loadingMembers,
    bannedUserIds,
    memberSearch,
    setMemberSearch,
    memberRoleFilter,
    setMemberRoleFilter,
    filteredMembers,
    toggleBan,
  } = useAdminMembers();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <span>회원 관리</span>
            <span className="text-sm text-muted-foreground">
              총 {filteredMembers.length}명 / 전체 {members.length}명 (관리자 제외)
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <Input
              placeholder="이름 또는 이메일로 검색"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="h-9 text-sm"
            />
            <Select
              value={memberRoleFilter}
              onValueChange={(value) =>
                setMemberRoleFilter(value as 'all' | 'member' | 'manager' | 'banned')
              }
            >
              <SelectTrigger className="h-9 w-full sm:w-40 text-xs">
                <SelectValue placeholder="역할 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="member">스탭만</SelectItem>
                <SelectItem value="manager">매니저만</SelectItem>
                <SelectItem value="banned">정지 스탭만</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loadingMembers ? (
          <div className="text-sm text-muted-foreground py-6 text-center">
            불러오는 중...
          </div>
        ) : filteredMembers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            조건에 맞는 회원이 없습니다.
          </p>
        ) : (
          filteredMembers.map((user) => {
            const isBanned = bannedUserIds.includes(user.id);
            return (
              <div
                key={user.id}
                className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.photo ?? undefined} alt={user.name ?? '사용자'} />
                    <AvatarFallback>{user.name?.at(0) ?? '?'}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{user.name ?? '알 수 없음'}</span>
                    <span className="text-xs text-muted-foreground">
                      {user.email ?? '이메일 없음'}
                    </span>
                    <div className="flex items-center gap-1 mt-1">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                        {user.role === 'manager' ? '매니저' : '스탭'}
                      </Badge>
                      {user.role === 'member' && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                          근태 {user.attendanceScore ?? 0}점
                        </Badge>
                      )}
                      {isBanned && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5">
                          정지됨
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={isBanned ? 'outline' : 'destructive'}
                    size="sm"
                    onClick={() => toggleBan(user.id)}
                  >
                    <ShieldBan className="size-4" />
                    <span className="text-xs">{isBanned ? '정지 해제' : '정지(벤)'}</span>
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
