import AuthPageHeader from '../components/molecules/AuthPageHeader';
import EmailLoginForm from '../components/organisms/EmailLoginForm';

const LoginPage = () => (
  <div className="w-full h-full flex items-center justify-center px-4 py-10">
    <div className="flex flex-col w-full max-w-md">
      <AuthPageHeader title="이메일로 로그인" backHref="/auth" />
      <main className="space-y-4 mt-12">
        <EmailLoginForm />
      </main>
    </div>
  </div>
);

export default LoginPage;
