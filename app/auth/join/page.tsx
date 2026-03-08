import AuthPageHeader from '../components/molecules/AuthPageHeader';
import SignUpFormBase from '../components/organisms/SignUpFormBase';

const JoinPage = () => (
  <div className="w-full h-full flex items-center justify-center px-4 py-10">
    <div className="w-full max-w-md">
      <AuthPageHeader title="회원가입" backHref="/auth/login" />
      <main className="space-y-4 mt-12">
        <SignUpFormBase role="member" />
      </main>
    </div>
  </div>
);

export default JoinPage;
