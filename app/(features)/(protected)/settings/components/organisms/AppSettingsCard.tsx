import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion';
import { Label } from '@/app/components/ui/label';
import { Switch } from '@/app/components/ui/switch';
import { Settings as SettingsIcon, Monitor, Bell } from 'lucide-react';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';

type Props = {
  mounted: boolean;
  notificationsEnabled: boolean;
  onNotificationToggle: (enabled: boolean) => void;
  pushPermission: NotificationPermission | null;
  pushSubscribed: boolean;
  isPushLoading: boolean;
  onPushToggle: () => void;
  isIos: boolean;
  isStandalone: boolean;
};

export function AppSettingsCard({
  mounted,
  notificationsEnabled,
  onNotificationToggle,
  pushPermission,
  pushSubscribed,
  isPushLoading,
  onPushToggle,
  isIos,
  isStandalone,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SettingsIcon className="size-5" />앱 설정
        </CardTitle>
        <CardDescription>모든 사용자에게 적용되는 설정입니다</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full" defaultValue={['theme']}>
          {/* 테마 설정 */}
          <AccordionItem value="theme">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Monitor className="size-4" />
                <span className="font-medium">테마 설정</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                <p className="text-sm text-muted-foreground">
                  앱의 색상 테마를 선택하세요
                </p>
                {mounted && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <AnimatedThemeToggler
                          className="size-8 p-1 rounded-lg border hover:bg-accent transition-colors"
                          duration={500}
                        />
                        <div>
                          <Label className="font-medium">다크 모드</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 알림 설정 */}
          <AccordionItem value="notifications">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Bell className="size-4" />
                <span className="font-medium">알림 설정</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 flex-1">
                    <p className="text-sm text-muted-foreground">
                      앱 내 알림 수신 여부를 설정합니다
                    </p>
                  </div>
                  <Switch
                    checked={notificationsEnabled}
                    onCheckedChange={onNotificationToggle}
                  />
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 flex-1">
                      <Label className="font-medium">푸시 알림</Label>
                      <p className="text-xs text-muted-foreground">
                        앱을 열지 않아도 알림을 받습니다
                      </p>
                      {pushPermission === 'denied' && (
                        <p className="text-xs text-destructive mt-1">
                          알림이 차단되어 있습니다. 브라우저 설정에서 허용해주세요.
                        </p>
                      )}
                    </div>
                    <Switch
                      checked={pushSubscribed}
                      disabled={isPushLoading || pushPermission === 'denied'}
                      onCheckedChange={onPushToggle}
                    />
                  </div>

                  {isIos && !isStandalone && (
                    <div className="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                      <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                        iOS 푸시 알림 사용 방법
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Safari 하단의 공유 버튼 → &quot;홈 화면에 추가&quot;로 앱을 설치한 후 다시 열어주세요.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
