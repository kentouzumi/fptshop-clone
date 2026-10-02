#!/usr/bin/env node
/**
 * Load test đo NGƯỠNG CHỊU TẢI thật của site.
 *
 * Mục đích: trả lời câu "bao nhiêu người đồng thời thì bắt đầu lag" bằng SỐ ĐO
 * thay vì ước lượng, và tách bạch 2 đường đi khác nhau về bản chất sau Giai
 * đoạn 2 của việc chịu tải:
 *   - hình dạng truy vấn CÓ cache  (danh mục trần, trang 1 — isCacheableShape)
 *   - hình dạng KHÔNG cache        (bộ lọc thông số, tìm kiếm, lọc tồn kho)
 * Nếu chỉ đo trung bình toàn site thì 2 đường này trộn vào nhau và con số
 * không nói được gì.
 *
 * CHẠY:
 *   node scripts/loadtest.mjs --check                 # thử 1 lần mỗi URL, không tạo tải
 *   node scripts/loadtest.mjs                          # bắn vào localhost:3000
 *   node scripts/loadtest.mjs --target=prod --confirm  # bắn vào production
 *
 * Tuỳ chọn:
 *   --target=<local|prod|https://...>  đích bắn (mặc định local)
 *   --stages=2,5,10,20,40              số request/giây của từng chặng
 *   --duration=20                      số giây mỗi chặng
 *   --only=cached,uncached,detail      chỉ bắn các nhóm này
 *   --api                              bắn API JSON thay vì trang HTML
 *                                      (xem GHI CHÚ TRẦN BĂNG THÔNG dưới)
 *   --weighted                         bắn theo tỉ lệ traffic thật thay vì chia đều
 *   --confirm                          bắt buộc khi --target trỏ ra ngoài localhost
 *
 * KHÔNG dùng thư viện ngoài (k6/autocannon) — chỉ module lõi của Node. Lý do
 * ngoài việc đỡ thêm dependency: cần tự kiểm soát 2 thứ mà công cụ dựng sẵn
 * hay che đi, xem phần "mô hình mở" và "trần socket" bên dưới.
 */

import http from "node:http";
import https from "node:https";
import { performance } from "node:perf_hooks";
import { createInterface } from "node:readline";

// ─────────────────────────────────────────────────────────── tham số dòng lệnh

const argv = new Map(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? "true"];
  })
);

const TARGETS = {
  local: "http://localhost:3000",
  prod: "https://fptshop-clone.vercel.app",
};

const rawTarget = argv.get("target") ?? "local";
const BASE = (TARGETS[rawTarget] ?? rawTarget).replace(/\/$/, "");
const IS_REMOTE = !/^https?:\/\/(localhost|127\.0\.0\.1)/.test(BASE);

const STAGES = (argv.get("stages") ?? "2,5,10,20,40")
  .split(",")
  .map((s) => Number(s.trim()))
  .filter((n) => Number.isFinite(n) && n > 0);
const STAGE_SECONDS = Number(argv.get("duration") ?? 20);
const COOLDOWN_SECONDS = 5;
const WARMUP_SECONDS = Number(argv.get("warmup") ?? 10);
const CHECK_ONLY = argv.get("check") === "true";
const WEIGHTED = argv.get("weighted") === "true";
const API_MODE = argv.get("api") === "true";

/**
 * Trần số request đang bay cùng lúc. Đây là CƠ CHẾ AN TOÀN, không phải tối ưu:
 * ở mô hình mở (xem dưới) nếu server chậm lại mà vẫn bắn đều thì số request
 * tồn đọng tăng vô hạn — vừa ngốn RAM của chính script, vừa biến phép đo thành
 * một đợt tấn công. Đụng trần là đã tìm thấy ngưỡng rồi, dừng chặng đó luôn.
 */
const MAX_INFLIGHT_FACTOR = 10;

// ──────────────────────────────────────────────────────────── danh sách đích

