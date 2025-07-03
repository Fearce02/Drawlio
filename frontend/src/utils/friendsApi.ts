import axios from "axios";

export interface Friend {
  _id: string;
  username: string;
  avatar?: string;
  status?: "online" | "offline" | "in-game";
}

export interface UserSearchResult {
  _id: string;
  username: string;
  avatar?: string;
  sent?: boolean;
}

const BASE_URL = "http://localhost:8000/api/friends";

const getAuthHeaders = (token: string | null) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const getFriendsList = async (
  token: string | null,
): Promise<{
  friends: Friend[];
  friendRequests: Friend[];
  sentRequests: Friend[];
}> => {
  const res = await axios.get(`${BASE_URL}/list`, getAuthHeaders(token));
  return res.data;
};

export const sendFriendRequest = async (
  toUserId: string,
  token: string | null,
): Promise<any> => {
  const res = await axios.post(
    `${BASE_URL}/request`,
    { toUserId },
    getAuthHeaders(token),
  );
  return res.data;
};

export const acceptFriendRequest = async (
  fromUserId: string,
  token: string | null,
): Promise<any> => {
  const res = await axios.post(
    `${BASE_URL}/accept`,
    { fromUserId },
    getAuthHeaders(token),
  );
  return res.data;
};

export const rejectFriendRequest = async (
  userId: string,
  token: string | null,
): Promise<any> => {
  const res = await axios.post(
    `${BASE_URL}/reject`,
    { userId },
    getAuthHeaders(token),
  );
  return res.data;
};

export const removeFriend = async (
  friendUserId: string,
  token: string | null,
): Promise<any> => {
  const res = await axios.delete(
    `${BASE_URL}/remove/${friendUserId}`,
    getAuthHeaders(token),
  );
  return res.data;
};

export const searchUsers = async (
  query: string,
  token: string | null,
): Promise<{ users: UserSearchResult[] }> => {
  const res = await axios.get(`${BASE_URL}/search`, {
    params: { query },
    ...getAuthHeaders(token),
  });
  return res.data;
};
