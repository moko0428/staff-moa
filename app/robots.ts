import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/post', '/post/'],
        disallow: [
          '/admin',
          '/profile',
          '/my-post',
          '/manager',
          '/worker',
          '/notification',
          '/settings',
          '/auth/callback',
        ],
      },
    ],
    sitemap: 'https://www.goinlyeog.com/sitemap.xml',
  };
}