/**
 * `group` dùng để gom số liệu, và nó bám đúng isCacheableShape() trong
 * src/lib/products.ts — sửa quy tắc cache ở đó thì phải sửa nhãn ở đây.
 *
 * CỐ Ý KHÔNG có trong danh sách:
 *   - /tin-tuc/<slug>: trang này gọi incrementPostView() nên MỖI LẦN XEM LÀ 1
 *     LƯỢT GHI vào DB. Bắn vài nghìn request vào đó sẽ bơm lượt xem giả vào dữ
 *     liệu thật — làm sai lệch chính thứ mình đang đo chất lượng.
 *   - mọi trang cần đăng nhập (/cart, /checkout, /orders, /admin): đo chúng
 *     cần session thật, mà tạo session test hàng loạt lại ghi vào bảng Session.
 *   - /api/orders/lookup và webhook MoMo: có rate limit, bắn vào chỉ nhận 429.
 *   - mọi endpoint POST: không bao giờ tạo đơn/đánh giá trong lúc đo tải.
 */
const ENDPOINTS = [
  {
    name: "trang chủ",
    group: "cached",
    path: "/",
    weight: 30,
    note: "6 query song song + tồn kho (không cache)",
  },
  {
    name: "danh mục (có cache)",
    group: "cached",
    path: "/products?category=dien-thoai",
    weight: 25,
  },
  {
    name: "danh mục con (có cache)",
    group: "cached",
    path: "/products?category=iphone-15-series",
    weight: 10,
  },
  {
    name: "chi tiết sản phẩm",
    group: "detail",
    path: null, // lấy từ sitemap lúc chạy
    weight: 20,
    note: "trang nặng nhất: 3 đợt query nối tiếp",
  },
  {
    name: "trang thương hiệu",
    group: "cached",
    path: "/thuong-hieu/apple",
    weight: 5,
  },
  {
    name: "lọc thông số (KHÔNG cache)",
    group: "uncached",
    path: "/products?category=laptop&spec_ram=16gb",
    weight: 4,
  },
  {
    name: "tìm kiếm (KHÔNG cache, pg_trgm)",
    group: "uncached",
    path: "/products?search=iphone",
    weight: 4,
    note: "đường ILIKE '%...%' — dễ sập nhất ở quy mô lớn",
  },
  {
    name: "lọc tồn kho (KHÔNG cache, EXISTS)",
    group: "uncached",
    path: "/products?category=tivi&instock=1",
    weight: 2,
  },
];

/**
 * GHI CHÚ TRẦN BĂNG THÔNG — lý do tồn tại của `--api`.
 *
 * Mỗi trang HTML của site nặng ~79-93KB (phần lớn là RSC payload). Nghĩa là
 * 100 req/s đã cần ~63 Mbps tải xuống LIÊN TỤC ở máy đang chạy test. Đo thực
 * tế trên máy phát triển: trần ~74 Mbps, tức chỉ bắn được tới ~112 req/s là
 * ĐƯỜNG MẠNG bão hoà trước. Vượt mức đó thì mọi URL cùng chậm đi theo một tỉ
 * lệ y hệt nhau — kể cả URL có cache lẫn không cache — và con số đo được là
 * tốc độ Internet của người chạy test, KHÔNG phải sức chịu tải của site. Đây
 * đúng là cái bẫy mà MAX_SOCKETS ở dưới phòng cho socket, nhưng băng thông là
 * một trần RIÊNG mà script không tự thấy được.
 *
 * DẤU HIỆU đã chạm trần băng thông (phân biệt với server nghẽn thật):
 *   - mọi URL xuống cấp cùng tỉ lệ, nhóm cached và uncached chênh nhau không
 *     đáng kể (server nghẽn thì nhóm đụng DB phải tệ hơn hẳn);
 *   - lỗi vẫn 0% dù p95 lên hàng giây (quá tải thật thường kèm 5xx/ECONNRESET).
 *
 * `--api` bắn /api/products thay vì trang HTML: ~2,5KB/response (nhỏ hơn ~35
 * lần) nhưng CHẠY ĐÚNG getProducts() của trang danh mục — cùng truy vấn, cùng
 * connection pool, cùng Prisma. Nhờ vậy tách được "DB/pool có theo nổi không"
 * khỏi "máy mình có tải nổi HTML về không", và đẩy được lên hàng nghìn req/s
 * trong cùng đường mạng đó.
 *
 * ĐÁNH ĐỔI phải biết khi đọc kết quả: cách này KHÔNG đo phần render/stream
 * HTML (CPU của serverless function), nên số ra sẽ LẠC QUAN HƠN trang thật.
 * Nó trả lời "tầng dữ liệu chịu bao nhiêu", không phải "người dùng thật thấy
 * bao nhiêu". Muốn số của người dùng thật thì phải chạy chế độ HTML mặc định
 * từ một máy có đường mạng đủ rộng.
 *
 * `spec_*` và `instock` CỐ Ý không có ở đây: route /api/products không hỗ trợ
 * 2 tham số đó (xem quyết định phạm vi trong CLAUDE.md), gửi vào sẽ bị bỏ qua
 * âm thầm và ta tưởng đang đo đường facet trong khi thực ra chỉ đo lọc danh
 * mục thường. Đường EXISTS/facet chỉ đo được qua chế độ HTML.
 */
