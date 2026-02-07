import api from "./api";

export const updateUserLocation = async (
  latitude: number,
  longitude: number,
) => {
  try {
    const response = await api.post("/api/location/update", {
      latitude,
      longitude,
      timestamp: new Date().toISOString(),
    });

    return response.data;
  } catch (error: any) {
    console.error("Error updating location:", error);

    throw new Error(
      error?.response?.data?.message ||
        "Failed to update location on server",
    );
  }
};
