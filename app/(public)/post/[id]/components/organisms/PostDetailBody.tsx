import { format, parseISO } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import WorkInfoGrid from '../molecules/WorkInfoGrid';
import WorkSlotDetail from '../molecules/WorkSlotDetail';
import PostDescription from '../molecules/PostDescription';
import { PostData, isNewPart } from '../../types';

interface PostDetailBodyProps {
  post: PostData;
}

const PostDetailBody = ({ post }: PostDetailBodyProps) => {
  const firstSlot = post.work_slots?.[0];
  const isV3 = firstSlot && isNewPart(firstSlot);

  // ── 전체 날짜 범위 계산 (모든 파트·시프트·date_end 포함) ──────────────
  const allDates: Date[] = [];
  if (post.work_slots && post.work_slots.length > 0) {
    for (const slot of post.work_slots) {
      if (isNewPart(slot)) {
        for (const shift of slot.shifts) {
          if (shift.date) allDates.push(parseISO(shift.date));
          if (shift.date_end) allDates.push(parseISO(shift.date_end));
        }
      } else {
        const d = (slot as { date?: string }).date;
        if (d) allDates.push(parseISO(d));
      }
    }
  }
  // 레거시 fallback
  if (allDates.length === 0 && post.work_date) {
    allDates.push(parseISO(post.work_date));
  }

  const validDates = allDates.filter((d) => !isNaN(d.getTime()));
  const dateMin = validDates.length > 0
    ? new Date(Math.min(...validDates.map((d) => d.getTime())))
    : null;
  const dateMax = validDates.length > 0
    ? new Date(Math.max(...validDates.map((d) => d.getTime())))
    : null;

  const workDate = dateMin ? format(dateMin, 'yyyy-MM-dd') : undefined;
  const dateEnd =
    dateMax && dateMin && dateMax.getTime() !== dateMin.getTime()
      ? format(dateMax, 'yyyy-MM-dd')
      : undefined;

  // ── 첫 파트 요약 정보 ──────────────────────────────────────────────────
  const workTimeStart = isV3
    ? firstSlot.shifts?.[0]?.start
    : (firstSlot as { start_time?: string; start?: string } | undefined)
        ?.start_time ||
      (firstSlot as { start_time?: string; start?: string } | undefined)
        ?.start ||
      post.work_time_start;

  const workTimeEnd = isV3
    ? firstSlot.shifts?.[0]?.end
    : (firstSlot as { end_time?: string; end?: string } | undefined)
        ?.end_time ||
      (firstSlot as { end_time?: string; end?: string } | undefined)?.end ||
      post.work_time_end;

  const workLocation = firstSlot?.location || post.location;
  const payAmount = firstSlot?.pay_amount || post.pay_amount;
  const payType = firstSlot?.pay_type || post.pay_type;
  const taxWithholding = firstSlot?.tax_withholding;
  const partCount = isV3 ? post.work_slots?.length : undefined;

  // ── 근무 파트 섹션 표시 조건 ───────────────────────────────────────────
  // v3: 파트가 있으면 항상 표시 (상세 정보: 장소·식대·날짜범위 등)
  // legacy: 슬롯이 2개 이상일 때만 표시
  const showPartsSection =
    post.work_slots &&
    post.work_slots.length > 0 &&
    (isV3 || post.work_slots.length > 1);

  const partsSectionTitle = isV3 ? '근무 파트' : '근무 일정';

  return (
    <div className="lg:col-span-2 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">근무 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkInfoGrid
            workDate={workDate}
            dateEnd={dateEnd}
            workTimeStart={workTimeStart}
            workTimeEnd={workTimeEnd}
            workLocation={workLocation}
            payAmount={payAmount}
            payType={payType}
            taxWithholding={taxWithholding}
            partCount={partCount}
          />
        </CardContent>
      </Card>

      {showPartsSection && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{partsSectionTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <WorkSlotDetail slots={post.work_slots!} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">상세 설명</CardTitle>
        </CardHeader>
        <CardContent>
          <PostDescription
            description={post.description}
            equipments={post.equipments}
            qualifications={post.qualifications}
            preferences={post.preferences}
            notes={post.notes}
            externalLink={post.external_link}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default PostDetailBody;
