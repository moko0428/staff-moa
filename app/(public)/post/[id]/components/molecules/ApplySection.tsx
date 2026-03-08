import Link from 'next/link';
import { Button } from '@/app/components/ui/button';

interface ApplySectionProps {
  isMember: boolean;
  roleHydrated: boolean;
  currentUserId: string | null;
  status: 'recruiting' | 'completed' | 'urgent';
  hasApplied: boolean;
  onApply: () => void;
}

const ApplySection = ({
  isMember,
  roleHydrated,
  currentUserId,
  status,
  hasApplied,
  onApply,
}: ApplySectionProps) => (
  <div className="space-y-3">
    {isMember && roleHydrated && status !== 'completed' && (
      <Button className="w-full" size="lg" onClick={onApply} disabled={hasApplied}>
        {hasApplied ? '지원 완료' : '지원하기'}
      </Button>
    )}
    {status === 'completed' && (
      <div className="p-4 bg-muted rounded-lg text-center">
        <p className="text-muted-foreground font-medium">모집이 완료되었습니다</p>
      </div>
    )}
    {!currentUserId && !isMember && roleHydrated && (
      <Button variant="default" className="w-full" asChild>
        <Link href="/auth">지원하려면 회원으로 로그인해주세요</Link>
      </Button>
    )}
  </div>
);

export default ApplySection;
