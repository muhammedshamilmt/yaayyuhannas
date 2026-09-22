'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Result, Candidate, Programme } from '@/types';

export default function TeamResultsPage() {
  const searchParams = useSearchParams();
  const teamCode = searchParams.get('team') || 'SMD';
  
  const [results, setResults] = useState<Result[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [teamCode]);

  const fetchData = async () => {
    try {
      const [resultsRes, candidatesRes, programmesRes] = await Promise.all([
        fetch('/api/results'),
        fetch(`/api/candidates?team=${teamCode}`),
        fetch('/api/programmes')
      ]);

      const [resultsData, candidatesData, programmesData] = await Promise.all([
        resultsRes.json(),
        candidatesRes.json(),
        programmesRes.json()
      ]);

      setResults(resultsData);
      setCandidates(candidatesData);
      setProgrammes(programmesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter results that include team members
  const teamResults = results.filter(result => {
    const teamChestNumbers = candidates.map(c => c.chestNumber);
    const allWinners = [
      ...result.firstPlace.map(w => w.chestNumber),
      ...result.secondPlace.map(w => w.chestNumber),
      ...result.thirdPlace.map(w => w.chestNumber)
    ];
    return allWinners.some(chestNumber => teamChestNumbers.includes(chestNumber));
  });

  // Calculate statistics
  const totalResults = teamResults.length;
  const firstPlaces = teamResults.filter(result => 
    result.firstPlace.some(w => candidates.some(c => c.chestNumber === w.chestNumber))
  ).length;
  const secondPlaces = teamResults.filter(result => 
    result.secondPlace.some(w => candidates.some(c => c.chestNumber === w.chestNumber))
  ).length;
  const thirdPlaces = teamResults.filter(result => 
    result.thirdPlace.some(w => candidates.some(c => c.chestNumber === w.chestNumber))
  ).length;

  const totalPoints = teamResults.reduce((sum, result) => {
    let points = 0;
    if (result.firstPlace.some(w => candidates.some(c => c.chestNumber === w.chestNumber))) {
      points += result.firstPoints;
    }
    if (result.secondPlace.some(w => candidates.some(c => c.chestNumber === w.chestNumber))) {
      points += result.secondPoints;
    }
    if (result.thirdPlace.some(w => candidates.some(c => c.chestNumber === w.chestNumber))) {
      points += result.thirdPoints;
    }
    return sum + points;
  }, 0);

  const getPositionBadge = (position: 'first' | 'second' | 'third') => {
    const badges = {
      first: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      second: 'bg-gray-100 text-gray-800 border-gray-200',
      third: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    const icons = {
      first: '🥇',
      second: '🥈', 
      third: '🥉'
    };
    return { class: badges[position], icon: icons[position] };
  };

  const getProgrammeName = (programmeCode: string) => {
    const programme = programmes.find(p => p.code === programmeCode);
    return programme ? programme.name : programmeCode;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Results</h1>
          <p className="text-gray-600">View your team's performance and achievements</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{totalResults}</div>
          <div className="text-sm text-gray-500">Total Results</div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <span className="text-2xl">🥇</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{firstPlaces}</h3>
              <p className="text-sm text-gray-600">First Places</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-gray-100 text-gray-600">
              <span className="text-2xl">🥈</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{secondPlaces}</h3>
              <p className="text-sm text-gray-600">Second Places</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600">
              <span className="text-2xl">🥉</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{thirdPlaces}</h3>
              <p className="text-sm text-gray-600">Third Places</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <span className="text-2xl">🏆</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{totalPoints}</h3>
              <p className="text-sm text-gray-600">Total Points</p>
            </div>
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Competition Results</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {teamResults.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🏅</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Results Yet</h3>
              <p className="text-gray-500">Results will appear here once competitions are completed.</p>
            </div>
          ) : (
            teamResults.map((result) => {
              const teamFirstPlace = result.firstPlace.filter(w => 
                candidates.some(c => c.chestNumber === w.chestNumber)
              );
              const teamSecondPlace = result.secondPlace.filter(w => 
                candidates.some(c => c.chestNumber === w.chestNumber)
              );
              const teamThirdPlace = result.thirdPlace.filter(w => 
                candidates.some(c => c.chestNumber === w.chestNumber)
              );

              return (
                <div key={result._id?.toString()} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {getProgrammeName(result.programme)}
                      </h3>
                      <p className="text-sm text-gray-600 capitalize">
                        {result.section} • {result.positionType}
                      </p>
                    </div>
                    <span className="text-sm bg-gray-100 px-3 py-1 rounded-full font-mono">
                      {result.programme}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {teamFirstPlace.length > 0 && (
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPositionBadge('first').class}`}>
                          {getPositionBadge('first').icon} 1st Place
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {teamFirstPlace.map((winner, index) => {
                            const candidate = candidates.find(c => c.chestNumber === winner.chestNumber);
                            return (
                              <span key={index} className="text-sm bg-yellow-50 px-2 py-1 rounded border border-yellow-200">
                                {winner.chestNumber} - {candidate?.name}
                              </span>
                            );
                          })}
                        </div>
                        <span className="text-sm font-semibold text-green-600">
                          +{result.firstPoints} points
                        </span>
                      </div>
                    )}

                    {teamSecondPlace.length > 0 && (
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPositionBadge('second').class}`}>
                          {getPositionBadge('second').icon} 2nd Place
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {teamSecondPlace.map((winner, index) => {
                            const candidate = candidates.find(c => c.chestNumber === winner.chestNumber);
                            return (
                              <span key={index} className="text-sm bg-gray-50 px-2 py-1 rounded border border-gray-200">
                                {winner.chestNumber} - {candidate?.name}
                              </span>
                            );
                          })}
                        </div>
                        <span className="text-sm font-semibold text-green-600">
                          +{result.secondPoints} points
                        </span>
                      </div>
                    )}

                    {teamThirdPlace.length > 0 && (
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPositionBadge('third').class}`}>
                          {getPositionBadge('third').icon} 3rd Place
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {teamThirdPlace.map((winner, index) => {
                            const candidate = candidates.find(c => c.chestNumber === winner.chestNumber);
                            return (
                              <span key={index} className="text-sm bg-orange-50 px-2 py-1 rounded border border-orange-200">
                                {winner.chestNumber} - {candidate?.name}
                              </span>
                            );
                          })}
                        </div>
                        <span className="text-sm font-semibold text-green-600">
                          +{result.thirdPoints} points
                        </span>
                      </div>
                    )}
                  </div>

                  {result.notes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{result.notes}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}