import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { EventEmitter } from "node:events";
import { classifyMongoError, connectMongoose, MongoTemporaryUnavailableError, waitForMongoState, withMongoRequest } from "../../lib/db";
import { settleHomepageData } from "../../lib/queries/public";
import sitemap from "../../app/sitemap";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

test("a request arriving during readyState 2 waits locally and succeeds", async () => {
  let sleeps = 0;
  const fake = {
    connection: { readyState: 2 },
    connect: async () => { throw new Error("must not reconnect"); },
    disconnect: async () => { fake.connection.readyState = 0; },
  };
  await expect(connectMongoose(fake as never, "mongodb://example/test", undefined, { sleep: async () => { sleeps += 1; fake.connection.readyState = 1; } })).resolves.toBe(fake);
  expect(sleeps).toBe(1);
});

test("state waiting uses only local polling and has a strict deadline", async () => {
  let clock = 0;
  const fake = { connection: { readyState: 2 }, connect: async () => fake, disconnect: async () => undefined };
  await expect(waitForMongoState(fake as never, { timeoutMs: 100, now: () => clock, sleep: async (ms) => { clock += ms; } })).rejects.toBeInstanceOf(MongoTemporaryUnavailableError);
  expect(clock).toBe(100);
  const source = fs.readFileSync(path.join(process.cwd(), "lib/db.ts"), "utf8");
  expect(source).not.toMatch(/connectionPromise|cache\.promise|await\s+client\.connection/);
});

test("a state 2 to 0 transition permits one clean connection attempt", async () => {
  let connects = 0;
  const fake = { connection: { readyState: 2 }, connect: async () => { connects += 1; fake.connection.readyState = 1; return fake; }, disconnect: async () => undefined };
  await expect(connectMongoose(fake as never, "mongodb://example/test", undefined, { sleep: async () => { fake.connection.readyState = 0; } })).resolves.toBe(fake);
  expect(connects).toBe(1);
});

test("concurrent callers trigger only one mongoose.connect call", async () => {
  const pending = deferred<unknown>();
  let connects = 0;
  const fake = {
    connection: { readyState: 0 },
    connect: async () => { connects += 1; fake.connection.readyState = 2; await pending.promise; fake.connection.readyState = 1; return fake; },
    disconnect: async () => { fake.connection.readyState = 0; },
  };
  const first = connectMongoose(fake as never, "mongodb://example/test");
  const second = connectMongoose(fake as never, "mongodb://example/test", undefined, { sleep: async () => { pending.resolve(fake); await Promise.resolve(); } });
  await Promise.all([first, second]);
  expect(connects).toBe(1);
});

test("failed connection resets transitional state for a later retry", async () => {
  let disconnects = 0;
  const fake = {
    connection: { readyState: 0 },
    connect: async () => { fake.connection.readyState = 2; throw new Error("selection failed"); },
    disconnect: async () => { disconnects += 1; fake.connection.readyState = 0; },
  };
  await expect(connectMongoose(fake as never, "mongodb://example/test")).rejects.toThrow("selection failed");
  expect(fake.connection.readyState).toBe(0);
  expect(disconnects).toBe(1);
});

test("homepage data failures preserve a renderable fallback", async () => {
  const data = await settleHomepageData({ creators: async () => { throw new Error("db"); }, brands: async () => [], stats: async () => { throw new Error("db"); } });
  expect(data).toEqual({ featuredCreators: [], featuredBrands: [], stats: { creators: 0, brands: 0, collaborations: 0 } });
});

test("public creator queries have finite database execution limits", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "lib/queries/creators.ts"), "utf8");
  expect(source).toContain("MONGO_QUERY_TIMEOUT_MS");
  expect(source).toContain("maxTimeMS");
});

test("database health route always has finite success and failure responses", () => {
  const route = fs.readFileSync(path.join(process.cwd(), "app/api/health/db/route.ts"), "utf8");
  expect(route).toContain("if (!hasMongoUri())");
  expect(route).toContain('status: "connecting"');
  expect(route).toContain('reason: "configuration"');
  expect(route).toContain('status: "unavailable"');
  expect(route).toContain("await verifyDBConnection()");
  expect(route).toContain("catch");
});

