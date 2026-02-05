
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
    const json = XLSX.utils.sheet_to_json(sheet);

    // 통계 집계
    const stats = {};
    json.forEach(row => {
      const name = row['대학명'];
      if (!stats[name]) stats[name] = { 합격: 0, 불합격: 0 };
      const pass = row['최종단계']?.includes('합격') ? '합격' : '불합격';
      stats[name][pass]++;
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
