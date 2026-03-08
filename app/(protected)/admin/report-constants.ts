export type ReportReason =
  | 'fraud_investment'
  | 'obscene'
  | 'child_abuse'
  | 'hate_violence'
  | 'illegal_product'
  | 'privacy_violation'
  | 'abnormal_usage'
  | 'scam_impersonation'
  | 'defamation_copyright'
  | 'illegal_filming'
  | 'false_advertisement'
  | 'spam'
  | 'other';

export type ReportStatus = 'pending' | 'reviewed' | 'dismissed' | 'resolved';

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  fraud_investment: '사기/유사투자자문 등',
  obscene: '음란/성적행위',
  child_abuse: '아동/청소년 대상 성범죄',
  hate_violence: '욕설/폭력/혐오 갈등 조장',
  illegal_product: '불법상품/서비스',
  privacy_violation: '개인정보 무단 수집/유포',
  abnormal_usage: '비정상적인 서비스 이용',
  scam_impersonation: '사기/사칭',
  defamation_copyright: '명예훼손/저작권 등 권리침해',
  illegal_filming: '불법촬영물 등 유통',
  false_advertisement: '허위정보/과장 광고',
  spam: '스팸/도배',
  other: '기타',
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  pending: '대기중',
  reviewed: '검토중',
  dismissed: '기각',
  resolved: '처리완료',
};

export interface PostReport {
  report_id: number;
  post_id: number;
  reporter_id: string;
  reason: ReportReason;
  detail: string | null;
  status: ReportStatus;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface PostReportWithDetails extends PostReport {
  post_title: string;
  post_location: string;
  post_author_id: string;
  post_author_name: string;
  reporter_name: string;
  reporter_email: string;
}

export interface ReportedPostSummary {
  post_id: number;
  post_title: string;
  post_location: string;
  post_author_id: string;
  post_author_name: string;
  report_count: number;
  reasons: ReportReason[];
  latest_report_at: string;
  status: 'pending' | 'reviewed' | 'dismissed' | 'resolved';
}
