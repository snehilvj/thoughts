import { getCollection } from 'astro:content';
import { SITE } from '../config';

export async function GET() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const sorted = posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  let content = `# ${SITE.title}  - Full Content Index\n\n`;
  content += `> ${SITE.description}\n\n`;
  content += `Author: ${SITE.author}\n`;
  content += `URL: ${SITE.url}\n\n`;
  content += `## Blog Posts\n\n`;

  for (const post of sorted) {
    content += `### ${post.data.title}\n`;
    content += `- URL: ${SITE.url}/blog/${post.id}\n`;
    content += `- Date: ${post.data.pubDate.toISOString().split('T')[0]}\n`;
    content += `- Tags: ${post.data.tags.join(', ')}\n`;
    content += `- Description: ${post.data.description}\n\n`;
  }

  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
