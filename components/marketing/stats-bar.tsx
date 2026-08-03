import { type PublicMarketplaceStats } from "@/lib/queries/public";
import { Building2, Handshake, Users } from "lucide-react";

export function StatsBar({ stats }: { stats: PublicMarketplaceStats }) {
  const hasLiveCounts = stats.creators + stats.brands + stats.collaborations > 0;
  const items = hasLiveCounts
    ? [
        { label: "Creators", value: stats.creators.toLocaleString("en-IN"), motionClass: "stat-delay-1", icon: Users },
        { label: "Brands", value: stats.brands.toLocaleString("en-IN"), motionClass: "stat-delay-2", icon: Building2 },
        { label: "Collaborations", value: stats.collaborations.toLocaleString("en-IN"), motionClass: "stat-delay-3", icon: Handshake },
      ]
    : [
        { label: "Creator profiles", value: "Verified", motionClass: "stat-delay-1", icon: Users },
        { label: "Campaign requests", value: "Structured", motionClass: "stat-delay-2", icon: Building2 },
        { label: "Collaborations", value: "Secure", motionClass: "stat-delay-3", icon: Handshake },
      ];
  return (
    <section className="marketing-stats" aria-label="Branzzo marketplace statistics">
      <div className="marketing-stats__inner">
        {items.map(({ icon: Icon, ...stat }) => (
          <div key={stat.label} className={`animate-stat-up marketing-stats__item ${stat.motionClass}`}>
            <Icon aria-hidden="true" className="marketing-stats__icon" size={20} />
            <div>
              <p className="marketing-stats__value">{stat.value}</p>
              <p className="marketing-stats__label">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
