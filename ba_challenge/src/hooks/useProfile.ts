import { userService } from '@services/userService';
import { useAuthStore } from '@store/authStore';
import { useUserStore } from '@store/userStore';
import { useEffect, useState } from 'react';

export const useProfile = () => {
  const { user } = useAuthStore();
  const { profile, setProfile, updateProfile } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const data = await userService.getProfile();
      setProfile(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const editProfile = async (params: { username?: string }) => {
    try {
      setIsLoading(true);
      setError(null);
      const updated = await userService.updateProfile(params);
      updateProfile(updated);
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

useEffect(() => {
  if (user) {
    fetchProfile();
  }
}, [user?.id]);

  const displayUser = profile || user;

  return { displayUser, profile, isLoading, error, fetchProfile, editProfile };
};