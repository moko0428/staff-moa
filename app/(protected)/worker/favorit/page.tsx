'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs';
import {
  Loader2,
  FileText,
  Tag,
  Users,
  Search,
  ArrowUpDown,
} from 'lucide-react';
import ProfileModal from '@/app/components/profile-modal';
import { useFavorit } from './hooks/useFavorit';
import { PostsTab } from './components/organisms/PostsTab';
import { KeywordsTab } from './components/organisms/KeywordsTab';
import { ManagersTab } from './components/organisms/ManagersTab';
import type { SortOrder } from './types';

export default function WorkerFavoritePage() {
  const [activeTab, setActiveTab] = useState('posts');

  const {
    roleHydrated,
    isMember,
    favoritePosts,
    matchedPosts,
    isLoading,
    isLoadingMatched,
    searchTerm,
    setSearchTerm,
    sortOrder,
    setSortOrder,
    favoriteKeywords,
    activeKeywords,
    newKeyword,
    setNewKeyword,
    isLoadingKeywords,
    followedManagerIds,
    activeManagers,
    managerSearch,
    setManagerSearch,
    isLoadingManagers,
    profileModalOpen,
    setProfileModalOpen,
    profileModalUser,
    currentUserId,
    filteredAndSortedPosts,
    filteredMatchedPosts,
    filteredActiveManagers,
    handleAddKeyword,
    handleRemoveKeyword,
    handleAddKeywordFromSuggestion,
    handleFollowManager,
    handleUnfollowManager,
    openManagerProfile,
  } = useFavorit();

  return (
    <div>
      {!roleHydrated ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="size-12 text-muted-foreground/50 mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">
              역할 정보를 불러오는 중입니다...
            </p>
          </CardContent>
        </Card>
      ) : !isMember ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              스탭만 관심 목록을 사용할 수 있습니다.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* 데스크톱: 4열 레이아웃 (사이드바 1 + 콘텐츠 3) */}
          <div className="md:grid md:grid-cols-4 md:gap-6 md:items-start">
            {/* 좌측 사이드바 */}
            <div className="md:col-span-1 md:sticky md:top-20">
              <TabsList className="grid grid-cols-3 w-full mb-4 md:flex md:flex-col md:h-auto md:gap-1 md:bg-muted md:p-1 md:rounded-lg">
                <TabsTrigger
                  value="posts"
                  className="flex items-center gap-2 md:w-full md:justify-start md:px-3 md:py-2.5"
                >
                  <FileText className="size-4 shrink-0" />
                  <span>포스트</span>
                </TabsTrigger>
                <TabsTrigger
                  value="keywords"
                  className="flex items-center gap-2 md:w-full md:justify-start md:px-3 md:py-2.5"
                >
                  <Tag className="size-4 shrink-0" />
                  <span>키워드</span>
                </TabsTrigger>
                <TabsTrigger
                  value="managers"
                  className="flex items-center gap-2 md:w-full md:justify-start md:px-3 md:py-2.5"
                >
                  <Users className="size-4 shrink-0" />
                  <span>매니저</span>
                </TabsTrigger>
              </TabsList>

              {/* 필터 섹션 - 데스크톱 사이드바, 포스트 탭일 때만 */}
              {activeTab === 'posts' && (
                <div className="hidden md:block">
                  <Card>
                    <CardContent className="pt-4 pb-4 space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/80" />
                        <Input
                          placeholder="제목, 장소, 키워드..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Select
                        value={sortOrder}
                        onValueChange={(v) => setSortOrder(v as SortOrder)}
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
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* 우측 콘텐츠 (3열) */}
            <div className="md:col-span-3">
              <TabsContent value="posts" className="mt-4 md:mt-0">
                <PostsTab
                  isLoading={isLoading}
                  isLoadingMatched={isLoadingMatched}
                  favoritePosts={favoritePosts}
                  matchedPosts={matchedPosts}
                  filteredAndSortedPosts={filteredAndSortedPosts}
                  filteredMatchedPosts={filteredMatchedPosts}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  sortOrder={sortOrder}
                  setSortOrder={setSortOrder}
                />
              </TabsContent>

              <TabsContent value="keywords" className="mt-4 md:mt-0">
                <KeywordsTab
                  favoriteKeywords={favoriteKeywords}
                  activeKeywords={activeKeywords}
                  newKeyword={newKeyword}
                  setNewKeyword={setNewKeyword}
                  isLoadingKeywords={isLoadingKeywords}
                  onAddKeyword={handleAddKeyword}
                  onRemoveKeyword={handleRemoveKeyword}
                  onAddFromSuggestion={handleAddKeywordFromSuggestion}
                />
              </TabsContent>

              <TabsContent value="managers" className="mt-4 md:mt-0">
                <ManagersTab
                  followedManagerIds={followedManagerIds}
                  activeManagers={activeManagers}
                  filteredActiveManagers={filteredActiveManagers}
                  managerSearch={managerSearch}
                  setManagerSearch={setManagerSearch}
                  isLoadingManagers={isLoadingManagers}
                  onProfileClick={openManagerProfile}
                  onFollow={handleFollowManager}
                  onUnfollow={handleUnfollowManager}
                />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      )}

      {profileModalUser && (
        <ProfileModal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          user={profileModalUser}
          currentUserId={currentUserId}
          isFollowing={followedManagerIds.includes(profileModalUser.id)}
          onFollowToggle={async () => {
            const id = profileModalUser.id;
            if (followedManagerIds.includes(id)) {
              await handleUnfollowManager(id);
            } else {
              await handleFollowManager(id);
            }
          }}
        />
      )}
    </div>
  );
}
