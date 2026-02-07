import api from "./api";

export const generateProfile = async (profile: Object[]) => {
  const response = await api.post("profile/submit-answers", { profile });
  return response.data;
}