export const dashboardStyle = `
  body {
    margin: 0;
    padding: 40px 20px;
    background: #f4f6f8;
    font-family: 'Helvetica Neue', Arial, sans-serif;
  }
  .container {
    max-width: 1000px;
    margin: 0 auto;
    background: #ffffff;
    padding: 30px;
    border-radius: 12px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.05);
  }
  .header-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #ecf0f1;
    padding-bottom: 15px;
    margin-bottom: 20px;
  }
  .header-controls h1 {
    margin: 0;
    color: #2c3e50;
    font-size: 24px;
  }
  .header-controls select {
    padding: 8px 12px;
    border-radius: 6px;
    border: 1px solid #ccc;
    font-size: 14px;
    cursor: pointer;
    background: #fff;
  }
  #map {
    height: 600px;
    width: 100%;
    background: #e5e5e5;
    border-radius: 8px;
    border: 1px solid #dfe6e9;
  }
  .table-wrapper {
    margin-top: 40px;
    overflow-x: auto;
  }
  .table-wrapper h2 {
    font-size: 20px;
    color: #2c3e50;
    margin-bottom: 15px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: 14px;
  }
  th, td {
    padding: 12px;
    border-bottom: 1px solid #ecf0f1;
    vertical-align: top; /* 複数行になってもテキストが上に揃うようにする */
  }
  th {
    background: #f8fafc;
    color: #2c3e50;
    font-weight: bold;
    white-space: nowrap;
  }
  tr:hover { background: #f1f5f9; }
  
  /* 閲覧ページ履歴を複数行のリストとして綺麗に表示する */
  .page-list {
    max-width: 400px;
    word-break: break-all;
    line-height: 1.5;
  }
  .page-list span {
    display: block; /* 改行させる */
    padding: 4px 0;
    border-bottom: 1px dashed #ecf0f1;
  }
  .page-list span:last-child {
    border-bottom: none;
  }
  .page-list span::before {
    content: "↳ "; /* 階層っぽく見せる矢印 */
    color: #95a5a6;
  }
    .pagination-controls {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 15px;
      margin-top: 15px;
      padding: 10px 0;
    }
    .pagination-controls button {
      padding: 6px 12px;
      cursor: pointer;
      border: 1px solid #ccc;
      background-color: #f9f9f9;
      border-radius: 4px;
    }
    .pagination-controls button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
`;