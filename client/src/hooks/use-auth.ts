import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { getAuthMe } from '@/lib/api';

export function useAuth() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['auth', 'me'], // Changed from ["/api/auth/me"] to semantic key
    queryFn: getAuthMe,
    retry: false,
  });

  return {
    user: data?.user as User | undefined,
    isLoading,
    isAuthenticated: !!data?.user,
    error,
  };
}
