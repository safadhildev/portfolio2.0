import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { VISITS_COUNT_URL, parseVisitors, resolveVisitConfig, visitsCountUrl } from "./visit-counter.ts";
import type { VisitEnv, VisitResponse } from "./visit-counter.ts";
import { createVisitHandler } from "./visit-handler.ts";
import type { VisitHandlerDeps } from "./visit-handler.ts";

const TOKEN = "secret-token-material";
const env: VisitEnv = {
  VERCEL_ANALYTICS_TOKEN: TOKEN,
  VERCEL_ANALYTICS_PROJECT_ID: "prj_123",
  VERCEL_ANALYTICS_TEAM_ID: "team_456",
};

describe("resolveVisitConfig", () => {
  it("reads token, project and team", () => {
    assert.deepEqual(resolveVisitConfig(env), {
      token: TOKEN,
      projectId: "prj_123",
      teamId: "team_456",
    });
  });

  it("treats the team id as optional", () => {
    assert.equal(resolveVisitConfig({ ...env, VERCEL_ANALYTICS_TEAM_ID: undefined })?.teamId, null);
    assert.equal(resolveVisitConfig({ ...env, VERCEL_ANALYTICS_TEAM_ID: "" })?.teamId, null);
  });

  it("returns null when the token or project id is missing or empty", () => {
    for (const key of ["VERCEL_ANALYTICS_TOKEN", "VERCEL_ANALYTICS_PROJECT_ID"]) {
      const partial: Record<string, string | undefined> = { ...env };
      delete partial[key];
      assert.equal(resolveVisitConfig(partial), null, `without ${key}`);
      assert.equal(resolveVisitConfig({ ...env, [key]: "" }), null, `empty ${key}`);
    }
  });
});

describe("visitsCountUrl", () => {
  it("queries the whole project with no filter", () => {
    const url = new URL(visitsCountUrl({ token: TOKEN, projectId: "prj_123", teamId: "team_456" }));
    assert.equal(`${url.origin}${url.pathname}`, VISITS_COUNT_URL);
    assert.equal(url.searchParams.get("projectId"), "prj_123");
    assert.equal(url.searchParams.get("teamId"), "team_456");
    assert.equal(url.searchParams.has("filter"), false);
    assert.ok(!url.toString().includes(TOKEN), "token goes in the header, never the url");
  });

  it("omits teamId for personal accounts", () => {
    const url = new URL(visitsCountUrl({ token: TOKEN, projectId: "prj_123", teamId: null }));
    assert.equal(url.searchParams.has("teamId"), false);
  });
});

describe("parseVisitors", () => {
  it("reads data.visitors from the documented shape", () => {
    assert.equal(parseVisitors({ version: 1, query: {}, data: { pageviews: 1250, visitors: 980 } }), 980);
    assert.equal(parseVisitors({ data: { visitors: 0 } }), 0);
  });

  it("rejects anything else", () => {
    for (const body of [
      null,
      "980",
      {},
      { data: null },
      { data: { pageviews: 5 } },
      { data: { visitors: "980" } },
      { data: { visitors: -1 } },
      { data: { visitors: 1.5 } },
      { data: { visitors: Number.NaN } },
    ]) {
      assert.equal(parseVisitors(body), null, JSON.stringify(body));
    }
  });
});

function harness(respond: (url: string, init?: RequestInit) => Promise<Response>, overrides: Partial<VisitHandlerDeps> = {}) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const warnings: string[] = [];
  const deps: VisitHandlerDeps = {
    env,
    fetch: (async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      calls.push({ url, init });
      return respond(url, init);
    }) as typeof fetch,
    warn: (m) => warnings.push(m),
    ...overrides,
  };
  return { calls, warnings, handler: createVisitHandler(deps) };
}

const okApi = () => Promise.resolve(Response.json({ data: { pageviews: 1250, visitors: 980 } }));

async function body(res: Response): Promise<VisitResponse> {
  return (await res.json()) as VisitResponse;
}

describe("visits route handler", () => {
  it("returns the visitor total, CDN-cached", async () => {
    const h = harness(okApi);
    const res = await h.handler();
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("cache-control"), "public, s-maxage=300, stale-while-revalidate=3600");
    assert.deepEqual(await body(res), { status: "ok", visitors: 980 });
  });

  it("sends the token as a bearer header and nowhere else", async () => {
    const h = harness(okApi);
    await h.handler();
    assert.equal(h.calls.length, 1);
    const headers = new Headers(h.calls[0].init?.headers);
    assert.equal(headers.get("authorization"), `Bearer ${TOKEN}`);
    assert.ok(!h.calls[0].url.includes(TOKEN));
  });

  it("is disabled and warns once when env is missing, without calling the API", async () => {
    const h = harness(okApi, { env: { VERCEL_ANALYTICS_PROJECT_ID: "prj_123" } });
    for (let i = 0; i < 2; i++) {
      const res = await h.handler();
      assert.equal(res.status, 200);
      assert.equal(res.headers.get("cache-control"), "no-store");
      assert.deepEqual(await body(res), { status: "disabled" });
    }
    assert.equal(h.calls.length, 0);
    assert.equal(h.warnings.length, 1);
  });

  const failures: [string, () => Promise<Response>, RegExp][] = [
    ["non-2xx", () => Promise.resolve(new Response("nope", { status: 403 })), /HTTP 403/],
    ["bad shape", () => Promise.resolve(Response.json({ data: {} })), /unexpected response shape/],
    ["invalid json", () => Promise.resolve(new Response("<html>")), /./],
    ["network error", () => Promise.reject(new Error("socket hang up")), /socket hang up/],
  ];
  for (const [name, respond, reason] of failures) {
    it(`answers 200 error on ${name}, short-cached, logged once without the token`, async () => {
      const h = harness(respond);
      for (let i = 0; i < 2; i++) {
        const res = await h.handler();
        assert.equal(res.status, 200);
        assert.equal(res.headers.get("cache-control"), "public, s-maxage=60");
        assert.deepEqual(await body(res), { status: "error" });
      }
      assert.equal(h.warnings.length, 1);
      assert.match(h.warnings[0], reason);
      assert.ok(!h.warnings[0].includes(TOKEN));
    });
  }
});
