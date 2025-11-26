export default function Hero({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-2">
      <h1 className="text-gray-900 text-2xl font-bold mb-2">{title}</h1>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}
