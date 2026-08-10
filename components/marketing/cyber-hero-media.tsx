const WEBM_SRC = "/media/cyber-creator-hero.webm";
const MP4_SRC = "/media/cyber-creator-hero.mp4";
const POSTER_SRC = "/media/cyber-creator-poster.webp";

export function CyberHeroMedia() {
  return (
    <div className="cyber-hero-media relative" role="img" aria-label="A futuristic digital creator representing Branzzo's creator marketplace">
      {/* Purplish Ambient Glow Aura radiating from background box */}
      <div className="absolute -inset-4 z-0 rounded-3xl bg-gradient-to-tr from-purple-600/45 via-violet-500/35 to-cyan-400/25 blur-3xl opacity-90 scale-105 pointer-events-none" />

      <div className="cyber-hero-media__frame relative z-10">
        <video className="cyber-hero-media__video" autoPlay muted loop playsInline controls={false} preload="metadata" poster={POSTER_SRC}>
          <source src={WEBM_SRC} type="video/webm" />
          <source src={MP4_SRC} type="video/mp4" />
        </video>
        <div className="cyber-hero-media__blend" />
      </div>

      {/* Creator Profile Signal Badge (Bottom-Right, Clean & Non-Overlapping) */}
      <div className="creator-signal-preview z-20">
        <div className="creator-signal-preview__scan" />
        <div className="creator-signal-preview__header">
          <p>CREATOR PROFILE</p>
          <span>VERIFIED</span>
        </div>
        <div className="creator-signal-preview__tags">
          <span>Discover</span>
          <span>Collaborate</span>
          <span>Grow</span>
        </div>
        <div className="creator-signal-preview__status">
          <i />
          <span>Available for collaborations</span>
        </div>
      </div>
    </div>
  );
}
