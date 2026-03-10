interface PostDescriptionProps {
  description: string;
  equipments?: string;
  qualifications?: string;
  preferences?: string;
  notes?: string;
  externalLink?: string;
}

const PostDescription = ({
  description,
  equipments,
  qualifications,
  preferences,
  notes,
  externalLink,
}: PostDescriptionProps) => (
  <div className="space-y-4">
    <div className="whitespace-pre-wrap text-sm leading-relaxed">
      {description}
    </div>
    {equipments && (
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-foreground flex items-center gap-2 mb-1">
          준비물
        </p>
        <p className="text-sm text-muted-foreground ml-6">{equipments}</p>
      </div>
    )}
    {qualifications && (
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-foreground flex items-center gap-2 mb-1">
          자격 요건
        </p>
        <p className="text-sm text-muted-foreground ml-6">{qualifications}</p>
      </div>
    )}
    {preferences && (
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-foreground flex items-center gap-2 mb-1">
          우대 사항
        </p>
        <p className="text-sm text-muted-foreground ml-6">{preferences}</p>
      </div>
    )}
    {notes && (
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-foreground flex items-center gap-2 mb-1">
          기타 사항
        </p>
        <p className="text-sm text-muted-foreground ml-6">{notes}</p>
      </div>
    )}
    {externalLink && (
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-foreground flex items-center gap-2 mb-1">
          링크
        </p>
        <a
          href={externalLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline underline-offset-2 ml-6 break-all"
        >
          {externalLink}
        </a>
      </div>
    )}
  </div>
);

export default PostDescription;
