import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  onCardClick: () => void;
  onStatusChange: (applicationId: string, newStatus: ApplicationStatus) => void;
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
  onCardClick,
  onStatusChange,
}: WorkerCardProps) {
  const statusBadge = getStatusBadge(application.status);
  const StatusIcon = statusBadge.icon;

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onCardClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-center justify-center">
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
                <p className="text-sm text-gray-600">{application.postTitle}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-3 text-sm">
              {application.applicantAge && (
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="size-4" />
                  <span>{application.applicantAge}세</span>
                </div>
              )}
              {application.applicantGender && (
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="size-4" />
                  <span>{application.applicantGender}</span>
                </div>
              )}
              {application.applicantKakaoId && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MessageSquare className="size-4" />
                  <span>{application.applicantKakaoId}</span>
                </div>
              )}
              {application.applicantAttendanceScore !== undefined && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Star className="size-4 fill-yellow-400 text-yellow-400" />
                  <span>{application.applicantAttendanceScore}점</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 md:grid-cols-2 gap-3 text-sm mt-2">
              <div className="flex items-center gap-2 text-gray-600 col-span-1">
                <Calendar className="size-4" />
                <span>
                  {format(parseISO(application.appliedAt), 'yyyy.MM.dd', {
                    locale: ko,
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 col-span-2">
                <Briefcase className="size-4" />
                <span>{application.postLocation}</span>
              </div>
            </div>
            {/* <div className="flex items-center justify-between">
              {application.status === 'pending' && (
                <>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusChange(application.id, 'accepted');
                    }}
                  >
                    <CheckCircle2 className="size-4 mr-1" />
                    승인
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusChange(application.id, 'rejected');
                    }}
                  >
                    <XCircle className="size-4 mr-1" />
                    거절
                  </Button>
                </>
              )}
            </div> */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
