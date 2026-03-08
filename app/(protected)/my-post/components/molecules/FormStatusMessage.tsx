'use client';

interface Props {
  message?: string;
  ok?: boolean;
}

export function FormStatusMessage({ message, ok }: Props) {
  if (!message) return null;

  return (
    <div className={`p-3 rounded-md ${ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
      {message}
    </div>
  );
}
