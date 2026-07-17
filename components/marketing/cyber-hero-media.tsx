const WEBM_SRC = "/media/cyber-creator-hero.webm";
const MP4_SRC = "/media/cyber-creator-hero.mp4";
const POSTER_SRC = "/media/cyber-creator-poster.webp";

export function CyberHeroMedia() {
  return (
    <div className="cyber-hero-media" aria-hidden="true">
      <div className="cyber-hero-media__frame">
        <div className="cyber-hero-media__poster" style={{ backgroundImage: `url(${POSTER_SRC})` }} />
        <video className="cyber-hero-media__video" autoPlay muted loop playsInline controls={false} preload="metadata" poster={POSTER_SRC}>
          <source src={WEBM_SRC} type="video/webm" />
          <source src={MP4_SRC} type="video/mp4" />
        </video>
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
