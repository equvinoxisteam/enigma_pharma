import axiosInstance from './axios';

export const analyticsAPI = {
  get: async (range = 'month') => {
    const response = await axiosInstance.get(`/api/analytics?range=${range}`);
    return response.data;
  }
};
