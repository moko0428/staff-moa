import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion';
import { Label } from '@/app/components/ui/label';
import { Separator } from '@/app/components/Separator';
import {
  Eye,
  Mail,
  Phone,
  MessageCircle,
  Calendar,
  Users,
  Briefcase,
  FileText,
  Award,
  Languages,
} from 'lucide-react';
import { VisibilityToggleRow } from '../molecules/VisibilityToggleRow';
import type { ProfileVisibility } from '../../actions';

type Props = {
  profileVisibility: ProfileVisibility;
  getFieldPreview: (field: keyof ProfileVisibility) => string;
  onToggle: (key: keyof ProfileVisibility) => void;
};

export function ProfileVisibilityAccordion({
  profileVisibility,
  getFieldPreview,
  onToggle,
}: Props) {
  return (
    <AccordionItem value="profile-visibility">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-2">
          <Eye className="size-4" />
          <span className="font-medium">개인 프로필 공개 여부</span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-6 pt-2">
          {/* 기본 정보 */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">기본 정보</Label>
            <div className="space-y-3 pl-4">
              <VisibilityToggleRow
                icon={Mail}
                label="이메일"
                description="이메일 주소 공개 여부"
                previewValue={getFieldPreview('email')}
                checked={!!profileVisibility.email}
                onCheckedChange={() => onToggle('email')}
              />
              <VisibilityToggleRow
                icon={Phone}
                label="전화번호"
                description="전화번호 공개 여부"
                previewValue={getFieldPreview('phone')}
                checked={!!profileVisibility.phone}
                onCheckedChange={() => onToggle('phone')}
              />
              <VisibilityToggleRow
                icon={MessageCircle}
                label="카카오톡 ID"
                description="카카오톡 ID 공개 여부"
                previewValue={getFieldPreview('kakaoId')}
                checked={!!profileVisibility.kakaoId}
                onCheckedChange={() => onToggle('kakaoId')}
              />
            </div>
          </div>

          <Separator />

          {/* 신체 정보 */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">신체 정보</Label>
            <div className="space-y-3 pl-4">
              <VisibilityToggleRow
                icon={Calendar}
                label="나이"
                description="나이 정보 공개 여부"
                previewValue={getFieldPreview('age')}
                checked={!!profileVisibility.age}
                onCheckedChange={() => onToggle('age')}
              />
              <VisibilityToggleRow
                icon={Users}
                label="성별"
                description="성별 정보 공개 여부"
                previewValue={getFieldPreview('gender')}
                checked={!!profileVisibility.gender}
                onCheckedChange={() => onToggle('gender')}
              />
            </div>
          </div>

          <Separator />

          {/* 경력 */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">경력</Label>
            <div className="pl-4">
              <VisibilityToggleRow
                icon={Briefcase}
                label="경력"
                description="경력 정보 공개 여부"
                previewValue={getFieldPreview('experiences')}
                checked={!!profileVisibility.experiences}
                onCheckedChange={() => onToggle('experiences')}
              />
            </div>
          </div>

          <Separator />

          {/* 서류 */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">서류</Label>
            <div className="pl-4">
              <VisibilityToggleRow
                icon={FileText}
                label="서류"
                description="서류 정보 공개 여부"
                previewValue={getFieldPreview('documents')}
                checked={!!profileVisibility.documents}
                onCheckedChange={() => onToggle('documents')}
              />
            </div>
          </div>

          <Separator />

          {/* 자격증 */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">자격증</Label>
            <div className="pl-4">
              <VisibilityToggleRow
                icon={Award}
                label="자격증"
                description="자격증 정보 공개 여부"
                previewValue={getFieldPreview('certificates')}
                checked={!!profileVisibility.certificates}
                onCheckedChange={() => onToggle('certificates')}
              />
            </div>
          </div>

          <Separator />

          {/* 어학 능력 */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">어학 능력</Label>
            <div className="pl-4">
              <VisibilityToggleRow
                icon={Languages}
                label="어학 능력"
                description="어학 능력 정보 공개 여부"
                previewValue={getFieldPreview('languages')}
                checked={!!profileVisibility.languages}
                onCheckedChange={() => onToggle('languages')}
              />
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
