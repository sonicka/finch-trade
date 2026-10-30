import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { editUser, fetchUser } from '../../api/api';
import { userDataQueryKeys } from '../context/UserProvider';
import { User } from '../types';

type EditUserData = {
  email?: string;
  password?: string;
  passwordAgain?: string;
};

export const useUserById = (userId: number) => {
  const { data: user } = useQuery<User>({
    queryKey: userDataQueryKeys.user(userId),
    queryFn: () => fetchUser(userId),
    enabled: Boolean(userId),
  });

  return user;
};

export const useEditUser = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: EditUserData }) =>
      editUser(userId, data),
    onSuccess: async (_response, { userId }) => {
      await queryClient.invalidateQueries({
        queryKey: userDataQueryKeys.user(userId),
      });
    },
  });

  const edit = async (userId: number, data: EditUserData): Promise<boolean> => {
    try {
      await mutation.mutateAsync({ userId, data });
      return true;
    } catch {
      return false;
    }
  };

  const error =
    mutation.error instanceof Error
      ? mutation.error.message
      : mutation.error
        ? 'Failed to edit the user.'
        : '';
  const success = mutation.isSuccess ? mutation.data.message : '';

  return { edit, error, success, loading: mutation.isPending };
};
