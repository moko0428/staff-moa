import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion';
import { Label } from '@/app/components/ui/label';
import { LogIn, Mail } from 'lucide-react';

type Props = {
  loginMethod: string;
  email: string | null;
};

export function AccountInfoAccordion({ loginMethod, email }: Props) {
  return (
    <AccordionItem value="account-info">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-2">
          <LogIn className="size-4" />
          <span className="font-medium">계정</span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <LogIn className="size-4 text-muted-foreground" />
              <div>
                <Label className="font-medium">로그인 방식</Label>
                <p className="text-xs text-muted-foreground">
                  현재 사용 중인 로그인 방법
                </p>
              </div>
            </div>
            <span className="text-sm font-medium">{loginMethod || '이메일'}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <Mail className="size-4 text-muted-foreground" />
              <div>
                <Label className="font-medium">이메일</Label>
                <p className="text-xs text-muted-foreground">
                  계정에 연결된 이메일 주소
                </p>
              </div>
            </div>
            <span className="text-sm font-medium">{email || '없음'}</span>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
