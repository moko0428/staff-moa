import Logo from '@/app/components/Logo';
import { Button } from '@/app/components/ui/button';
import Link from 'next/link';
import { KakaoLoginButton } from './components/KakaoLoginButton';

export default function AuthPage() {
  return (
    <div className="flex flex-col items-center p-4 w-full h-screen bg-background">
      <header className="flex justify-center w-full p-4 md:max-w-7xl md:p-0 md:justify-start  max-w-md mx-auto ">
        <Logo />
      </header>

      <main className="flex-1 flex flex-col justify-start items-center w-full max-w-md p-4 mx-auto space-y-8 pt-24">
        <section className="flex flex-col gap-2 items-center w-full">
          <h2 className="text-2xl text-center font-bold">
            나에게 딱 맞는 스탭알바
          </h2>
          <p className="text-sm text-muted-foreground w-full text-center">
            원하는 공고를 찾아보세요.
          </p>
        </section>
        <section className="flex flex-col gap-3 w-full">
          <KakaoLoginButton />
          <Button variant="default" asChild className="w-full h-12 text-sm font-normal hover:bg-primary/90">
            <Link href="/auth/login">이메일로 계속하기</Link>
          </Button>
        </section>
        <section className="flex justify-center gap-2">
          <Button variant={'ghost'}>기존 계정 찾기</Button>
          <Button variant={'ghost'} asChild>
            <Link href="/auth/join/manager-join">매니저 회원가입</Link>
          </Button>
        </section>
      </main>
      <footer className="fixed bottom-0 left-0 right-0 text-sm text-muted-foreground mt-3 text-center flex flex-col gap-2 p-4 border-t border-border bg-background">
        <section className="flex justify-center gap-2">
          <Link href="/terms">이용약관</Link>
          <Link href="/privacy">개인정보처리방침</Link>
        </section>
        <span>
          copyright {new Date().getFullYear()} Staff-MOA. All rights reserved.
        </span>
      </footer>
    </div>
  );
}