const API_ENDPOINTS = [
  {
    name: "api danh mục (có cache)",
    group: "cached",
    path: "/api/products?category=dien-thoai",
    weight: 30,
  },
  {
    name: "api danh mục 2 (có cache)",
    group: "cached",
    path: "/api/products?category=laptop",
    weight: 20,
  },
  {
    name: "api sắp xếp giá (có cache)",
    group: "cached",
    path: "/api/products?category=tivi&sort=price_asc",
    weight: 10,
  },
  {
    name: "api tìm kiếm (KHÔNG cache, pg_trgm)",
    group: "uncached",
    path: "/api/products?search=iphone",
    weight: 15,
    note: "đường ILIKE '%...%' — dễ sập nhất ở quy mô lớn",
  },
  {
    name: "api khoảng giá (KHÔNG cache)",
    group: "uncached",
    path: "/api/products?minPrice=5000000&maxPrice=30000000",
    weight: 15,
  },
  {
    name: "api gợi ý (KHÔNG cache)",
    group: "uncached",
    path: "/api/products/suggest?q=iph",
    weight: 10,
    note: "autocomplete: gọi mỗi 250ms khi khách đang gõ",
  },
];

// ─────────────────────────────────────────────────────────────── tầng HTTP

/**
 * Agent riêng với maxSockets cao + keepAlive.
 *
 * TRẦN SOCKET: mặc định của `http.globalAgent` giới hạn số kết nối đồng thời
 * mỗi host. Để nguyên thì khi server chậm lại, chính SCRIPT thành cổ chai —
 * request mới nằm chờ socket chứ không chờ server, và con số đo được là hiệu
 * năng của cái máy đang chạy test, không phải của site. Đây là lỗi kinh điển
 * của load test tự viết, nên đặt tường minh và báo lại nếu đụng trần.
 */
const MAX_SOCKETS = 512;
const agent = IS_REMOTE
  ? new https.Agent({ keepAlive: true, maxSockets: MAX_SOCKETS })
  : new http.Agent({ keepAlive: true, maxSockets: MAX_SOCKETS });
const client = IS_REMOTE ? https : http;

function request(path) {
  return new Promise((resolve) => {
    const started = performance.now();
    let ttfb = null;

    const req = client.request(
      `${BASE}${path}`,
      { agent, method: "GET", headers: { "user-agent": "fptshop-loadtest/1.0" } },
      (res) => {
        ttfb = performance.now() - started;
        let bytes = 0;
        // PHẢI đọc hết body: dừng ở header là bỏ qua phần lớn thời gian
        // server stream HTML ra (Next.js trả RSC payload ở cuối document), và
        // socket cũng không được trả về pool để dùng lại.
        res.on("data", (c) => {
          bytes += c.length;
        });
        res.on("end", () =>
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 400,
            status: res.statusCode,
            ttfb,
            total: performance.now() - started,
            bytes,
            cache: res.headers["x-vercel-cache"] ?? null,
          })
        );
        res.on("error", (err) =>
          resolve({ ok: false, status: 0, error: err.message, total: performance.now() - started })
        );
      }
    );

    req.on("error", (err) =>
      resolve({ ok: false, status: 0, error: err.message, total: performance.now() - started })
    );
    // Timeout dài hơn hẳn mức "chấp nhận được": mục đích là phân biệt CHẬM với
    // TREO, không phải để cắt sớm cho đẹp số.
    req.setTimeout(30_000, () => {
      req.destroy();
      resolve({ ok: false, status: 0, error: "timeout 30s", total: performance.now() - started });
    });
    req.end();
  });
}

