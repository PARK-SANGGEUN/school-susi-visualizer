
// 고급 분석 대시보드: 지역/전형/등급/대학별 차트 + 필터별 사례표 제공 + 상세 분석 및 검색/정렬 기능 + 커스터마이징 추가
import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell, Label
} from "recharts";

const COLORS = ['#4ade80', '#f87171'];

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState({ 지역: "전체", 전형: "전체", 등급: "전체", 대학명: "전체" });
  const [page, setPage] = useState(1);
  const itemsPerPage = 7;
  const [sortKey, setSortKey] = useState("합격률");
  const [search, setSearch] = useState("");
  const [chartStyle, setChartStyle] = useState("bar");
  const [visibleCols, setVisibleCols] = useState(null);

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    onDrop: (acceptedFiles) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const workbook = XLSX.read(e.target.result, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const headers = json[0];
        const subHeaders = json[1];
        const fullHeaders = headers.map((h, i) => h || subHeaders[i] || `열${i}`);
        const parsed = json.slice(2).map(row => Object.fromEntries(row.map((v, i) => [fullHeaders[i], v])));
        setData(parsed);
        setVisibleCols(fullHeaders);
        setPage(1);
      };
      reader.readAsBinaryString(acceptedFiles[0]);
    }
  });

  const getGradeRange = (num) => {
    if (isNaN(num)) return "기타";
    const g = Math.floor(num);
    if (g >= 1 && g <= 9) return `${g}등급`;
    return "기타";
  };

  const getCategoryStats = (key) => {
    const grouped = {};
    data.forEach(row => {
      let group;
      if (key === "내등급(환산)") {
        const val = parseFloat(row[key]);
        group = getGradeRange(val);
      } else {
        group = row[key] || "미지정";
      }
      const pass = (row["최종단계"] || "").includes("합격") ? "합격" : "불합격";
      if (!grouped[group]) grouped[group] = { 합격: 0, 불합격: 0 };
      grouped[group][pass]++;
    });
    return Object.entries(grouped).map(([name, counts]) => {
      const total = counts.합격 + counts.불합격;
      return {
        name,
        합격: counts.합격,
        불합격: counts.불합격,
        합격률: total > 0 ? parseFloat(((counts.합격 / total) * 100).toFixed(1)) : 0,
      };
    }).sort((a, b) => b[sortKey] - a[sortKey]).slice((page - 1) * itemsPerPage, page * itemsPerPage);
  };

  const filteredCases = data.filter(row => {
    const 등급 = parseFloat(row["내등급(환산)"]); const g = filter.등급;
    const 등급조건 = g === "전체" || getGradeRange(등급) === g;
    return (filter.지역 === "전체" || row["지역"] === filter.지역) &&
      (filter.전형 === "전체" || row["전형"] === filter.전형) &&
      (filter.대학명 === "전체" || row["대학명"] === filter.대학명) && 등급조건;
  });

  const ChartBlock = ({ title, data }) => {
    const avgRate = data.length > 0 ? (data.reduce((sum, d) => sum + d.합격률, 0) / data.length).toFixed(1) : 0;
    return (
      <div className="mb-12">
        <h3 className="text-lg font-semibold text-gray-700 mb-1">{title} <span className="text-sm text-gray-500 ml-2">(평균 합격률: {avgRate}%)</span></h3>
        <ResponsiveContainer width="100%" height={300}>
          {chartStyle === "bar" ? (
            <BarChart data={data} layout="vertical" barCategoryGap={20}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" />
              <Tooltip />
              <Legend />
              <Bar dataKey="합격" fill="#4ade80" name="합격" />
              <Bar dataKey="불합격" fill="#f87171" name="불합격" />
              <Line type="monotone" dataKey="합격률" stroke="#6366f1" name="합격률(%)" />
            </BarChart>
          ) : (
            <PieChart>
              <Pie data={data} dataKey="합격률" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 font-sans bg-gradient-to-tr from-indigo-100 via-white to-pink-100 min-h-screen">
      <div {...getRootProps({ className: "dropzone mb-6 border-2 border-dashed border-gray-400 rounded-md p-6 text-center cursor-pointer bg-white shadow" })}>
        <input {...getInputProps()} />
        <p className="text-gray-600">엑셀 파일을 여기로 끌어다 놓거나 클릭해서 업로드하세요</p>
      </div>
      {data.length > 0 && (
        <>
          <ChartBlock title="지역별 합격 통계" data={getCategoryStats("지역")} />
          <ChartBlock title="전형별 합격 통계" data={getCategoryStats("전형")} />
          <ChartBlock title="등급대별 합격 통계" data={getCategoryStats("내등급(환산)")} />
          <ChartBlock title="대학명별 합격 통계" data={getCategoryStats("대학명")} />
        </>
      )}
    </div>
  );
}
