import api from "./api";

export const checkNearbyUsers = async () => {
  try {
    const response = await api.post("/api/location/signal/check");

    return response.data;
  } catch (error: any) {
    console.error("Error checking nearby users:", error);

    throw new Error(
      error?.response?.data?.message ||
        "Failed to check surrounding users",
    );
  }
};