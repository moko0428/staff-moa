import Logo from '@/app/components/Logo';
import { Button } from '@/app/components/ui/button';
import Link from 'next/link';
import { KakaoLoginButton } from './components/KakaoLoginButton';
import Footer from '../components/Footer';

const AuthPage = () => (
  <div className="flex flex-col items-center w-full min-h-screen bg-background">
    <header className="w-full -mt-0 max-w-md mx-auto px-4">
      <Logo />
    </header>
    <main className="-mt-20 flex-1 flex flex-col justify-start items-center w-full max-w-md mx-auto space-y-8 pt-24">
      <section className="flex flex-col gap-2 items-center w-full">
        <h2 className="text-2xl text-center font-bold">
          사람과 기회를 연결하다
        </h2>
        <p className="text-sm text-muted-foreground w-full text-center">
          당신에게 맞는 기회를 찾으세요
        </p>
      </section>
      <section className="flex flex-col gap-3 w-full">
        <KakaoLoginButton />
        <Button
          variant="default"
          asChild
          className="w-full h-12 text-sm font-normal hover:bg-primary/90"
        >
          <Link href="/auth/login">이메일로 계속하기</Link>
        </Button>
      </section>
      <section className="flex justify-center gap-2">
        <Button variant="ghost">기존 계정 찾기</Button>
        <Button variant="ghost" asChild>
          <Link href="/auth/join/manager-join">매니저 회원가입</Link>
        </Button>
      </section>
    </main>

    <Footer />
  </div>
);

export default AuthPage;
