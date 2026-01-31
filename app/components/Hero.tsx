export default function Hero({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-2">
      <h1 className="text-foreground text-2xl font-bold mb-2">{title}</h1>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