test("onboarding maps busy state to an accurate retryable message", () => {
  const page = fs.readFileSync(path.join(process.cwd(), "app/onboarding/page.tsx"), "utf8");
  const unavailable = fs.readFileSync(path.join(process.cwd(), "components/shared/account-unavailable.tsx"), "utf8");
  const errors = fs.readFileSync(path.join(process.cwd(), "lib/api-errors.ts"), "utf8");
  expect(page).toContain('accountState.status === "temporarily_unavailable"');
  expect(unavailable).toContain("We could not load your Branzzo account right now. Please retry.");
  expect(page).not.toContain("MongoDB Atlas is not reachable");
  expect(errors).toContain('code: "DATABASE_CONNECTING"');
});

test("no unresolved Mongoose promise cache remains", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "lib/db.ts"), "utf8");
  expect(source).not.toContain("mongooseCache");
  expect(source).not.toContain("cache.promise");
  expect(source).not.toMatch(/globalForMongoose|globalThis\s+as/);
  expect(source).toContain("bufferCommands: false");
  expect(source).toContain("serverSelectionTimeoutMS");
});

test("sitemap is synchronous, valid, and completely database-independent", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "app/sitemap.ts"), "utf8");
  expect(source).not.toMatch(/from ["']mongoose|from ["']@\/lib\/db|connectDB\(|User\.|BrandProfile\.|async function sitemap|Promise<MetadataRoute/);
  const entries = sitemap();
  expect(Array.isArray(entries)).toBe(true);
  expect(entries.length).toBeGreaterThan(0);
  expect(entries.every((entry) => entry.url.startsWith("https://") && !entry.url.includes("undefined"))).toBe(true);
});

test("homepage and public legal shell perform no Clerk or MongoDB I/O", () => {
  const homepage = fs.readFileSync(path.join(process.cwd(), "app/(marketing)/page.tsx"), "utf8");
  const layout = fs.readFileSync(path.join(process.cwd(), "app/(marketing)/layout.tsx"), "utf8");
  const navbar = fs.readFileSync(path.join(process.cwd(), "components/marketing/marketing-navbar.tsx"), "utf8");
  for (const source of [homepage, layout, navbar]) {
    expect(source).not.toMatch(/connectDB|getCurrentAppUser|getHomepageMarketplaceData|getCurrentUserNotificationSummary|await auth\(|currentUser\(/);
  }
  const hero = fs.readFileSync(path.join(process.cwd(), "components/marketing/landing-hero.tsx"), "utf8");
  expect(hero).toContain("Branzzo connects brands");
});

test("creator discovery is bounded and avoids sorting the count branch", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "lib/queries/creators.ts"), "utf8");
  expect(source).toContain("Math.min(Math.max(filters.pageSize ?? 20, 1), 24)");
  expect(source).toContain("profileMatch");
  expect(source).toContain('creators: [{ $sort:');
  expect(source).not.toContain("return getCreatorDiscoveryPage({ ...filters, page })");
});

test("parallel connection waiters add no EventEmitter timeout listeners", async () => {
  let clock = 0;
  const connection = Object.assign(new EventEmitter(), { readyState: 2 });
  const fake = { connection, connect: async () => fake, disconnect: async () => undefined };
  const waits = Array.from({ length: 24 }, () =>
    waitForMongoState(fake as never, { timeoutMs: 40, now: () => clock, sleep: async (ms) => { clock += ms; connection.readyState = 1; } }),
  );
  await Promise.all(waits);
  expect(connection.listenerCount("timeout")).toBe(0);
});

