import React, { useState, useEffect } from 'react';

const WeatherComponent = () => {
  const [weather, setWeather] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch('https://api.weather.com/today');
        const data = await response.json();
        setWeather(data);
      } catch (error) {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeather();
  }, []);

  if (isLoading) return <p>Loading weather data...</p>;
  if (hasError) return <p>Error fetching weather data</p>;

  return (
    <div>
      <h1>Today's Weather</h1>
      <p>Temperature: {weather.temperature}°C</p>
    </div>
  );
};

export default WeatherComponent;
