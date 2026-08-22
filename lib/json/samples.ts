const ORDER = {
    id: "ord_9f2a41",
    createdAt: "2026-03-14T09:21:00Z",
    status: "shipped",
    customer: {
        id: 4821,
        name: "Ada Lovelace",
        email: "ada@example.com",
        tier: "pro",
        address: { line1: "12 Analytical Way", city: "London", postcode: "EC1A 1AA", country: "GB" },
    },
    items: [
        { sku: "KB-77", title: "Mechanical keyboard", qty: 1, unitPrice: 129.99, tags: ["input", "hardware"] },
        { sku: "MN-32", title: "32\" monitor", qty: 2, unitPrice: 349.5, tags: ["display"], warrantyYears: 3 },
        { sku: "CB-01", title: "USB-C cable", qty: 4, unitPrice: 12, tags: [] },
    ],
    totals: { subtotal: 1090.99, shipping: 0, tax: 218.2, grandTotal: 1309.19, currency: "GBP" },
    notes: null,
    metadata: { source: "web", experiment: "checkout-v3", referrer: "https://example.com/blog" },
};

const BROKEN = `{
  // a config with the mistakes people actually paste
  name: 'jsonic',
  version: "0.2.0",
  features: ["viewer", "formatter", "diff",],
  limits: { maxUploadMb: 50, },
}`;

const QUERYABLE = {
    users: [
        { id: 1, name: "Ada", email: "ada@example.com", roles: ["admin"], active: true, score: 91 },
        { id: 2, name: "Grace", email: "grace@example.com", roles: ["editor", "reviewer"], active: true, score: 88 },
        { id: 3, name: "Alan", email: "alan@example.com", roles: [], active: false, score: 64 },
    ],
    page: { number: 1, size: 3, total: 128 },
};

const pretty = (value: unknown) => JSON.stringify(value, null, 2);

const ESCAPED = String.raw`{\"order\":{\"id\":\"ord_9f2a41\",\"total\":1309.19,\"currency\":\"GBP\"},\"note\":\"Line one\nLine two\"}`;

const FLAT = pretty({
    "customer.name": "Ada Lovelace",
    "customer.address.city": "London",
    "customer.address.country": "GB",
    "items.0.sku": "KB-77",
    "items.0.qty": 1,
    "items.1.sku": "MN-32",
    "items.1.qty": 2,
    "totals.grandTotal": 1309.19,
});

const CSV_TEXT = [
    "id,name,email,active,score",
    "1,Ada,ada@example.com,true,91",
    '2,"Hopper, Grace",grace@example.com,true,88',
    "3,Alan,alan@example.com,false,64",
].join("\n");

const NDJSON_TEXT = [
    '{"id":1,"event":"signup","ts":"2026-03-14T09:21:00Z"}',
    '{"id":2,"event":"purchase","ts":"2026-03-14T09:24:11Z","amount":42.5}',
    '{"id":3,"event":"refund","ts":"2026-03-15T11:02:00Z","amount":-42.5}',
].join("\n");

// a deliberately expired demo token, signed with nothing anyone uses
const JWT_TEXT =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
    "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkYSBMb3ZlbGFjZSIsImFkbWluIjp0cnVlLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTUxNjI0MjYyMn0." +
    "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

export const SAMPLES: Record<string, string> = {
    default: pretty(ORDER),
    viewer: pretty(ORDER),
    formatter: BROKEN,
    validator: BROKEN,
    minifier: pretty(ORDER),
    jsonpath: pretty(QUERYABLE),
    typescript: pretty(ORDER),
    go: pretty(ORDER),
    schema: pretty(ORDER),
    converter: pretty(QUERYABLE),
    compare: pretty(ORDER),

    sort: pretty({ zebra: 1, item10: "ten", Alpha: true, item2: "two", beta: { yankee: 1, alpha: 2 }, item1: "one" }),
    escape: ESCAPED,
    flatten: pretty(ORDER),
    unflatten: FLAT,
    merge: pretty(ORDER),
    mergeRight: pretty({ ...ORDER, status: "delivered", totals: { ...ORDER.totals, shipping: 4.99 } }),
    base64: pretty(QUERYABLE),
    jwt: JWT_TEXT,
    size: pretty(ORDER),
    csv: pretty(QUERYABLE.users),
    yaml: pretty(QUERYABLE),
    xml: pretty(QUERYABLE),
    csvToJson: CSV_TEXT,
    ndjson: pretty(QUERYABLE.users),
    ndjsonText: NDJSON_TEXT,
    sql: pretty(QUERYABLE.users),
    python: pretty(ORDER),
    rust: pretty(ORDER),
    java: pretty(ORDER),
    csharp: pretty(ORDER),
    kotlin: pretty(ORDER),
    zod: pretty(ORDER),
};

export const COMPARE_SAMPLES = {
    left: pretty(ORDER),
    right: pretty({
        ...ORDER,
        status: "delivered",
        customer: { ...ORDER.customer, tier: "enterprise" },
        items: ORDER.items.slice(0, 2),
        totals: { ...ORDER.totals, shipping: 4.99, grandTotal: 1314.18 },
        deliveredAt: "2026-03-17T11:02:00Z",
    }),
};
