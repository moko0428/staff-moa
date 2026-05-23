export const formatBusinessNumber = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length > 5) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  }
  if (digits.length > 3) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
  return digits;
};

export type CompanyVerifyStatus = 'pending' | 'approved' | 'rejected' | null;

export function getCompanyBadge(
  companyInfoFilled: boolean,
  companyStatusRaw: CompanyVerifyStatus
): { label: string; variant: 'secondary' | 'default' | 'outline' } {
  if (!companyInfoFilled) return { label: '미입력', variant: 'secondary' };
  if (companyStatusRaw === 'approved') return { label: '인증 완료', variant: 'default' };
  if (companyStatusRaw === 'pending') return { label: '검토 중', variant: 'outline' };
  if (companyStatusRaw === 'rejected') return { label: '반려됨', variant: 'secondary' };
  return { label: '미제출', variant: 'secondary' };
}

export function getCompanyInfoFilled(params: {
  companyName?: string | null;
  businessNumber?: string | null;
  companyCertificate?: string | null;
}): boolean {
  return (
    !!params.companyName?.trim() &&
    (params.businessNumber?.replace(/\D/g, '').length ?? 0) === 10 &&
    !!params.companyCertificate?.trim()
  );
}

export function getMissingFields(params: {
  role: string;
  phone?: string | null;
  gender?: string | null;
  introduction?: string | null;
  birthDate?: string | null;
  companyName?: string | null;
  businessNumber?: string | null;
  companyCertificate?: string | null;
}): string[] {
  const required: Array<[string, unknown]> = [];

  if (params.role === 'member') {
    required.push(
      ['전화번호', params.phone],
      ['성별', params.gender],
      ['자기소개', params.introduction],
      ['생년월일', params.birthDate]
    );
  }

  if (params.role === 'manager' || params.role === 'pending_manager') {
    required.push(
      ['전화번호', params.phone],
      ['회사명', params.companyName],
      ['사업자등록번호', params.businessNumber],
      ['기업인증 파일', params.companyCertificate]
    );
  }

  return required
    .filter(([, value]) => value === undefined || value === null || value === '')
    .map(([label]) => label as string);
}
