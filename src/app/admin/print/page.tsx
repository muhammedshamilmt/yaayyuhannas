"use client";

import { useState, useEffect } from 'react';
import { Programme, ProgrammeParticipant, Candidate } from '@/types';

export default function AdminPrintPage() {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [participants, setParticipants] = useState<ProgrammeParticipant[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedProgramme, setSelectedProgramme] = useState<Programme | null>(null);
  const [evaluatorName, setEvaluatorName] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [programmesRes, participantsRes, candidatesRes] = await Promise.all([
        fetch('/api/programmes'),
        fetch('/api/programme-participants'),
        fetch('/api/candidates')
      ]);

      const [programmesData, participantsData, candidatesData] = await Promise.all([
        programmesRes.json(),
        participantsRes.json(),
        candidatesRes.json()
      ]);

      setProgrammes(programmesData || []);
      setParticipants(participantsData || []);
      setCandidates(candidatesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgrammeParticipants = (programmeId: string) => {
    return participants.filter(p => p.programmeId === programmeId);
  };

  const getParticipantChestNumbers = (programmeId: string) => {
    const programmeParticipants = getProgrammeParticipants(programmeId);
    const chestNumbers: string[] = [];

    programmeParticipants.forEach(participant => {
      participant.participants.forEach(p => {
        if (typeof p === 'string') {
          chestNumbers.push(p);
        } else if (p.candidateId) {
          const candidate = candidates.find(c => c._id?.toString() === p.candidateId);
          if (candidate) {
            chestNumbers.push(candidate.chestNumber);
          }
        }
      });
    });

    return chestNumbers.sort();
  };

  const handleGenerateScorecard = () => {
    if (!selectedProgramme) {
      alert('Please select a programme');
      return;
    }
    setShowPreview(true);
  };

  const handlePrint = () => {
    if (!selectedProgramme) {
      alert('Please select a programme');
      return;
    }

    const chestNumbers = getParticipantChestNumbers(selectedProgramme._id?.toString() || '');
    const params = new URLSearchParams({
      evaluator: evaluatorName || '',
      code: selectedProgramme.code,
      name: selectedProgramme.name,
      participants: chestNumbers.join(',')
    });

    // Open print page in new window
    const printWindow = window.open(`/admin/print/scorecard?${params.toString()}`, '_blank');
    if (printWindow) {
      printWindow.focus();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading programmes...</p>
        </div>
      </div>
    );
  }

  const chestNumbers = selectedProgramme ? getParticipantChestNumbers(selectedProgramme._id?.toString() || '') : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Print & Judgment Center</h1>
          <p className="text-gray-600">Generate printable scorecards and documents for programme evaluation</p>
        </div>
      </div>

      {!showPreview ? (
        // Configuration Form
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">📋 Judgment Scorecard Generator</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                👨‍⚖️ Name of Evaluator (Optional)
              </label>
              <input
                type="text"
                value={evaluatorName}
                onChange={(e) => setEvaluatorName(e.target.value)}
                placeholder="Enter evaluator's name (optional)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🎭 Select Programme *
              </label>
              <select
                value={selectedProgramme?._id?.toString() || ''}
                onChange={(e) => {
                  const programme = programmes.find(p => p._id?.toString() === e.target.value);
                  setSelectedProgramme(programme || null);
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              >
                <option value="">Choose a programme...</option>
                {programmes.map((programme) => (
                  <option key={programme._id?.toString()} value={programme._id?.toString()}>
                    {programme.name} ({programme.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedProgramme && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-3">📊 Programme Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-800">Name:</span>
                  <p className="text-blue-700">{selectedProgramme.name}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Code:</span>
                  <p className="text-blue-700">{selectedProgramme.code}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Category:</span>
                  <p className="text-blue-700 capitalize">{selectedProgramme.category}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Section:</span>
                  <p className="text-blue-700 capitalize">{selectedProgramme.section}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Participants:</span>
                  <p className="text-blue-700">{chestNumbers.length} registered</p>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Type:</span>
                  <p className="text-blue-700 capitalize">{selectedProgramme.positionType}</p>
                </div>
              </div>

              {chestNumbers.length > 0 && (
                <div className="mt-4">
                  <span className="font-medium text-blue-800">Chest Numbers:</span>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {chestNumbers.map((chestNumber, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono">
                        {chestNumber}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 flex justify-end space-x-4">
            <button
              onClick={handleGenerateScorecard}
              disabled={!selectedProgramme}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              � Previewt Scorecard
            </button>
            <button
              onClick={handlePrint}
              disabled={!selectedProgramme}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              🖨️ Open Print Page
            </button>
          </div>
        </div>
      ) : (
        // Preview and Print Controls
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4 flex justify-between items-center no-print">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">📄 Scorecard Preview</h2>
              <p className="text-gray-600">Review and print the judgment scorecard</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                ← Back to Edit
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                🖨️ Print Scorecard
              </button>
            </div>
          </div>

          {/* Improved Scorecard HTML */}
          <div className="scorecard">
            <header className="header">
              <div className="header-title">
                <h1>wattaqa Arts fest 2025</h1>
                <p>scorecard</p>
              </div>
              <div className="logo-section" aria-hidden="true">
                <div className="logo"></div>
                <p><strong>wattaqa</strong><br />Arts fest 2025</p>
              </div>
            </header>

            <section className="info-section" role="region" aria-label="Evaluator and Program">
              <div className="info-row p-2">
                <div className="label">Name of Evaluator</div>
                <div className="input">{evaluatorName}</div>
              </div>
              <div className="info-row">
                <div className="label">Program code</div>
                <div className="input">{selectedProgramme?.code}</div>
              </div>
              <div className="info-row">
                <div className="label">Name of Program</div>
                <div className="input">{selectedProgramme?.name}</div>
              </div>
            </section>

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
                  {Array.from({ length: 15 }, (_, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{chestNumbers[index] || ''}</td>
                      <td></td>
                      <td></td>
                      <td></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        /* ---------- RESET ---------- */
        .scorecard * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: "Poppins", sans-serif;
        }

        /* page background - only for screen */
        @media screen {
          body {
            background: #f6f6f6;
            display: flex;
            justify-content: center;
            padding: 18px;
          }
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
          background: #000;
          border-radius: 6px;
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
          padding: 12px 16px;
          font-weight: 700;
          border-right: 1px solid #000;
          display: flex;
          align-items: center;
        }

        .input {
          flex: 1;
          padding: 12px 16px;
          min-height: 48px;
          display: flex;
          align-items: center;
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
          padding: 14px 12px;
          text-align: center;
        }

        tbody td {
          padding: 10px 12px;
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

        /* Hide elements during print */
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }

          .scorecard {
            width: 210mm !important;
            max-width: 210mm !important;
            height: auto !important;
            box-shadow: none !important;
            border: 1px solid #000 !important;
            page-break-after: always;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }

          .header {
            background: #000 !important;
            color: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            padding: 18px 22px !important;
            gap: 12px !important;
          }

          .header-title h1 {
            font-size: 1.4rem !important;
            font-weight: 700 !important;
            line-height: 1 !important;
            margin-bottom: 6px !important;
          }

          .header-title p {
            font-size: 1.05rem !important;
            font-weight: 600 !important;
            margin-top: 6px !important;
          }

          .logo-section {
            background: #fff !important;
            color: #000 !important;
            padding: 8px 14px !important;
            border: 1px solid #000 !important;
            border-radius: 4px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .logo {
            width: 40px !important;
            height: 40px !important;
            background: #000 !important;
            border-radius: 6px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .info-section {
            border-left: 1px solid #000 !important;
            border-right: 1px solid #000 !important;
            border-bottom: 1px solid #000 !important;
          }

          .info-row {
            border-top: 1px solid #000 !important;
            min-height: 48px !important;
          }

          .info-row:first-child {
            border-top: none !important;
          }

          .label {
            flex: 0 0 38% !important;
            padding: 12px 16px !important;
            font-weight: 700 !important;
            border-right: 1px solid #000 !important;
            display: flex !important;
            align-items: center !important;
          }

          .input {
            flex: 1 !important;
            padding: 12px 16px !important;
            min-height: 48px !important;
            display: flex !important;
            align-items: center !important;
          }

          .table-wrapper {
            width: 100% !important;
            overflow: hidden !important;
          }

          table {
            width: 100% !important;
            border-collapse: collapse !important;
            table-layout: fixed !important;
            border-top: 1px solid #000 !important;
            border-left: 1px solid #000 !important;
          }

          thead th, tbody td {
            border-right: 1px solid #000 !important;
            border-bottom: 1px solid #000 !important;
          }

          thead th {
            background: #000 !important;
            color: #fff !important;
            font-weight: 800 !important;
            padding: 14px 12px !important;
            text-align: center !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          tbody td {
            padding: 10px 12px !important;
            text-align: center !important;
            vertical-align: middle !important;
            height: 55px !important;
          }

          table th:first-child, table td:first-child {
            width: 6% !important;
          }
        }
      `}</style>
    </div>
  );
}