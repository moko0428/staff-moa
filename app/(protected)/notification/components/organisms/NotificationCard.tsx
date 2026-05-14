'use client';

import { Button } from '@/app/components/ui/button';
import { Bell, ChevronLeft, ChevronRight } from 'lucide-react';
import { NotificationItem } from '../molecules/NotificationItem';
import { getTimeGroup } from '../../utils/notificationUtils';
import type { Notification } from '../../actions';
import { DISPLAY_PAGE_SIZE } from '../../hooks/useNotifications';

interface Props {
  notifications: Notification[];
  filteredCount: number;
  currentPage: number;
  totalPages: number;
  isSelectMode: boolean;
  selectedIds: string[];
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleSelected: (id: string) => void;
  onOpenDetail: (notification: Notification) => void;
  onPageChange: (page: number) => void;
}

type TimeGroup = '오늘' | '어제' | '이전';

function groupNotifications(notifications: Notification[]): Array<{
  group: TimeGroup;
  items: Notification[];
}> {
  const buckets: Record<TimeGroup, Notification[]> = { 오늘: [], 어제: [], 이전: [] };
  for (const n of notifications) {
    buckets[getTimeGroup(n.created_at)].push(n);
  }
  return (['오늘', '어제', '이전'] as TimeGroup[])
    .filter((g) => buckets[g].length > 0)
    .map((g) => ({ group: g, items: buckets[g] }));
}

export function NotificationCard({
  notifications,
  filteredCount,
  currentPage,
  totalPages,
  isSelectMode,
  selectedIds,
  onMarkAsRead,
  onDelete,
  onToggleSelected,
  onOpenDetail,
  onPageChange,
}: Props) {
  const groups = groupNotifications(notifications);

  const startItem = (currentPage - 1) * DISPLAY_PAGE_SIZE + 1;
  const endItem = Math.min(currentPage * DISPLAY_PAGE_SIZE, filteredCount);

  if (notifications.length === 0 && filteredCount === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Bell className="size-12 mx-auto mb-4 opacity-30" />
        <p className="text-sm">알림이 없습니다</p>
      </div>
    );
  }

  return (
    <div>
      {/* 페이지 범위 표시 */}
      {filteredCount > 0 && (
        <div className="px-4 py-2 text-xs text-muted-foreground border-b border-border">
          {startItem}–{endItem} / {filteredCount}건
        </div>
      )}

      {/* 그룹별 목록 */}
      {groups.map(({ group, items }) => (
        <div key={group}>
          <div className="flex items-center gap-2 px-4 pt-3 pb-1">
            <span className="text-xs font-semibold text-muted-foreground">{group}</span>
            <span className="text-xs text-muted-foreground">· {items.length}</span>
          </div>
          <div className="divide-y divide-border">
            {items.map((notification) => (
              <NotificationItem
                key={notification.notification_id}
                notification={notification}
                isSelectMode={isSelectMode}
                isSelected={selectedIds.includes(notification.notification_id)}
                onToggleSelect={onToggleSelected}
                onMarkAsRead={onMarkAsRead}
                onDelete={onDelete}
                onOpenDetail={onOpenDetail}
              />
            ))}
          </div>
        </div>
      ))}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 py-6 border-t border-border">
          <Button
            size="icon"
            variant="ghost"
            className="size-8"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="size-4" />
          </Button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(
              (p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2
            )
            .reduce<(number | '...')[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
              acc.push(p);
              return acc;
            }, [])
            .map((p, idx) =>
              p === '...' ? (
                <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground text-sm">
                  ...
                </span>
              ) : (
                <Button
                  key={p}
                  size="sm"
                  variant={p === currentPage ? 'default' : 'ghost'}
                  className="size-8 p-0 text-xs"
                  onClick={() => onPageChange(p as number)}
                >
                  {p}
                </Button>
              )
            )}

          <Button
            size="icon"
            variant="ghost"
            className="size-8"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