test("MongoDB connection topology prevents parallel socket-listener amplification", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "lib/db.ts"), "utf8");
  expect(source).toContain("maxConnecting: 1");
  expect(source).toContain('serverMonitoringMode: "poll"');
  expect(source).toContain("waitQueueTimeoutMS: MONGO_QUERY_TIMEOUT_MS");
  expect(source).not.toContain("setMaxListeners");

  const driverConnect = fs.readFileSync(path.join(process.cwd(), "node_modules/mongodb/lib/cmap/connect.js"), "utf8");
  expect(driverConnect).toContain(".once('timeout'");
});

test("profile metadata and page rendering share one request-scoped lookup", () => {
  const creator = fs.readFileSync(path.join(process.cwd(), "app/creators/[username]/page.tsx"), "utf8");
  const brand = fs.readFileSync(path.join(process.cwd(), "app/brands/[username]/page.tsx"), "utf8");
  expect(creator).toContain("const getCachedCreatorByUsername = cache(getCreatorByUsername)");
  expect(creator.match(/getCachedCreatorByUsername\(username\)/g)).toHaveLength(2);
  expect(brand).toContain("const getCachedPublicBrandByUsername = cache(getPublicBrandByUsername)");
  expect(brand.match(/getCachedPublicBrandByUsername\(username\)/g)).toHaveLength(2);
});

test("authenticated navbar is role-driven and performs no server database reads", () => {
  const server = fs.readFileSync(path.join(process.cwd(), "components/shared/navbar.tsx"), "utf8");
  const client = fs.readFileSync(path.join(process.cwd(), "components/shared/navbar-client.tsx"), "utf8");
  expect(server).not.toMatch(/getCurrentAppUser|getCurrentUserNotificationSummary|connectDB|await auth/);
  expect(client).toContain('{ label: "Dashboard", href: "/dashboard/creator"');
  expect(client).toContain('{ label: "Dashboard", href: "/dashboard/brand"');
  expect(client).toContain('{ label: "Collaborations", href: "/dashboard/history"');
  expect(client).toContain('{ label: "Saved Creators", href: "/dashboard/brand/saved-creators"');
  expect(client).toContain('{ label: "Admin Dashboard", href: "/admin"');
  expect(client).not.toMatch(/primaryLabel|bridge-button-primary|getCurrentUserNotificationSummary/);
});

test("authenticated navbar preserves accessible responsive behavior", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/shared/navbar-client.tsx"), "utf8");
  expect(source).toContain('aria-current={active ? "page" : undefined}');
  expect(source).toContain('aria-controls="authenticated-mobile-navigation"');
  expect(source).toContain('aria-label="View notifications"');
  expect(source).toContain("h-11 w-11");
  expect(source).toContain("min-h-11");
  expect(source).toContain("w-[min(88vw,360px)]");
  expect(source).toContain("h-16");
  expect(source).not.toMatch(/backdrop-blur|animate-|shadow-\[/);
});

