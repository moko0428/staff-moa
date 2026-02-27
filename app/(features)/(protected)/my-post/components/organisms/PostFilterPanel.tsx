'use client';

import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent } from '@/app/components/ui/card';
import { Search } from 'lucide-react';

interface PostFilterPanelProps {
  sortOrder: 'newest' | 'oldest';
  setSortOrder: (v: 'newest' | 'oldest') => void;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
}

export const PostFilterPanel = ({
  sortOrder,
  setSortOrder,
  searchTerm,
  setSearchTerm,
}: PostFilterPanelProps) => {
  return (
    <Card className="bg-white lg:sticky lg:top-20">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">정렬:</span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={sortOrder === 'newest' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortOrder('newest')}
              >
                최신순
              </Button>
              <Button
                type="button"
                variant={sortOrder === 'oldest' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortOrder('oldest')}
              >
                오래된 순
              </Button>
            </div>
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="공고 제목 또는 내용으로 검색..."
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
