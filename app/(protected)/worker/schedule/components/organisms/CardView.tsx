import { Badge } from '@/app/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion';
import { Clock, CheckCircle2 } from 'lucide-react';
import { ScheduleCard } from '../molecules/ScheduleCard';
import type { CategorizedSchedules, ScheduleWithPost } from '../../types';

interface CardViewProps {
  categorizedSchedules: CategorizedSchedules;
  onScheduleClick: (schedule: ScheduleWithPost) => void;
}

export function CardView({ categorizedSchedules, onScheduleClick }: CardViewProps) {
  const approvedCount =
    categorizedSchedules.upcoming.length +
    categorizedSchedules.ongoing.length +
    categorizedSchedules.completed.length;

  return (
    <Accordion type="multiple" defaultValue={['applications', 'approved']} className="mt-3">
      {/* 전체 지원 목록 */}
      <AccordionItem value="applications">
        <AccordionTrigger className="py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">전체 지원 목록</span>
            <Badge variant="outline" className="text-xs">
              {categorizedSchedules.applications.length}
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          {categorizedSchedules.applications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">지원한 공고가 없습니다</p>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scroll-none">
              {categorizedSchedules.applications.map((schedule) => (
                <ScheduleCard
                  key={schedule.id}
                  schedule={schedule}
                  onClick={() => onScheduleClick(schedule)}
                  showApplicationStatus
                  compact
                />
              ))}
            </div>
          )}
        </AccordionContent>
      </AccordionItem>

      {/* 승인된 스케줄 */}
      <AccordionItem value="approved">
        <AccordionTrigger className="py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">승인된 스케줄</span>
            <Badge variant="outline" className="text-xs">
              {approvedCount}
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4">
            {/* 예정 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-blue-500" />
                <span className="text-sm font-medium">예정</span>
                <Badge variant="outline" className="text-xs ml-auto">
                  {categorizedSchedules.upcoming.length}
                </Badge>
              </div>
              {categorizedSchedules.upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">예정된 스케줄이 없습니다</p>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scroll-none">
                  {categorizedSchedules.upcoming.map((schedule) => (
                    <ScheduleCard
                      key={schedule.id}
                      schedule={schedule}
                      onClick={() => onScheduleClick(schedule)}
                      compact
                    />
                  ))}
                </div>
              )}
            </div>

            {/* 진행중 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-orange-500" />
                <span className="text-sm font-medium">진행중</span>
                <Badge variant="outline" className="text-xs ml-auto">
                  {categorizedSchedules.ongoing.length}
                </Badge>
              </div>
              {categorizedSchedules.ongoing.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">진행중인 스케줄이 없습니다</p>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scroll-none">
                  {categorizedSchedules.ongoing.map((schedule) => (
                    <ScheduleCard
                      key={schedule.id}
                      schedule={schedule}
                      onClick={() => onScheduleClick(schedule)}
                      compact
                    />
                  ))}
                </div>
              )}
            </div>

            {/* 완료 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-green-500" />
                <span className="text-sm font-medium">완료</span>
                <Badge variant="outline" className="text-xs ml-auto">
                  {categorizedSchedules.completed.length}
                </Badge>
              </div>
              {categorizedSchedules.completed.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">완료된 스케줄이 없습니다</p>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scroll-none">
                  {categorizedSchedules.completed.map((schedule) => (
                    <ScheduleCard
                      key={schedule.id}
                      schedule={schedule}
                      onClick={() => onScheduleClick(schedule)}
                      compact
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
