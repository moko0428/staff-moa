'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Save,
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

interface MarkdownFormProps {
  title: string;
  onTitleChange: (title: string) => void;
  content: string;
  onContentChange: (content: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export default function MarkdownForm({
  title,
  onTitleChange,
  content,
  onContentChange,
  onSubmit,
  onCancel,
}: MarkdownFormProps) {
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertText = (
    before: string,
    after: string = '',
    placeholder: string = ''
  ) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const textToInsert = selectedText || placeholder;

    const newContent =
      content.substring(0, start) +
      before +
      textToInsert +
      after +
      content.substring(end);

    onContentChange(newContent);

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

  const insertHeader = (level: number) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = content.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = content.indexOf('\n', start);
    const lineEndPos = lineEnd === -1 ? content.length : lineEnd;
    const currentLine = content.substring(lineStart, lineEndPos);

    // 이미 헤더인 경우 레벨만 변경
    const headerMatch = currentLine.match(/^(#{1,3})\s*(.*)$/);
    if (headerMatch) {
      const newLine = '#'.repeat(level) + ' ' + headerMatch[2];
      const newContent =
        content.substring(0, lineStart) +
        newLine +
        content.substring(lineEndPos);
      onContentChange(newContent);
      return;
    }

    // 헤더가 아닌 경우 헤더 추가
    const headerPrefix = '#'.repeat(level) + ' ';
    const newContent =
      content.substring(0, lineStart) +
      headerPrefix +
      currentLine +
      content.substring(lineEndPos);
    onContentChange(newContent);
  };

  const insertLink = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    if (selectedText) {
      // 선택된 텍스트가 있으면 링크로 감싸기
      insertText('[', '](https://)', selectedText);
    } else {
      // 선택된 텍스트가 없으면 플레이스홀더 삽입
      insertText('[링크 텍스트](', ')', 'https://example.com');
    }
  };

  // 간단한 마크다운 렌더링 (기본적인 기능만)
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
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>'
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

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-xl shadow-sm p-6">
      <div className="space-y-6">
        {/* 제목 */}
        <div className="space-y-2">
          <Label htmlFor="markdown-title">
            제목 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="markdown-title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="공고 제목을 입력하세요"
            required
          />
        </div>

        {/* 마크다운 에디터 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="markdown-content">
              내용 <span className="text-red-500">*</span>
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? (
                <>
                  <Edit className="size-4" />
                  편집 모드
                </>
              ) : (
                <>
                  <Eye className="size-4" />
                  미리보기
                </>
              )}
            </Button>
          </div>

          {/* 마크다운 툴바 */}
          {!showPreview && (
            <div className="flex flex-wrap gap-1 p-2 border rounded-md bg-gray-50">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertHeader(1)}
                title="큰 제목 (H1)"
              >
                <Heading1 className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertHeader(2)}
                title="중간 제목 (H2)"
              >
                <Heading2 className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertHeader(3)}
                title="작은 제목 (H3)"
              >
                <Heading3 className="size-4" />
              </Button>
              <div className="w-px h-6 bg-gray-300 mx-1" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertText('**', '**', '굵은 글씨')}
                title="굵게"
              >
                <Bold className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertText('*', '*', '기울임')}
                title="기울임"
              >
                <Italic className="size-4" />
              </Button>
              <div className="w-px h-6 bg-gray-300 mx-1" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={insertLink}
                title="링크"
              >
                <LinkIcon className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertText('- ', '', '리스트 항목')}
                title="리스트"
              >
                <List className="size-4" />
              </Button>
            </div>
          )}

          {showPreview ? (
            <div
              className="w-full min-h-[500px] px-4 py-3 border rounded-md bg-gray-50 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: renderMarkdown(content),
              }}
            />
          ) : (
            <textarea
              ref={textareaRef}
              id="markdown-content"
              className="w-full min-h-[500px] px-3 py-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              placeholder={`마크다운 형식으로 공고를 작성하세요.

예시:
# 공고 제목

# 업무 내용
# 일정
- 날짜: 2024년 12월 3일
- 시간: 09:00 - 18:00

# 장소
강남구 역삼동
# 급여
일급 11만원 (주휴, 식대 포함)

# 모집 인원
1명

# 담당자 이름
홍길동
# 담당자 연락처
010-1234-5678

# 준비물 및 복장
- 검정 상의, 하의, 신발

# 우대사항
- 행사 경력이 많으신 분

# 기타 사항
- 주휴, 식대 포함

# 링크
[링크 텍스트](https://www.naver.com)

# 키워드
행사, 스탭, 팝업
`}
              required
            />
          )}
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex justify-end gap-2 mt-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" variant="default">
          <Save className="size-4" />
          저장
        </Button>
      </div>
    </form>
  );
}
