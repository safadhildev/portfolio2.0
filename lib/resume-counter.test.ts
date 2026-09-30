import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  RESUME_KEYS,
  SEEN_TTL_SECONDS,
  classifyResumeRequest,
  isCountedKind,
  recordResumeOpen,
  utcDay,
  visitorHash,
} from "./resume-counter.ts";
import type { CounterStore, ResumeRequestInfo, ResumeRequestKind } from "./resume-counter.ts";
import { createResumeHandler, resolveCounterConfig } from "./resume-handler.ts";
import type { ResumeEnv, ResumeHandlerDeps } from "./resume-handler.ts";
import { RESUME_FILE } from "./resume.ts";

const browser: ResumeRequestInfo = {
  method: "GET",
  userAgent: "Mozilla/5.0 (Macintosh) Safari/605.1.15",
  isBot: false,
  secPurpose: null,
  purpose: null,
};

describe("classifyResumeRequest", () => {
  const cases: [string, Partial<ResumeRequestInfo>, ResumeRequestKind][] = [
    ["plain GET", {}, "count"],
    ["HEAD", { method: "HEAD" }, "head"],
    ["lowercase head", { method: "head" }, "head"],
    ["non-GET method", { method: "POST" }, "head"],
    ["Sec-Purpose prefetch", { secPurpose: "prefetch" }, "prefetch"],
    ["Sec-Purpose prefetch;prerender", { secPurpose: "prefetch;prerender" }, "prefetch"],
    ["Purpose prefetch", { purpose: "Prefetch" }, "prefetch"],
    ["known bot", { isBot: true }, "bot"],
    ["empty user agent", { userAgent: "" }, "bot"],
    ["blank user agent", { userAgent: "   " }, "bot"],
  ];
  for (const [name, patch, expected] of cases) {
    it(`${name} -> ${expected}`, () => {
      assert.equal(classifyResumeRequest({ ...browser, ...patch }), expected);
    });
  }

  it("only `count` is counted", () => {
    const kinds: ResumeRequestKind[] = ["count", "head", "prefetch", "bot"];
    assert.deepEqual(kinds.filter(isCountedKind), ["count"]);
  });
});

describe("utcDay and visitorHash", () => {
  it("formats the UTC day", () => {
    assert.equal(utcDay(new Date("2026-09-30T23:59:59Z")), "2026-09-30");
    assert.equal(utcDay(new Date("2026-10-01T00:00:00Z")), "2026-10-01");
  });

  it("is deterministic, hex, and does not contain the raw ip", () => {
    const a = visitorHash("salt", "203.0.113.7", "UA", "2026-09-30");
    assert.equal(a, visitorHash("salt", "203.0.113.7", "UA", "2026-09-30"));
    assert.match(a, /^[0-9a-f]{64}$/);
    assert.ok(!a.includes("203.0.113.7"));
  });

  it("changes with salt, ip, ua and day", () => {
    const base = visitorHash("salt", "1.1.1.1", "UA", "2026-09-30");
    assert.notEqual(base, visitorHash("other", "1.1.1.1", "UA", "2026-09-30"));
    assert.notEqual(base, visitorHash("salt", "2.2.2.2", "UA", "2026-09-30"));
    assert.notEqual(base, visitorHash("salt", "1.1.1.1", "UB", "2026-09-30"));
    assert.notEqual(base, visitorHash("salt", "1.1.1.1", "UA", "2026-10-01"));
  });
});

function fakeStore() {
  const strings = new Map<string, string>();
  const counters = new Map<string, number>();
  const hashes = new Map<string, Map<string, number>>();
  const ttls = new Map<string, number>();
  const store: CounterStore = {
    async set(key, value, options) {
      if (options.nx && strings.has(key)) return null;
      strings.set(key, value);
      ttls.set(key, options.ex);
      return "OK";
    },
    async incr(key) {
      const next = (counters.get(key) ?? 0) + 1;
      counters.set(key, next);
      return next;
    },
    async hincrby(key, field, n) {
      const h = hashes.get(key) ?? new Map<string, number>();
      h.set(field, (h.get(field) ?? 0) + n);
      hashes.set(key, h);
      return h.get(field) ?? 0;
    },
  };
  return { store, strings, counters, hashes, ttls };
}