// ──────────────────────────────────────────────────────────────── thống kê

function percentile(sorted, p) {
  if (sorted.length === 0) return null;
  const i = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[i];
}

function summarize(samples) {
  const ok = samples.filter((s) => s.ok).map((s) => s.total).sort((a, b) => a - b);
  const errors = samples.filter((s) => !s.ok);
  const byStatus = {};
  for (const s of samples) {
    const k = s.error ? s.error : String(s.status);
    byStatus[k] = (byStatus[k] ?? 0) + 1;
  }
  return {
    n: samples.length,
    okCount: ok.length,
    errorRate: samples.length ? errors.length / samples.length : 0,
    p50: percentile(ok, 50),
    p95: percentile(ok, 95),
    p99: percentile(ok, 99),
    max: ok.length ? ok[ok.length - 1] : null,
    byStatus,
  };
}

const ms = (v) => (v === null ? "   —  " : `${Math.round(v).toString().padStart(5)}ms`);
const pct = (v) => `${(v * 100).toFixed(1)}%`;

// ───────────────────────────────────────────────── tự lấy URL thật từ sitemap

/**
 * Lấy slug sản phẩm từ sitemap.xml thay vì ghi cứng trong script.
 *
 * Ghi cứng slug thì mỗi lần catalog đổi là script bắn vào URL 404 mà vẫn báo
 * "nhanh" — 404 thì Next.js không chạy query nào, nên con số đẹp một cách vô
 * nghĩa. Sitemap đã liệt kê đúng những URL đang sống nên dùng nó là tự khớp.
 */
async function resolveDynamicPaths() {
  const res = await request("/sitemap.xml");
  if (!res.ok) {
    console.log(`  ! Không đọc được sitemap.xml (${res.status || res.error}) — dùng slug dự phòng`);
    return { product: "/products/iphone-15-pro-max" };
  }

  // Đọc lại body (hàm request chỉ đếm byte) — chỉ 1 lần lúc khởi động nên rẻ.
  const xml = await new Promise((resolve) => {
    client.get(`${BASE}/sitemap.xml`, { agent }, (r) => {
      let buf = "";
      r.on("data", (c) => (buf += c));
      r.on("end", () => resolve(buf));
    });
  });

  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const products = urls.filter((u) => /\/products\/[^/?]+$/.test(u));
  if (products.length === 0) return { product: "/products/iphone-15-pro-max" };

  // Lấy sản phẩm ở GIỮA danh sách, không phải phần tử đầu: sitemap sắp theo
  // ngày cập nhật nên phần tử đầu dễ là sản phẩm vừa sửa, tức dữ liệu nóng
  // nhất trong cache — không đại diện cho một lượt xem bình thường.
  const picked = products[Math.floor(products.length / 2)];
  return { product: new URL(picked).pathname, productCount: products.length };
}

// ──────────────────────────────────────────────────────────── vòng bắn tải

/**
 * MÔ HÌNH MỞ (open model): request được phát theo ĐỒNG HỒ, không chờ request
 * trước xong.
 *
 * Cách tự nhiên hơn — "N worker, mỗi worker lặp gửi rồi chờ" — có một sai số
 * nghiêm trọng gọi là coordinated omission: server chậm đi thì worker tự động
 * gửi ít hơn, nên độ trễ đo được THẤP HƠN thực tế và cổ chai bị che mất. Người
 * dùng thật không lịch sự như vậy: họ cứ vào trang theo nhịp của họ bất kể
 * server có đang nghẽn hay không. Phát theo đồng hồ mô phỏng đúng điều đó, và
 * số request tồn đọng (inflight) chính là dấu hiệu nghẽn.
 */
