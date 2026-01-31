import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/app/components/ui/avatar';
import {
  User,
  Calendar,
  Briefcase,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  Star,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

interface WorkerCardProps {
  application: {
    id: string;
    applicantId: string;
    applicantName: string;
    postTitle: string;
    postLocation: string;
    appliedAt: string;
    status: ApplicationStatus;
    applicantAge?: number;
    applicantGender?: string;
    applicantKakaoId?: string;
    applicantAttendanceScore?: number;
    applicantPhoto?: string;
  };
  workerManagement?: {
    rating?: number | null;
    notes?: string | null;
    is_favorite?: boolean;
    is_blacklisted?: boolean;
  };
  onCardClick: () => void;
  onStatusChange: (applicationId: string, newStatus: ApplicationStatus) => void;
  onToggleFavorite?: (applicantId: string) => void;
  onToggleBlacklist?: (applicantId: string) => void;
}

const getStatusBadge = (status: ApplicationStatus) => {
  const badges = {
    pending: {
      label: '대기중',
      className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      icon: Clock,
    },
    accepted: {
      label: '승인',
      className: 'bg-green-100 text-green-700 border-green-200',
      icon: CheckCircle2,
    },
    rejected: {
      label: '거절',
      className: 'bg-red-100 text-red-700 border-red-200',
      icon: XCircle,
    },
  };
  return badges[status];
};

export default function WorkerCard({
  application,
  workerManagement,
  onCardClick,
  onStatusChange,
  onToggleFavorite,
  onToggleBlacklist,
}: WorkerCardProps) {
  const statusBadge = getStatusBadge(application.status);
  const StatusIcon = statusBadge.icon;

  // 별점 렌더링
  const renderRating = (rating?: number | null) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              'size-3',
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground/50'
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onCardClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="w-12 h-12">
                <AvatarImage
                  src={
                    application.applicantPhoto || '/images/default-avatar.png'
                  }
                  alt={application.applicantName}
                />
                <AvatarFallback>
                  {application.applicantName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">
                    {application.applicantName}
                  </h3>
                  <Badge
                    variant="outline"
                    className={cn('text-xs', statusBadge.className)}
                  >
                    <StatusIcon className="size-3 mr-1" />
                    {statusBadge.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{application.postTitle}</p>
                {workerManagement?.rating && (
                  <div className="mt-1">{renderRating(workerManagement.rating)}</div>
                )}
              </div>
            </div>
            {workerManagement?.notes && (
              <div className="mb-2 p-2 bg-muted rounded text-xs text-muted-foreground line-clamp-2">
                {workerManagement.notes}
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-2 gap-3 text-sm">
              {application.applicantAge && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="size-4" />
                  <span>{application.applicantAge}세</span>
                </div>
              )}
              {application.applicantGender && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="size-4" />
                  <span>{application.applicantGender}</span>
                </div>
              )}
              {application.applicantKakaoId && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MessageSquare className="size-4" />
                  <span>{application.applicantKakaoId}</span>
                </div>
              )}
              {application.applicantAttendanceScore !== undefined && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Star className="size-4 fill-yellow-400 text-yellow-400" />
                  <span>{application.applicantAttendanceScore}점</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 md:grid-cols-2 gap-3 text-sm mt-2">
              <div className="flex items-center gap-2 text-muted-foreground col-span-1">
                <Calendar className="size-4" />
                <span>
                  {format(parseISO(application.appliedAt), 'yyyy.MM.dd', {
                    locale: ko,
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                <Briefcase className="size-4" />
                <span>{application.postLocation}</span>
              </div>
            </div>
          </div>

          {/* 즐겨찾기 및 벤 버튼 */}
          <div className="flex flex-col gap-1">
            {onToggleFavorite && (
              <Button
                size="sm"
                variant={workerManagement?.is_favorite ? 'default' : 'outline'}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(application.applicantId);
                }}
                className="h-7 w-7 p-0"
              >
                <Star
                  className={cn(
                    'size-3',
                    workerManagement?.is_favorite && 'fill-yellow-400 text-yellow-400'
                  )}
                />
              </Button>
            )}
            {onToggleBlacklist && (
              <Button
                size="sm"
                variant={workerManagement?.is_blacklisted ? 'destructive' : 'outline'}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleBlacklist(application.applicantId);
                }}
                className="h-7 w-7 p-0"
              >
                <XCircle className="size-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
