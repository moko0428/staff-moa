'use client';

import { useNotifications } from './hooks/useNotifications';
import { NotificationCard } from './components/organisms/NotificationCard';
import { NotificationDetailModal } from './components/molecules/NotificationDetailModal';
import PageHeader from '@/app/components/PageHeader';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { Search, MoreVertical, SquareCheck, Square, Trash2 } from 'lucide-react';
import { filterConfig } from './utils/notificationUtils';
import { cn } from '@/lib/utils';

export default function NotificationPage() {
  const {
    notifications,
    filteredCount,
    isLoading,
    isSelectMode,
    selectedIds,
    unreadCount,
    searchQuery,
    activeFilter,
    currentPage,
    totalPages,
    selectedNotification,
    handleMarkAsRead,
    handleMarkAllAsRead,
    handleDelete,
    handleToggleSelectMode,
    handleToggleSelected,
    handleDeleteSelected,
    handleOpenDetail,
    handleCloseDetail,
    handleFilterChange,
    handleSearchChange,
    handlePageChange,
    refetch,
  } = useNotifications();

  const headerRight = (
    <div className="flex items-center gap-0.5">
      {isSelectMode ? (
        <>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-xs"
            onClick={handleToggleSelectMode}
          >
            <SquareCheck className="size-4 mr-1" />
            취소
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-xs text-destructive hover:text-destructive"
            onClick={handleDeleteSelected}
            disabled={selectedIds.length === 0}
          >
            <Trash2 className="size-4 mr-1" />
            {selectedIds.length}
          </Button>
        </>
      ) : (
        <>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-xs"
            onClick={handleToggleSelectMode}
          >
            <Square className="size-4 mr-1" />
            선택
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="size-8">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
                모두 읽음
              </DropdownMenuItem>
              <DropdownMenuItem onClick={refetch}>
                새로고침
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </div>
  );

  return (
    <div className="bg-background min-h-screen">
      {/* ── sticky 영역 ── */}
      <div className="sticky top-0 z-40 bg-background">
        <PageHeader
          title={
            <span className="flex items-center gap-1.5">
              알림
              {unreadCount > 0 && (
                <Badge className="bg-red-500 text-white text-xs px-1.5 py-0 leading-none h-5">
                  {unreadCount}
                </Badge>
              )}
            </span>
          }
          right={headerRight}
        />

        {/* 검색 */}
        <div className="px-4 py-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="알림 내용 검색"
              className="pl-9 bg-muted border-0 h-10 text-sm"
            />
          </div>
        </div>

        {/* 필터 탭 */}
        <div className="flex gap-2 px-4 py-2.5 overflow-x-auto scrollbar-hide border-b border-border">
          {filterConfig.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => handleFilterChange(f.id)}
              className={cn(
                'flex items-center gap-1 shrink-0 rounded-full px-3.5 py-1 text-sm font-medium transition-colors',
                activeFilter === f.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              )}
            >
              {f.label}
              {f.id === 'unread' && unreadCount > 0 && (
                <span
                  className={cn(
                    'text-xs font-bold leading-none',
                    activeFilter === f.id ? 'text-primary-foreground' : 'text-primary'
                  )}
                >
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── 스크롤 영역 ── */}
      {isLoading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <p className="text-sm text-muted-foreground">로딩 중...</p>
        </div>
      ) : (
        <NotificationCard
          notifications={notifications}
          filteredCount={filteredCount}
          currentPage={currentPage}
          totalPages={totalPages}
          isSelectMode={isSelectMode}
          selectedIds={selectedIds}
          onMarkAsRead={handleMarkAsRead}
          onDelete={handleDelete}
          onToggleSelected={handleToggleSelected}
          onOpenDetail={handleOpenDetail}
          onPageChange={handlePageChange}
        />
      )}

      <NotificationDetailModal
        notification={selectedNotification}
        onClose={handleCloseDetail}
        onDelete={handleDelete}
      />
    </div>
  );
}
