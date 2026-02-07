import api from "./api";

export const generateProfile = async (profile) => {
  const response = await api.post("profile/submit-answers", { answers:profile });
  return response.data;
}