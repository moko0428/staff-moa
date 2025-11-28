'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Hero from '@/components/Hero';
import PostForm, { LinkItem, DateTimeItem } from '@/components/PostForm';
import MarkdownForm from '@/components/MarkdownForm';
import { Button } from '@/components/ui/button';
import { Post } from '@/types/mockData';
import { Clipboard, Check } from 'lucide-react';

type FormType = 'basic' | 'markdown';

export default function CreatePostPage() {
  const router = useRouter();
  const [formType, setFormType] = useState<FormType>('basic');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [newKeyword, setNewKeyword] = useState('');
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [newLinkText, setNewLinkText] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [dateTimeList, setDateTimeList] = useState<DateTimeItem[]>([
    { date: '', time: '' },
  ]);
  const [formData, setFormData] = useState<Partial<Post>>({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    salary: 0,
    paymentDate: '',
    preparation: '',
    keywords: [],
    managerInfo: {
      name: '',
      phone: '',
    },
    recruitCount: 1,
    currentApplicants: 0,
    requirements: '',
    preferences: '',
    notes: '',
    status: 'recruiting',
  });
  const [markdownTitle, setMarkdownTitle] = useState('');
  const [markdownContent, setMarkdownContent] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [showPasteModal, setShowPasteModal] = useState(false);

  useEffect(() => {
    try {
      const userId =
        typeof window !== 'undefined'
          ? localStorage.getItem('userId') || 'manager-1'
          : 'manager-1';
      const userName =
        typeof window !== 'undefined'
          ? localStorage.getItem('userName') || '매니저'
          : '매니저';
      setCurrentUserId(userId);
      setCurrentUserName(userName);
    } catch {
      setCurrentUserId('manager-1');
      setCurrentUserName('매니저');
    }
  }, []);

  const handleInputChange = (
    field: string,
    value: string | number | string[]
  ) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof Post] as object),
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleDateTimeChange = (
    index: number,
    field: 'date' | 'time',
    value: string
  ) => {
    const updated = [...dateTimeList];
    updated[index] = { ...updated[index], [field]: value };
    setDateTimeList(updated);

    // formData에도 업데이트 (첫 번째 항목을 기본값으로)
    if (index === 0) {
      setFormData((prev) => ({
        ...prev,
        date: field === 'date' ? value : prev.date,
        time: field === 'time' ? value : prev.time,
      }));
    }
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !formData.keywords?.includes(newKeyword.trim())) {
      setFormData((prev) => ({
        ...prev,
        keywords: [...(prev.keywords || []), newKeyword.trim()],
      }));
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (keywordToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      keywords: prev.keywords?.filter((k) => k !== keywordToRemove) || [],
    }));
  };

  const handleKeywordKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const handleAddLink = () => {
    if (newLinkText.trim() && newLinkUrl.trim()) {
      // URL 유효성 검사
      try {
        new URL(newLinkUrl);
        setLinks([
          ...links,
          { text: newLinkText.trim(), url: newLinkUrl.trim() },
        ]);
        setNewLinkText('');
        setNewLinkUrl('');
      } catch {
        alert('올바른 URL 형식을 입력해주세요. (예: https://example.com)');
      }
    }
  };

  const handleRemoveLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleLinkKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddLink();
    }
  };

  const handleAddDateTime = () => {
    setDateTimeList([...dateTimeList, { date: '', time: '' }]);
  };

  const handleRemoveDateTime = (index: number) => {
    if (dateTimeList.length > 1) {
      const updated = dateTimeList.filter((_, i) => i !== index);
      setDateTimeList(updated);

      // 첫 번째 항목이 삭제된 경우 formData 업데이트
      if (index === 0 && updated.length > 0) {
        setFormData((prev) => ({
          ...prev,
          date: updated[0].date,
          time: updated[0].time,
        }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUserId) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (formType === 'markdown') {
      // 마크다운 양식 제출
      if (!markdownTitle || !markdownContent) {
        alert('제목과 내용을 모두 입력해주세요.');
        return;
      }

      const newPost: Post = {
        id: `post-${Date.now()}`,
        authorId: currentUserId,
        authorName: currentUserName,
        status: 'recruiting',
        title: markdownTitle,
        keywords: [],
        date: '',
        location: '',
        time: '',
        salary: 0,
        paymentDate: '',
        preparation: '',
        description: markdownContent,
        managerInfo: {
          name: '',
          phone: '',
        },
        recruitCount: 1,
        currentApplicants: 0,
        notes: markdownContent,
        requirements: '',
        preferences: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log('새 공고 생성 (마크다운):', newPost);
      router.push('/my-post');
      return;
    }

    // 기본 양식 제출
    // 날짜/시간 검증
    const hasValidDateTime = dateTimeList.some(
      (item) => item.date && item.time
    );
    if (!hasValidDateTime) {
      alert('최소 하나의 날짜와 시간을 입력해주세요.');
      return;
    }

    // 필수 필드 검증
    if (
      !formData.title ||
      !formData.description ||
      !formData.location ||
      !formData.salary ||
      !formData.managerInfo?.name ||
      !formData.managerInfo?.phone
    ) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    // 링크를 기타 사항에 포함
    let notes = formData.notes || '';
    if (links.length > 0) {
      const linksText = links
        .map((link) => `[${link.text}](${link.url})`)
        .join('\n');
      notes = notes ? `${notes}\n\n링크:\n${linksText}` : `링크:\n${linksText}`;
    }

    // 날짜와 시간을 문자열로 합치기 (여러 개인 경우)
    const dateStr = dateTimeList
      .map((item) => item.date)
      .filter((d) => d)
      .join(', ');
    const timeStr = dateTimeList
      .map((item) => item.time)
      .filter((t) => t)
      .join(', ');

    // 새 공고 생성
    const newPost: Post = {
      id: `post-${Date.now()}`,
      authorId: currentUserId,
      authorName: currentUserName,
      status: formData.status || 'recruiting',
      title: formData.title!,
      keywords: formData.keywords || [],
      date: dateStr,
      location: formData.location!,
      time: timeStr,
      salary: formData.salary!,
      paymentDate: formData.paymentDate || '',
      preparation: formData.preparation || '',
      description: formData.description!,
      managerInfo: {
        name: formData.managerInfo!.name,
        phone: formData.managerInfo!.phone,
      },
      recruitCount: formData.recruitCount || 1,
      currentApplicants: 0,
      notes: notes,
      requirements: formData.requirements || '',
      preferences: formData.preferences || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('새 공고 생성:', newPost);
    router.push('/my-post');
  };

  const parsePastedText = (text: string) => {
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line);

    // 제목 추출 (첫 줄에서 이모지/특수문자 제거)
    const titleLine = lines[0] || '';
    const title = titleLine.replace(/^[📌🔔⭐✨🎯💼\s]+/, '').trim();

    // 설명 추출 (별표나 특수문자로 시작하는 줄)
    const description =
      lines
        .find(
          (line) =>
            line.startsWith('*') || line.startsWith('•') || line.startsWith('-')
        )
        ?.replace(/^[*•\-]\s*/, '') || '';

    // 패턴 매칭 함수
    const extractField = (pattern: RegExp, lines: string[]): string => {
      for (const line of lines) {
        const match = line.match(pattern);
        if (match) {
          return match[1]?.trim() || '';
        }
      }
      return '';
    };

    // 각 필드 추출
    const date =
      extractField(/[✔✓]\s*일정\s*[:：]\s*(.+)/i, lines) ||
      extractField(/일정\s*[:：]\s*(.+)/i, lines);

    const time =
      extractField(/[✔✓]\s*시간\s*[:：]\s*(.+)/i, lines) ||
      extractField(/시간\s*[:：]\s*(.+)/i, lines);

    const location =
      extractField(/[✔✓]\s*장소\s*[:：]\s*(.+)/i, lines) ||
      extractField(/장소\s*[:：]\s*(.+)/i, lines);

    const preparation =
      extractField(/[✔✓]\s*복장\s*[:：]\s*(.+)/i, lines) ||
      extractField(/복장\s*[:：]\s*(.+)/i, lines);

    const salaryText =
      extractField(/[✔✓]\s*급여\s*[:：]\s*(.+)/i, lines) ||
      extractField(/급여\s*[:：]\s*(.+)/i, lines);
    const salary = salaryText
      ? parseInt(salaryText.replace(/[^0-9]/g, '')) || 0
      : 0;

    const paymentDate =
      extractField(/[✔✓]\s*지급일\s*[:：]\s*(.+)/i, lines) ||
      extractField(/지급일\s*[:：]\s*(.+)/i, lines);

    const phone =
      extractField(/[☎📞]\s*담당자\s*연락처\s*(.+)/i, lines) ||
      extractField(/담당자\s*연락처\s*(.+)/i, lines) ||
      extractField(/(010-\d{4}-\d{4})/i, lines);

    // 키워드 추출 (제목에서 주요 키워드)
    const keywords: string[] = [];
    if (title) {
      const titleKeywords = title
        .split(/\s+/)
        .filter((word) => word.length > 1);
      keywords.push(...titleKeywords.slice(0, 3));
    }
    if (location) {
      const locationParts = location.split(/\s+/);
      keywords.push(
        ...locationParts.filter((part) => part.length > 1).slice(0, 2)
      );
    }

    // 날짜와 시간을 배열로 파싱
    const dateTimeItems: DateTimeItem[] = [];

    // 일정에서 날짜 범위 추출
    if (date) {
      // "12월 3일~12월 31일" 형식 처리
      const dateRangeMatch = date.match(
        /(\d{1,2})월\s*(\d{1,2})일\s*~\s*(\d{1,2})월\s*(\d{1,2})일/
      );
      if (dateRangeMatch) {
        // 범위가 있으면 시작일만 추가 (추가 날짜는 사용자가 수동으로 추가 가능)
        const month = dateRangeMatch[1].padStart(2, '0');
        const day = dateRangeMatch[2].padStart(2, '0');
        const currentYear = new Date().getFullYear();
        dateTimeItems.push({
          date: `${currentYear}-${month}-${day}`,
          time: time || '',
        });
      } else {
        // 단일 날짜
        const dateMatch = date.match(/(\d{1,2})월\s*(\d{1,2})일/);
        if (dateMatch) {
          const month = dateMatch[1].padStart(2, '0');
          const day = dateMatch[2].padStart(2, '0');
          const currentYear = new Date().getFullYear();
          dateTimeItems.push({
            date: `${currentYear}-${month}-${day}`,
            time: time || '',
          });
        } else {
          dateTimeItems.push({
            date: date,
            time: time || '',
          });
        }
      }
    } else {
      dateTimeItems.push({ date: '', time: time || '' });
    }

    // 기타 사항 (나머지 내용)
    const otherLines = lines.filter((line) => {
      const lowerLine = line.toLowerCase();
      return (
        !lowerLine.includes('일정') &&
        !lowerLine.includes('시간') &&
        !lowerLine.includes('장소') &&
        !lowerLine.includes('급여') &&
        !lowerLine.includes('지급일') &&
        !lowerLine.includes('담당자') &&
        !lowerLine.includes('연락처') &&
        !lowerLine.includes('복장') &&
        !lowerLine.includes('업무') &&
        !line.startsWith('*') &&
        !line.startsWith('•') &&
        !line.startsWith('-') &&
        line !== title &&
        !line.match(/^[📌🔔⭐✨🎯💼]/)
      );
    });
    const notes = otherLines.join('\n');

    // 날짜 형식 변환 (예: "12월 3일~12월 31일" -> "2024-12-03")
    let formattedDate = '';
    if (date) {
      const dateMatch = date.match(/(\d{1,2})월\s*(\d{1,2})일/);
      if (dateMatch) {
        const month = dateMatch[1].padStart(2, '0');
        const day = dateMatch[2].padStart(2, '0');
        const currentYear = new Date().getFullYear();
        formattedDate = `${currentYear}-${month}-${day}`;
      } else {
        formattedDate = date;
      }
    }

    // 지급일 형식 변환
    let formattedPaymentDate = '';
    if (paymentDate) {
      const paymentMatch = paymentDate.match(/(\d{1,2})월\s*(\d{1,2})일/);
      if (paymentMatch) {
        const month = paymentMatch[1].padStart(2, '0');
        const day = paymentMatch[2].padStart(2, '0');
        const currentYear = new Date().getFullYear();
        formattedPaymentDate = `${currentYear}-${month}-${day}`;
      } else {
        formattedPaymentDate = paymentDate;
      }
    }

    return {
      title: title || formData.title,
      description: description || formData.description,
      date: formattedDate || formData.date,
      time: time || formData.time,
      location: location || formData.location,
      salary: salary || formData.salary,
      paymentDate: formattedPaymentDate || formData.paymentDate,
      preparation: preparation || formData.preparation,
      managerInfo: {
        name: formData.managerInfo?.name || '',
        phone: phone || formData.managerInfo?.phone || '',
      },
      notes: notes || formData.notes,
      keywords: keywords.length > 0 ? keywords : formData.keywords,
      dateTimeList:
        dateTimeItems.length > 0 ? dateTimeItems : [{ date: '', time: '' }],
    };
  };

  const handlePasteAndParse = () => {
    if (!pasteText.trim()) return;

    const parsed = parsePastedText(pasteText);

    setFormData((prev) => ({
      ...prev,
      ...parsed,
      keywords: parsed.keywords || prev.keywords,
    }));

    // 날짜/시간 목록 설정
    if (parsed.dateTimeList && parsed.dateTimeList.length > 0) {
      setDateTimeList(parsed.dateTimeList);
      if (parsed.dateTimeList[0]) {
        setFormData((prev) => ({
          ...prev,
          date: parsed.dateTimeList[0].date,
          time: parsed.dateTimeList[0].time,
        }));
      }
    }

    setShowPasteModal(false);
    setPasteText('');
  };

  return (
    <div>
      <Hero title="새 공고 작성" description="새로운 공고를 작성하세요" />

      {/* 붙여넣기 버튼 */}
      <div className="mb-4 flex justify-between items-center">
        <div className="flex gap-1">
          <Button
            variant={formType === 'basic' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFormType('basic')}
          >
            기본 양식
          </Button>
          <Button
            variant={formType === 'markdown' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFormType('markdown')}
          >
            자유 양식
          </Button>
        </div>
        {formType === 'basic' && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPasteModal(true)}
          >
            <Clipboard className="size-4" />
            공고문 붙여넣기
          </Button>
        )}
      </div>

      {/* 붙여넣기 모달 */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">공고문 붙여넣기</h3>
            <p className="text-sm text-gray-600 mb-4">
              공고문 텍스트를 붙여넣으면 자동으로 양식에 채워집니다.
            </p>
            <textarea
              className="w-full min-h-[300px] px-3 py-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="공고문 텍스트를 붙여넣어주세요..."
            />
            <div className="flex justify-end gap-2 mt-4">
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
                variant="default"
                onClick={handlePasteAndParse}
                disabled={!pasteText.trim()}
              >
                <Check className="size-4" />
                적용하기
              </Button>
            </div>
          </div>
        </div>
      )}

      {formType === 'basic' ? (
        <PostForm
          formData={formData}
          onFormDataChange={handleInputChange}
          dateTimeList={dateTimeList}
          onDateTimeChange={handleDateTimeChange}
          onAddDateTime={handleAddDateTime}
          onRemoveDateTime={handleRemoveDateTime}
          links={links}
          onAddLink={handleAddLink}
          onRemoveLink={handleRemoveLink}
          newLinkText={newLinkText}
          newLinkUrl={newLinkUrl}
          onNewLinkTextChange={setNewLinkText}
          onNewLinkUrlChange={setNewLinkUrl}
          onLinkKeyPress={handleLinkKeyPress}
          newKeyword={newKeyword}
          onNewKeywordChange={setNewKeyword}
          onAddKeyword={handleAddKeyword}
          onRemoveKeyword={handleRemoveKeyword}
          onKeywordKeyPress={handleKeywordKeyPress}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
        />
      ) : (
        <MarkdownForm
          title={markdownTitle}
          onTitleChange={setMarkdownTitle}
          content={markdownContent}
          onContentChange={setMarkdownContent}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
        />
      )}
    </div>
  );
}
