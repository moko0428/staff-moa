import { BriefcaseBusiness, Check, FileText } from 'lucide-react';

interface PostDescriptionProps {
  description: string;
  equipments?: string;
  qualifications?: string;
  preferences?: string;
  notes?: string;
}

const PostDescription = ({
  description,
  equipments,
  qualifications,
  preferences,
  notes,
}: PostDescriptionProps) => (
  <div className="space-y-4">
    <div className="whitespace-pre-wrap text-sm leading-relaxed">{description}</div>
    {equipments && (
      <div>
        <p className="text-sm font-medium text-foreground flex items-center gap-2 mb-1">
          <BriefcaseBusiness className="size-4" />
          준비물
        </p>
        <p className="text-sm text-muted-foreground ml-6">{equipments}</p>
      </div>
    )}
    {qualifications && (
      <div>
        <p className="text-sm font-medium text-foreground flex items-center gap-2 mb-1">
          <Check className="size-4" />
          자격 요건
        </p>
        <p className="text-sm text-muted-foreground ml-6">{qualifications}</p>
      </div>
    )}
    {preferences && (
      <div>
        <p className="text-sm font-medium text-foreground flex items-center gap-2 mb-1">
          <FileText className="size-4" />
          우대 사항
        </p>
        <p className="text-sm text-muted-foreground ml-6">{preferences}</p>
      </div>
    )}
    {notes && (
      <div>
        <p className="text-sm font-medium text-foreground flex items-center gap-2 mb-1">
          <FileText className="size-4" />
          기타 사항
        </p>
        <p className="text-sm text-muted-foreground ml-6">{notes}</p>
      </div>
    )}
  </div>
);

export default PostDescription;
