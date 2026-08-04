    // 翻訳用辞書オブジェクト
    const translations = {
      ja: {
        documentTitle: 'Kunimi – アクセス解析ダッシュボード',
        title: '🌍 Kunimi – アクセス状況マップ',
        labelLanguage: '言語: ',
        labelPeriod: '期間: ',
        opt7Days: '最新 7 日間',
        opt14Days: '最新 2 週間',
        opt30Days: '最新 1 ヶ月',
        labelTimezone: 'タイムゾーン: ',
        optLocalTime: 'ローカル時刻',
        tableTitle: '📋 アクセス一覧 (時間帯・パス別)',
        thDate: '日時',
        thDomain: 'ドメイン',
        thCountry: '国',
        thDevice: 'デバイス',
        thPv: 'PV',
        thPath: 'ページ',
        pvTooltip: 'PV数: ',
        fetchError: 'データ読み込みエラー:',
        btnPrev: '前のページ',
        btnNext: '次のページ',
        pageIndicator: 'ページ: {current} / {total}'
      },
      en: {
        documentTitle: 'Kunimi – Access Analytics Dashboard',
        title: '🌍 Kunimi – Traffic Map',
        labelLanguage: 'Language: ',
        labelPeriod: 'Period: ',
        opt7Days: 'Last 7 Days',
        opt14Days: 'Last 2 Weeks',
        opt30Days: 'Last 1 Month',
        labelTimezone: 'Timezone: ',
        optLocalTime: 'Local Time',
        tableTitle: '📋 Access Logs (Hourly / Path)',
        thDate: 'Date & Time',
        thDomain: 'Domain',
        thCountry: 'Country',
        thDevice: 'Device',
        thPv: 'PV',
        thPath: 'Page',
        pvTooltip: 'PV Count: ',
        fetchError: 'Data loading error:',
        btnPrev: 'Previous',
        btnNext: 'Next',
        pageIndicator: 'Page: {current} / {total}'
      }
    };

    // 初期言語の判定（ブラウザの言語設定かlocalStorageから取得）
    let currentLang = localStorage.getItem('app_lang') || (navigator.language.startsWith('ja') ? 'ja' : 'en');
    
    // ページング用の状態変数
    let currentPage = 1;
    let totalPages = 1;
    
    let geoJsonLayer = null;
    let cachedMapData = null; // 言語切り替え時に再利用するため保持

    const map = L.map('map').setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    function getColor(val) {
      return val > 500 ? '#800026' : val > 100 ? '#BD0026' : val > 50 ? '#E31A1C' : val > 10 ? '#FC4E2A' : val > 0 ? '#FD8D3C' : '#e0e0e0';
    }

    // UIのテキストを一括更新する関数
    function applyTranslations() {
      document.getElementById('language').value = currentLang;
      document.getElementById('title-text').innerText = translations[currentLang].documentTitle;

      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLang][key]) {
          el.innerText = translations[currentLang][key];
        }
      });
      updatePaginationUI(); // 翻訳反映後にページ表示も更新
    }

    function changeLanguage(lang) {
      currentLang = lang;
      localStorage.setItem('app_lang', lang);
      applyTranslations();
      if (cachedMapData) {
        renderMap(cachedMapData.geoData, cachedMapData.pvMap);
      }
    }

    function renderMap(geoData, pvMap) {
      if (geoJsonLayer) {
        map.removeLayer(geoJsonLayer);
      }

      geoJsonLayer = L.geoJson(geoData, {
        style: function(f) { return { fillColor: getColor(pvMap[f.properties.ISO_A2]||0), weight: 1, opacity: 1, color: '#fff', fillOpacity: 0.8 }; },
        onEachFeature: function(f, l) {
          const pv = pvMap[f.properties.ISO_A2] || 0;
          const tooltipText = '<b>' + f.properties.NAME + '</b><br>' + translations[currentLang].pvTooltip + pv;
          l.bindTooltip(tooltipText, { sticky: true });
          l.on({
            mouseover: function(e) { e.target.setStyle({ weight: 3, color: '#666' }); },
            mouseout: function(e) { e.target.setStyle({ weight: 1, color: '#fff' }); }
          });
        }
      }).addTo(map);
    }

    // 地図データのみ読み込む関数
    async function loadMapData() {
      const days = document.getElementById('period').value;
      
      try {
        const mapRes = await fetch('/api/stats?days=' + days);
        const mapData = await mapRes.json();
        const pvMap = {};
        mapData.forEach(function(d) { pvMap[d.country] = d.pv; });

        const geoRes = await fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson');
        const geoData = await geoRes.json();

        // キャッシュに保持して言語変更時に活用
        cachedMapData = { geoData, pvMap };
        renderMap(geoData, pvMap);
      } catch(e) {
        console.error(translations[currentLang].fetchError, e);
      }
    }

    // 表データ（ページ指定）のみ読み込む関数
    async function loadTableData() {
      const days = document.getElementById('period').value;
      
      try {
        const tableRes = await fetch('/api/sessions?days=' + days + '&page=' + currentPage);
        const responseData = await tableRes.json();
        
        // APIのレスポンス形式変更に対応
        const tableData = responseData.data;
        totalPages = responseData.totalPages;
        currentPage = responseData.currentPage;
        
        const tbody = document.querySelector('#session-table tbody');
        tbody.innerHTML = ''; 
        
        const tzValue = document.getElementById('timezone').value;
        const selectedTz = tzValue === 'auto' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';
        
        tableData.forEach(function(row) {
          const tr = document.createElement('tr');
          
          const utcDateString = row.date + 'T' + String(row.hour).padStart(2, '0') + ':00:00Z';
          const utcDate = new Date(utcDateString);
          
          // 表示フォーマット設定 (言語を動的にセット)
          // 第1引数を undefined に戻せば、ユーザーのブラウザ設定に合わせて自動調整されます
          const formatter = new Intl.DateTimeFormat(undefined, {
            timeZone: selectedTz,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          });
          const dateStr = formatter.format(utcDate);
          
          tr.innerHTML = 
            '<td>' + dateStr + '</td>' +
            '<td>' + row.host + '</td>' +
            '<td>' + row.country + '</td>' +
            '<td>' + row.device + '</td>' +
            '<td>' + row.pv_count + '</td>' +
            '<td><div class="page-list"><span>' + row.path + '</span></div></td>';
          tbody.appendChild(tr);
        });

        updatePaginationUI();
      } catch(e) {
        console.error(translations[currentLang].fetchError, e);
      }
    }

    function updatePaginationUI() {
      const btnPrev = document.getElementById('btn-prev');
      const btnNext = document.getElementById('btn-next');
      const indicator = document.getElementById('page-indicator');

      btnPrev.disabled = (currentPage <= 1);
      btnNext.disabled = (currentPage >= totalPages);

      let text = translations[currentLang].pageIndicator;
      text = text.replace('{current}', currentPage).replace('{total}', totalPages);
      indicator.innerText = text;
    }

    // 期間やタイムゾーンの変更時（ページを1に戻して全データ再取得）
    function handleFilterChange() {
      currentPage = 1;
      loadMapData();
      loadTableData();
    }

    // ページボタン押下時（テーブルデータのみ再取得）
    function changePage(delta) {
      const newPage = currentPage + delta;
      if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        loadTableData();
      }
    }
    
    // 初期表示処理
    applyTranslations();
    handleFilterChange();