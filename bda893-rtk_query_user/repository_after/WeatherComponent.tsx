import React, { use, useMemo } from 'react';

interface WeatherData {
  temperature: number;
  [key: string]: unknown;
}

const fetchWeather = async (): Promise<WeatherData> => {
  const response = await fetch('https://api.weather.com/today');
  
  if (!response.ok) {
    throw new Error(`Failed to fetch weather: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data || typeof data.temperature !== 'number') {
    throw new Error('Invalid weather data received from API');
  }
  
  return data;
};

const WeatherComponent = (): React.JSX.Element => {
  // Memoize promise to prevent re-creation on every render
  const weatherPromise = useMemo(() => {
    return fetchWeather();
  }, []);

  const weather: WeatherData = use(weatherPromise);

  return (
    <div>
      <h1>Today's Weather</h1>
      <p>Temperature: {weather.temperature}°C</p>
    </div>
  );
};

export default WeatherComponent;
