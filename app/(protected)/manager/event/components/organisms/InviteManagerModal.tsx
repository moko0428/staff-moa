'use client';

import { useState } from 'react';
import { Search, UserPlus, X } from 'lucide-react';
import type { CoManager, CoManagerRole } from '../../types';
import { CO_MANAGER_ROLES } from '../../constants';
import { formatPhone, nowHHmm } from '../../utils';
import { AvatarCircle } from '../atoms/AvatarCircle';

interface Props {
  coManagers: CoManager[];
  onAdd: (manager: CoManager) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}

export function InviteManagerModal({ coManagers, onAdd, onRemove, onClose }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [managerRole, setManagerRole] = useState<CoManagerRole>('팀장');

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({
      id: `co-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim() || null,
      avatar: null,
      role: managerRole,
      addedAt: nowHHmm(),
    });
    setName('');
    setPhone('');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base">현장 매니저 초대</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                role이 manager인 유저를 현장 운영에 초대합니다
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          </div>

          {coManagers.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">
                초대된 매니저 ({coManagers.length}명)
              </p>
              {coManagers.map((cm) => (
                <div
                  key={cm.id}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/50 border border-border"
                >
                  <AvatarCircle name={cm.name} avatar={cm.avatar} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug">{cm.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {cm.role} · {cm.addedAt} 초대
                      {cm.phone && ` · ${formatPhone(cm.phone)}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(cm.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="border-t pt-4 space-y-3">
            <p className="text-xs text-muted-foreground font-medium">매니저 검색 및 추가</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="이름 또는 전화번호 검색"
                className="w-full pl-8 pr-3 py-2 text-sm border rounded-lg bg-card outline-none focus:ring-1 focus:ring-ring"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            {searchQuery && (
              <div className="rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">
                <Search className="size-5 mx-auto mb-1.5 opacity-30" />
                서버 연동 후 검색 결과가 여기에 표시됩니다
              </div>
            )}

            <div className="flex gap-2">
              {CO_MANAGER_ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setManagerRole(r)}
                  className={`flex-1 text-sm py-2 rounded-xl border transition-colors ${
                    managerRole === r
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름"
                className="flex-1 px-3 py-2 text-sm border rounded-lg bg-card outline-none focus:ring-1 focus:ring-ring"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="전화번호 (선택)"
                className="flex-1 px-3 py-2 text-sm border rounded-lg bg-card outline-none focus:ring-1 focus:ring-ring"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
            </div>

            <button
              type="button"
              disabled={!name.trim()}
              onClick={handleAdd}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
            >
              <UserPlus className="size-4" />
              초대하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
