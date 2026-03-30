'use client';

import Image from 'next/image';

interface Props {
  name: string;
  avatar: string | null;
  size?: 'sm' | 'md';
}

export function AvatarCircle({ name, avatar, size = 'md' }: Props) {
  const sizeClass = size === 'sm' ? 'size-7 text-xs' : 'size-10 text-base';

  if (avatar) {
    return (
      <Image
        src={avatar}
        alt={name}
        width={size === 'sm' ? 28 : 40}
        height={size === 'sm' ? 28 : 40}
        unoptimized
        className={`${sizeClass} rounded-full object-cover shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-semibold select-none`}
    >
      {name.slice(0, 1)}
    </div>
  );
}
