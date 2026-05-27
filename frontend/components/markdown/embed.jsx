export function Embed({ embed }) {
  if (!embed) return null;

  if (embed.type === 'video') {
    return (
      <video
        controls
        preload="metadata"
        className="my-4 w-full rounded-lg border border-border"
        src={embed.src}
      />
    );
  }

  const src =
    embed.type === 'youtube'
      ? `https://www.youtube-nocookie.com/embed/${embed.id}`
      : `https://player.vimeo.com/video/${embed.id}`;

  return (
    <span className="my-4 block aspect-video w-full overflow-hidden rounded-lg border border-border">
      <iframe
        src={src}
        title={embed.title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
      />
    </span>
  );
}
