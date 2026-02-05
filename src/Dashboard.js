import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";

export default function Dashboard() {
  const [message, setMessage] = useState("엑셀 파일을 여기에 끌어다 놓거나 클릭해서 업로드하세요");

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    onDrop: acceptedFiles => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const workbook = XLSX.read(e.target.result, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        setMessage(`총 ${jsonData.length}개 행이 업로드되었습니다.`);
      };
      reader.readAsBinaryString(acceptedFiles[0]);
    }
  });

  return (
    <div style={{ padding: "3rem", textAlign: "center" }}>
      <h2>수시진학파일 분석기</h2>
      <div {...getRootProps()} style={{ border: "2px dashed gray", padding: "2rem", cursor: "pointer" }}>
        <input {...getInputProps()} />
        <p>{message}</p>
      </div>
    </div>
  );
}