async function runStage(rate, seconds, paths) {
  const samples = [];
  const intervalMs = 1000 / rate;
  const maxInflight = Math.max(20, rate * MAX_INFLIGHT_FACTOR);

  let inflight = 0;
  let peakInflight = 0;
  let fired = 0;
  let skippedBackpressure = 0;
  let idx = 0;

  const pool = WEIGHTED
    ? paths.flatMap((e) => Array(e.weight).fill(e))
    : paths;

  const endAt = performance.now() + seconds * 1000;
  let next = performance.now();

  await new Promise((resolve) => {
    function fire() {
      const ep = pool[idx++ % pool.length];
      inflight++;
      peakInflight = Math.max(peakInflight, inflight);
      fired++;
      request(ep.path).then((r) => {
        inflight--;
        samples.push({ ...r, endpoint: ep.name, group: ep.group });
      });
    }

    function tick() {
      const now = performance.now();
      if (now >= endAt) {
        // Đợi nốt các request đang bay rồi mới chốt chặng, nếu không thì mẫu
        // của những request CHẬM NHẤT bị bỏ đi — tức là bỏ đúng phần cần đo.
        const waitDrain = setInterval(() => {
          if (inflight === 0) {
            clearInterval(waitDrain);
            resolve();
          }
        }, 100);
        return;
      }

      // Bù nhịp đã trễ, nhưng có trần: setInterval/setTimeout trong Node trôi
      // nhịp, bù không giới hạn sẽ dồn thành một cục request vô nghĩa.
      let burst = 0;
      while (next <= now && burst < 50) {
        if (inflight < maxInflight) fire();
        else skippedBackpressure++;
        next += intervalMs;
        burst++;
      }
      if (next < now) next = now; // trễ quá nhiều thì bỏ phần nợ, không dồn

      setTimeout(tick, Math.max(1, next - performance.now()));
    }

    tick();
  });

  return { samples, fired, peakInflight, skippedBackpressure };
}

// ─────────────────────────────────────────────────────────────────── chạy

async function preflight(paths) {
  console.log(`\nKiểm tra từng URL (1 request/URL, không tạo tải):\n`);
  let bad = 0;
  for (const ep of paths) {
    const r = await request(ep.path);
    const cacheTag = r.cache ? ` x-vercel-cache=${r.cache}` : "";
    const sizeTag = r.bytes ? ` ${(r.bytes / 1024).toFixed(0)}KB` : "";
    console.log(
      `  ${r.ok ? "OK  " : "LỖI "} ${String(r.status || r.error).padEnd(8)} ${ms(r.total)}${sizeTag}${cacheTag}  ${ep.path}`
    );
    if (!r.ok) bad++;
  }
  if (bad > 0) {
    console.log(
      `\n  ${bad} URL không trả về 2xx/3xx. Sửa đường dẫn trong ENDPOINTS rồi chạy lại —\n` +
        `  bắn tải vào URL 404 cho ra số liệu vô nghĩa (404 không chạy query nào).`
    );
  }
  return bad === 0;
}

async function confirmRemote(totalRequests) {
  if (!IS_REMOTE || argv.get("confirm") === "true") return true;

  console.log(
    `\nĐích là ${BASE} (KHÔNG phải localhost).\n` +
      `Sẽ gửi khoảng ${totalRequests} request thật tới production.\n` +
      `Việc này tiêu hạn mức function/bandwidth của Vercel và compute của Supabase,\n` +
      `và trong lúc chạy người dùng thật có thể thấy trang chậm hoặc lỗi.\n`
  );

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((r) => rl.question('Gõ "yes" để tiếp tục: ', r));
  rl.close();
  return answer.trim().toLowerCase() === "yes";
}