test("marketing and authenticated brand marks always return to the homepage", () => {
  const marketing = fs.readFileSync(path.join(process.cwd(), "components/marketing/marketing-navbar-client.tsx"), "utf8");
  const application = fs.readFileSync(path.join(process.cwd(), "components/shared/navbar-client.tsx"), "utf8");
  for (const source of [marketing, application]) {
    expect(source).toContain('href="/" aria-label="Branzzo home"');
    expect(source).toContain("showWordmark");
  }
  expect(application).not.toMatch(/href=\{role ===/);
});

test("marketing navbar preserves static client-only authentication states", () => {
  const server = fs.readFileSync(path.join(process.cwd(), "components/marketing/marketing-navbar.tsx"), "utf8");
  const client = fs.readFileSync(path.join(process.cwd(), "components/marketing/marketing-navbar-client.tsx"), "utf8");
  expect(server).not.toMatch(/auth\(|getCurrentAppUser|connectDB|currentUser\(/);
  expect(client).toContain('label: "Browse Creators"');
  expect(client).toContain('label: "For Brands"');
  expect(client).toContain('label: "About"');
  expect(client).toContain(">Login</Link>");
  expect(client).toContain(">Join Free</Link>");
  expect(client).toContain('href="/dashboard"');
  expect(client).toContain("<NotificationButton");
  expect(client).toContain("<AccountMenu");
  expect(client).toContain("isLoaded && !isSignedIn");
  expect(client).toContain("isLoaded && isSignedIn");
});

test("account menu restores required Branzzo and Clerk actions", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/shared/account-menu.tsx"), "utf8");
  expect(source).toContain('"Admin Dashboard" : "Dashboard"');
  for (const label of ["My Profile", "Edit Profile", "Brand Profile", "Edit Brand Profile", "Collaborations", "Saved Creators", "Analytics", "User Management", "Reports", "Notifications", "Verification", "Account Settings"]) {
    expect(source).toContain(`label=\"${label}\"`);
  }
  expect(source).toContain('<UserButton.Action label="manageAccount" />');
  expect(source).toContain('<UserButton.Action label="signOut" />');
});

test("navbar layout anchors controls right and changes at the 1024px breakpoint", () => {
  const application = fs.readFileSync(path.join(process.cwd(), "components/shared/navbar-client.tsx"), "utf8");
  const marketingCss = fs.readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");
  expect(application).toContain("ml-auto");
  expect(application).toContain("lg:hidden");
  expect(application).toContain("hidden min-w-0 items-center gap-0.5 lg:flex");
  expect(marketingCss).toContain("@media (min-width: 1024px)");
  expect(marketingCss).toContain("margin-left: auto");
});

test("final navbar restoration keeps flat links and compact mobile auth controls", () => {
  const marketing = fs.readFileSync(path.join(process.cwd(), "components/marketing/marketing-navbar-client.tsx"), "utf8");
  const application = fs.readFileSync(path.join(process.cwd(), "components/shared/navbar-client.tsx"), "utf8");
  const css = fs.readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");
  const linksRule = css.slice(css.indexOf(".marketing-navbar__links {"), css.indexOf(".marketing-navbar__link {"));
  expect(linksRule).not.toMatch(/border:|border-radius:|background:|box-shadow:/);
  expect(application).toContain('className="ml-auto flex min-w-0 shrink-0 items-center');
  expect(application).toContain('className="hidden items-center gap-1.5 lg:flex"');
  expect(application).toContain('className="focus-ring inline-flex min-h-11 items-center px-2 text-sm font-semibold text-slate-200 lg:hidden">Dashboard');
  expect(application).toContain("openUserProfile()");
  expect(application).toContain("handleSignOut");
  expect(marketing).toContain("marketing-navbar__signed-in-dashboard");
  expect(marketing).toContain("marketing-navbar__desktop-account-controls");
  expect(marketing).toContain(">Contact</Link>");
  expect(marketing).toContain(">Terms</Link>");
  expect(marketing).toContain(">Privacy</Link>");
});

test("signed-in marketing desktop restores role-aware links without database I/O", () => {
  const marketing = fs.readFileSync(path.join(process.cwd(), "components/marketing/marketing-navbar-client.tsx"), "utf8");
  const application = fs.readFileSync(path.join(process.cwd(), "components/shared/navbar-client.tsx"), "utf8");
  for (const label of ["Browse Creators", "Collaborations", "Analytics", "My Profile", "Saved Creators", "Brand Profile", "Admin Dashboard", "Users", "Reports"]) {
    expect(marketing).toContain(`label: \"${label}\"`);
  }
  expect(marketing).toContain("marketing-navbar__signed-in-links");
  expect(marketing).toContain("useNavigationContext()");
  expect(application).not.toContain('localStorage.setItem("branzzo:navbar-context"');
  expect(marketing).not.toMatch(/getCurrentAppUser|getCurrentUserNotificationSummary|connectDB|await auth\(/);
});

test("marketing navigation fallback is client-only and returns no sensitive fields", () => {
  const hook = fs.readFileSync(path.join(process.cwd(), "components/shared/use-navigation-context.ts"), "utf8");
  const route = fs.readFileSync(path.join(process.cwd(), "app/api/navigation-context/route.ts"), "utf8");
  expect(hook).toContain('fetch("/api/navigation-context"');
  expect(hook).toContain("sessionClaims");
  expect(hook).toContain("user?.publicMetadata");
  expect(route).toContain("getApplicationAccountState()");
  expect(route).toContain('state.status === "temporarily_unavailable"');
  expect(route).not.toMatch(/email|phone|avatar/);
  expect(hook.indexOf("fallback?.sessionId")).toBeLessThan(hook.indexOf("parsed ??"));
});

test("account lookup uses one profile-aware query and realistic Atlas deadlines", () => {
  const state = fs.readFileSync(path.join(process.cwd(), "lib/application-account-state.ts"), "utf8");
  const db = fs.readFileSync(path.join(process.cwd(), "lib/db.ts"), "utf8");
  expect(state).toContain("User.aggregate<AccountRow>");
  expect(state).toContain("CreatorProfile.collection.name");
  expect(state).toContain("BrandProfile.collection.name");
  expect(state).toContain("accountStatus");
  expect(db).toContain("MONGO_CONNECTION_TIMEOUT_MS = 5_000");
  expect(db).toContain("MONGO_QUERY_TIMEOUT_MS = 5_000");
});

test("profile edit database failures render retry instead of onboarding", () => {
  for (const route of ["app/dashboard/creator/edit/page.tsx", "app/dashboard/brand/edit/page.tsx"]) {
    const source = fs.readFileSync(path.join(process.cwd(), route), "utf8");
    expect(source).toMatch(/(?:userResult|account)\.status === "temporarily_unavailable"/);
    expect(source).toContain("AccountUnavailable");
  }
});

test("legacy current-user guards honor profile-backed account recovery", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "lib/current-user.ts"), "utf8");
  expect(source).toContain('withMongoRequest("current-user"');
  expect(source).toContain("profileExists");
  expect(source).toContain("row.onboardingComplete = true");
});

