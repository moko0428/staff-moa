'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useActionState } from 'react';
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
import { Plus, X, Loader2 } from 'lucide-react';
import { updatePostAction, getPostByIdAction } from '../../actions';
import { useUserStore } from '@/store/useUserStore';
import { Post } from '@/types/mockData';

type WorkSlot = {
  date: string;
  start: string;
  end: string;
  location: string;
  pay_type: 'hourly' | 'daily' | 'weekly' | 'monthly';
  pay_amount: number;
  tax_withholding: boolean;
};

const initialState = { ok: false, message: '', data: undefined };

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const role = useUserStore((state) => state.role);
  const roleHydrated = useUserStore((state) => state.roleHydrated);
  const isManager = role === 'manager';

  const [state, formAction, isPending] = useActionState(
    updatePostAction,
    initialState
  );
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [workSlots, setWorkSlots] = useState<WorkSlot[]>([]);
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
    'recruiting'
  );
  const [formType, setFormType] = useState<'basic' | 'free'>('basic');

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      try {
        const result = await getPostByIdAction(postId);
        if (result.ok && result.data) {
          const post = result.data as unknown as Post;
          setTitle(post.title || '');
          setDescription(post.description || '');

          setRecruitCount(post.recruit_count || 1);
          setManagerName(post.manager_name || '');
          setManagerPhone(post.manager_phone || '');
          setEquipments(post.equipments || '');
          setQualifications(post.qualifications || '');
          setPreferences(post.preferences || '');
          setNotes(post.notes || '');
          setExternalLink(post.external_link || '');
          setKeywords(post.keywords || []);
          setStatus(post.status || 'recruiting');
          setFormType(post.form_type || 'basic');
        } else {
          alert('공고를 불러오는데 실패했습니다.');
          router.push('/my-post');
        }
      } catch (err) {
        console.error('Failed to fetch post', err);
        alert('공고를 불러오는 중 오류가 발생했습니다.');
        router.push('/my-post');
      } finally {
        setLoading(false);
      }
    };

    if (postId && isManager) {
      fetchPost();
    }
  }, [postId, isManager, router]);

  useEffect(() => {
    if (state.ok) {
      router.push('/my-post');
    }
  }, [state, router]);

  if (!roleHydrated) {
    return (
      <div className="space-y-4">
        <Hero title="공고 수정" description="매니저 전용 페이지" />
        <Card>
          <CardContent className="py-6 text-sm text-gray-600">
            역할 정보를 불러오는 중입니다...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isManager) {
    return (
      <div className="space-y-4">
        <Hero title="공고 수정" description="매니저 전용 페이지" />
        <Card>
          <CardContent className="py-6 text-sm text-gray-600">
            관리자 승인이 필요한 매니저 전용 페이지입니다.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Hero title="공고 수정" description="공고를 불러오는 중..." />
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="size-6 animate-spin mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500">공고를 불러오는 중...</p>
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
    value: string | number | boolean
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('id', postId);
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
    formData.append('form_type', formType);

    await formAction(formData);
  };

  return (
    <div>
      <Hero title="공고 수정" description="공고 정보를 수정하세요" />

      <div className="mb-4 flex gap-2">
        <Button
          type="button"
          variant={formType === 'basic' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFormType('basic')}
        >
          기본 양식
        </Button>
        <Button
          type="button"
          variant={formType === 'free' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFormType('free')}
        >
          자유 양식
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">
                제목 <span className="text-red-500">*</span>
              </Label>
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
              <Label htmlFor="description">
                업무 내용 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                required
              />
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
                          v as WorkSlot['pay_type']
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
                          Number(e.target.value)
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
                          e.target.checked
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
                수정 중...
              </>
            ) : (
              '수정하기'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
