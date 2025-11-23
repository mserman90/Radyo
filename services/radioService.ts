import { RadioStation, StationFilter } from '../types';

const BASE_URL = 'https://de1.api.radio-browser.info/json/stations';

export const fetchTopStations = async (limit: number = 50): Promise<RadioStation[]> => {
  try {
    // has_geo_info=true added to ensure we only get stations we can place on the globe
    const response = await fetch(`${BASE_URL}/search?limit=${limit}&order=clickcount&reverse=true&hidebroken=true&has_geo_info=true`);
    if (!response.ok) throw new Error('Failed to fetch stations');
    return await response.json();
  } catch (error) {
    console.error('Error fetching top stations:', error);
    return [];
  }
};

export const searchStations = async (filter: StationFilter): Promise<RadioStation[]> => {
  try {
    // has_geo_info=true added here as well
    let url = `${BASE_URL}/search?hidebroken=true&limit=${filter.limit || 20}&order=clickcount&reverse=true&has_geo_info=true`;
    
    if (filter.country) {
      url += `&country=${encodeURIComponent(filter.country)}`;
    }
    if (filter.tag) {
      url += `&tag=${encodeURIComponent(filter.tag)}`;
    }
    if (filter.name) {
      url += `&name=${encodeURIComponent(filter.name)}`;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to search stations');
    return await response.json();
  } catch (error) {
    console.error('Error searching stations:', error);
    return [];
  }
};

export const getStationsByLocation = async (lat: number, lng: number, radius: number = 500): Promise<RadioStation[]> => {
  // Fallback implementation
  try {
    return await fetchTopStations(50);
  } catch (error) {
    return [];
  }
};