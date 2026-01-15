'use client';

import { createClient } from '@/utils/supabase/client';

type UploadArgs = {
  file: File;
  role: 'member' | 'pending_manager' | 'manager' | 'admin' | 'rejected_manager';
  userId: string;
  prevUrl?: string | null;
};

const BUCKET = 'profiles';

const sanitizeFileName = (name: string) => {
  const base = name
    .normalize('NFKD')
    .replace(/[^\w.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return base || `file-${Date.now()}`;
};

const extractBucketPath = (url?: string | null) => {
  if (!url) return null;
  const match = url.match(/\/object\/public\/([^/]+)\/(.+)$/);
  if (!match) return null;
  return { bucket: match[1], path: match[2] };
};

export const useUpload = () => {
  const supabase = createClient();

  const uploadProfileImage = async ({
    file,
    role,
    userId,
    prevUrl,
  }: UploadArgs) => {
    if (!file.type.startsWith('image/')) {
      throw new Error('이미지 파일만 업로드 가능합니다.');
    }

    const folder =
      role === 'manager' || role === 'pending_manager'
        ? 'manager'
        : role === 'rejected_manager'
        ? 'rejected_manager'
        : role === 'admin'
        ? 'admin'
        : 'member';
    const safeName = sanitizeFileName(file.name);
    const filePath = `${folder}/${userId}/${Date.now()}-${safeName}`;

    // remove previous image if exists
    const prev = extractBucketPath(prevUrl);
    if (prev) {
      await supabase.storage.from(prev.bucket).remove([prev.path]);
    }

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, { upsert: true });
    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

    return publicUrl;
  };

  const removeProfileImage = async (url?: string | null) => {
    const target = extractBucketPath(url);
    if (!target) return;
    await supabase.storage.from(target.bucket).remove([target.path]);
  };

  return { uploadProfileImage, removeProfileImage };
};
