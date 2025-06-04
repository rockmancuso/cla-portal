import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  return {
    user: data?.user as User | undefined,
    isLoading,
    isAuthenticated: !!data?.user,
    error,
  };
}
