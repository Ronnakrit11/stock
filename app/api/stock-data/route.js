// app/api/stock-data/route.js
import { NextResponse } from 'next/server';

// คุณควรเก็บ API key ไว้ใน .env.local file
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'YOUR_API_KEY';
const SYMBOL = 'ARM'; // สัญลักษณ์สำหรับหุ้น ARM Holdings

export async function GET() {
  try {
    // วันที่ปัจจุบัน (25/02/2025)
    const currentDate = new Date('2025-02-25');
    
    // ดึงข้อมูลราคาล่าสุดจาก Alpha Vantage
    const priceResponse = await fetch(
      `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${SYMBOL}&outputsize=full&apikey=${ALPHA_VANTAGE_API_KEY}`
    );
    
    if (!priceResponse.ok) {
      throw new Error('ไม่สามารถดึงข้อมูลราคาหุ้นได้');
    }
    
    const priceData = await priceResponse.json();
    
    // ตรวจสอบว่ามีข้อมูลหรือไม่
    if (priceData['Error Message']) {
      throw new Error(priceData['Error Message']);
    }
    
    if (!priceData['Time Series (Daily)']) {
      throw new Error('ไม่พบข้อมูลราคาหุ้น');
    }
    
    // ดึงข้อมูล RSI
    const rsiResponse = await fetch(
      `https://www.alphavantage.co/query?function=RSI&symbol=${SYMBOL}&interval=daily&time_period=14&series_type=close&apikey=${ALPHA_VANTAGE_API_KEY}`
    );
    
    if (!rsiResponse.ok) {
      throw new Error('ไม่สามารถดึงข้อมูล RSI ได้');
    }
    
    const rsiData = await rsiResponse.json();
    
    // ตรวจสอบว่ามีข้อมูล RSI หรือไม่
    if (rsiData['Error Message']) {
      throw new Error(rsiData['Error Message']);
    }
    
    if (!rsiData['Technical Analysis: RSI']) {
      throw new Error('ไม่พบข้อมูล RSI');
    }
    
    // แปลงข้อมูลและเลือกข้อมูลจนถึงวันปัจจุบัน (25/02/2025)
    const formattedData = formatStockDataToCurrentDate(
      priceData['Time Series (Daily)'], 
      rsiData['Technical Analysis: RSI'],
      currentDate
    );
    
    return NextResponse.json(formattedData, { status: 200 });
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการดึงข้อมูลหุ้น:', error);
    
    // ถ้าไม่สามารถดึงข้อมูลจาก API ได้ ให้ใช้ข้อมูลจำลองที่มีวันที่ถึงปัจจุบัน
    const mockData = generateMockStockDataToCurrentDate();
    return NextResponse.json(mockData, { status: 200, headers: { 'X-Data-Source': 'mock' } });
  }
}

function formatStockDataToCurrentDate(priceTimeSeries, rsiData, currentDate) {
  const formattedData = [];
  
  // แปลงข้อมูลเป็น array ของวันที่เรียงตามลำดับ
  const dates = Object.keys(priceTimeSeries)
    .filter(date => {
      // กรองเฉพาะวันที่ไม่เกินวันปัจจุบัน (25/02/2025)
      const dateObj = new Date(date);
      return dateObj <= currentDate;
    })
    .sort();
  
  // เลือกเฉพาะ 90 วันล่าสุด (หรือน้อยกว่าถ้าข้อมูลมีไม่ถึง)
  const recentDates = dates.slice(0, 90);
  
  let previousPrice = null;
  
  for (const date of recentDates) {
    const priceInfo = priceTimeSeries[date];
    const closePrice = parseFloat(priceInfo['4. close']);
    
    // คำนวณการเปลี่ยนแปลงของราคา (%)
    let change = 0;
    if (previousPrice !== null) {
      change = ((closePrice - previousPrice) / previousPrice) * 100;
    }
    previousPrice = closePrice;
    
    // ดึงค่า RSI สำหรับวันนี้ (ถ้ามี)
    let rsi = null;
    if (rsiData[date] && rsiData[date].RSI) {
      rsi = parseFloat(rsiData[date].RSI);
    }
    
    formattedData.push({
      date: date,
      price: closePrice,
      change: change,
      rsi: rsi || 50, // ถ้าไม่มีข้อมูล RSI ให้ใช้ค่า 50 แทน
      overbought: 70, // เส้นแสดงระดับ Overbought
      oversold: 30,   // เส้นแสดงระดับ Oversold
      volume: parseInt(priceInfo['5. volume']),
      open: parseFloat(priceInfo['1. open']),
      high: parseFloat(priceInfo['2. high']),
      low: parseFloat(priceInfo['3. low'])
    });
  }
  
  // จัดเรียงข้อมูลตามวันที่ (เก่าไปใหม่)
  return formattedData.reverse();
}

function generateMockStockDataToCurrentDate() {
  const data = [];
  const currentDate = new Date('2025-02-25');
  const startDate = new Date(currentDate);
  startDate.setDate(startDate.getDate() - 89); // 90 วันย้อนหลัง
  
  let price = 120 + Math.random() * 10; // สมมติราคาเริ่มต้นประมาณ $120-$130
  
  // สร้างข้อมูลจำลองตั้งแต่ 90 วันที่แล้วจนถึงวันปัจจุบัน
  for (let d = new Date(startDate); d <= currentDate; d.setDate(d.getDate() + 1)) {
    // ข้ามวันเสาร์-อาทิตย์ (ตลาดหุ้นปิด)
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    
    // เปลี่ยนแปลงราคาแบบสุ่ม
    const priceChange = (Math.random() - 0.5) * 5;
    price += priceChange;
    
    // คำนวณเปอร์เซ็นต์การเปลี่ยนแปลง
    const change = (priceChange / (price - priceChange)) * 100;
    
    // คำนวณค่า RSI จำลอง
    let rsi;
    if (data.length === 0) {
      rsi = 50; // เริ่มต้นที่ 50
    } else {
      // ปรับ RSI ตามการเปลี่ยนแปลงของราคา
      const prevRSI = data[data.length - 1].rsi;
      if (priceChange > 0) {
        rsi = prevRSI + (Math.random() * 5);
      } else {
        rsi = prevRSI - (Math.random() * 5);
      }
      
      // ทำให้ RSI อยู่ในช่วง 0-100
      rsi = Math.max(0, Math.min(100, rsi));
    }
    
    // เมื่อใกล้วันปัจจุบัน (25/02/2025) ให้จำลองว่าราคาพุ่งขึ้น
    if (Math.abs(currentDate - d) / (1000 * 60 * 60 * 24) < 7) {
      price += Math.random() * 3; // ปรับราคาขึ้นในช่วง 7 วันสุดท้าย
      rsi = Math.min(100, rsi + Math.random() * 3); // ปรับ RSI ขึ้น
    }
    
    data.push({
      date: d.toISOString().split('T')[0], // รูปแบบ YYYY-MM-DD
      price: parseFloat(price.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      rsi: parseFloat(rsi.toFixed(2)),
      overbought: 70, // เส้นแสดงระดับ Overbought
      oversold: 30,   // เส้นแสดงระดับ Oversold
      volume: Math.floor(Math.random() * 5000000) + 1000000,
      open: parseFloat((price - (Math.random() * 2)).toFixed(2)),
      high: parseFloat((price + (Math.random() * 2)).toFixed(2)),
      low: parseFloat((price - (Math.random() * 2)).toFixed(2))
    });
  }
  
  return data;
}