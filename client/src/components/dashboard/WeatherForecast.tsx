import { useQuery } from '@tanstack/react-query';
import { format, addDays } from 'date-fns';
import { it } from 'date-fns/locale';
import { Cloud, Sun, CloudRain, CloudSnow, CloudFog, CloudLightning, Wind, Droplets } from 'lucide-react';

interface WeatherData {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weathercode: number[];
    precipitation_probability_max: number[];
    windspeed_10m_max: number[];
  };
}

const locations = [
  { name: 'Porto Viro', lat: 45.0164, lon: 12.2161 },
  { name: 'Goro', lat: 44.8500, lon: 12.3167 }
];

const getWeatherIcon = (code: number, className = "w-5 h-5") => {
  if (code === 0) return <Sun className={`${className} text-yellow-500`} />;
  if (code >= 1 && code <= 3) return <Cloud className={`${className} text-gray-400`} />;
  if (code >= 45 && code <= 48) return <CloudFog className={`${className} text-gray-500`} />;
  if (code >= 51 && code <= 67) return <CloudRain className={`${className} text-blue-400`} />;
  if (code >= 71 && code <= 77) return <CloudSnow className={`${className} text-blue-200`} />;
  if (code >= 80 && code <= 82) return <CloudRain className={`${className} text-blue-500`} />;
  if (code >= 95 && code <= 99) return <CloudLightning className={`${className} text-purple-500`} />;
  return <Cloud className={`${className} text-gray-400`} />;
};

const getDayName = (dateStr: string, index: number) => {
  if (index === 0) return 'Oggi';
  if (index === 1) return 'Dom';
  const date = new Date(dateStr);
  return format(date, 'EEE', { locale: it }).charAt(0).toUpperCase() + format(date, 'EEE', { locale: it }).slice(1, 3);
};

export default function WeatherForecast() {
  const avgLat = (locations[0].lat + locations[1].lat) / 2;
  const avgLon = (locations[0].lon + locations[1].lon) / 2;

  const { data: weather, isLoading } = useQuery<WeatherData>({
    queryKey: ['weather-forecast'],
    queryFn: async () => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${avgLat}&longitude=${avgLon}&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max,windspeed_10m_max&timezone=Europe/Rome&forecast_days=7`;
      const res = await fetch(url);
      return res.json();
    },
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  if (isLoading || !weather?.daily) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Cloud className="w-4 h-4 animate-pulse" />
        <span>Caricamento meteo...</span>
      </div>
    );
  }

  const { time, temperature_2m_max, temperature_2m_min, weathercode, precipitation_probability_max } = weather.daily;

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-gray-500 mr-1 hidden lg:inline">Meteo Delta:</span>
      {time.slice(0, 7).map((date, i) => (
        <div
          key={date}
          className="flex flex-col items-center px-1.5 py-0.5 rounded hover:bg-gray-100 transition-colors cursor-default group relative"
          title={`${format(new Date(date), 'EEEE d MMMM', { locale: it })}\nMax: ${Math.round(temperature_2m_max[i])}°C | Min: ${Math.round(temperature_2m_min[i])}°C\nPrecipitazioni: ${precipitation_probability_max[i]}%`}
        >
          <span className="text-[10px] text-gray-500 font-medium">{getDayName(date, i)}</span>
          {getWeatherIcon(weathercode[i], "w-4 h-4")}
          <div className="flex items-center gap-0.5 text-[10px]">
            <span className="font-semibold text-gray-700">{Math.round(temperature_2m_max[i])}°</span>
            <span className="text-gray-400">{Math.round(temperature_2m_min[i])}°</span>
          </div>
          {precipitation_probability_max[i] > 30 && (
            <div className="flex items-center text-[9px] text-blue-500">
              <Droplets className="w-2.5 h-2.5 mr-0.5" />
              {precipitation_probability_max[i]}%
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
