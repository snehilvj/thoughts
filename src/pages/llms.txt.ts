import { SITE } from '../config';

export async function GET() {
  const content = `# ${SITE.title}

> ${SITE.description}

## About

${SITE.author}'s personal blog covering software engineering, startups, opinions, and life experiences.

## Key Pages

- Blog: ${SITE.url}/blog
- About: ${SITE.url}/about
- Tags: ${SITE.url}/tags
- RSS: ${SITE.url}/rss.xml
- Full Content Index: ${SITE.url}/llms-full.txt
`;

  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
