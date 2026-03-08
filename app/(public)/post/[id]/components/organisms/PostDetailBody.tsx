import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import WorkInfoGrid from '../molecules/WorkInfoGrid';
import WorkSlotDetail from '../molecules/WorkSlotDetail';
import PostDescription from '../molecules/PostDescription';
import { PostData } from '../../types';

interface PostDetailBodyProps {
  post: PostData;
}

const PostDetailBody = ({ post }: PostDetailBodyProps) => {
  const firstSlot = post.work_slots?.[0];
  const workDate = firstSlot?.date || post.work_date;
  const workTimeStart = firstSlot?.start_time || firstSlot?.start || post.work_time_start;
  const workTimeEnd = firstSlot?.end_time || firstSlot?.end || post.work_time_end;
  const workLocation = firstSlot?.location || post.location;
  const payAmount = firstSlot?.pay_amount || post.pay_amount;
  const payType = firstSlot?.pay_type || post.pay_type;

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
            firstSlot={firstSlot}
            totalSlots={post.work_slots?.length}
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
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default PostDetailBody;
