import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/search', '/profiles', '/tuition'],
      disallow: ['/admin/', '/dashboard/', '/login', '/register'],
    },
    sitemap: 'https://dooarstutors.in/sitemap.xml',
  };
}
