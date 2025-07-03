import axios from "axios";

const BASE_URL = "http://localhost:8000/api/friends";

// Helper to get auth headers
const getAuthHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const getFriendsList = async (token) => {
  const res = await axios.get(`${BASE_URL}/list`, getAuthHeaders(token));
  return res.data;
};

export const sendFriendRequest = async (toUserId, token) => {
  const res = await axios.post(
    `${BASE_URL}/request`,
    { toUserId },
    getAuthHeaders(token),
  );
  return res.data;
};

export const acceptFriendRequest = async (fromUserId, token) => {
  const res = await axios.post(
    `${BASE_URL}/accept`,
    { fromUserId },
    getAuthHeaders(token),
  );
  return res.data;
};

export const rejectFriendRequest = async (userId, token) => {
  const res = await axios.post(
    `${BASE_URL}/reject`,
    { userId },
    getAuthHeaders(token),
  );
  return res.data;
};

export const removeFriend = async (friendUserId, token) => {
  const res = await axios.delete(
    `${BASE_URL}/remove/${friendUserId}`,
    getAuthHeaders(token),
  );
  return res.data;
};

export const searchUsers = async (query, token) => {
  const res = await axios.get(`${BASE_URL}/search`, {
    params: { query },
    ...getAuthHeaders(token),
  });
  return res.data;
};
