// app/api/stock-data/route.js
import { NextResponse } from 'next/server';

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const SYMBOL = 'ARM';

export async function GET() {
  try {
    // Check if API key exists
    if (!ALPHA_VANTAGE_API_KEY) {
      console.warn('API key is missing. Using mock data.');
      return NextResponse.json(generateMockStockData(), { 
        status: 200,
        headers: { 'X-Data-Source': 'mock' }
      });
    }

    // Fetch real-time quote first
    const quoteResponse = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${SYMBOL}&apikey=${ALPHA_VANTAGE_API_KEY}`
    );
    
    const quoteData = await quoteResponse.json();
    
    // Check if we got valid quote data
    if (!quoteData['Global Quote'] || !quoteData['Global Quote']['05. price']) {
      console.warn('Failed to fetch real-time quote. Using mock data.');
      return NextResponse.json(generateMockStockData(), {
        status: 200,
        headers: { 'X-Data-Source': 'mock' }
      });
    }

    const realTimePrice = parseFloat(quoteData['Global Quote']['05. price']);
    const realTimeChange = parseFloat(quoteData['Global Quote']['10. change percent'].replace('%', ''));

    // Fetch historical data
    const historicalResponse = await fetch(
      `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${SYMBOL}&outputsize=compact&apikey=${ALPHA_VANTAGE_API_KEY}`
    );
    
    const historicalData = await historicalResponse.json();
    
    if (!historicalData['Time Series (Daily)']) {
      console.warn('Failed to fetch historical data. Using mock data with real-time price.');
      return NextResponse.json(generateMockStockDataWithRealPrice(realTimePrice, realTimeChange), {
        status: 200,
        headers: { 'X-Data-Source': 'partial' }
      });
    }
    
    // Fetch RSI data
    const rsiResponse = await fetch(
      `https://www.alphavantage.co/query?function=RSI&symbol=${SYMBOL}&interval=daily&time_period=14&series_type=close&apikey=${ALPHA_VANTAGE_API_KEY}`
    );
    
    const rsiData = await rsiResponse.json();
    
    if (!rsiData['Technical Analysis: RSI']) {
      console.warn('Failed to fetch RSI data. Using mock data with real-time price.');
      return NextResponse.json(generateMockStockDataWithRealPrice(realTimePrice, realTimeChange), {
        status: 200,
        headers: { 'X-Data-Source': 'partial' }
      });
    }
    
    const formattedData = formatStockData(
      historicalData['Time Series (Daily)'],
      rsiData['Technical Analysis: RSI'],
      realTimePrice,
      realTimeChange
    );
    
    return NextResponse.json(formattedData, {
      status: 200,
      headers: { 'X-Data-Source': 'real' }
    });
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return NextResponse.json(generateMockStockData(), {
      status: 200,
      headers: { 'X-Data-Source': 'mock' }
    });
  }
}

function formatStockData(priceTimeSeries, rsiData, realTimePrice, realTimeChange) {
  const dates = Object.keys(priceTimeSeries).sort(); // Sort dates in ascending order
  const formattedData = [];
  let previousPrice = null;
  
  // Add historical data
  for (const date of dates) {
    const priceInfo = priceTimeSeries[date];
    const closePrice = parseFloat(priceInfo['4. close']);
    
    let change = 0;
    if (previousPrice !== null) {
      change = ((closePrice - previousPrice) / previousPrice) * 100;
    }
    previousPrice = closePrice;
    
    const rsi = rsiData[date] ? parseFloat(rsiData[date].RSI) : 50;
    
    formattedData.push({
      date,
      price: closePrice,
      change,
      rsi,
      overbought: 70,
      oversold: 30,
      volume: parseInt(priceInfo['5. volume']),
      open: parseFloat(priceInfo['1. open']),
      high: parseFloat(priceInfo['2. high']),
      low: parseFloat(priceInfo['3. low'])
    });
  }

  // Add real-time data as the latest point
  const today = new Date().toISOString().split('T')[0];
  formattedData.push({
    date: today,
    price: realTimePrice,
    change: realTimeChange,
    rsi: formattedData[formattedData.length - 1].rsi, // Use last known RSI
    overbought: 70,
    oversold: 30,
    volume: formattedData[formattedData.length - 1].volume, // Use last known volume
    open: realTimePrice - (Math.random() * 0.5), // Estimate
    high: realTimePrice + (Math.random() * 0.5), // Estimate
    low: realTimePrice - (Math.random() * 0.5), // Estimate
  });
  
  return formattedData;
}

function generateMockStockDataWithRealPrice(realTimePrice, realTimeChange) {
  const data = [];
  const currentDate = new Date();
  const startDate = new Date(currentDate);
  startDate.setDate(startDate.getDate() - 89);
  
  let price = realTimePrice - (realTimeChange * 89 / 100); // Start price based on current price and change
  
  for (let d = new Date(startDate); d <= currentDate; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    
    const isLastDay = d.toISOString().split('T')[0] === currentDate.toISOString().split('T')[0];
    
    if (isLastDay) {
      price = realTimePrice;
    } else {
      const priceChange = (realTimeChange / 89) + (Math.random() - 0.5);
      price += priceChange;
    }
    
    const change = isLastDay ? realTimeChange : ((Math.random() - 0.5) * 2);
    const rsi = 50 + (Math.random() - 0.5) * 20;
    
    data.push({
      date: d.toISOString().split('T')[0],
      price: parseFloat(price.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      rsi: parseFloat(rsi.toFixed(2)),
      overbought: 70,
      oversold: 30,
      volume: Math.floor(Math.random() * 5000000) + 1000000,
      open: parseFloat((price - (Math.random() * 1)).toFixed(2)),
      high: parseFloat((price + (Math.random() * 1)).toFixed(2)),
      low: parseFloat((price - (Math.random() * 1)).toFixed(2))
    });
  }
  
  return data;
}

function generateMockStockData() {
  return generateMockStockDataWithRealPrice(140.53, 0.5);
}