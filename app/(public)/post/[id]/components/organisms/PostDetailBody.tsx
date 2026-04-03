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
  const workDate = isV3
    ? firstSlot.shifts?.[0]?.date
    : (firstSlot as { date?: string } | undefined)?.date || post.work_date;
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
  const totalSlots = isV3
    ? post.work_slots?.reduce(
        (acc, p) => acc + (isNewPart(p) ? p.shifts.length : 1),
        0,
      )
    : post.work_slots?.length;

  return (
    <div className="lg:col-span-2 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">근무 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkInfoGrid
            workDate={workDate}
            workTimeStart={workTimeStart}
            workTimeEnd={workTimeEnd}
            workLocation={workLocation}
            payAmount={payAmount}
            payType={payType}
            taxWithholding={taxWithholding}
            totalSlots={totalSlots}
          />
        </CardContent>
      </Card>

      {post.work_slots && post.work_slots.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">근무일 상세</CardTitle>
          </CardHeader>
          <CardContent>
            <WorkSlotDetail slots={post.work_slots} />
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
