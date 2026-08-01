import Image from "next/image";
import { BadgeCheck, Building2 } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { type BrandProfileData } from "@/lib/types";

export function FeaturedBrands({ brands }: { brands: BrandProfileData[] }) {
  return (
    <section className="bridge-section" aria-labelledby="featured-brands-heading">
      <p className="bridge-eyebrow">Featured Brands</p>
      <h2 id="featured-brands-heading" className="mt-3 font-display text-3xl font-bold">
        Brands building with creators
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
        Companies shown here have explicitly opted in to public visibility.
      </p>
      {brands.length ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
          <article key={brand.id} className="bridge-card bridge-card-hover flex items-center gap-4 p-5">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[8px] border border-white/10 bg-white/[0.05]">
              {brand.avatar ? (
                <Image src={brand.avatar} alt="" fill sizes="56px" className="object-cover" />
              ) : (
                <Building2 aria-hidden="true" className="text-cyan-200" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-display text-lg font-bold">{brand.companyName}</h3>
                {brand.verificationStatus === "verified" ? (
                  <BadgeCheck aria-label="Verified brand" size={18} className="shrink-0 text-cyan-200" />
                ) : null}
              </div>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{brand.industry}</p>
            </div>
          </article>
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState
            title="No public brands yet"
            description="Brand profiles appear here only after the brand explicitly opts in to public visibility."
          />
        </div>
      )}
    </section>
  );
}
