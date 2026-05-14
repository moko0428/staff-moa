import { createClient } from '@/utils/supabase/server';
import { MetadataRoute } from 'next';

const BASE_URL = 'https://www.goinlyeog.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/post`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/auth`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  try {
    const supabase = await createClient();
    const { data: posts } = await supabase
      .from('posts')
      .select('post_id, updated_at')
      .neq('status', 'completed')
      .order('updated_at', { ascending: false })
      .limit(1000);

    const postRoutes: MetadataRoute.Sitemap = (posts ?? []).map((post) => ({
      url: `${BASE_URL}/post/${post.post_id}`,
      lastModified: post.updated_at ? new Date(post.updated_at) : new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    }));

    return [...staticRoutes, ...postRoutes];
  } catch {
    return staticRoutes;
  }
}
