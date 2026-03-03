import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { MoreHorizontal, MessageSquare, Star } from 'lucide-react';

type Props = {
  isReviewModalOpen: boolean;
  setIsReviewModalOpen: (open: boolean) => void;
  reviewRating: number;
  setReviewRating: (rating: number) => void;
  reviewContent: string;
  setReviewContent: (content: string) => void;
  isSubmittingReview: boolean;
  onSubmitReview: () => void;
};

export function MiscCard({
  isReviewModalOpen,
  setIsReviewModalOpen,
  reviewRating,
  setReviewRating,
  reviewContent,
  setReviewContent,
  isSubmittingReview,
  onSubmitReview,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MoreHorizontal className="size-5" />
          기타
        </CardTitle>
        <CardDescription>기타 설정 및 기능</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="review">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <MessageSquare className="size-4" />
                <span className="font-medium">앱 리뷰 작성</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                <p className="text-sm text-muted-foreground">
                  고인력 서비스에 대한 소중한 의견을 남겨주세요. 더 나은
                  서비스를 제공하는 데 큰 도움이 됩니다.
                </p>
                <Dialog
                  open={isReviewModalOpen}
                  onOpenChange={setIsReviewModalOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                      <Star className="size-4 mr-2" />
                      리뷰 작성하기
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>앱 리뷰 작성</DialogTitle>
                      <DialogDescription>
                        고인력 서비스에 대한 솔직한 리뷰를 남겨주세요.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">별점</Label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              className="p-1 hover:scale-110 transition-transform"
                            >
                              <Star
                                className={`size-8 ${
                                  star <= reviewRating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-muted-foreground'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                        {reviewRating > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {reviewRating === 1 && '별로예요'}
                            {reviewRating === 2 && '그저 그래요'}
                            {reviewRating === 3 && '보통이에요'}
                            {reviewRating === 4 && '좋아요'}
                            {reviewRating === 5 && '아주 좋아요!'}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="review-content"
                          className="text-sm font-medium"
                        >
                          리뷰 내용
                        </Label>
                        <Textarea
                          id="review-content"
                          placeholder="서비스 이용 경험을 자세히 적어주세요..."
                          value={reviewContent}
                          onChange={(e) => setReviewContent(e.target.value)}
                          rows={4}
                          className="resize-none"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsReviewModalOpen(false)}
                      >
                        취소
                      </Button>
                      <Button
                        onClick={onSubmitReview}
                        disabled={
                          isSubmittingReview ||
                          reviewRating === 0 ||
                          !reviewContent.trim()
                        }
                      >
                        {isSubmittingReview ? '제출 중...' : '리뷰 제출'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
