import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Plus } from 'lucide-react';

type Props = {
  favoriteKeywords: string[];
  activeKeywords: string[];
  newKeyword: string;
  setNewKeyword: (v: string) => void;
  isLoadingKeywords: boolean;
  onAddKeyword: () => void;
  onRemoveKeyword: (kw: string) => void;
  onAddFromSuggestion: (kw: string) => void;
};

export function KeywordsTab({
  favoriteKeywords,
  activeKeywords,
  newKeyword,
  setNewKeyword,
  isLoadingKeywords,
  onAddKeyword,
  onRemoveKeyword,
  onAddFromSuggestion,
}: Props) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-semibold">관심 키워드</p>
              <p className="text-sm text-muted-foreground">
                키워드에 매칭되는 공고가 올라오면 알림을 받을 수 있습니다.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="키워드 입력 (예: 부산, 팝업, 행사)"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onAddKeyword();
                }
              }}
            />
            <Button type="button" onClick={onAddKeyword}>
              <Plus className="size-4 mr-1" />
              추가
            </Button>
          </div>

          {isLoadingKeywords ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              키워드를 불러오는 중...
            </div>
          ) : favoriteKeywords.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              아직 관심 키워드가 없습니다.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {favoriteKeywords.map((kw) => (
                <Button
                  key={kw}
                  type="button"
                  variant="secondary"
                  className="h-8 px-3"
                  onClick={() => onRemoveKeyword(kw)}
                  title="클릭하면 삭제"
                >
                  #{kw}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-3">
          <p className="font-semibold">추천 키워드</p>
          <p className="text-sm text-muted-foreground">
            최근 공고에서 자주 보이는 키워드입니다. 클릭해서 추가할 수 있어요.
          </p>
          {activeKeywords.length === 0 ? (
            <div className="py-6 text-sm text-muted-foreground">추천 키워드가 없습니다.</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {activeKeywords
                .filter((kw) => !favoriteKeywords.includes(kw))
                .slice(0, 40)
                .map((kw) => (
                  <Button
                    key={`active-${kw}`}
                    type="button"
                    variant="outline"
                    className="h-8 px-3"
                    onClick={() => onAddFromSuggestion(kw)}
                  >
                    #{kw}
                  </Button>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
