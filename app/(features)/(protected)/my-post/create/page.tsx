'use client';

import {
  useState,
  useEffect,
  useActionState,
  useTransition,
  useRef,
  Suspense,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Hero from '@/app/components/Hero';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  Plus,
  X,
  Loader2,
  Clipboard,
  Check,
  Eye,
  Edit,
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Link as LinkIcon,
  List,
} from 'lucide-react';
import { createPostAction, getPostByIdAction } from '../actions';
import { useUserStore } from '@/store/useUserStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';

type WorkSlot = {
  date: string; // YYYY-MM-DD
  start: string; // HH:MM
  end: string; // HH:MM
  location: string;
  pay_type: 'hourly' | 'daily' | 'weekly' | 'monthly';
  pay_amount: number;
  tax_withholding: boolean;
};

type ActionResult<T = void> = {
  ok: boolean;
  message: string;
  data?: T;
  fieldErrors?: Record<string, string>;
};

const initialState: ActionResult<{ id: string }> = {
  ok: false,
  message: '',
  data: undefined,
};

function CreatePostContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const repostId = searchParams.get('repost');
  const isRepostMode = !!repostId;

  const role = useUserStore((state) => state.role);
  const roleHydrated = useUserStore((state) => state.roleHydrated);
  const isManager = role === 'manager';

  const wrappedAction = async (
    prevState: ActionResult<{ id: string }>,
    formData: FormData,
  ): Promise<ActionResult<{ id: string }>> => {
    // createPostAction은 ActionResult<void>를 기대하므로 타입 캐스팅 필요
    // @ts-expect-error - createPostAction의 타입 시그니처가 useActionState와 완전히 일치하지 않음
    const result = await createPostAction(prevState, formData);
    return result;
  };

  const [state, formAction, isPending] = useActionState(
    wrappedAction,
    initialState,
  );
  const [, startTransition] = useTransition();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [workSlots, setWorkSlots] = useState<WorkSlot[]>([
    {
      date: '',
      start: '',
      end: '',
      location: '',
      pay_type: 'hourly',
      pay_amount: 0,
      tax_withholding: false,
    },
  ]);
  const [recruitCount, setRecruitCount] = useState(1);
  const [managerName, setManagerName] = useState('');
  const [managerPhone, setManagerPhone] = useState('');
  const [equipments, setEquipments] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [preferences, setPreferences] = useState('');
  const [notes, setNotes] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [status, setStatus] = useState<'recruiting' | 'completed' | 'urgent'>(
    'recruiting',
  );
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(false);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

  // 마크다운 텍스트 삽입 함수
  const insertMarkdownText = (
    before: string,
    after: string = '',
    placeholder: string = '',
  ) => {
    const textarea = descriptionTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = description.substring(start, end);
    const textToInsert = selectedText || placeholder;

    const newContent =
      description.substring(0, start) +
      before +
      textToInsert +
      after +
      description.substring(end);

    setDescription(newContent);

    // 커서 위치 조정
    setTimeout(() => {
      textarea.focus();
      const newCursorPos =
        start +
        before.length +
        (selectedText ? selectedText.length : placeholder.length);
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // 마크다운 렌더링 함수
  const renderMarkdown = (text: string) => {
    let html = text;

    // 헤더
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // 볼드
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

    // 이탤릭
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');

    // 링크
    html = html.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>',
    );

    // 리스트
    html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
    html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/^\+ (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>');

    // 줄바꿈
    html = html.replace(/\n/g, '<br />');

    return html;
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, phone')
            .eq('user_id', data.user.id)
            .single();
          if (profile) {
            setManagerName(profile.name || '');
            setManagerPhone(profile.phone || '');
          }
        }
      } catch (err) {
        console.error('Failed to fetch user info', err);
      }
    };
    fetchUser();
  }, []);

  // 재공고 모드: 기존 공고 데이터 로드
  useEffect(() => {
    if (!repostId) return;

    const fetchRepostData = async () => {
      try {
        const result = await getPostByIdAction(repostId);
        if (result.ok && result.data) {
          const post = result.data;
          setTitle((post.title as string) || '');
          setDescription((post.description as string) || '');
          setRecruitCount((post.recruit_count as number) || 1);
          setManagerName((post.manager_name as string) || '');
          setManagerPhone((post.manager_phone as string) || '');
          setEquipments((post.equipments as string) || '');
          setQualifications((post.qualifications as string) || '');
          setPreferences((post.preferences as string) || '');
          setNotes((post.notes as string) || '');
          setExternalLink((post.external_link as string) || '');
          setKeywords((post.keywords as string[]) || []);
          setStatus('recruiting'); // 재공고는 모집중으로 시작

          // work_slots 변환
          if (post.work_slots && Array.isArray(post.work_slots)) {
            const slots = (
              post.work_slots as Array<Record<string, unknown>>
            ).map((slot) => ({
              date: (slot.date as string) || '',
              start: ((slot.start_time || slot.start) as string) || '',
              end: ((slot.end_time || slot.end) as string) || '',
              location: ((slot.location || post.location) as string) || '',
              pay_type: (slot.pay_type ||
                post.pay_type ||
                'hourly') as WorkSlot['pay_type'],
              pay_amount: (slot.pay_amount || post.pay_amount || 0) as number,
              tax_withholding:
                slot.tax_withholding !== undefined
                  ? (slot.tax_withholding as boolean)
                  : (post.tax_withholding as boolean) || false,
            }));
            setWorkSlots(slots);
          } else if (post.work_date) {
            // 레거시 데이터 지원
            setWorkSlots([
              {
                date: (post.work_date as string) || '',
                start: (post.work_time_start as string) || '',
                end: (post.work_time_end as string) || '',
                location: (post.location as string) || '',
                pay_type: (post.pay_type || 'hourly') as WorkSlot['pay_type'],
                pay_amount: Number(post.pay_amount) || 0,
                tax_withholding: (post.tax_withholding as boolean) || false,
              },
            ]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch repost data', err);
      }
    };

    fetchRepostData();
  }, [repostId]);

  useEffect(() => {
    if (state.ok && state.data?.id) {
      router.push('/my-post');
    }
  }, [state, router]);

  if (!roleHydrated) {
    return (
      <div className="space-y-4">
        <Hero title="새 공고 작성" description="매니저 전용 페이지" />
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            역할 정보를 불러오는 중입니다...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isManager) {
    return (
      <div className="space-y-4">
        <Hero title="새 공고 작성" description="매니저 전용 페이지" />
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            관리자 승인이 필요한 매니저 전용 페이지입니다.
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAddWorkSlot = () => {
    setWorkSlots([
      ...workSlots,
      {
        date: '',
        start: '',
        end: '',
        location: workSlots[0]?.location || '',
        pay_type: workSlots[0]?.pay_type || 'hourly',
        pay_amount: workSlots[0]?.pay_amount || 0,
        tax_withholding: workSlots[0]?.tax_withholding || false,
      },
    ]);
  };

  const handleRemoveWorkSlot = (index: number) => {
    if (workSlots.length > 1) {
      setWorkSlots(workSlots.filter((_, i) => i !== index));
    }
  };

  const handleWorkSlotChange = (
    index: number,
    field: keyof WorkSlot,
    value: string | number | boolean,
  ) => {
    const updated = [...workSlots];
    updated[index] = { ...updated[index], [field]: value };
    setWorkSlots(updated);
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword));
  };

  const parsePastedText = (text: string) => {
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line);
    const fullText = text;

    // 제목 추출: 다양한 패턴
    let parsedTitle = '';
    let keywordFromTitle = '';

    // [지역명] 형식
    const bracketMatch = fullText.match(/^\[([^\]]+)\]/);
    if (bracketMatch) {
      keywordFromTitle = bracketMatch[1];
    }

    // "모집", "구인", "스탭" 등의 키워드가 포함된 문장 찾기
    const titlePatterns = [
      /[^.\n]*[스탭|알바|직원|인력|채용|모집|구인][^.\n]*/,
      /[^.\n]*[일|시|시간|기간][^.\n]*[근무|알바|스탭][^.\n]*/,
    ];

    for (const pattern of titlePatterns) {
      const match = fullText.match(pattern);
      if (match && match[0].length > 5 && match[0].length < 100) {
        parsedTitle = match[0].trim();
        break;
      }
    }

    // 첫 줄이 제목일 가능성
    if (!parsedTitle && lines[0]) {
      const firstLine = lines[0]
        .replace(/^\[.+\]\s*/, '')
        .replace(/^📣\s*/, '');
      if (firstLine.length > 5 && firstLine.length < 100) {
        parsedTitle = firstLine;
      }
    }

    if (!parsedTitle) {
      parsedTitle = '공고 제목';
    }

    // 설명 추출: 전체 텍스트를 설명으로 (제목 부분 제외)
    let parsedDescription = fullText.trim();

    // 날짜/시간 추출: 다양한 형식 지원
    let parsedDate = '';
    let parsedStartTime = '';
    let parsedEndTime = '';

    // 날짜 패턴: 1/17, 1월 17일, 2025-01-17, 17일 등
    const datePatterns = [
      /(\d{1,2})\/(\d{1,2})(?:\([^)]+\))?(?:-(\d{1,2})(?:\([^)]+\))?)?/, // 1/17(토)-18(일)
      /(\d{1,2})월\s*(\d{1,2})일(?:-(\d{1,2})일)?/, // 1월 17일-18일
      /(\d{4})-(\d{1,2})-(\d{1,2})/, // 2025-01-17
      /(\d{1,2})일(?:-(\d{1,2})일)?/, // 17일-18일
    ];

    for (const pattern of datePatterns) {
      const match = fullText.match(pattern);
      if (match) {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        let month = '';
        let day = '';

        if (match[0].includes('/')) {
          // 1/17 형식
          month = match[1].padStart(2, '0');
          day = match[2].padStart(2, '0');
        } else if (match[0].includes('월')) {
          // 1월 17일 형식
          month = match[1].padStart(2, '0');
          day = match[2].padStart(2, '0');
        } else if (match[0].includes('-') && match[1].length === 4) {
          // 2025-01-17 형식
          parsedDate = match[0];
          break;
        } else if (match[0].includes('일')) {
          // 17일 형식 (현재 월 사용)
          month = currentMonth.toString().padStart(2, '0');
          day = match[1].padStart(2, '0');
        }

        if (month && day) {
          let year = currentYear;
          if (parseInt(month) < currentMonth) {
            year = currentYear + 1;
          }
          parsedDate = `${year}-${month}-${day}`;
          break;
        }
      }
    }

    // 시간 패턴: 12:00-17:00, 12시-17시, 오후 12시 등
    const timePatterns = [
      /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/, // 12:00-17:00
      /(\d{1,2})시\s*-\s*(\d{1,2})시/, // 12시-17시
      /오전\s*(\d{1,2}):(\d{2})\s*-\s*오후\s*(\d{1,2}):(\d{2})/,
      /오후\s*(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/,
    ];

    for (const pattern of timePatterns) {
      const match = fullText.match(pattern);
      if (match) {
        if (match[0].includes(':')) {
          parsedStartTime = `${match[1].padStart(2, '0')}:${match[2]}`;
          parsedEndTime = `${match[3].padStart(2, '0')}:${match[4]}`;
        } else if (match[0].includes('시')) {
          parsedStartTime = `${match[1].padStart(2, '0')}:00`;
          parsedEndTime = `${match[2].padStart(2, '0')}:00`;
        }
        break;
      }
    }

    // 장소 추출: 다양한 키워드와 주소 패턴
    let parsedLocation = '';
    const locationKeywords = [
      '장소',
      '위치',
      '근무지',
      '주소',
      '장소:',
      '위치:',
      '🏢',
    ];

    for (const keyword of locationKeywords) {
      const locationLine = lines.find(
        (line) => line.includes(keyword) || fullText.includes(keyword),
      );
      if (locationLine) {
        const match = locationLine.match(
          new RegExp(`${keyword.replace('🏢', '')}\\s*:?\\s*(.+)`, 'i'),
        );
        if (match) {
          parsedLocation = match[1].trim();
          break;
        }
      }
    }

    // 주소 패턴 직접 찾기 (시/도, 시/군/구 포함)
    if (!parsedLocation) {
      const addressPattern = /[가-힣]+(?:시|도)\s+[가-힣]+(?:시|군|구)[^.\n]*/;
      const addressMatch = fullText.match(addressPattern);
      if (addressMatch) {
        parsedLocation = addressMatch[0].trim();
      }
    }

    // 복장/준비물 추출
    let parsedEquipments = '';
    const equipmentKeywords = ['복장', '준비물', '지참', '👔'];
    for (const keyword of equipmentKeywords) {
      const equipLine = lines.find((line) => line.includes(keyword));
      if (equipLine) {
        const match = equipLine.match(
          new RegExp(`${keyword.replace('👔', '')}\\s*:?\\s*(.+)`, 'i'),
        );
        if (match) {
          parsedEquipments = match[1].trim();
          break;
        }
      }
    }

    // 업무 내용 추출
    let parsedWorkDescription = '';
    const workKeywords = ['업무', '담당', '작업', '⌨'];
    for (const keyword of workKeywords) {
      const workLine = lines.find((line) => line.includes(keyword));
      if (workLine) {
        const match = workLine.match(
          new RegExp(`${keyword.replace('⌨', '')}\\s*:?\\s*(.+)`, 'i'),
        );
        if (match) {
          parsedWorkDescription = match[1].trim();
          if (!parsedDescription.includes(parsedWorkDescription)) {
            parsedDescription += '\n\n업무: ' + parsedWorkDescription;
          }
          break;
        }
      }
    }

    // 인원 추출
    let parsedRecruitCount = 1;
    const recruitPatterns = [
      /(\d+)\s*명/,
      /인원\s*:?\s*(\d+)/,
      /모집\s*:?\s*(\d+)/,
      /(\d+)\s*인/,
    ];
    for (const pattern of recruitPatterns) {
      const match = fullText.match(pattern);
      if (match) {
        parsedRecruitCount = parseInt(match[1], 10);
        break;
      }
    }

    // 급여 추출: 다양한 형식
    let parsedPayAmount = 0;
    let parsedPayType: 'hourly' | 'daily' | 'weekly' | 'monthly' = 'daily';
    let parsedTaxWithholding = false;

    // 급여 유형 확인
    if (fullText.includes('시급')) parsedPayType = 'hourly';
    else if (fullText.includes('일급')) parsedPayType = 'daily';
    else if (fullText.includes('주급')) parsedPayType = 'weekly';
    else if (fullText.includes('월급')) parsedPayType = 'monthly';

    // 금액 추출: 다양한 형식
    const amountPatterns = [
      /(\d{1,3}(?:,\d{3})*)\s*원/, // 65,000원
      /(\d+)\s*원/, // 65000원
      /시급\s*:?\s*(\d{1,3}(?:,\d{3})*)/,
      /일급\s*:?\s*(\d{1,3}(?:,\d{3})*)/,
      /페이\s*:?\s*(\d{1,3}(?:,\d{3})*)/,
    ];

    for (const pattern of amountPatterns) {
      const match = fullText.match(pattern);
      if (match) {
        parsedPayAmount = parseInt(match[1].replace(/,/g, ''), 10);
        break;
      }
    }

    // 3.3% 공제 확인
    if (
      fullText.includes('3.3%') ||
      fullText.includes('세공') ||
      fullText.includes('원천징수')
    ) {
      parsedTaxWithholding = true;
    }

    // 담당자 정보 추출
    let parsedManagerName = '';
    let parsedManagerPhone = '';

    // 전화번호 패턴 찾기
    const phonePatterns = [
      /(\d{3}-\d{4}-\d{4})/,
      /(\d{3}\s*\d{4}\s*\d{4})/,
      /(\d{11})/,
      /010[-\s]?\d{4}[-\s]?\d{4}/,
    ];

    for (const pattern of phonePatterns) {
      const match = fullText.match(pattern);
      if (match) {
        parsedManagerPhone = match[0].replace(/\s/g, '-');
        break;
      }
    }

    // 담당자 이름 추출
    const managerPatterns = [
      /담당자\s+([가-힣\s]+?)(?:\s+대리|\s+과장|\s+팀장|\s+📞|$)/,
      /([가-힣]{2,4})\s*(?:대리|과장|팀장|담당)\s*[📞\d-]/,
    ];

    for (const pattern of managerPatterns) {
      const match = fullText.match(pattern);
      if (match) {
        parsedManagerName = match[1].trim();
        break;
      }
    }

    // 기타 사항 추출
    let parsedNotes = '';
    const notesKeywords = ['문자 지원', '지원 방법', '안내', '✉', '문의'];
    for (const keyword of notesKeywords) {
      const notesIndex = lines.findIndex((line) => line.includes(keyword));
      if (notesIndex >= 0) {
        parsedNotes = lines.slice(notesIndex).join('\n');
        break;
      }
    }

    return {
      title: parsedTitle,
      description: parsedDescription,
      date: parsedDate,
      startTime: parsedStartTime,
      endTime: parsedEndTime,
      location: parsedLocation,
      equipments: parsedEquipments,
      recruitCount: parsedRecruitCount,
      payAmount: parsedPayAmount,
      payType: parsedPayType,
      taxWithholding: parsedTaxWithholding,
      managerName: parsedManagerName,
      managerPhone: parsedManagerPhone,
      notes: parsedNotes,
      keyword: keywordFromTitle,
    };
  };

  const handlePasteAndParse = () => {
    if (!pasteText.trim()) return;

    const parsed = parsePastedText(pasteText);

    // 제목 설정
    if (parsed.title) {
      setTitle(parsed.title);
    }

    // 설명 설정
    if (parsed.description) {
      setDescription(parsed.description);
    }

    // 키워드 추가
    if (parsed.keyword && !keywords.includes(parsed.keyword)) {
      setKeywords((prev) => [...prev, parsed.keyword]);
    }

    // work_slots 설정
    if (parsed.date && parsed.startTime && parsed.endTime && parsed.location) {
      setWorkSlots([
        {
          date: parsed.date,
          start: parsed.startTime,
          end: parsed.endTime,
          location: parsed.location,
          pay_type: parsed.payType,
          pay_amount: parsed.payAmount || 0,
          tax_withholding: parsed.taxWithholding,
        },
      ]);
    } else if (parsed.location) {
      // 날짜/시간이 없어도 장소만 있으면 work_slots에 장소 설정
      setWorkSlots([
        {
          date: parsed.date || '',
          start: parsed.startTime || '09:00',
          end: parsed.endTime || '18:00',
          location: parsed.location,
          pay_type: parsed.payType,
          pay_amount: parsed.payAmount || 0,
          tax_withholding: parsed.taxWithholding,
        },
      ]);
    }

    // 모집인원 설정
    if (parsed.recruitCount) {
      setRecruitCount(parsed.recruitCount);
    }

    // 준비물 설정
    if (parsed.equipments) {
      setEquipments(parsed.equipments);
    }

    // 담당자 정보 설정
    if (parsed.managerName) {
      setManagerName(parsed.managerName);
    }
    if (parsed.managerPhone) {
      setManagerPhone(parsed.managerPhone);
    }

    // 기타 사항 설정
    if (parsed.notes) {
      setNotes(parsed.notes);
    }

    setShowPasteModal(false);
    setPasteText('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('work_slots', JSON.stringify(workSlots));
    formData.append('recruit_count', recruitCount.toString());
    formData.append('manager_name', managerName);
    formData.append('manager_phone', managerPhone);
    if (equipments) formData.append('equipments', equipments);
    if (qualifications) formData.append('qualifications', qualifications);
    if (preferences) formData.append('preferences', preferences);
    if (notes) formData.append('notes', notes);
    if (externalLink) formData.append('external_link', externalLink);
    formData.append('keywords', JSON.stringify(keywords));
    formData.append('status', status);
    formData.append('form_type', 'basic');

    // formAction을 transition 내에서 호출
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <div>
      <Hero
        title={isRepostMode ? '재공고 작성' : '새 공고 작성'}
        description={
          isRepostMode
            ? '기존 공고를 기반으로 새 공고를 작성합니다'
            : '새로운 공고를 작성하세요'
        }
      />

      {isRepostMode && (
        <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
          <span className="font-medium">재공고 수정 중</span> - 기존 공고 내용을
          수정하여 새로운 공고로 등록합니다.
        </div>
      )}

      <div className="mb-4 flex gap-2 justify-end items-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowPasteModal(true)}
        >
          <Clipboard className="size-4 mr-2" />
          붙여넣기
        </Button>
      </div>

      {/* 붙여넣기 모달 */}
      <Dialog open={showPasteModal} onOpenChange={setShowPasteModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>공고문 붙여넣기</DialogTitle>
            <DialogDescription>
              공고문 텍스트를 붙여넣으면 자동으로 양식에 채워집니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="paste-text">공고문 텍스트</Label>
              <Textarea
                id="paste-text"
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="공고문 텍스트를 붙여넣어주세요..."
                className="min-h-[300px] font-mono text-sm"
              />
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>지원 형식:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>📅 일시: 날짜 및 시간</li>
                <li>🏢 장소: 근무 장소</li>
                <li>👔 복장: 준비물/복장</li>
                <li>⌨️ 업무: 업무 내용</li>
                <li>🧑 인원: 모집 인원</li>
                <li>💵 페이: 급여 정보</li>
                <li>담당자 정보: 이름 및 연락처</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowPasteModal(false);
                setPasteText('');
              }}
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={handlePasteAndParse}
              disabled={!pasteText.trim()}
            >
              <Check className="size-4 mr-2" />
              적용하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <form action={formAction} onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">
                제목 <span className="text-red-500">*</span>
              </Label>
              <small className="text-muted-foreground">최대 24자</small>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              {state.fieldErrors?.title && (
                <p className="text-sm text-red-500 mt-1">
                  {state.fieldErrors.title}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="description">
                  업무 내용 <span className="text-red-500">*</span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMarkdownPreview(!showMarkdownPreview)}
                >
                  {showMarkdownPreview ? (
                    <>
                      <Edit className="size-4 mr-1" />
                      편집 모드
                    </>
                  ) : (
                    <>
                      <Eye className="size-4 mr-1" />
                      미리보기
                    </>
                  )}
                </Button>
              </div>
              {!showMarkdownPreview && (
                <div className="flex flex-wrap gap-1 p-2 border rounded-md bg-muted mb-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertMarkdownText('# ', '', '큰 제목')}
                    title="큰 제목 (H1)"
                  >
                    <Heading1 className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertMarkdownText('## ', '', '중간 제목')}
                    title="중간 제목 (H2)"
                  >
                    <Heading2 className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertMarkdownText('### ', '', '작은 제목')}
                    title="작은 제목 (H3)"
                  >
                    <Heading3 className="size-4" />
                  </Button>
                  <div className="w-px h-6 bg-border mx-1" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertMarkdownText('**', '**', '굵은 글씨')}
                    title="굵게"
                  >
                    <Bold className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertMarkdownText('*', '*', '기울임')}
                    title="기울임"
                  >
                    <Italic className="size-4" />
                  </Button>
                  <div className="w-px h-6 bg-border mx-1" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      insertMarkdownText('[', '](https://)', '링크 텍스트')
                    }
                    title="링크"
                  >
                    <LinkIcon className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertMarkdownText('- ', '', '리스트 항목')}
                    title="리스트"
                  >
                    <List className="size-4" />
                  </Button>
                </div>
              )}
              {!showMarkdownPreview ? (
                <Textarea
                  ref={descriptionTextareaRef}
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                  placeholder={`예시:
# 업무 내용
행사 스탭 모집합니다.
`}
                  required
                />
              ) : (
                <div
                  className="w-full min-h-[300px] px-4 py-3 border rounded-md bg-muted prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdown(description),
                  }}
                />
              )}
              {state.fieldErrors?.description && (
                <p className="text-sm text-red-500 mt-1">
                  {state.fieldErrors.description}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="recruit_count">
                모집인원 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="recruit_count"
                type="number"
                min="1"
                value={recruitCount}
                onChange={(e) => setRecruitCount(Number(e.target.value))}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>날짜/시간/급여 정보</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddWorkSlot}
            >
              <Plus className="size-4 mr-2" />
              추가
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {workSlots.map((slot, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">슬롯 {index + 1}</span>
                  {workSlots.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveWorkSlot(index)}
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>
                      날짜 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={slot.date}
                      onChange={(e) =>
                        handleWorkSlotChange(index, 'date', e.target.value)
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label>
                      시작 시간 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="time"
                      value={slot.start}
                      onChange={(e) =>
                        handleWorkSlotChange(index, 'start', e.target.value)
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label>
                      종료 시간 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="time"
                      value={slot.end}
                      onChange={(e) =>
                        handleWorkSlotChange(index, 'end', e.target.value)
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label>
                      장소 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={slot.location}
                      onChange={(e) =>
                        handleWorkSlotChange(index, 'location', e.target.value)
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label>
                      급여 유형 <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={slot.pay_type}
                      onValueChange={(v) =>
                        handleWorkSlotChange(
                          index,
                          'pay_type',
                          v as WorkSlot['pay_type'],
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">시급</SelectItem>
                        <SelectItem value="daily">일급</SelectItem>
                        <SelectItem value="weekly">주급</SelectItem>
                        <SelectItem value="monthly">월급</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>
                      급여 금액 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={slot.pay_amount || ''}
                      onChange={(e) =>
                        handleWorkSlotChange(
                          index,
                          'pay_amount',
                          Number(e.target.value),
                        )
                      }
                      required
                    />
                  </div>
                  <div className="md:col-span-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`tax-${index}`}
                      checked={slot.tax_withholding}
                      onChange={(e) =>
                        handleWorkSlotChange(
                          index,
                          'tax_withholding',
                          e.target.checked,
                        )
                      }
                      className="size-4"
                    />
                    <Label htmlFor={`tax-${index}`} className="cursor-pointer">
                      3.3% 원천징수 공제
                    </Label>
                  </div>
                </div>
              </div>
            ))}
            {state.fieldErrors?.['work_slots'] && (
              <p className="text-sm text-red-500">
                {state.fieldErrors['work_slots']}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>담당자 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="manager_name">
                담당자 이름 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="manager_name"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="manager_phone">
                담당자 연락처 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="manager_phone"
                value={managerPhone}
                onChange={(e) => setManagerPhone(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>추가 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="equipments">준비물 (복장 등)</Label>
              <Input
                id="equipments"
                value={equipments}
                onChange={(e) => setEquipments(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="qualifications">자격 요건</Label>
              <Textarea
                id="qualifications"
                value={qualifications}
                onChange={(e) => setQualifications(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="preferences">우대 사항</Label>
              <Textarea
                id="preferences"
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="notes">기타 사항</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="external_link">링크 (선택사항)</Label>
              <Input
                id="external_link"
                type="url"
                value={externalLink}
                onChange={(e) => setExternalLink(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <Label>키워드</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddKeyword();
                    }
                  }}
                  placeholder="키워드 입력 후 Enter"
                />
                <Button type="button" onClick={handleAddKeyword}>
                  추가
                </Button>
              </div>
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {keywords.map((kw) => (
                    <Badge
                      key={kw}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {kw}
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(kw)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="status">공고 상태</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as typeof status)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recruiting">모집중</SelectItem>
                  <SelectItem value="urgent">급구</SelectItem>
                  <SelectItem value="completed">모집완료</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {state.message && (
          <div
            className={`p-3 rounded-md ${
              state.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {state.message}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            취소
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                {isRepostMode ? '재공고 작성 중...' : '작성 중...'}
              </>
            ) : isRepostMode ? (
              '재공고 작성하기'
            ) : (
              '작성하기'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function CreatePostPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Hero title="공고 작성" description="공고를 불러오는 중..." />
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              페이지를 불러오는 중입니다...
            </CardContent>
          </Card>
        </div>
      }
    >
      <CreatePostContent />
    </Suspense>
  );
}