describe("recordResumeOpen", () => {
  it("first hit: total 1, unique 1, daily 1", async () => {
    const f = fakeStore();
    await recordResumeOpen(f.store, { hash: "h1", day: "2026-09-30" });
    assert.equal(f.counters.get(RESUME_KEYS.total), 1);
    assert.equal(f.counters.get(RESUME_KEYS.unique), 1);
    assert.equal(f.hashes.get(RESUME_KEYS.daily)?.get("2026-09-30"), 1);
    assert.equal(f.ttls.get(RESUME_KEYS.seen("h1")), SEEN_TTL_SECONDS);
  });

  it("same visitor again: total 2, unique and daily stay 1", async () => {
    const f = fakeStore();
    await recordResumeOpen(f.store, { hash: "h1", day: "2026-09-30" });
    await recordResumeOpen(f.store, { hash: "h1", day: "2026-09-30" });
    assert.equal(f.counters.get(RESUME_KEYS.total), 2);
    assert.equal(f.counters.get(RESUME_KEYS.unique), 1);
    assert.equal(f.hashes.get(RESUME_KEYS.daily)?.get("2026-09-30"), 1);
  });

  it("different visitor: unique and daily grow", async () => {
    const f = fakeStore();
    await recordResumeOpen(f.store, { hash: "h1", day: "2026-09-30" });
    await recordResumeOpen(f.store, { hash: "h2", day: "2026-09-30" });
    assert.equal(f.counters.get(RESUME_KEYS.total), 2);
    assert.equal(f.counters.get(RESUME_KEYS.unique), 2);
    assert.equal(f.hashes.get(RESUME_KEYS.daily)?.get("2026-09-30"), 2);
  });

  it("propagates store failures to its caller", async () => {
    const boom: CounterStore = {
      set: () => Promise.reject(new Error("down")),
      incr: () => Promise.reject(new Error("down")),
      hincrby: () => Promise.reject(new Error("down")),
    };
    await assert.rejects(recordResumeOpen(boom, { hash: "h", day: "d" }), /down/);
  });
});

describe("resolveCounterConfig", () => {
  it("prefers KV_* and accepts UPSTASH_REDIS_* as a fallback", () => {
    assert.deepEqual(
      resolveCounterConfig({
        KV_REST_API_URL: "u1",
        KV_REST_API_TOKEN: "t1",
        UPSTASH_REDIS_REST_URL: "u2",
        UPSTASH_REDIS_REST_TOKEN: "t2",
        RESUME_COUNTER_SALT: "s",
      }),
      { url: "u1", token: "t1", salt: "s" },
    );
    assert.deepEqual(
      resolveCounterConfig({
        UPSTASH_REDIS_REST_URL: "u2",
        UPSTASH_REDIS_REST_TOKEN: "t2",
        RESUME_COUNTER_SALT: "s",
      }),
      { url: "u2", token: "t2", salt: "s" },
    );
  });

  it("returns null when url, token or salt is missing", () => {
    const full = { KV_REST_API_URL: "u", KV_REST_API_TOKEN: "t", RESUME_COUNTER_SALT: "s" };
    assert.notEqual(resolveCounterConfig(full), null);
    for (const key of Object.keys(full)) {
      const partial: Record<string, string> = { ...full };
      delete partial[key];
      assert.equal(resolveCounterConfig(partial), null, `without ${key}`);
    }
    assert.equal(resolveCounterConfig({ ...full, RESUME_COUNTER_SALT: "" }), null);
  });
});

const prodEnv: ResumeEnv = {
  VERCEL_ENV: "production",
  KV_REST_API_URL: "https://example.invalid",
  KV_REST_API_TOKEN: "test-token",
  RESUME_COUNTER_SALT: "test-salt",
};

function harness(overrides: Partial<ResumeHandlerDeps> = {}) {
  const f = fakeStore();
  const tasks: Promise<void>[] = [];
  const warnings: string[] = [];
  const deps: ResumeHandlerDeps = {
    env: prodEnv,
    createStore: () => f.store,
    schedule: (task) => {
      tasks.push(task());
    },
    isBot: () => false,
    now: () => new Date("2026-09-30T10:00:00Z"),
    warn: (m) => warnings.push(m),
    ...overrides,
  };
  return {
    f,
    warnings,
    handler: createResumeHandler(deps),
    settle: () => Promise.all(tasks),
    tasks,
  };
}

