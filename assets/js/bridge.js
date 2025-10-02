/** ===============================
 *  NAVI-SIMS — Frontend API Client
 *  Connects GitHub Pages frontend to Google Apps Script backend
 * =============================== */

// ===== Configuration =====
const API_CONFIG = {
  // Replace this with your actual Google Apps Script Web App URL
  BASE_URL: 'https://script.google.com/macros/s/AKfycbxysJX74MHaIN2MBviY0nj6_w8YvyqHewTQ6zUiDmMbd0wjDv8Xhu2Q_d4EZtZoupzQaw/exec',
  
  // Session management
  TOKEN_KEY: 'navi_token',
  SESSION_TTL: 3600000 // 1 hour in milliseconds
};

// ===== Storage Helpers =====
const Storage = {
  getToken: () => localStorage.getItem(API_CONFIG.TOKEN_KEY) || '',
  setToken: (token) => token && localStorage.setItem(API_CONFIG.TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(API_CONFIG.TOKEN_KEY),
  
  getSessionData: () => {
    try {
      const data = localStorage.getItem('session_data');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  
  setSessionData: (data) => {
    localStorage.setItem('session_data', JSON.stringify(data));
  },
  
  clearSessionData: () => {
    localStorage.removeItem('session_data');
  }
};

// ===== HTTP Client =====
const HTTP = {
  /**
   * Make API request
   * @param {string} endpoint - API action name
   * @param {object} options - Request options
   * @returns {Promise<object>} Response data
   */
  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      query = {},
      body = null,
      formData = null,
      requireAuth = true
    } = options;
    
    // Build URL with query parameters
    const url = new URL(API_CONFIG.BASE_URL);
    url.searchParams.set('action', endpoint);
    
    // Add token if required
    const token = Storage.getToken();
    if (requireAuth && token) {
      url.searchParams.set('token', token);
    }
    
    // Add additional query parameters
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
    
    // Prepare fetch options
    const fetchOptions = {
      method,
      mode: 'cors',
      cache: 'no-cache',
      headers: {}
    };
    
    // Handle different body types
    if (formData) {
      fetchOptions.body = formData;
      // Don't set Content-Type for FormData - browser will set it with boundary
    } else if (body) {
      fetchOptions.headers['Content-Type'] = 'application/json';
      fetchOptions.body = JSON.stringify(body);
    }
    
    try {
      const response = await fetch(url.toString(), fetchOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Handle auth errors
      if (!data.ok && data.msg && data.msg.includes('Unauthorized')) {
        Storage.clearToken();
        Storage.clearSessionData();
        window.location.href = '/login.html';
        throw new Error('Session expired. Please login again.');
      }
      
      return data;
      
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  },
  
  // Convenience methods
  get: (endpoint, query = {}, requireAuth = true) => 
    HTTP.request(endpoint, { method: 'GET', query, requireAuth }),
    
  post: (endpoint, body, requireAuth = true) => 
    HTTP.request(endpoint, { method: 'POST', body, requireAuth }),
    
  upload: (endpoint, formData, requireAuth = true) => 
    HTTP.request(endpoint, { method: 'POST', formData, requireAuth })
};

// ===== API Methods =====
const API = {
  // ===== Authentication =====
  auth: {
    login: async (username, password) => {
      const result = await HTTP.post('login', { username, password }, false);
      if (result.ok && result.token) {
        Storage.setToken(result.token);
      }
      return result;
    },
    
    logout: () => {
      Storage.clearToken();
      Storage.clearSessionData();
      window.location.href = '/login.html';
    },
    
    getSession: async () => {
      const result = await HTTP.get('session');
      if (result.ok && result.token) {
        Storage.setToken(result.token);
        Storage.setSessionData(result.user);
      }
      return result;
    },
    
    changePassword: (currentPassword, newPassword) => 
      HTTP.post('changePassword', { currentPassword, newPassword })
  },
  
  // ===== Metadata =====
  meta: {
    logo: () => HTTP.get('logo', {}, false),
    levels: () => HTTP.get('levels', {}, false),
    groups: () => HTTP.get('groups', {}, false),
    companies: () => HTTP.get('companies')
  },
  
  // ===== User Management =====
  users: {
    list: (scope) => HTTP.get('listUsers', { scope }),
    
    get: (userId) => HTTP.get('getUser', { userId }),
    
    create: (userData) => HTTP.post('createUserLogin', userData),
    
    update: (userData) => HTTP.post('updateUser', userData),
    
    delete: (userId) => HTTP.post('deleteUser', { userId }),
    
    saveDetails: (detailsData) => HTTP.post('saveUserDetails', detailsData)
  },
  
  // ===== Client Management =====
  clients: {
    list: (searchQuery) => HTTP.get('getClientList', { 
      searchQuery: searchQuery ? JSON.stringify(searchQuery) : null 
    }),
    
    get: (clientId) => HTTP.get('getClientProfile', { clientId }),
    
    register: (values, files) => HTTP.post('saveClientRegistration', { values, files }),
    
    update: (clientId, data, files) => HTTP.post('updateClientProfile', { clientId, data, files })
  },
  
  // ===== Vessel Management =====
  vessels: {
    newShipId: () => HTTP.get('newShipId'),
    
    listKeys: (keyType) => HTTP.get('listVesselKeys', { keyType }),
    
    get: (keyType, keyValue) => HTTP.get('getVessel', { keyType, keyValue }),
    
    save: (vesselData) => HTTP.post('saveVesselMain', vesselData),
    
    update: (vesselData) => HTTP.post('updateVesselAll', vesselData),
    
    list: () => HTTP.get('listVesselsForUser'),
    
    detail: (shipId) => HTTP.get('getVesselDetail', { shipId }),
    
    inventoryNames: () => HTTP.get('getInventoryNames')
  },
  
  // ===== File Upload =====
  files: {
    upload: async (fileInput, additionalData = {}) => {
      const formData = new FormData();
      
      // Add file
      if (fileInput.files && fileInput.files[0]) {
        formData.append('file', fileInput.files[0]);
      }
      
      // Add additional data
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
      
      return HTTP.upload('uploadFile', formData);
    }
  }
};

// ===== Auth Guards =====
const Guards = {
  /**
   * Ensure user is authenticated
   * Redirects to login if not
   */
  requireAuth: async () => {
    const token = Storage.getToken();
    if (!token) {
      window.location.href = '/login.html';
      return null;
    }
    
    try {
      const session = await API.auth.getSession();
      if (!session.ok) {
        window.location.href = '/login.html';
        return null;
      }
      return session.user;
    } catch {
      window.location.href = '/login.html';
      return null;
    }
  },
  
  /**
   * Check if user has required permission level
   * @param {number} requiredLevel - 0=super, 1=admin, 2=staff, 3=user
   */
  hasPermission: (requiredLevel) => {
    const session = Storage.getSessionData();
    if (!session) return false;
    
    const userLevel = parseInt(session.levelId) || 999;
    return userLevel <= requiredLevel;
  },
  
  /**
   * Redirect to login if not authenticated
   */
  redirectIfNotAuth: () => {
    const token = Storage.getToken();
    if (!token) {
      window.location.href = '/login.html';
    }
  }
};

// ===== UI Helpers =====
const UI = {
  /**
   * Populate identity information in page
   */
  hydrateIdentity: async (selectors = {}) => {
    const {
      logoSel,
      nameSel,
      levelSel,
      groupSel,
      idSel
    } = selectors;
    
    const session = await API.auth.getSession();
    
    if (session?.ok) {
      if (logoSel && session.logoUrl) {
        document.querySelectorAll(logoSel).forEach(el => el.src = session.logoUrl);
      }
      if (nameSel) {
        document.querySelectorAll(nameSel).forEach(el => el.textContent = session.user?.username || '—');
      }
      if (levelSel) {
        document.querySelectorAll(levelSel).forEach(el => el.textContent = session.user?.levelName || '—');
      }
      if (groupSel) {
        document.querySelectorAll(groupSel).forEach(el => el.textContent = session.user?.groupName || '—');
      }
      if (idSel) {
        document.querySelectorAll(idSel).forEach(el => el.textContent = session.user?.userId || '—');
      }
    }
    
    return session;
  }
};

// ===== Export =====
// Make available globally
window.NAVI = {
  API,
  Guards,
  UI,
  Storage,
  CONFIG: API_CONFIG
};

// Export for ES modules
// export { API, Guards, UI, Storage, API_CONFIG };