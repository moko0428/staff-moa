import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';

interface RecruitmentStatusProps {
  currentApplicants: number;
  recruitCount: number;
}

const RecruitmentStatus = ({
  currentApplicants,
  recruitCount,
}: RecruitmentStatusProps) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base flex items-center gap-2">
        모집 현황
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">지원자 수</span>
        <span className="font-semibold">
          {currentApplicants} / {recruitCount}명
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all"
          style={{
            width: `${Math.min((currentApplicants / recruitCount) * 100, 100)}%`,
          }}
        />
      </div>
    </CardContent>
  </Card>
);

export default RecruitmentStatus;
