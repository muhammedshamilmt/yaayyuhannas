"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ScorecardPrintPage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState({
    evaluatorName: '',
    programCode: '',
    programName: '',
    chestNumbers: [] as string[]
  });

  useEffect(() => {
    // Get data from URL parameters
    const evaluatorName = searchParams.get('evaluator') || '';
    const programCode = searchParams.get('code') || '';
    const programName = searchParams.get('name') || '';
    const chestNumbers = searchParams.get('participants')?.split(',') || [];

    setData({
      evaluatorName,
      programCode,
      programName,
      chestNumbers
    });

    // Auto-print when page loads
    setTimeout(() => {
      window.print();
    }, 500);
  }, [searchParams]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>wattaqa Arts fest 2025 - Scorecard</title>
        <style>{`
          /* ---------- RESET ---------- */
          * { 
            box-sizing: border-box; 
            margin: 0; 
            padding: 0; 
            font-family: "Poppins", sans-serif; 
          }

          /* page background */
          body {
            background: #f6f6f6;
            display: flex;
            justify-content: center;
            padding: 18px;
          }

          /* main card constrained for responsive + print */
          .scorecard {
            width: 100%;
            max-width: 850px;
            background: #fff;
            border: 1px solid #000;
            display: flex;
            flex-direction: column;
            box-shadow: 0 6px 18px rgba(0,0,0,0.06);
            overflow: hidden; /* prevent table from pushing outside */
          }

          /* ---------- HEADER ---------- */
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #000;
            color: #fff;
            padding: 18px 22px;
            gap: 12px;
          }

          .header-title h1 { 
            font-size: 1.4rem; 
            font-weight: 700; 
            line-height: 1; 
          }

          .header-title p { 
            font-size: 1.05rem; 
            font-weight: 600; 
            margin-top: 6px; 
          }

          .logo-section {
            display: flex;
            align-items: center;
            gap: 10px;
            background: #fff;
            color: #000;
            padding: 8px 14px;
            border: 1px solid #000;
            border-radius: 4px;
          }

          .logo { 
            width: 40px; 
            height: 40px; 
            background: #fff; 
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }

          /* ---------- INFO ---------- */
          .info-section {
            border-left: 1px solid #000;
            border-right: 1px solid #000;
            border-bottom: 1px solid #000;
            display: flex;
            flex-direction: column;
          }

          .info-row {
            display: flex;
            border-top: 1px solid #000;
            min-height: 48px;
            align-items: center;
          }

          .info-row:first-child { 
            border-top: none; 
          }

          .label {
            flex: 0 0 38%;
            padding: 12px;
            font-weight: 700;
            border-right: 1px solid #000;
          }

          .input {
            flex: 1;
            padding: 10px;
            min-height: 48px;
          }

          /* ---------- TABLE ---------- */
          .table-wrapper { 
            width: 100%; 
            overflow: hidden; 
          }

          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            border-top: 1px solid #000;
            border-left: 1px solid #000;
          }

          thead th, tbody td { 
            border-right: 1px solid #000; 
            border-bottom: 1px solid #000; 
          }

          thead th {
            background: #000;
            color: #fff;
            font-weight: 800;
            padding: 12px 8px;
            text-align: center;
          }

          tbody td {
            padding: 8px;
            text-align: center;
            vertical-align: middle;
            height: 62px; /* tuned height so 15 rows fit well */
          }

          /* make SL column narrower */
          table th:first-child, table td:first-child {
            width: 6%;
          }

          /* ---------- RESPONSIVE ---------- */
          @media (max-width: 700px) {
            .scorecard { 
              max-width: 100%; 
            }

            .header { 
              flex-direction: column; 
              align-items: center; 
              text-align: center; 
              padding: 14px; 
            }

            .logo-section { 
              width: 100%; 
              justify-content: center; 
            }

            .label { 
              flex-basis: 100%; 
              border-right: none; 
              border-bottom: 1px solid #000; 
            }

            .input { 
              flex-basis: 100%; 
            }

            thead th, tbody td { 
              padding: 8px; 
              font-size: 0.95rem; 
            }

            tbody td { 
              height: 56px; 
            }
          }

          /* ---------- PRINT (A4) ---------- */
          @media print {
            body { 
              margin: 0; 
              padding: 0; 
              background: #fff; 
            }

            .scorecard {
              width: 210mm;
              height: 297mm;
              box-shadow: none;
              border: none;
              page-break-after: always;
            }

            thead th { 
              -webkit-print-color-adjust: exact; 
            }

            .logo {
              background: #fff !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .logo img {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            tbody td { 
              height: 55px; /* keep rows uniform when printing */ 
            }
          }
        `}</style>
      </head>
      <body>
        <div className="scorecard">
          {/* HEADER */}
          <header className="header">
            <div className="header-title">
              <h1>wattaqa Arts fest 2025</h1>
              <p>scorecard</p>
            </div>
            <div className="logo-section" aria-hidden="true">
              <div className="logo">
                <img src="/images/festival-logo.png" alt="Festival Logo" style={{width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px'}} />
              </div>
              <p><strong>wattaqa</strong><br/>Arts fest 2025</p>
            </div>
          </header>

          {/* INFO */}
          <section className="info-section" role="region" aria-label="Evaluator and Program">
            <div className="info-row">
              <div className="label">Name of Evaluator</div>
              <div className="input">{data.evaluatorName}</div>
            </div>
            <div className="info-row">
              <div className="label">Program code</div>
              <div className="input">{data.programCode}</div>
            </div>
            <div className="info-row">
              <div className="label">Name of Program</div>
              <div className="input">{data.programName}</div>
            </div>
          </section>

          {/* TABLE */}
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>SL</th>
                  <th>Chess No</th>
                  <th>Code Letter</th>
                  <th>Score</th>
                  <th>Remarks/Grades</th>
                </tr>
              </thead>
              <tbody>
                {/* EXACT 15 ROWS */}
                {Array.from({ length: 15 }, (_, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{data.chestNumbers[index] || ''}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </body>
    </html>
  );
}