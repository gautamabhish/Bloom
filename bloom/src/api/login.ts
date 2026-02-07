import api from "./api";

export const requestMagicLink = async (email: string) => {
  try {
    const response = await api.post("/auth/login/", { email });
    return response.data; // usually { success: true }
  } catch (error) {
    console.error("Magic link request failed:", error);
    throw error;
  }
};