test("creator account menu links to the existing public and edit routes", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/shared/account-menu.tsx"), "utf8");
  expect(source).toContain('href={username ? `/creators/${username}` : "/dashboard/creator/edit"} label="My Profile"');
  expect(source).toContain('href="/dashboard/creator/edit" label="Edit Profile"');
});

test("creator edit resolves ownership from Clerk id and loads the existing profile", () => {
  const route = fs.readFileSync(path.join(process.cwd(), "app/dashboard/creator/edit/page.tsx"), "utf8");
  const queries = fs.readFileSync(path.join(process.cwd(), "lib/queries/creators.ts"), "utf8");
  expect(route).toContain("getCreatorEditAccountByClerkId(clerkUserId)");
  expect(route).toContain("profile: creator");
  expect(route).toContain("<CreatorOnboardingForm");
  expect(queries).toContain("User.findOne({ clerkId: clerkUserId })");
  expect(queries).toContain("CreatorProfile.findOne({ userId: user._id })");
  expect(queries).not.toContain('getCreatorEditAccountByClerkId(clerkUserId: string): Promise<CreatorEditAccountResult> {\n  if (!hasMongoUri()) return { status: "missing"');
});

test("temporary creator edit lookup failure renders retry and never redirects to dashboard", () => {
  const route = fs.readFileSync(path.join(process.cwd(), "app/dashboard/creator/edit/page.tsx"), "utf8");
  expect(route).toContain('account.status === "temporarily_unavailable"');
  expect(route).toContain('<AccountUnavailable retryHref="/dashboard/creator/edit" />');
  expect(route).not.toContain('redirect("/dashboard")');
});

test("creator save updates the unique existing profile instead of inserting a second profile", () => {
  const route = fs.readFileSync(path.join(process.cwd(), "app/api/onboarding/creator/route.ts"), "utf8");
  const model = fs.readFileSync(path.join(process.cwd(), "lib/models/CreatorProfile.ts"), "utf8");
  expect(route).toContain("const existingProfile = await ScopedCreatorProfile.findOne({ userId: user._id })");
  expect(route).toContain("await ScopedCreatorProfile.findOneAndUpdate(");
  expect(route).toContain("{ userId: user._id }");
  expect(route).toContain("{ upsert: true, new: true }");
  expect(model).toContain("required: true, unique: true, index: true");
});

