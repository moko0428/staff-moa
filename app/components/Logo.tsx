import Image from 'next/image';
import Link from 'next/link';

export default function Logo() {
  return (
    <Link href="/" className="w-full h-full flex items-center justify-center">
      <Image
        src="/assets/primary_text_logo.png"
        alt="고인력"
        width={100}
        height={100}
        className="w-60 h-auto"
      />
    </Link>
  );
}