function req(init: { method?: string; headers?: Record<string, string> } = {}) {
  return new Request("https://example.com/resume", {
    method: init.method ?? "GET",
    headers: {
      "user-agent": browser.userAgent,
      "x-forwarded-for": "203.0.113.7, 10.0.0.1",
      ...init.headers,
    },
  });
}

describe("resume route handler", () => {
  it("307s to the static PDF with no-store and noindex headers", () => {
    const h = harness();
    const res = h.handler(req());
    assert.equal(res.status, 307);
    assert.equal(res.headers.get("location"), `/${RESUME_FILE}`);
    assert.equal(res.headers.get("cache-control"), "no-store");
    assert.equal(res.headers.get("x-robots-tag"), "noindex, nofollow");
  });

  it("counts a production GET after responding", async () => {
    const h = harness();
    h.handler(req());
    await h.settle();
    assert.equal(h.f.counters.get(RESUME_KEYS.total), 1);
    assert.equal(h.f.counters.get(RESUME_KEYS.unique), 1);
    assert.equal(h.f.hashes.get(RESUME_KEYS.daily)?.get("2026-09-30"), 1);
    const seenKeys = [...h.f.strings.keys()];
    assert.equal(seenKeys.length, 1);
    assert.ok(!seenKeys[0].includes("203.0.113.7"), "raw ip is never stored");
  });

  it("dedupes uniques for the same visitor on the same day", async () => {
    const h = harness();
    h.handler(req());
    h.handler(req());
    await h.settle();
    assert.equal(h.f.counters.get(RESUME_KEYS.total), 2);
    assert.equal(h.f.counters.get(RESUME_KEYS.unique), 1);
  });

  it("does not count HEAD, prefetch, bots, or non-production", async () => {
    const h = harness({ isBot: (r) => r.headers.get("x-test-bot") === "1" });
    h.handler(req({ method: "HEAD" }));
    h.handler(req({ headers: { "sec-purpose": "prefetch" } }));
    h.handler(req({ headers: { "x-test-bot": "1" } }));
    h.handler(req({ headers: { "user-agent": "" } }));
    await h.settle();
    assert.equal(h.tasks.length, 0);
    for (const VERCEL_ENV of ["preview", "development", undefined]) {
      const other = harness({ env: { ...prodEnv, VERCEL_ENV } });
      const res = other.handler(req());
      assert.equal(res.status, 307);
      assert.equal(other.tasks.length, 0, `VERCEL_ENV=${String(VERCEL_ENV)}`);
    }
  });

  it("still redirects and warns once when the counter env is missing", () => {
    const h = harness({ env: { VERCEL_ENV: "production" } });
    assert.equal(h.handler(req()).status, 307);
    assert.equal(h.handler(req()).status, 307);
    assert.equal(h.tasks.length, 0);
    assert.equal(h.warnings.length, 1);
    assert.ok(!h.warnings[0].includes("test-token"));
  });

  it("still returns 307 when the store throws, and logs once", async () => {
    const boom: CounterStore = {
      set: () => Promise.reject(new Error("redis down")),
      incr: () => Promise.reject(new Error("redis down")),
      hincrby: () => Promise.reject(new Error("redis down")),
    };
    const h = harness({ createStore: () => boom });
    const first = h.handler(req());
    const second = h.handler(req());
    await h.settle();
    assert.equal(first.status, 307);
    assert.equal(second.status, 307);
    assert.equal(h.warnings.length, 1);
    assert.match(h.warnings[0], /redis down/);
  });

  it("still returns 307 when the store factory or scheduler throws", () => {
    const factory = harness({
      createStore: () => {
        throw new Error("bad config");
      },
    });
    assert.equal(factory.handler(req()).status, 307);

    const scheduler = harness({
      schedule: () => {
        throw new Error("outside request scope");
      },
    });
    assert.equal(scheduler.handler(req()).status, 307);
    assert.equal(scheduler.warnings.length, 1);
  });

  it("does not wait for the write before returning", () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const slow: CounterStore = {
      set: async () => {
        await gate;
        return "OK";
      },
      incr: async () => 1,
      hincrby: async () => 1,
    };
    const h = harness({ createStore: () => slow });
    const res = h.handler(req());
    assert.equal(res.status, 307);
    release();
    return h.settle().then(() => undefined);
  });
});
