const APP_VERSION = '001';

import { dashboardStyle } from './style';

export const dashboardHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title id="title-text">Kunimi</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css" />
  <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js"></script>
  <link rel="stylesheet" href="/style.css?v=${APP_VERSION}" />
</head>
<body>
  <div class="container">
    <div class="header-controls">
      <h1 data-i18n="title">🌍 Kunimi – アクセス状況マップ</h1>
      <div>
        <!-- 言語切替を追加 -->
        <label for="language" data-i18n="labelLanguage">言語: </label>
        <select id="language" onchange="changeLanguage(this.value)">
          <option value="ja">日本語</option>
          <option value="en">English</option>
        </select>

        <label for="period" style="margin-left: 10px;" data-i18n="labelPeriod">期間: </label>
        <select id="period" onchange="loadData()">
          <option value="7" data-i18n="opt7Days">最新 7 日間</option>
          <option value="14" data-i18n="opt14Days">最新 2 週間</option>
          <option value="30" data-i18n="opt30Days">最新 1 ヶ月</option>
        </select>
        
        <label for="timezone" style="margin-left: 10px;" data-i18n="labelTimezone">タイムゾーン: </label>
        <select id="timezone" onchange="loadData()">
          <option value="auto" data-i18n="optLocalTime">ローカル時刻</option>
          <option value="UTC">UTC</option>
        </select>
      </div>
    </div>
    
    <div id="map"></div>

    <div class="table-wrapper">
      <h2 data-i18n="tableTitle">📋 アクセス一覧 (時間帯・パス別)</h2>
      <table id="session-table">
        <thead>
          <tr>
            <th data-i18n="thDate">日時</th>
            <th data-i18n="thDomain">ドメイン</th>
            <th data-i18n="thCountry">国</th>
            <th data-i18n="thDevice">デバイス</th>
            <th data-i18n="thPv">PV</th>
            <th data-i18n="thPath">ページ</th>
          </tr>
        </thead>
        <tbody>
          <!-- JavaScriptで挿入 -->
        </tbody>
      </table>
      
      <!-- ページネーションUI -->
      <div class="pagination-controls">
        <button id="btn-prev" onclick="changePage(-1)" data-i18n="btnPrev">前のページ</button>
        <span id="page-indicator">1 / 1</span>
        <button id="btn-next" onclick="changePage(1)" data-i18n="btnNext">次のページ</button>
      </div>
    </div>
  </div>

  <script src="/dashboard.client.js?v=${APP_VERSION}"></script>
</body>
</html>`;