export function parseEmbed(href) {
  if (typeof href !== 'string') return null;
  let url;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  const host = url.hostname.replace(/^www\./, '');

  if (host === 'youtube.com' || host === 'm.youtube.com') {
    const id = url.searchParams.get('v');
    if (id) return { type: 'youtube', id, title: 'YouTube video' };
  }
  if (host === 'youtu.be') {
    const id = url.pathname.slice(1);
    if (id) return { type: 'youtube', id, title: 'YouTube video' };
  }
  if (host === 'vimeo.com') {
    const id = url.pathname.split('/').filter(Boolean)[0];
    if (/^\d+$/.test(id ?? '')) return { type: 'vimeo', id, title: 'Vimeo video' };
  }
  if (/\.(mp4|webm|ogg)$/i.test(url.pathname)) {
    return { type: 'video', src: href, title: 'Video' };
  }
  return null;
}
