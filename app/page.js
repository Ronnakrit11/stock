// app/page.js
"use client";

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Home() {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  async function fetchStockData() {
    try {
      setLoading(true);
      const response = await fetch('/api/stock-data');
      
      if (!response.ok) {
        throw new Error('ไม่สามารถดึงข้อมูลหุ้นได้');
      }
      
      const data = await response.json();
      setStockData(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStockData();
    
    // Update data every minute
    const interval = setInterval(fetchStockData, 60000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading && !stockData.length) return <div className="flex justify-center items-center h-screen">กำลังโหลด...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-500">เกิดข้อผิดพลาด: {error}</div>;

  const latestPrice = stockData[stockData.length - 1]?.price;
  const latestChange = stockData[stockData.length - 1]?.change;
  const latestRSI = stockData[stockData.length - 1]?.rsi;

  return (
    <main className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">ข้อมูลหุ้น ARM Holdings</h1>
        <div className="text-sm text-gray-500">
          {lastUpdated && (
            <>
              อัพเดทล่าสุด: {lastUpdated.toLocaleTimeString()}
              <button 
                onClick={fetchStockData}
                className="ml-4 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                รีเฟรช
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">ราคาหุ้น</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={stockData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={['auto', 'auto']}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ fontSize: 12 }}
                formatter={(value) => [`$${value.toFixed(2)}`, 'ราคา']}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#8884d8" 
                name="ราคา"
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4">
            <p className="font-semibold">ราคาล่าสุด: 
              <span className="text-blue-600 ml-2">${latestPrice?.toFixed(2)}</span>
            </p>
            <p className="font-semibold">เปลี่ยนแปลง: 
              <span className={`ml-2 ${latestChange > 0 ? "text-green-600" : "text-red-600"}`}>
                {latestChange > 0 ? "+" : ""}{latestChange?.toFixed(2)}%
              </span>
            </p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">ค่า RSI (Relative Strength Index)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={stockData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={[0, 100]} 
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ fontSize: 12 }}
                formatter={(value) => [value.toFixed(2), 'RSI']}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="rsi" 
                stroke="#82ca9d" 
                name="RSI"
                dot={false}
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="overbought" 
                stroke="#ff0000" 
                strokeDasharray="3 3" 
                name="Overbought (70)"
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="oversold" 
                stroke="#00ff00" 
                strokeDasharray="3 3" 
                name="Oversold (30)"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4">
            <p className="font-semibold">RSI ล่าสุด: 
              <span className="text-blue-600 ml-2">{latestRSI?.toFixed(2)}</span>
            </p>
            <div className="flex items-center mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${getColorByRSI(latestRSI)}`} 
                  style={{ width: `${latestRSI}%` }}
                ></div>
              </div>
              <span className="ml-2">{interpretRSI(latestRSI)}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function getColorByRSI(rsi) {
  if (rsi >= 70) return 'bg-red-600';  // Overbought
  if (rsi <= 30) return 'bg-green-600';  // Oversold
  return 'bg-blue-600';  // Normal
}

function interpretRSI(rsi) {
  if (rsi >= 70) return 'Overbought (ซื้อมากเกินไป)';
  if (rsi <= 30) return 'Oversold (ขายมากเกินไป)';
  return 'Neutral (สมดุล)';
}