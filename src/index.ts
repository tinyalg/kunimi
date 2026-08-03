import localDomains from './allowed-domains.json';
import { dashboardHtml } from './dashboard';

export interface Env {
  DB: D1Database;
  ALLOWED_DOMAINS: string;
  BASIC_USER: string;
  BASIC_PASS?: string;
  TARGET_DOMAINS: string;
}

// ヘルパー関数: リクエストから優先言語を取得 (ja か en)
function getLanguage(request: Request): 'ja' | 'en' {
  const acceptLang = request.headers.get('Accept-Language') || '';
  return acceptLang.toLowerCase().includes('ja') ? 'ja' : 'en';
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const requestUrl = new URL(request.url);
    const lang = getLanguage(request);
    // =========================================================
    // 【1】アクセス記録用ピクセル（誰でもアクセスOK）
    // =========================================================
    if (requestUrl.pathname === '/log.gif') {
      ctx.waitUntil((async function() {
        const targetUrlParam = requestUrl.searchParams.get('url');
        let domain = 'unknown_domain', path = '/';
        if (targetUrlParam) {
          try {
            const parsed = new URL(targetUrlParam);
            domain = parsed.hostname; path = parsed.pathname;   
          } catch (e) {}
        }

        const cloudDomains = env.ALLOWED_DOMAINS ? env.ALLOWED_DOMAINS.split(',').map(d => d.trim()) : [];
        const allowedList = Array.from(new Set([...localDomains, ...cloudDomains]));
        const isAllowed = (host: string) => allowedList.some(d => host === d || host.endsWith('.' + d));

        if (!isAllowed(domain)) return; 

        const rawReferrer = request.headers.get('Referer');
        let referrer = 'direct';
        if (rawReferrer) {
          try {
            const refererUrl = new URL(rawReferrer);
            if (!isAllowed(refererUrl.hostname)) return; // 自サイト以外からの埋め込み呼び出しをブロック
            referrer = refererUrl.hostname;
          } catch (e) { return; }
        }

        const ua = request.headers.get('user-agent') || '';
        const isBot = /bot|spider|crawl|headless/i.test(ua);
        
        // ★ ボットからのアクセスは集計に入れないため、ここで処理を終了
        if (isBot) return;

        const device = /mobile|iphone|android/i.test(ua) ? 'mobile' : 'desktop';
        const country = request.cf?.country || 'XX';
        const region = (request.cf?.region as string) || 'Unknown';
        
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const hour = now.getUTCHours();

        try {
          // ★ 生ログのINSERTではなく、集計テーブルへのUPSERTに変更
          await env.DB.prepare(`
            INSERT INTO hourly_stats (date, hour, host, referrer, country, region, path, device)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
            ON CONFLICT(date, hour, host, referrer, country, region, path, device)
            DO UPDATE SET pv_count = pv_count + 1
          `).bind(dateStr, hour, domain, referrer, country, region, path, device).run();
        } catch (error) {
          // エラーが出ても画面表示に影響しないように、コンソールに出すだけ
          console.error('D1 Analytics Insert Failed:', error);
        }
      })());

      const transparentGif = new Uint8Array([
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, 0xff, 0xff, 0xff,
        0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
        0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b
      ]);
      return new Response(transparentGif, {
        headers: { 'Content-Type': 'image/gif', 'Cache-Control': 'no-store, no-cache, must-revalidate, private' }
      });
    }

    // =========================================================
    //  解析用スクリプトの配信
    // =========================================================
    if (requestUrl.pathname === '/script.js') {
      const scriptContent = `
        (function() {
          const workerUrl = "https://${requestUrl.hostname}/log.gif";
          const cacheBuster = Date.now();
          const img = new Image();
          img.src = workerUrl + "?url=" + encodeURIComponent(window.location.href) + "&_=" + cacheBuster;
        })();
      `;
      return new Response(scriptContent, {
        headers: { 
          'Content-Type': 'application/javascript; charset=utf-8',
          // スクリプトファイル自体はブラウザにキャッシュさせて通信量を減らす
          'Cache-Control': 'public, max-age=86400' 
        }
      });
    }

    // =========================================================
    // 【2】Basic認証
    // =========================================================
    const USER = env.BASIC_USER || 'admin';
    const PASS = env.BASIC_PASS;
    
    if (!PASS) {
      const msg = lang === 'ja' ? 'パスワードが設定されていません' : 'Password is not set';
      return new Response(msg, { status: 500 });
    }

    const expectedAuth = 'Basic ' + btoa(`${USER}:${PASS}`);
    const authHeader = request.headers.get('Authorization');

    if (authHeader !== expectedAuth) {
      const msg = lang === 'ja' ? '認証が必要です' : 'Authentication required';
      return new Response(msg, {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Analytics Dashboard"' }
      });
    }

    // =========================================================
    // 【3】ダッシュボード画面
    // =========================================================
    if (requestUrl.pathname === '/') {
      return new Response(dashboardHtml, { headers: { 'Content-Type': 'text/html;charset=utf-8' } });
    }

    // =========================================================
    // 【4】データ集計API
    // =========================================================
    function getValidDays(reqUrl: URL) {
      const days = parseInt(reqUrl.searchParams.get('days') || '7', 10);
      return [7, 14, 30].includes(days) ? days : 7;
    }

    // ① 地図用のAPI（UUではなくPVの集計に変更）
    if (requestUrl.pathname === '/api/stats') {
      const validDays = getValidDays(requestUrl);
      const { results } = await env.DB.prepare(`
        SELECT country, SUM(pv_count) as pv 
        FROM hourly_stats 
        WHERE date >= date('now', '-${validDays} days')
        GROUP BY country
      `).all();
      return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } });
    }

    // ② 表用のAPI（セッション単位から、時間帯・パス別のPVランキングに変更）
    if (requestUrl.pathname === '/api/sessions') {
      const validDays = getValidDays(requestUrl);
      const { results } = await env.DB.prepare(`
        SELECT 
          date,
          hour,
          country, 
          device, 
          path,
          SUM(pv_count) as pv_count
        FROM hourly_stats 
        WHERE date >= date('now', '-${validDays} days')
        GROUP BY date, hour, country, device, path
        ORDER BY date DESC, hour DESC, pv_count DESC
        LIMIT 100
      `).all();
      return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response('Not Found', { status: 404 });
  },
};