test("public creator CTA distinguishes signed out, brand, owner, and other creator states", () => {
  const page = fs.readFileSync(path.join(process.cwd(), "app/creators/[username]/page.tsx"), "utf8");
  const header = fs.readFileSync(path.join(process.cwd(), "components/creators/creator-profile-header.tsx"), "utf8");
  const queries = fs.readFileSync(path.join(process.cwd(), "lib/queries/creators.ts"), "utf8");
  for (const source of [page, header]) {
    expect(source).toContain('viewerState === "brand"');
    expect(source).toContain('viewerState === "signed_out"');
    expect(source).toContain("Sign in to start collaboration");
    expect(source).toContain("Edit Profile");
  }
  expect(header).toContain('viewerState === "creator_other"');
  expect(header).toContain("Browse Directory");
  expect(queries).toContain('return user.username.toLowerCase() === creatorUsername.toLowerCase() ? "creator_owner" : "creator_other"');
});

test("creator ownership state cannot expose the brand collaboration action to self", () => {
  const page = fs.readFileSync(path.join(process.cwd(), "app/creators/[username]/page.tsx"), "utf8");
  const header = fs.readFileSync(path.join(process.cwd(), "components/creators/creator-profile-header.tsx"), "utf8");
  expect(page).toContain('const isOwner = viewerState === "creator_owner"');
  expect(header).toContain('const isOwner = viewerState === "creator_owner"');
  expect(page).toContain('viewerRole === "brand" && canStart');
  expect(header).toContain('viewerState === "brand" && canStart');
});

test("creator directory resolves authentication once and passes explicit card viewer states", () => {
  const page = fs.readFileSync(path.join(process.cwd(), "app/creators/page.tsx"), "utf8");
  expect(page.match(/getApplicationAccountState\(\)/g)).toHaveLength(1);
  expect(page.indexOf("getApplicationAccountState()")).toBeLessThan(page.indexOf("creators.map"));
  for (const state of ["signed_out", "brand", "creator", "owner", "admin", "unavailable", "signed_in_unknown"]) {
    expect(page).toContain(`"${state}"`);
  }
});

test("creator cards separate signed-out, Brand, and signed-in non-Brand actions", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/creators/creator-card.tsx"), "utf8");
  expect(source).toContain('effectiveViewerState === "signed_out"');
  expect(source).toContain("Sign In");
  expect(source).toContain('authHref("/sign-in", `/campaign-inquiry?creator=${creator.username}`)');
  expect(source).toContain('effectiveViewerState === "brand" ? canStart');
  expect(source).toContain("Start Collaboration");
  expect(source).toContain("Unavailable");
  expect(source).toContain(': effectiveViewerState === "signed_out" ?');
});

