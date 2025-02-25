// app/page.js
"use client";

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Home() {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStockData() {
      try {
        setLoading(true);
        // ตัวอย่าง URL API สำหรับดึงข้อมูลหุ้น (ในสถานการณ์จริงคุณต้องใช้ API key)
        const response = await fetch('/api/stock-data');
        
        if (!response.ok) {
          throw new Error('ไม่สามารถดึงข้อมูลหุ้นได้');
        }
        
        const data = await response.json();
        setStockData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchStockData();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-screen">กำลังโหลด...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-500">เกิดข้อผิดพลาด: {error}</div>;

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-6">ข้อมูลหุ้น ARM Holdings</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">ราคาหุ้น</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={stockData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="price" stroke="#8884d8" name="ราคา" />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4">
            <p className="font-semibold">ราคาล่าสุด: <span className="text-blue-600">${stockData[stockData.length - 1]?.price.toFixed(2)}</span></p>
            <p className="font-semibold">เปลี่ยนแปลง: 
              <span className={stockData[stockData.length - 1]?.change > 0 ? "text-green-600" : "text-red-600"}>
                {stockData[stockData.length - 1]?.change > 0 ? "+" : ""}{stockData[stockData.length - 1]?.change.toFixed(2)}%
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
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="rsi" stroke="#82ca9d" name="RSI" />
              {/* เส้นแสดงระดับ Overbought (70) และ Oversold (30) */}
              <Line type="monotone" dataKey="overbought" stroke="#ff0000" strokeDasharray="3 3" name="Overbought (70)" />
              <Line type="monotone" dataKey="oversold" stroke="#00ff00" strokeDasharray="3 3" name="Oversold (30)" />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4">
            <p className="font-semibold">RSI ล่าสุด: <span className="text-blue-600">{stockData[stockData.length - 1]?.rsi.toFixed(2)}</span></p>
            <div className="flex items-center mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${getColorByRSI(stockData[stockData.length - 1]?.rsi)}`} 
                  style={{ width: `${stockData[stockData.length - 1]?.rsi}%` }}
                ></div>
              </div>
              <span className="ml-2">{interpretRSI(stockData[stockData.length - 1]?.rsi)}</span>
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