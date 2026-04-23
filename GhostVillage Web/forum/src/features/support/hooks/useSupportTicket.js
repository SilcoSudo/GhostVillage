import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import * as supportTicketService from "../services/supportTicketService";

const SUPPORT_TICKET_QUERY_KEY = "supportTickets";

export const useMySupportTickets = (params = {}) => {
  return useQuery({
    queryKey: [SUPPORT_TICKET_QUERY_KEY, params],
    queryFn: () => supportTicketService.getMySupportTickets(params),
    placeholderData: keepPreviousData,
  });
};

export const useCreateSupportTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: supportTicketService.createSupportTicket,
    onSuccess: (data) => {
      queryClient.invalidateQueries([SUPPORT_TICKET_QUERY_KEY]);
      toast.success(data?.message || "Support ticket submitted");
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Failed to submit support ticket",
      );
    },
  });
};
