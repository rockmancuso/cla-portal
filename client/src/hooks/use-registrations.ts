import { useQuery } from "@tanstack/react-query";
import {
  fetchContactId,
  fetchRegistrationIds,
  fetchRegistrations
} from "../lib/api";
import { useAuth } from "./use-auth";

export function useRegistrations() {
  const { user } = useAuth();             // your existing auth hook
  const email = user?.email || (import.meta.env.DEV ? "rob@wencelworldwide.com" : undefined);
  
  const queryFn = async () => {
    try {
      if (!email) return [];

      const contactId = await fetchContactId(email);
      if (!contactId) {
        console.warn(`No contact ID found for email: ${email}`);
        return [];
      }

      const regIds = await fetchRegistrationIds(contactId);
      if (!regIds?.length) {
        console.log(`No registrations found for contact ID: ${contactId}`);
        return [];
      }

      const registrations = await fetchRegistrations(regIds);
      return registrations;
    } catch (error) {
      console.error("Error fetching registrations:", error);
      throw error;
    }
  };

  return useQuery({
    queryKey: ["registrations", email],
    queryFn,
    enabled: !!email,
    retry: 2,               // Retry failed requests twice
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}