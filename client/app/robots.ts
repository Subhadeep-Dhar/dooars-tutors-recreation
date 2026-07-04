import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/profiles', '/tuition'],
      disallow: ['/admin/', '/dashboard/', '/login', '/register', '/search'],
    },
    sitemap: 'https://dooarstutors.in/sitemap.xml',
  };
}
