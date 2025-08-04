import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';

function DisciplineAnalysisDashboard() {
  const [data, setData] = useState(null);
  const [selectedView, setSelectedView] = useState('overview');

  useEffect(() => {
    async function loadData() {
      try {
        const fileContent = await window.fs.readFile('Updated_DESEMA_Discipline_Calculations.csv', { encoding: 'utf8' });
        const parsed = Papa.parse(fileContent, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true
        });
        setData(parsed.data);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    }
    loadData();
  }, []);

  if (!data) return <div className="p-8 text-center">Loading data...</div>;

  // Define groups
  const programStatusGroups = ["English Learner", "Low income", "Low Income", "Students w/disabilities", "High needs"];
  const genderGroups = ["Male", "Female"];
  const raceEthnicityGroups = ["Amer. Ind. or Alaska Nat.", "Asian", "Afr. Amer./Black", "Hispanic/Latino", 
                                "Multi-race, Non-Hisp./Lat.", "Nat. Haw. or Pacif. Isl.", "White"];

  // Process data for visualizations
  const latestYearData = data.filter(d => d.Year === "2023-24");
  
  // Separate data by group categories
  const programStatusData = latestYearData
    .filter(d => programStatusGroups.includes(d['Student Group']))
    .map(d => ({
      group: d['Student Group'] === "Low Income" ? "Low income" : d['Student Group'], // Normalize naming
      percent: d[' Percent of Students Disciplined']
    }))
    .filter((d, index, self) => self.findIndex(item => item.group === d.group) === index) // Remove duplicates
    .sort((a, b) => b.percent - a.percent);

  const genderData = latestYearData
    .filter(d => genderGroups.includes(d['Student Group']))
    .map(d => ({
      group: d['Student Group'],
      percent: d[' Percent of Students Disciplined']
    }))
    .sort((a, b) => b.percent - a.percent);

  const raceEthnicityData = latestYearData
    .filter(d => raceEthnicityGroups.includes(d['Student Group']))
    .map(d => ({
      group: d['Student Group'],
      percent: d[' Percent of Students Disciplined']
    }))
    .sort((a, b) => b.percent - a.percent);

  const allStudentsData = latestYearData.find(d => d['Student Group'] === "All Students");
  const allStudentsBaseline = allStudentsData ? allStudentsData[' Percent of Students Disciplined'] : 0;

  // Trend data processing
  const trendData = {};
  const yearOrder = ["2021-22", "2022-23", "2023-24"];
  
  data.forEach(row => {
    const group = row['Student Group'];
    if (!trendData[group]) trendData[group] = [];
    trendData[group].push({
      year: row.Year,
      percent: row[' Percent of Students Disciplined']
    });
  });

  // Format trend data for selected groups from each category
  const trendGroups = {
    "Program/Status": ["Students w/disabilities", "English Learner", "High needs"],
    "Gender": ["Male", "Female"],
    "Race/Ethnicity": ["Afr. Amer./Black", "Hispanic/Latino", "White", "Asian"]
  };

  const formattedTrendData = yearOrder.map(year => {
    const yearData = { year: year.replace("-", "-\n") };
    Object.values(trendGroups).flat().forEach(group => {
      const groupData = trendData[group] || trendData["Low income"]; // Handle Low income/Low Income variation
      if (groupData) {
        const dataPoint = groupData.find(d => d.year === year);
        if (dataPoint) {
          yearData[group] = dataPoint.percent;
        }
      }
    });
    // Add All Students baseline
    const allStudentsTrend = trendData["All Students"];
    if (allStudentsTrend) {
      const dataPoint = allStudentsTrend.find(d => d.year === year);
      if (dataPoint) {
        yearData["All Students"] = dataPoint.percent;
      }
    }
    return yearData;
  });

  // Calculate disparities for all groups
  const calculateDisparities = (groupData) => {
    return groupData.map(d => ({
      group: d.group,
      percent: d.percent,
      disparity: d.percent - allStudentsBaseline
    }));
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-2">Student Discipline Data Analysis</h1>
      <p className="text-gray-600 mb-6">Analysis of discipline percentages across student groups and years</p>
      
      <div className="mb-6 flex gap-4">
        <button
          onClick={() => setSelectedView('overview')}
          className={`px-4 py-2 rounded ${selectedView === 'overview' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 border'}`}
        >
          Overview by Category
        </button>
        <button
          onClick={() => setSelectedView('trends')}
          className={`px-4 py-2 rounded ${selectedView === 'trends' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 border'}`}
        >
          Trends Over Time
        </button>
        <button
          onClick={() => setSelectedView('disparities')}
          className={`px-4 py-2 rounded ${selectedView === 'disparities' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 border'}`}
        >
          Disparities Analysis
        </button>
      </div>

      {selectedView === 'overview' && (
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm font-semibold">All Students Baseline (2023-24): {allStudentsBaseline.toFixed(2)}%</p>
          </div>

          {/* Program/Status Groups */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Program/Status Groups</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={programStatusData} margin={{ top: 20, right: 30, left: 50, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="group" 
                  angle={-20} 
                  textAnchor="end" 
                  height={60}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  label={{ value: 'Percent Disciplined', angle: -90, position: 'insideLeft' }}
                  domain={[0, 7]}
                />
                <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
                <Bar 
                  dataKey="percent" 
                  fill="#3B82F6"
                  label={{ position: 'top', fontSize: 11, formatter: (value) => `${value.toFixed(1)}%` }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gender Groups */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Gender Groups</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={genderData} margin={{ top: 20, right: 30, left: 50, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="group" />
                <YAxis 
                  label={{ value: 'Percent Disciplined', angle: -90, position: 'insideLeft' }}
                  domain={[0, 5]}
                />
                <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
                <Bar 
                  dataKey="percent" 
                  fill="#10B981"
                  label={{ position: 'top', fontSize: 11, formatter: (value) => `${value.toFixed(1)}%` }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Race/Ethnicity Groups */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Race/Ethnicity Groups</h2>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={raceEthnicityData} margin={{ top: 20, right: 30, left: 50, bottom: 100 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="group" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  tick={{ fontSize: 11 }}
                />
                <YAxis 
                  label={{ value: 'Percent Disciplined', angle: -90, position: 'insideLeft' }}
                  domain={[0, 7]}
                />
                <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
                <Bar 
                  dataKey="percent" 
                  fill="#F59E0B"
                  label={{ position: 'top', fontSize: 11, formatter: (value) => `${value.toFixed(1)}%` }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {selectedView === 'trends' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Discipline Rate Trends by Category (2021-22 to 2023-24)</h2>
          <ResponsiveContainer width="100%" height={500}>
            <LineChart data={formattedTrendData} margin={{ top: 20, right: 30, left: 50, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis 
                label={{ value: 'Percent Disciplined', angle: -90, position: 'insideLeft' }}
                domain={[0, 8]}
              />
              <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
              <Legend />
              {/* All Students baseline */}
              <Line type="monotone" dataKey="All Students" stroke="#000000" strokeWidth={3} strokeDasharray="5 5" />
              {/* Program/Status lines */}
              <Line type="monotone" dataKey="Students w/disabilities" stroke="#3B82F6" strokeWidth={2} />
              <Line type="monotone" dataKey="English Learner" stroke="#60A5FA" strokeWidth={2} />
              <Line type="monotone" dataKey="High needs" stroke="#1D4ED8" strokeWidth={2} />
              {/* Gender lines */}
              <Line type="monotone" dataKey="Male" stroke="#10B981" strokeWidth={2} />
              <Line type="monotone" dataKey="Female" stroke="#34D399" strokeWidth={2} />
              {/* Race/Ethnicity lines */}
              <Line type="monotone" dataKey="Afr. Amer./Black" stroke="#DC2626" strokeWidth={2} />
              <Line type="monotone" dataKey="Hispanic/Latino" stroke="#F59E0B" strokeWidth={2} />
              <Line type="monotone" dataKey="White" stroke="#8B5CF6" strokeWidth={2} />
              <Line type="monotone" dataKey="Asian" stroke="#EC4899" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 text-sm text-gray-600">
            <p><strong>Note:</strong> The dashed black line represents the "All Students" baseline for comparison.</p>
          </div>
        </div>
      )}

      {selectedView === 'disparities' && (
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm font-semibold">All Students Baseline (2023-24): {allStudentsBaseline.toFixed(2)}%</p>
            <p className="text-xs text-gray-600 mt-1">Positive values indicate higher discipline rates than average</p>
          </div>

          {/* Program/Status Disparities */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Program/Status Group Disparities</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={calculateDisparities(programStatusData)} margin={{ top: 20, right: 30, left: 50, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="group" 
                  angle={-20} 
                  textAnchor="end" 
                  height={60}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  label={{ value: 'Percentage Point Difference', angle: -90, position: 'insideLeft' }}
                  domain={[-1, 3]}
                />
                <Tooltip formatter={(value) => `${value > 0 ? '+' : ''}${value.toFixed(2)} pp`} />
                <Bar 
                  dataKey="disparity" 
                  fill={(entry) => entry.disparity > 0 ? '#DC2626' : '#10B981'}
                  label={{ position: 'top', fontSize: 10, formatter: (value) => `${value > 0 ? '+' : ''}${value.toFixed(1)}` }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gender Disparities */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Gender Group Disparities</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={calculateDisparities(genderData)} margin={{ top: 20, right: 30, left: 50, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="group" />
                <YAxis 
                  label={{ value: 'Percentage Point Difference', angle: -90, position: 'insideLeft' }}
                  domain={[-1.5, 1.5]}
                />
                <Tooltip formatter={(value) => `${value > 0 ? '+' : ''}${value.toFixed(2)} pp`} />
                <Bar 
                  dataKey="disparity" 
                  fill={(entry) => entry.disparity > 0 ? '#DC2626' : '#10B981'}
                  label={{ position: 'top', fontSize: 10, formatter: (value) => `${value > 0 ? '+' : ''}${value.toFixed(1)}` }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Race/Ethnicity Disparities */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Race/Ethnicity Group Disparities</h2>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={calculateDisparities(raceEthnicityData)} margin={{ top: 20, right: 30, left: 50, bottom: 100 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="group" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  tick={{ fontSize: 11 }}
                />
                <YAxis 
                  label={{ value: 'Percentage Point Difference', angle: -90, position: 'insideLeft' }}
                  domain={[-3, 3]}
                />
                <Tooltip formatter={(value) => `${value > 0 ? '+' : ''}${value.toFixed(2)} pp`} />
                <Bar 
                  dataKey="disparity" 
                  fill={(entry) => entry.disparity > 0 ? '#DC2626' : '#10B981'}
                  label={{ position: 'top', fontSize: 10, formatter: (value) => `${value > 0 ? '+' : ''}${value.toFixed(1)}` }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Summary of Key Findings by Category</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg text-blue-600">Program/Status Groups</h3>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Students with disabilities have the highest discipline rate at 6.19% (+2.74 pp above average)</li>
              <li>Low income students: 5.63% (+2.19 pp)</li>
              <li>High needs students: 5.02% (+1.57 pp)</li>
              <li>English Learners: 3.73% (+0.28 pp)</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg text-green-600">Gender Groups</h3>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Male students: 4.44% (+0.99 pp above average)</li>
              <li>Female students: 2.43% (-1.02 pp below average)</li>
              <li>Gender ratio: Males disciplined at 1.8x the rate of females</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg text-yellow-600">Race/Ethnicity Groups</h3>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Highest rates: African American/Black (6.14%, +2.69 pp) and Hispanic/Latino (5.19%, +1.75 pp)</li>
              <li>Moderate rates: American Indian/Alaska Native (4.65%, +1.20 pp), Multi-race (3.87%, +0.42 pp)</li>
              <li>Lowest rates: White (2.39%, -1.06 pp) and Asian (0.85%, -2.60 pp)</li>
              <li>Largest disparity: 7.2x difference between highest (African American/Black) and lowest (Asian) groups</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DisciplineAnalysisDashboard;