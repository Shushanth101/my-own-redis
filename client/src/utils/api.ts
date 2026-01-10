const BASE_URL = 'http://localhost:3000';

// Helper function to handle fetch errors
async function fetchWithErrorHandling(url: string, options?: RequestInit) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error);
    throw error;
  }
}

// Cache API calls
export const cacheApi = {
  put: async (key: string, value: string) => {
    return fetchWithErrorHandling(`${BASE_URL}/put`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    });
  },

  cache: async (key: string, value: string, ttl: number) => {
    return fetchWithErrorHandling(`${BASE_URL}/cache`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value, ttl }),
    });
  },

  getAll: async () => {
    return fetchWithErrorHandling(`${BASE_URL}/getall`);
  },

  flush: async (key: string) => {
    return fetchWithErrorHandling(`${BASE_URL}/flush/${key}`, {
      method: 'DELETE',
    });
  },

  flushAll: async () => {
    return fetchWithErrorHandling(`${BASE_URL}/flush-all`, {
      method: 'DELETE',
    });
  },

  stats: async () => {
    return fetchWithErrorHandling(`${BASE_URL}/stats`);
  },
};

// List API calls
export const listApi = {
  lpush: async (value: string) => {
    return fetchWithErrorHandling(`${BASE_URL}/lpush`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
  },

  rpush: async (value: string) => {
    return fetchWithErrorHandling(`${BASE_URL}/rpush`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
  },

  lpop: async () => {
    return fetchWithErrorHandling(`${BASE_URL}/lpop`, {
      method: 'DELETE',
    });
  },

  rpop: async () => {
    return fetchWithErrorHandling(`${BASE_URL}/rpop`, {
      method: 'DELETE',
    });
  },

  lget: async () => {
    return fetchWithErrorHandling(`${BASE_URL}/lget`);
  },
};

// Health check
export const healthCheck = async (): Promise<boolean> => {
  try {
    await fetch(`${BASE_URL}/stats`);
    return true;
  } catch {
    return false;
  }
};