async function main() {
  console.log(`\n┌─ Load test: ${BASE}`);

  // Chế độ --api không có URL nào phải lấy từ sitemap, nên bỏ luôn 1 request.
  const dyn = API_MODE ? {} : await resolveDynamicPaths();
  const endpointSet = API_MODE ? API_ENDPOINTS : ENDPOINTS;
  const onlyGroups = argv.get("only")?.split(",").map((s) => s.trim());
  const paths = endpointSet
    .filter((e) => !onlyGroups || onlyGroups.includes(e.group))
    .map((e) => ({ ...e, path: e.path ?? dyn.product }));

  if (API_MODE) {
    console.log("│  chế độ API JSON: đo tầng dữ liệu, KHÔNG đo render HTML");
  }

  if (dyn.productCount) {
    console.log(`│  sitemap: ${dyn.productCount} sản phẩm · chọn ${dyn.product}`);
  }
  console.log(`│  ${paths.length} URL · nhóm: ${[...new Set(paths.map((p) => p.group))].join(", ")}`);
  console.log(`└─ chia tải: ${WEIGHTED ? "theo tỉ lệ traffic" : "đều nhau giữa các URL"}`);

  const ok = await preflight(paths);
  if (CHECK_ONLY) return;
  if (!ok) process.exit(1);

  const totalRequests = STAGES.reduce((a, r) => a + r * STAGE_SECONDS, 0);
  if (!(await confirmRemote(totalRequests))) {
    console.log("Đã huỷ.");
    return;
  }

  console.log(
    `\nChặng: ${STAGES.join(" → ")} request/giây, mỗi chặng ${STAGE_SECONDS}s ` +
      `(tổng ~${totalRequests} request + ${Math.round(STAGES[0] * WARMUP_SECONDS)} warmup)\n`
  );

  // WARMUP — kết quả BỊ LOẠI khỏi mọi số liệu.
  //
  // Không có bước này thì chặng ĐẦU TIÊN hứng toàn bộ cold start của Vercel
  // (serverless instance phải khởi tạo, mở pool kết nối tới Supabase, nạp
  // Prisma Client) và cho ra kết quả NGƯỢC: đo thật thấy chặng 2 req/s có
  // p95 2002ms còn chặng 4 req/s chỉ 549ms — tải tăng mà lại nhanh hơn. Đọc
  // nguyên số đó sẽ kết luận "ngưỡng là 2 req/s", sai hoàn toàn.
  process.stdout.write(`  warmup ${WARMUP_SECONDS}s (loại khỏi kết quả) ... `);
  const warm = await runStage(STAGES[0], WARMUP_SECONDS, paths);
  const warmSummary = summarize(warm.samples);
  console.log(`p50 ${ms(warmSummary.p50)}  max ${ms(warmSummary.max)}`);

  const stageResults = [];

  for (const [i, rate] of STAGES.entries()) {
    process.stdout.write(`  ${String(rate).padStart(3)} req/s ... `);
    const { samples, fired, peakInflight, skippedBackpressure } = await runStage(
      rate,
      STAGE_SECONDS,
      paths
    );
    const s = summarize(samples);
    const achieved = fired / STAGE_SECONDS;

    const flags = [];
    // Không đạt nổi nhịp đã đặt = script không phát kịp, thường vì nghẽn ở
    // dưới. Cần nói rõ để không đọc nhầm "server chịu được 40 req/s".
    if (achieved < rate * 0.9) flags.push(`chỉ phát được ${achieved.toFixed(1)}/s`);
    if (skippedBackpressure > 0) flags.push(`bỏ ${skippedBackpressure} nhịp vì tồn đọng`);
    if (peakInflight >= MAX_SOCKETS * 0.9) flags.push(`ĐỤNG TRẦN SOCKET (${peakInflight})`);
    // max lệch hẳn khỏi trung vị = có vài request đơn lẻ rất chậm, gần như
    // luôn là instance mới được Vercel bật lên khi tải tăng. Phải nói ra, vì
    // nó đẩy p95/p99 lên mà KHÔNG phải do DB hay query nghẽn.
    if (s.p50 && s.max && s.max > s.p50 * 5) {
      flags.push(`nghi cold start (max ${Math.round(s.max)}ms vs p50 ${Math.round(s.p50)}ms)`);
    }

    console.log(
      `p50 ${ms(s.p50)}  p95 ${ms(s.p95)}  p99 ${ms(s.p99)}  ` +
        `lỗi ${pct(s.errorRate).padStart(6)}  tồn đọng tối đa ${String(peakInflight).padStart(4)}` +
        (flags.length ? `  ⚠ ${flags.join("; ")}` : "")
    );

    stageResults.push({ rate, achieved, summary: s, samples, peakInflight });

    if (i < STAGES.length - 1) {
      // Nghỉ giữa 2 chặng: để pool kết nối của Supabase và instance Vercel về
      // trạng thái rỗi, nếu không chặng sau thừa hưởng phần tồn đọng của chặng
      // trước và số liệu bị đẩy xấu đi một cách không thật.
      await new Promise((r) => setTimeout(r, COOLDOWN_SECONDS * 1000));
    }
  }

  report(stageResults, paths);
}

