export const successMessages = {
  signIn: '로그인에 성공했습니다.',
  signUp: '회원가입이 완료되었습니다. 이메일 인증을 완료해 주세요.',
  signOut: '로그아웃되었습니다.',
} as const;

export const errorMessages = {
  invalidCredentials: '이메일 또는 비밀번호가 올바르지 않습니다.',
  emailNotConfirmed:
    '이메일 인증이 완료되지 않았습니다. 메일함을 확인해 주세요.',
  emailExists: '이미 가입된 이메일입니다.',
  signUpFailed: '회원가입을 진행할 수 없습니다. 잠시 후 다시 시도해주세요.',
  signOutFailed: '로그아웃에 실패했습니다. 다시 시도해주세요.',
  unknown: '요청을 처리하는 중 문제가 발생했습니다.',
} as const;
