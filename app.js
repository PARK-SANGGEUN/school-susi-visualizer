
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs';

const uploadArea = document.getElementById('upload-area');
const dashboardArea = document.getElementById('dashboard-area');

const input = document.createElement('input');
input.type = 'file';
input.accept = '.xlsx';
input.className = 'mb-4';
input.onchange = (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = (event) => {
    const data = new Uint8Array(event.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // 헤더 추출 (1, 2행)
    const headerRow1 = json[0];
    const headerRow2 = json[1];

    const fullHeaders = headerRow1.map((h1, i) => {
      const h2 = headerRow2[i];
      return h1 || h2 || `열${i}`;
    });

    // 데이터 재구성
    const dataRows = json.slice(2).map(row => {
      const obj = {};
      row.forEach((cell, i) => {
        obj[fullHeaders[i]] = cell;
      });
      return obj;
    });

    // 대학명 및 최종단계 자동 탐색
    const 대학Key = fullHeaders.find(h => h.includes('대학'));
    const 결과Key = fullHeaders.find(h => h.includes('최종'));

    if (!대학Key || !결과Key) {
      dashboardArea.innerHTML = '<p class="text-red-500 font-bold">❗ 대학명 또는 최종단계 열을 찾을 수 없습니다.</p>';
      return;
    }

    // 통계 처리
    const stats = {};
    dataRows.forEach(row => {
      const name = row[대학Key] || '미지정';
      const result = (row[결과Key] || '').includes('합격') ? '합격' : '불합격';
      if (!stats[name]) stats[name] = { 합격: 0, 불합격: 0 };
      stats[name][result]++;
    });

    // 테이블 출력
    let html = '<table class="table-auto border-collapse border w-full text-sm">';
    html += '<thead><tr><th class="border p-2">대학명</th><th class="border p-2">합격</th><th class="border p-2">불합격</th></tr></thead><tbody>';
    Object.entries(stats).forEach(([name, val]) => {
      html += `<tr><td class="border p-2">${name}</td><td class="border p-2">${val.합격}</td><td class="border p-2">${val.불합격}</td></tr>`;
    });
    html += '</tbody></table>';
    dashboardArea.innerHTML = html;
  };
  reader.readAsArrayBuffer(file);
};

uploadArea.appendChild(input);
