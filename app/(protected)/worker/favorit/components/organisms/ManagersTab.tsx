import { Card, CardContent } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { ManagerListItem } from '../molecules/ManagerListItem';
import type { ManagerInfo } from '../../types';

type Props = {
  followedManagerIds: string[];
  activeManagers: ManagerInfo[];
  filteredActiveManagers: ManagerInfo[];
  managerSearch: string;
  setManagerSearch: (v: string) => void;
  isLoadingManagers: boolean;
  onProfileClick: (managerId: string) => void;
  onFollow: (managerId: string) => void;
  onUnfollow: (managerId: string) => void;
};

export function ManagersTab({
  followedManagerIds,
  activeManagers,
  filteredActiveManagers,
  managerSearch,
  setManagerSearch,
  isLoadingManagers,
  onProfileClick,
  onFollow,
  onUnfollow,
}: Props) {
  return (
    <div className="space-y-6">
      {/* 팔로우한 매니저 */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <p className="font-semibold">팔로우한 매니저</p>
          <p className="text-sm text-muted-foreground">
            팔로우한 매니저가 공고를 올리면 알림을 받을 수 있습니다.
          </p>
          {followedManagerIds.length === 0 ? (
            <div className="py-6 text-sm text-muted-foreground">
              아직 팔로우한 매니저가 없습니다.
            </div>
          ) : (
            <div className="space-y-2 max-h-[264px] overflow-y-auto pr-1">
              {followedManagerIds.map((id) => {
                const m = activeManagers.find((x) => x.managerId === id);
                return (
                  <ManagerListItem
                    key={`followed-${id}`}
                    manager={m ?? { managerId: id }}
                    isFollowed
                    onProfileClick={onProfileClick}
                    onFollow={onFollow}
                    onUnfollow={onUnfollow}
                  />
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 매니저 찾기 */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <p className="font-semibold">매니저 찾기</p>
          <Input
            placeholder="매니저 이름으로 검색"
            value={managerSearch}
            onChange={(e) => setManagerSearch(e.target.value)}
          />
          {isLoadingManagers ? (
            <div className="py-6 text-sm text-muted-foreground">불러오는 중...</div>
          ) : filteredActiveManagers.length === 0 ? (
            <div className="py-6 text-sm text-muted-foreground">검색 결과가 없습니다.</div>
          ) : (
            <div className="space-y-2 max-h-[264px] overflow-y-auto pr-1">
              {filteredActiveManagers.slice(0, 50).map((m) => (
                <ManagerListItem
                  key={m.managerId}
                  manager={m}
                  isFollowed={followedManagerIds.includes(m.managerId)}
                  onProfileClick={onProfileClick}
                  onFollow={onFollow}
                  onUnfollow={onUnfollow}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
