import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Accordion } from '@/app/components/ui/accordion';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/app/components/ui/avatar';
import { User } from 'lucide-react';
import { AccountInfoAccordion } from './AccountInfoAccordion';
import { ProfileVisibilityAccordion } from './ProfileVisibilityAccordion';
import { AccountManagementAccordion } from './AccountManagementAccordion';
import type { ProfileVisibility } from '../../actions';
import type { UserProfile } from '../../hooks/useSettingsPage';

type Props = {
  userProfile: UserProfile | null;
  isMember: boolean;
  profileVisibility: ProfileVisibility;
  getFieldPreview: (field: keyof ProfileVisibility) => string;
  onVisibilityToggle: (key: keyof ProfileVisibility) => void;
  showManagerRequestDialog: boolean;
  setShowManagerRequestDialog: (open: boolean) => void;
  isRequestingManagerRole: boolean;
  onRequestManagerRole: () => void;
  showDeleteDialog: boolean;
  setShowDeleteDialog: (open: boolean) => void;
  deleteConfirmText: string;
  setDeleteConfirmText: (text: string) => void;
  isDeletingAccount: boolean;
  onDeleteAccount: () => void;
  onDeleteAccountConfirm: () => void;
};

export function ProfileCard({
  userProfile,
  isMember,
  profileVisibility,
  getFieldPreview,
  onVisibilityToggle,
  showManagerRequestDialog,
  setShowManagerRequestDialog,
  isRequestingManagerRole,
  onRequestManagerRole,
  showDeleteDialog,
  setShowDeleteDialog,
  deleteConfirmText,
  setDeleteConfirmText,
  isDeletingAccount,
  onDeleteAccount,
  onDeleteAccountConfirm,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="size-5" />
          프로필
        </CardTitle>
        <CardDescription>프로필 정보 및 계정 관리</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-6 pb-6 border-b">
          <Avatar className="w-16 h-16">
            <AvatarImage
              src={userProfile?.avatar || undefined}
              alt={userProfile?.name || '프로필'}
            />
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
              {userProfile?.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">
              {userProfile?.name || '사용자'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {userProfile?.email || '이메일 없음'}
            </p>
          </div>
        </div>

        <Accordion type="multiple" className="w-full">
          <AccountInfoAccordion
            loginMethod={userProfile?.loginMethod || '이메일'}
            email={userProfile?.email || null}
          />
          {isMember && (
            <ProfileVisibilityAccordion
              profileVisibility={profileVisibility}
              getFieldPreview={getFieldPreview}
              onToggle={onVisibilityToggle}
            />
          )}
          <AccountManagementAccordion
            isMember={isMember}
            showManagerRequestDialog={showManagerRequestDialog}
            setShowManagerRequestDialog={setShowManagerRequestDialog}
            isRequestingManagerRole={isRequestingManagerRole}
            onRequestManagerRole={onRequestManagerRole}
            showDeleteDialog={showDeleteDialog}
            setShowDeleteDialog={setShowDeleteDialog}
            deleteConfirmText={deleteConfirmText}
            setDeleteConfirmText={setDeleteConfirmText}
            isDeletingAccount={isDeletingAccount}
            onDeleteAccount={onDeleteAccount}
            onDeleteAccountConfirm={onDeleteAccountConfirm}
          />
        </Accordion>
      </CardContent>
    </Card>
  );
}
