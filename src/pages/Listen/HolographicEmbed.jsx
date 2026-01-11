export default function HolographicEmbed({ trackId, color }) {
  // Encode the SoundCloud URL for the widget
  const trackUrl = encodeURIComponent(trackId);
  const colorHex = color.replace("#", "");

  return (
    <div className="holo-panel">
      <div className="holo-shimmer" />
      <div className="holo-panel-inner">
        <iframe
          title="SoundCloud player"
          src={`https://w.soundcloud.com/player/?url=${trackUrl}&color=%23${colorHex}&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false`}
          allow="autoplay"
          className="holo-embed"
        />
      </div>
      <div className="holo-scanline" />
    </div>
  );
}
