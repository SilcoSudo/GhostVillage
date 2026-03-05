import axios from "../../../shared/services/axios";

export const createSupportTicket = async (ticketData) => {
  const response = await axios.post("/web/support-tickets", ticketData);
  return response.data;
};

export const getMySupportTickets = async (params = {}) => {
  const response = await axios.get("/web/support-tickets", { params });
  return response.data;
};
