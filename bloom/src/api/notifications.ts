import api from "./api";


export const fetchNotifications = async () => {
    try {
      const response = await api.get("/profile/notifications");
      return response.data;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
};