import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import * as XLSX from 'xlsx';

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedFactor, setSelectedFactor] = useState('fuel'); // 가격 영향 요인 선택

  const parsePrice = (priceStr) => {
    if (!priceStr) return 0;
    const cleanPrice = priceStr.replace(/[만원,]/g, '');
    return parseInt(cleanPrice) || 0;
  };

  const parseMileage = (mileageStr) => {
    if (!mileageStr) return 0;
    const cleanMileage = mileageStr.replace(/[,km]/g, '');
    return parseInt(cleanMileage) || 0;
  };

  const parseYear = (yearStr) => {
    if (!yearStr) return 0;
    const match = yearStr.match(/(\d{2})/);
    return match ? 2000 + parseInt(match[1]) : 0;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const allData = [];

        try {
          const encarFile = await window.fs.readFile('엔카_더 뉴 아반떼.xlsx');
          const encarWorkbook = XLSX.read(encarFile);
          const encarSheet = encarWorkbook.Sheets[encarWorkbook.SheetNames[0]];
          const encarData = XLSX.utils.sheet_to_json(encarSheet);
          
          encarData.forEach(item => {
            allData.push({
              platform: '엔카',
              model: item['모델'],
              displacement: item['배기량'],
              grade: item['등급'],
              year: parseYear(item['연식']),
              yearStr: item['연식'],
              mileage: parseMileage(item['주행거리']),
              mileageStr: item['주행거리'],
              fuel: item['연료'],
              region: item['지역'],
              price: parsePrice(item['판매가']),
              priceStr: item['판매가'],
              owner: item['이전 소유주']
            });
          });
        } catch (e) {
          console.error('엔카 데이터 로드 실패:', e);
        }

        try {
          const kcarFile = await window.fs.readFile('케이카_더 뉴 아반떼.xlsx');
          const kcarWorkbook = XLSX.read(kcarFile);
          const kcarSheet = kcarWorkbook.Sheets[kcarWorkbook.SheetNames[0]];
          const kcarData = XLSX.utils.sheet_to_json(kcarSheet);
          
          kcarData.forEach(item => {
            allData.push({
              platform: '케이카',
              model: item['모델'],
              displacement: item['배기량'],
              grade: item['등급'],
              year: parseYear(item['연식']),
              yearStr: item['연식'],
              mileage: parseMileage(item['주행거리']),
              mileageStr: item['주행거리'],
              fuel: item['연료'],
              region: item['지역'],
              price: parsePrice(item['판매가']),
              priceStr: item['판매가'],
              owner: null
            });
          });
        } catch (e) {
          console.error('케이카 데이터 로드 실패:', e);
        }

        try {
          const kbFile = await window.fs.readFile('KB차차차_더 뉴 아반떼.xlsx');
          const kbWorkbook = XLSX.read(kbFile);
          const kbSheet = kbWorkbook.Sheets[kbWorkbook.SheetNames[0]];
          const kbData = XLSX.utils.sheet_to_json(kbSheet);
          
          kbData.forEach(item => {
            allData.push({
              platform: 'KB차차차',
              model: item['모델'],
              displacement: item['배기량'],
              grade: item['등급'],
              year: parseYear(item['연식']),
              yearStr: item['연식'],
              mileage: parseMileage(item['주행거리']),
              mileageStr: item['주행거리'],
              fuel: item['연료'],
              region: item['지역'],
              price: parsePrice(item['판매가']),
              priceStr: item['판매가'],
              owner: null
            });
          });
        } catch (e) {
          console.error('KB차차차 데이터 로드 실패:', e);
        }

        const validData = allData.filter(item => item.price > 0 && item.year > 0);
        setData(validData);

        const calculateStats = (data) => {
          const prices = data.map(d => d.price).filter(p => p > 0);
          const platformCounts = {};
          const fuelCounts = {};
          const yearCounts = {};
          const gradeCounts = {};
          const regionCounts = {};

          data.forEach(item => {
            platformCounts[item.platform] = (platformCounts[item.platform] || 0) + 1;
            if (item.fuel) fuelCounts[item.fuel] = (fuelCounts[item.fuel] || 0) + 1;
            if (item.year && item.year > 2000 && item.year < 2030) yearCounts[item.year] = (yearCounts[item.year] || 0) + 1;
            if (item.grade) gradeCounts[item.grade] = (gradeCounts[item.grade] || 0) + 1;
            if (item.region) regionCounts[item.region] = (regionCounts[item.region] || 0) + 1;
          });

          return {
            totalCount: data.length,
            avgPrice: Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length),
            minPrice: Math.min(...prices),
            maxPrice: Math.max(...prices),
            platformCounts,
            fuelCounts,
            yearCounts,
            gradeCounts,
            regionCounts
          };
        };

        setStats(calculateStats(validData));
        setLoading(false);
      } catch (error) {
        console.error('데이터 로드 오류:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getPlatformData = () => {
    return Object.entries(stats.platformCounts || {}).map(([platform, count]) => ({
      platform,
      count,
      avgPrice: Math.round(data.filter(d => d.platform === platform).reduce((sum, d) => sum + d.price, 0) / count)
    }));
  };

  const getYearPriceData = () => {
    const yearData = {};
    data.forEach(item => {
      if (!yearData[item.year]) {
        yearData[item.year] = { year: item.year, prices: [], count: 0 };
      }
      yearData[item.year].prices.push(item.price);
      yearData[item.year].count++;
    });

    return Object.values(yearData).map(d => ({
      year: d.year,
      avgPrice: Math.round(d.prices.reduce((sum, p) => sum + p, 0) / d.prices.length),
      count: d.count
    })).sort((a, b) => a.year - b.year);
  };

  const getFuelData = () => {
    return Object.entries(stats.fuelCounts || {})
      .map(([fuel, count]) => ({
        name: fuel,
        value: count,
        avgPrice: Math.round(data.filter(d => d.fuel === fuel && d.price > 0).reduce((sum, d) => sum + d.price, 0) / count)
      }))
      .filter(item => item.value > 0 && !isNaN(item.avgPrice));
  };

  const getGradeData = () => {
    return Object.entries(stats.gradeCounts || {})
      .map(([grade, count]) => ({
        grade,
        count,
        avgPrice: Math.round(data.filter(d => d.grade === grade && d.price > 0).reduce((sum, d) => sum + d.price, 0) / count)
      }))
      .filter(item => item.count > 0 && !isNaN(item.avgPrice))
      .sort((a, b) => b.avgPrice - a.avgPrice);
  };

  const getMileagePriceData = () => {
    return data.filter(d => d.mileage > 0 && d.price > 0)
      .map(d => ({
        mileage: d.mileage,
        price: d.price,
        platform: d.platform,
        year: d.year
      }))
      .sort((a, b) => a.mileage - b.mileage); // 주행거리 순으로 정렬
  };

  const getTopRegions = () => {
    return Object.entries(stats.regionCounts || {})
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([region, count]) => ({
        region,
        count,
        avgPrice: Math.round(data.filter(d => d.region === region && d.price > 0).reduce((sum, d) => sum + d.price, 0) / count) || 0
      }));
  };

  // 박스 플롯 데이터 계산 함수
  const calculateBoxPlotData = (prices) => {
    if (prices.length === 0) return null;
    
    const sorted = prices.sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const medianIndex = Math.floor(sorted.length * 0.5);
    const q3Index = Math.floor(sorted.length * 0.75);
    
    return {
      min: sorted[0],
      q1: sorted[q1Index],
      median: sorted[medianIndex],
      q3: sorted[q3Index],
      max: sorted[sorted.length - 1],
      avg: Math.round(sorted.reduce((sum, p) => sum + p, 0) / sorted.length)
    };
  };

  // 박스 플롯용 데이터 생성 함수
  const getBoxPlotData = (factor) => {
    switch(factor) {
      case 'fuel':
        return Object.entries(stats.fuelCounts || {}).map(([fuel, count]) => {
          const prices = data.filter(d => d.fuel === fuel && d.price > 0).map(d => d.price);
          const boxData = calculateBoxPlotData(prices);
          return {
            factor: fuel,
            count: count,
            ...boxData
          };
        }).filter(item => item.min !== undefined);
      
      case 'grade':
        return Object.entries(stats.gradeCounts || {}).map(([grade, count]) => {
          const prices = data.filter(d => d.grade === grade && d.price > 0).map(d => d.price);
          const boxData = calculateBoxPlotData(prices);
          return {
            factor: grade,
            count: count,
            ...boxData
          };
        }).filter(item => item.min !== undefined).sort((a, b) => b.avg - a.avg);
      
      case 'region':
        return Object.entries(stats.regionCounts || {})
          .filter(([region, count]) => count >= 5)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([region, count]) => {
            const prices = data.filter(d => d.region === region && d.price > 0).map(d => d.price);
            const boxData = calculateBoxPlotData(prices);
            return {
              factor: region,
              count: count,
              ...boxData
            };
          }).filter(item => item.min !== undefined);
      
      case 'year':
        return Object.entries(stats.yearCounts || {}).map(([year, count]) => {
          const prices = data.filter(d => d.year === parseInt(year) && d.price > 0).map(d => d.price);
          const boxData = calculateBoxPlotData(prices);
          return {
            factor: year + '년',
            count: count,
            ...boxData
          };
        }).filter(item => item.min !== undefined).sort((a, b) => parseInt(a.factor) - parseInt(b.factor));
      
      case 'mileageRange':
        const ranges = [
          { range: '1만km 미만', min: 0, max: 10000 },
          { range: '1-3만km', min: 10000, max: 30000 },
          { range: '3-5만km', min: 30000, max: 50000 },
          { range: '5-7만km', min: 50000, max: 70000 },
          { range: '7만km 이상', min: 70000, max: Infinity }
        ];
        
        return ranges.map(r => {
          const prices = data.filter(d => d.mileage >= r.min && d.mileage < r.max && d.price > 0).map(d => d.price);
          const boxData = calculateBoxPlotData(prices);
          return {
            factor: r.range,
            count: prices.length,
            ...boxData
          };
        }).filter(item => item.min !== undefined);
      
      case 'platform':
        return Object.entries(stats.platformCounts || {}).map(([platform, count]) => {
          const prices = data.filter(d => d.platform === platform && d.price > 0).map(d => d.price);
          const boxData = calculateBoxPlotData(prices);
          return {
            factor: platform,
            count: count,
            ...boxData
          };
        }).filter(item => item.min !== undefined);
      
      default:
        return [];
    }
  };

  const getMileageRangeData = () => {
    const ranges = [
      { range: '1만km 미만', min: 0, max: 10000 },
      { range: '1-3만km', min: 10000, max: 30000 },
      { range: '3-5만km', min: 30000, max: 50000 },
      { range: '5-7만km', min: 50000, max: 70000 },
      { range: '7만km 이상', min: 70000, max: Infinity }
    ];
    
    return ranges.map(r => {
      const filteredData = data.filter(d => d.mileage >= r.min && d.mileage < r.max && d.price > 0);
      return {
        range: r.range,
        count: filteredData.length,
        avgPrice: filteredData.length > 0 ? Math.round(filteredData.reduce((sum, d) => sum + d.price, 0) / filteredData.length) : 0
      };
    }).filter(item => item.count > 0);
  };

  const getRegionPriceData = () => {
    return Object.entries(stats.regionCounts || {})
      .map(([region, count]) => {
        const regionData = data.filter(d => d.region === region && d.price > 0);
        return {
          region,
          count,
          avgPrice: regionData.length > 0 ? Math.round(regionData.reduce((sum, d) => sum + d.price, 0) / regionData.length) : 0,
          minPrice: regionData.length > 0 ? Math.min(...regionData.map(d => d.price)) : 0,
          maxPrice: regionData.length > 0 ? Math.max(...regionData.map(d => d.price)) : 0
        };
      })
      .filter(item => item.count >= 5)
      .sort((a, b) => b.avgPrice - a.avgPrice);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-lg text-gray-600">데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <h1 className="text-3xl font-bold text-gray-900">더 뉴 아반떼 (CN7) 중고차 시장 분석</h1>
            <p className="text-gray-600 mt-1">엔카, 케이카, KB차차차 데이터 종합 분석</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: '전체 개요' },
              { id: 'factors', name: '가격 영향 요인' },
              { id: 'platform', name: '플랫폼 비교' },
              { id: 'price', name: '가격 분석' },
              { id: 'specs', name: '사양별 분석' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold">📊</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">총 매물 수</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalCount?.toLocaleString()}대</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold">💰</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">평균 가격</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.avgPrice?.toLocaleString()}만원</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold">📈</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">최고 가격</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.maxPrice?.toLocaleString()}만원</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold">📉</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">최저 가격</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.minPrice?.toLocaleString()}만원</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">연료별 매물 분포</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getFuelData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({name, value, percent}) => `${name}: ${value}대 (${(percent * 100).toFixed(1)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getFuelData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value}대`, '매물 수']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">지역별 매물 수 TOP 10</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getTopRegions()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="region" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [`${value}대`, '매물 수']} />
                    <Bar dataKey="count" fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'platform' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">플랫폼별 매물 수</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getPlatformData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="platform" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [`${value}대`, '매물 수']} />
                    <Bar dataKey="count" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">플랫폼별 평균 가격</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getPlatformData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="platform" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [`${value}만원`, '평균 가격']} />
                    <Bar dataKey="avgPrice" fill="#FFBB28" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">플랫폼별 상세 통계</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">플랫폼</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">매물 수</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">평균 가격</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">시장 점유율</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getPlatformData().map((platform, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {platform.platform}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {platform.count.toLocaleString()}대
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {platform.avgPrice.toLocaleString()}만원
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {((platform.count / stats.totalCount) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'price' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">연식별 평균 가격 추이</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={getYearPriceData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [`${value}만원`, '평균 가격']}
                    labelFormatter={(value) => `${value}년식`}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="avgPrice" stroke="#0088FE" strokeWidth={3} name="평균 가격" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">주행거리별 가격 분포</h3>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart data={getMileagePriceData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mileage" name="주행거리" unit="km" />
                  <YAxis dataKey="price" name="가격" unit="만원" />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    formatter={(value, name) => [
                      name === 'price' ? `${value}만원` : `${value.toLocaleString()}km`,
                      name === 'price' ? '가격' : '주행거리'
                    ]}
                  />
                  <Scatter dataKey="price" fill="#FF8042" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">가격 구간별 매물 분포</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={(() => {
                  const ranges = [
                    { range: '1,500만원 미만', min: 0, max: 1500 },
                    { range: '1,500-2,000만원', min: 1500, max: 2000 },
                    { range: '2,000-2,500만원', min: 2000, max: 2500 },
                    { range: '2,500-3,000만원', min: 2500, max: 3000 },
                    { range: '3,000만원 이상', min: 3000, max: Infinity }
                  ];
                  
                  return ranges.map(r => ({
                    range: r.range,
                    count: data.filter(d => d.price >= r.min && d.price < r.max).length
                  })).filter(item => item.count > 0); // 매물이 0개인 구간 제외
                })()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [`${value}대`, '매물 수']} />
                  <Bar dataKey="count" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'factors' && (
          <div className="space-y-8">
            {/* 가격 영향 요인 인터랙티브 차트 */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">가격에 영향을 미치는 요인별 분석</h3>
                <select 
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={selectedFactor}
                  onChange={(e) => setSelectedFactor(e.target.value)}
                >
                  <option value="fuel">연료 타입</option>
                  <option value="grade">등급</option>
                  <option value="region">지역 (TOP 10)</option>
                  <option value="year">연식</option>
                  <option value="mileageRange">주행거리 구간</option>
                  <option value="platform">플랫폼</option>
                </select>
              </div>
              
              <ResponsiveContainer width="100%" height={500}>
                <BarChart data={getBoxPlotData(selectedFactor)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="factor" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    interval={0}
                  />
                  <YAxis label={{ value: '가격 (만원)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'min') return [`${value.toLocaleString()}만원`, '최저가'];
                      if (name === 'q1') return [`${value.toLocaleString()}만원`, '25% 분위수'];
                      if (name === 'median') return [`${value.toLocaleString()}만원`, '중앙값'];
                      if (name === 'q3') return [`${value.toLocaleString()}만원`, '75% 분위수'];
                      if (name === 'max') return [`${value.toLocaleString()}만원`, '최고가'];
                      if (name === 'avg') return [`${value.toLocaleString()}만원`, '평균가'];
                      return [`${value}대`, '매물 수'];
                    }}
                    labelFormatter={(label) => `${selectedFactor === 'fuel' ? '연료 타입' : 
                      selectedFactor === 'grade' ? '등급' : 
                      selectedFactor === 'region' ? '지역' : 
                      selectedFactor === 'year' ? '연식' : 
                      selectedFactor === 'mileageRange' ? '주행거리 구간' : '플랫폼'}: ${label}`}
                  />
                  <Legend />
                  {/* 박스 플롯 스타일 바차트 */}
                  <Bar dataKey="min" fill="#E3F2FD" name="최저가" />
                  <Bar dataKey="q1" fill="#BBDEFB" name="25% 분위수" />
                  <Bar dataKey="median" fill="#64B5F6" name="중앙값" />
                  <Bar dataKey="q3" fill="#2196F3" name="75% 분위수" />
                  <Bar dataKey="max" fill="#1976D2" name="최고가" />
                  <Bar dataKey="avg" fill="#FF5722" name="평균가" strokeWidth={2} />
                </BarChart>
              </ResponsiveContainer>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>💡 박스 플롯 해석:</strong> 각 막대는 가격 분포를 나타냅니다. 
                  최저가부터 최고가까지의 범위와 25%, 50%(중앙값), 75% 분위수를 통해 가격 분포의 특성을 파악할 수 있습니다.
                  빨간색 막대는 평균가를 의미합니다.
                  <br />
                  현재 선택된 요인: <span className="font-semibold">
                    {selectedFactor === 'fuel' ? '연료 타입' : 
                     selectedFactor === 'grade' ? '등급' : 
                     selectedFactor === 'region' ? '지역' : 
                     selectedFactor === 'year' ? '연식' : 
                     selectedFactor === 'mileageRange' ? '주행거리 구간' : '플랫폼'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'specs' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">등급별 평균 가격</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={getGradeData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="grade" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [`${value}만원`, '평균 가격']} />
                  <Bar dataKey="avgPrice" fill="#8884D8" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">연료별 상세 분석</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">연료 타입</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">매물 수</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">평균 가격</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">비율</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getFuelData().map((fuel, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {fuel.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {fuel.value.toLocaleString()}대
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {fuel.avgPrice.toLocaleString()}만원
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {((fuel.value / stats.totalCount) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">등급별 상세 분석</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">등급</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">매물 수</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">평균 가격</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">비율</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getGradeData().map((grade, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {grade.grade}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {grade.count.toLocaleString()}대
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {grade.avgPrice.toLocaleString()}만원
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {((grade.count / stats.totalCount) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">플랫폼별 연료 타입 분포</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={(() => {
                  const platformFuelData = [];
                  const platforms = Object.keys(stats.platformCounts || {});
                  const fuels = Object.keys(stats.fuelCounts || {});
                  
                  platforms.forEach(platform => {
                    const platformData = { platform };
                    fuels.forEach(fuel => {
                      const count = data.filter(d => d.platform === platform && d.fuel === fuel).length;
                      platformData[fuel] = count;
                    });
                    platformFuelData.push(platformData);
                  });
                  
                  return platformFuelData;
                })()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="platform" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {Object.keys(stats.fuelCounts || {}).map((fuel, index) => (
                    <Bar key={fuel} dataKey={fuel} fill={COLORS[index % COLORS.length]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            더 뉴 아반떼 (CN7) 중고차 시장 분석 대시보드 | 데이터 출처: 엔카, 케이카, KB차차차
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;