import { User2, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';

interface ManagerInfoProps {
  managerName: string;
  managerPhone: string;
  managerContactType?: 'phone' | 'kakao' | 'email' | 'other';
}

const getContactLabel = (type?: string) => {
  switch (type) {
    case 'kakao':
      return '카카오톡';
    case 'email':
      return '이메일';
    case 'other':
      return '연락처';
    default:
      return '전화번호';
  }
};

const ManagerInfo = ({ managerName, managerPhone, managerContactType }: ManagerInfoProps) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base">담당자 정보</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="flex items-center gap-3">
        <User2 className="size-5 text-muted-foreground" />
        <div>
          <p className="text-sm text-muted-foreground">담당자</p>
          <p className="font-medium">{managerName}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Phone className="size-5 text-muted-foreground" />
        <div>
          <p className="text-sm text-muted-foreground">
            {getContactLabel(managerContactType)}
          </p>
          {managerContactType === 'email' ? (
            <a
              href={`mailto:${managerPhone}`}
              className="font-medium text-primary hover:underline"
            >
              {managerPhone}
            </a>
          ) : managerContactType === 'phone' || !managerContactType ? (
            <a
              href={`tel:${managerPhone}`}
              className="font-medium text-primary hover:underline"
            >
              {managerPhone}
            </a>
          ) : (
            <p className="font-medium">{managerPhone}</p>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default ManagerInfo;
