'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import {
  CheckCircle2,
  ImageIcon,
  Loader2,
  Trash2,
  Upload,
  X,
  XCircle,
  Eye,
} from 'lucide-react';
import { useAdminPopups } from '../../hooks/useAdminPopups';

export const PopupTab = () => {
  const {
    popups,
    loadingPopups,
    editingPopup,
    popupForm,
    setPopupForm,
    popupSaving,
    imageUploading,
    popupImageInputRef,
    resetPopupForm,
    handleEditPopup,
    handlePopupImageUpload,
    handleRemovePopupImage,
    handleSavePopup,
    handleDeletePopup,
    handleTogglePopupActive,
  } = useAdminPopups();

  return (
    <div className="space-y-4">
      {/* 팝업 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span>팝업 목록</span>
            <span className="text-sm font-normal text-muted-foreground">
              총 {popups.length}개
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loadingPopups ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground gap-2">
              <Loader2 className="size-4 animate-spin" />
              불러오는 중...
            </div>
          ) : popups.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              등록된 팝업이 없습니다. 아래에서 새 팝업을 만들어보세요.
            </p>
          ) : (
            popups.map((popup) => (
              <div
                key={popup.popup_id}
                className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 ${
                  popup.is_active ? 'border-primary/50 bg-primary/5' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{popup.title}</span>
                    {popup.is_active && (
                      <Badge className="text-[10px] px-1.5 py-0.5 shrink-0">활성</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {popup.content}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTogglePopupActive(popup.popup_id, !popup.is_active)}
                  >
                    {popup.is_active ? (
                      <>
                        <XCircle className="size-3.5" />
                        <span className="text-xs">비활성화</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="size-3.5 text-emerald-600" />
                        <span className="text-xs">활성화</span>
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditPopup(popup)}
                  >
                    <Eye className="size-3.5" />
                    <span className="text-xs">수정</span>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeletePopup(popup.popup_id)}
                  >
                    <Trash2 className="size-3.5" />
                    <span className="text-xs">삭제</span>
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* 생성 / 수정 폼 + 미리보기 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* 폼 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>{editingPopup ? '팝업 수정' : '새 팝업 만들기'}</span>
              {editingPopup && (
                <Button variant="ghost" size="sm" onClick={resetPopupForm}>
                  <X className="size-4" />
                  <span className="text-xs">취소</span>
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 이미지 업로드 */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                이미지 <span className="text-xs text-muted-foreground">(선택)</span>
              </label>
              {popupForm.image_url ? (
                <div className="relative w-full rounded-lg overflow-hidden bg-muted border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={popupForm.image_url}
                    alt="팝업 이미지"
                    className="w-full aspect-video object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemovePopupImage}
                    className="absolute top-2 right-2 size-7 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
                    aria-label="이미지 제거"
                  >
                    <X className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => popupImageInputRef.current?.click()}
                    disabled={imageUploading}
                    className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md bg-black/60 hover:bg-black/80 text-white transition-colors"
                  >
                    <Upload className="size-3" />
                    교체
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => popupImageInputRef.current?.click()}
                  disabled={imageUploading}
                  className="w-full aspect-video rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors disabled:opacity-60"
                >
                  {imageUploading ? (
                    <>
                      <Loader2 className="size-6 animate-spin text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">업로드 중...</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="size-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        클릭하여 이미지 업로드
                      </span>
                      <span className="text-[10px] text-muted-foreground/70">
                        JPG, PNG, WEBP 권장
                      </span>
                    </>
                  )}
                </button>
              )}
              <input
                ref={popupImageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePopupImageUpload}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">
                제목 <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="팝업 제목"
                value={popupForm.title}
                onChange={(e) => setPopupForm((p) => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">
                내용 <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="팝업에 표시할 내용을 입력하세요"
                value={popupForm.content}
                onChange={(e) => setPopupForm((p) => ({ ...p, content: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  링크 URL{' '}
                  <span className="text-xs text-muted-foreground">(선택)</span>
                </label>
                <Input
                  placeholder="/post 또는 https://..."
                  value={popupForm.link_url}
                  onChange={(e) =>
                    setPopupForm((p) => ({ ...p, link_url: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  버튼 텍스트{' '}
                  <span className="text-xs text-muted-foreground">(선택)</span>
                </label>
                <Input
                  placeholder="자세히 보기"
                  value={popupForm.link_text}
                  onChange={(e) =>
                    setPopupForm((p) => ({ ...p, link_text: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="popup-active"
                className="size-4 rounded"
                checked={popupForm.is_active}
                onChange={(e) =>
                  setPopupForm((p) => ({ ...p, is_active: e.target.checked }))
                }
              />
              <label htmlFor="popup-active" className="text-sm font-medium cursor-pointer">
                즉시 활성화{' '}
                <span className="text-xs font-normal text-muted-foreground">
                  (다른 활성 팝업은 자동 비활성화)
                </span>
              </label>
            </div>
            <Button
              onClick={handleSavePopup}
              disabled={
                popupSaving ||
                imageUploading ||
                !popupForm.title.trim() ||
                !popupForm.content.trim()
              }
              className="w-full"
            >
              {popupSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  저장 중...
                </>
              ) : editingPopup ? (
                '팝업 수정'
              ) : (
                '팝업 생성'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 미리보기 */}
        <Card className="lg:sticky lg:top-4">
          <CardHeader>
            <CardTitle className="text-base text-muted-foreground">미리보기</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center bg-black/30 rounded-xl p-4 min-h-[300px]">
              {popupForm.title || popupForm.content || popupForm.image_url ? (
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden">
                  {popupForm.image_url && (
                    <div className="w-full aspect-video overflow-hidden bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={popupForm.image_url}
                        alt="preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="px-5 pt-5 pb-3 space-y-2">
                    {popupForm.title && (
                      <h2 className="text-sm font-bold text-gray-900 leading-snug">
                        {popupForm.title}
                      </h2>
                    )}
                    {popupForm.content && (
                      <p className="text-xs text-gray-500 whitespace-pre-line leading-relaxed">
                        {popupForm.content}
                      </p>
                    )}
                    {popupForm.link_url && (
                      <div className="pt-1">
                        <div className="w-full text-center text-xs font-medium bg-primary text-primary-foreground rounded-md px-3 py-1.5">
                          {popupForm.link_text || '자세히 보기'}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center border-t border-gray-200">
                    <div className="flex-1 py-2.5 text-center text-[10px] text-gray-400">
                      하루 동안 보지 않기
                    </div>
                    <div className="w-px h-4 bg-gray-200" />
                    <div className="flex-1 py-2.5 text-center text-[10px] text-gray-400">
                      닫기
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 size-6 flex items-center justify-center rounded-full bg-black/30 text-white">
                    <X className="size-3" />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-white/50">
                  <ImageIcon className="size-8" />
                  <p className="text-xs">
                    제목이나 내용을 입력하면
                    <br />
                    미리보기가 표시됩니다
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