function report(stageResults, paths) {
  console.log(`\n${"─".repeat(78)}\nCHI TIẾT THEO TỪNG URL (p95, ms)\n`);

  const header = ["URL".padEnd(34), ...stageResults.map((s) => String(s.rate).padStart(7))].join("");
  console.log(`  ${header}`);
  for (const ep of paths) {
    const cells = stageResults.map((st) => {
      const sub = summarize(st.samples.filter((s) => s.endpoint === ep.name));
      return (sub.p95 === null ? "—" : String(Math.round(sub.p95))).padStart(7);
    });
    console.log(`  ${ep.name.padEnd(34)}${cells.join("")}`);
  }

  console.log(`\n${"─".repeat(78)}\nTHEO NHÓM (p95, ms)\n`);
  const groups = [...new Set(paths.map((p) => p.group))];
  console.log(`  ${["nhóm".padEnd(34), ...stageResults.map((s) => String(s.rate).padStart(7))].join("")}`);
  for (const g of groups) {
    const cells = stageResults.map((st) => {
      const sub = summarize(st.samples.filter((s) => s.group === g));
      return (sub.p95 === null ? "—" : String(Math.round(sub.p95))).padStart(7);
    });
    console.log(`  ${g.padEnd(34)}${cells.join("")}`);
  }

  // Ngưỡng: chặng ĐẦU TIÊN mà p95 vượt 1 giây hoặc bắt đầu có lỗi. Chọn 1s vì
  // đó là mốc người dùng cảm nhận rõ là "chậm"; đổi mốc thì đổi dòng dưới.
  const knee = stageResults.find((s) => {
    if (s.summary.errorRate > 0.01) return true; // lỗi thật thì luôn tính
    const coldStartSuspect = s.summary.p50 && s.summary.max > s.summary.p50 * 5;
    // p95 cao KÈM trung vị vẫn thấp thì đó là vài outlier cold start, chưa
    // phải xuống cấp — chỉ tính là ngưỡng khi trung vị cũng đã đi lên.
    if (coldStartSuspect && (s.summary.p50 ?? 0) < 500) return false;
    return (s.summary.p95 ?? 0) > 1000;
  });

  console.log(`\n${"─".repeat(78)}\nKẾT LUẬN\n`);
  if (!knee) {
    const last = stageResults[stageResults.length - 1];
    console.log(
      `  Chưa tìm thấy ngưỡng. Ở ${last.rate} req/s vẫn p95 ${Math.round(last.summary.p95 ?? 0)}ms,` +
        ` lỗi ${pct(last.summary.errorRate)}.\n` +
        `  Chạy lại với chặng cao hơn, vd: --stages=${last.rate},${last.rate * 2},${last.rate * 4}`
    );
  } else {
    console.log(
      `  Bắt đầu xuống cấp ở khoảng ${knee.rate} req/s ` +
        `(p95 ${Math.round(knee.summary.p95 ?? 0)}ms, lỗi ${pct(knee.summary.errorRate)}).`
    );
    const statuses = Object.entries(knee.summary.byStatus).filter(([k]) => k !== "200");
    if (statuses.length) {
      console.log(`  Mã trả về khác 200: ${statuses.map(([k, v]) => `${k}×${v}`).join(", ")}`);
    }
  }

  console.log(
    `\n  LƯU Ý khi đọc kết quả:\n` +
      `  · req/s KHÁC số người đồng thời. Một người xem trang ~5s mới tải trang mới,\n` +
      `    nên 10 req/s xấp xỉ 50 người đang lướt cùng lúc.\n` +
      `  · Số ở localhost gần như vô nghĩa: dev server có overhead Turbopack, còn\n` +
      `    "next start" thì thiếu độ trễ mạng tới Supabase. Chỉ production mới thật.\n` +
      `  · Cold start: Vercel bật thêm instance khi tải tăng, mỗi instance đầu tiên\n` +
      `    tốn ~1-2s. Nó đẩy p95/p99 lên mà không phải do DB nghẽn — xem cờ\n` +
      `    "nghi cold start" ở từng chặng trước khi kết luận.\n` +
      `  · Nhóm "uncached" chậm hơn "cached" là ĐÚNG THIẾT KẾ (xem isCacheableShape).\n` +
      `    Điều đáng lo là khoảng cách giữa 2 nhóm GIÃN RA khi tăng tải — đó là lúc DB\n` +
      `    thành cổ chai, không phải tầng cache.\n`
  );
}

main().catch((err) => {
  console.error("\nLỗi:", err);
  process.exit(1);
});
