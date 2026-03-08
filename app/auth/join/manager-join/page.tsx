import AuthPageHeader from '../../components/molecules/AuthPageHeader';
import SignUpFormBase from '../../components/organisms/SignUpFormBase';

const ManagerJoinPage = () => (
  <div className="w-full h-full flex items-center justify-center px-4 py-10">
    <div className="w-full max-w-md">
      <AuthPageHeader
        title="매니저 회원가입"
        description="가입 후 프로필 관리 페이지에서 회사 정보를 추가하여 관리자에게 승인을 받아야 합니다."
        backHref="/auth"
      />
      <main className="space-y-4 mt-12">
        <SignUpFormBase role="pending_manager" />
      </main>
    </div>
  </div>
);

export default ManagerJoinPage;
