'use client';

import Hero from '@/app/components/Hero';
import { Card, CardContent } from '@/app/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs';
import { Loader2, FileText, Tag, Users } from 'lucide-react';
import ProfileModal from '@/app/components/profile-modal';
import { useFavorit } from './hooks/useFavorit';
import { PostsTab } from './components/organisms/PostsTab';
import { KeywordsTab } from './components/organisms/KeywordsTab';
import { ManagersTab } from './components/organisms/ManagersTab';

export default function WorkerFavoritePage() {
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
      <Hero
        title="관심 목록"
        description="관심있는 공고와 매니저를 저장하고 빠르게 확인하세요"
      />

      {!roleHydrated ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="size-12 text-muted-foreground/50 mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">역할 정보를 불러오는 중입니다...</p>
          </CardContent>
        </Card>
      ) : !isMember ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">스탭만 관심 목록을 사용할 수 있습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full max-w-xl mx-auto mb-6 grid-cols-3">
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <FileText className="size-4" />
              포스트
            </TabsTrigger>
            <TabsTrigger value="keywords" className="flex items-center gap-2">
              <Tag className="size-4" />
              키워드
            </TabsTrigger>
            <TabsTrigger value="managers" className="flex items-center gap-2">
              <Users className="size-4" />
              매니저
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
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

          <TabsContent value="keywords">
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

          <TabsContent value="managers">
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
