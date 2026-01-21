import { Song } from '../types';

const BASE_URL = 'https://saavn.sumit.co/api';

export const searchSongs = async (query: string, page: number = 0, limit: number = 10): Promise<Song[]> => {
  try {
    const url = `${BASE_URL}/search/songs?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;
    console.log('Fetching:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText);
      return [];
    }
    
    const json = await response.json();
    
    // API returns { data: { results: [...] } } structure
    const results = json.data?.results;
    
    if (results && Array.isArray(results) && results.length > 0) {
      console.log('Returning', results.length, 'songs');
      return results;
    }
    
    console.log('No results found');
    return [];
  } catch (error) {
    console.error('Search Songs Error:', error);
    return [];
  }
};
