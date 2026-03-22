import { getCollection } from 'astro:content';

export async function getSortedPosts() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export async function getAllTags() {
  const posts = await getSortedPosts();
  const tagCount = new Map<string, number>();
  posts.forEach((post) => {
    post.data.tags.forEach((tag) => {
      tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
    });
  });
  return tagCount;
}
