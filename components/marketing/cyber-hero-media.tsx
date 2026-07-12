const POSTER_SRC = "/marketing/cyber-creator-poster.png";

type CyberHeroMediaProps = {
  videoSrc?: string;
  posterSrc?: string;
};

function videoType(src: string) {
  return src.endsWith(".webm") ? "video/webm" : "video/mp4";
}

export function CyberHeroMedia({ videoSrc, posterSrc = POSTER_SRC }: CyberHeroMediaProps) {
  return (
    <div className="cyber-hero-media" aria-hidden="true">
      <div className="cyber-hero-media__frame">
        <div className="cyber-hero-media__poster" style={{ backgroundImage: `url(${posterSrc})` }} />
        {videoSrc ? (
          <video className="cyber-hero-media__video" autoPlay muted loop playsInline controls={false} preload="metadata" poster={posterSrc}>
            <source src={videoSrc} type={videoType(videoSrc)} />
          </video>
        ) : null}
        <div className="cyber-hero-media__blend" />
      </div>

      <div className="creator-signal-preview">
        <div className="creator-signal-preview__scan" />
        <div className="creator-signal-preview__header">
          <p>CREATOR SIGNAL</p>
          <span>LIVE FIT</span>
        </div>
        <div className="creator-signal-preview__stats">
          <div>
            <strong>680K</strong>
            <span>subscribers</span>
          </div>
          <div>
            <strong>145K</strong>
            <span>average views</span>
          </div>
          <div>
            <strong>92%</strong>
            <span>brand fit</span>
          </div>
        </div>
        <div className="creator-signal-preview__tags">
          <span>Tech</span>
          <span>India</span>
        </div>
        <div className="creator-signal-preview__status">
          <i />
          <span>Available for collaborations</span>
        </div>
        <span className="creator-signal-preview__node creator-signal-preview__node--a" />
        <span className="creator-signal-preview__node creator-signal-preview__node--b" />
      </div>
    </div>
  );
}