test("creator cards introduce no per-card authentication, navigation-context, or database request", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/creators/creator-card.tsx"), "utf8");
  expect(source).not.toMatch(/useAuth|useUser|auth\(|getApplicationAccountState|getCurrentAppUser|navigation-context|connectDB|fetch\(/);
});

test("simultaneous cold account requests never share a pending connection promise", async () => {
  const previous = process.env.MONGODB_URI;
  process.env.MONGODB_URI = "mongodb://example/test";
  const opened: number[] = [];
  const destroyed: number[] = [];
  const makeFactory = (id: number) => () => ({
    readyState: 0, models: {}, asPromise: async function () { this.readyState = 1; opened.push(id); return this; },
    destroy: async function () { this.readyState = 0; destroyed.push(id); },
  });
  const [first, second] = await Promise.all([
    withMongoRequest("cold-account-a", async () => "a", { createConnection: makeFactory(1) as never }),
    withMongoRequest("cold-account-b", async () => "b", { createConnection: makeFactory(2) as never }),
  ]);
  expect([first, second]).toEqual(["a", "b"]);
  expect(opened).toEqual([1, 2]);
  expect(destroyed).toEqual([1, 2]);
  if (previous === undefined) delete process.env.MONGODB_URI; else process.env.MONGODB_URI = previous;
});

test("failed request connection is destroyed before a later successful request", async () => {
  const previous = process.env.MONGODB_URI;
  process.env.MONGODB_URI = "mongodb://example/test";
  let destroyed = 0;
  const failing = () => ({ readyState: 2, models: {}, asPromise: async () => { throw Object.assign(new Error("selection"), { name: "MongooseServerSelectionError" }); }, destroy: async () => { destroyed += 1; } });
  await expect(withMongoRequest("failed", async () => null, { createConnection: failing as never })).rejects.toThrow("selection");
  const succeeding = () => ({ readyState: 1, models: {}, asPromise: async function () { return this; }, destroy: async () => { destroyed += 1; } });
  await expect(withMongoRequest("retry", async () => "ok", { createConnection: succeeding as never })).resolves.toBe("ok");
  expect(destroyed).toBe(2);
  if (previous === undefined) delete process.env.MONGODB_URI; else process.env.MONGODB_URI = previous;
});

test("repeated request-local failures add no timeout listeners", async () => {
  const previous = process.env.MONGODB_URI;
  process.env.MONGODB_URI = "mongodb://example/test";
  const emitter = new EventEmitter();
  const factory = () => Object.assign(emitter, { readyState: 2, models: {}, asPromise: async () => { throw new Error("failed"); }, destroy: async () => undefined });
  for (let index = 0; index < 20; index += 1) await withMongoRequest("listener-test", async () => null, { createConnection: factory as never }).catch(() => undefined);
  expect(emitter.listenerCount("timeout")).toBe(0);
  if (previous === undefined) delete process.env.MONGODB_URI; else process.env.MONGODB_URI = previous;
});

test("pool checkout timeouts are classified as retryable database failures", () => {
  const error = Object.assign(new Error("Timed out while checking out a connection from connection pool"), { name: "MongoWaitQueueTimeoutError" });
  expect(classifyMongoError(error)).toBe("network");
});

test("account-critical routes use bounded request-local database sequences", () => {
  const creator = fs.readFileSync(path.join(process.cwd(), "app/api/onboarding/creator/route.ts"), "utf8");
  const brand = fs.readFileSync(path.join(process.cwd(), "app/api/onboarding/brand/route.ts"), "utf8");
  const webhook = fs.readFileSync(path.join(process.cwd(), "app/api/webhooks/clerk/route.ts"), "utf8");
  const account = fs.readFileSync(path.join(process.cwd(), "lib/application-account-state.ts"), "utf8");
  const edit = fs.readFileSync(path.join(process.cwd(), "lib/queries/creators.ts"), "utf8");
  expect(creator).toContain('withMongoRequest("creator-onboarding"');
  expect(brand).toContain('withMongoRequest("brand-onboarding"');
  expect(webhook).toContain('withMongoRequest("clerk-webhook"');
  expect(account).toContain('withMongoRequest("application-account-state"');
  expect(edit).toContain('withMongoRequest("creator-edit-account"');
  for (const source of [creator, brand, webhook]) expect(source).not.toContain("await connectDB()");
});

test("navigation context preserves authenticated database-unavailable state", () => {
  const route = fs.readFileSync(path.join(process.cwd(), "app/api/navigation-context/route.ts"), "utf8");
  expect(route).toContain('state.status === "temporarily_unavailable"');
  expect(route).toContain('code: "DATABASE_UNAVAILABLE", retryable: true');
  expect(route).toContain("status: 503");
});

test("onboarding retries remain idempotent for User and Profile records", () => {
  for (const route of ["app/api/onboarding/creator/route.ts", "app/api/onboarding/brand/route.ts"]) {
    const source = fs.readFileSync(path.join(process.cwd(), route), "utf8");
    expect(source).toContain("findOneAndUpdate(");
    expect(source).toContain("{ userId: user._id }");
    expect(source).toContain("{ upsert: true, new: true }");
  }
});
