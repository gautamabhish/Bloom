import api from "./api";

export const fetchHome = async () => {
  try {
    const response = await api.get("/profile/home-content");
    return response.data;
  } catch (error) {
    console.error("Error fetching home content:", error);
    throw error;
  }
};