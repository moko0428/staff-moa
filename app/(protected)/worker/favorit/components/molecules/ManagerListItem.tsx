import { Button } from '@/app/components/ui/button';
import UserAvatar from '@/app/common/components/UserAvatar';
import type { ManagerInfo } from '../../types';

type Props = {
  manager: ManagerInfo | { managerId: string; managerName?: string; avatar?: string | null };
  isFollowed: boolean;
  onProfileClick: (managerId: string) => void;
  onFollow: (managerId: string) => void;
  onUnfollow: (managerId: string) => void;
};

export function ManagerListItem({ manager, isFollowed, onProfileClick, onFollow, onUnfollow }: Props) {
  const name = (manager as ManagerInfo).managerName || '매니저';
  const avatar = (manager as ManagerInfo).avatar;

  return (
    <div
      className="flex items-center justify-between rounded-md border p-3 cursor-pointer hover:bg-accent"
      onClick={() => onProfileClick(manager.managerId)}
    >
      <div className="min-w-0 flex items-center gap-3">
        <UserAvatar src={avatar} name={name} className="size-10" />
        <p className="font-medium truncate">{name}</p>
      </div>
      {isFollowed ? (
        <Button
          type="button"
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation();
            onUnfollow(manager.managerId);
          }}
        >
          팔로잉
        </Button>
      ) : (
        <Button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onFollow(manager.managerId);
          }}
        >
          팔로우
        </Button>
      )}
    </div>
  );
}
