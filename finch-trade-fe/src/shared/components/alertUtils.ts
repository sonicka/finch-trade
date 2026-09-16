export const alertColors = {
  error: 'bg-red-100 border-red-400 text-red-700',
  success: 'bg-green-100 border-green-400 text-green-700',
  info: 'bg-lightBeige border-darkBeige text-darkBeige',
};

export const getAlertMessage = (
  message: string,
  type: 'error' | 'success' | 'info',
) =>
  message ||
  (type === 'error'
    ? 'Something went wrong. Please try again later.'
    : type === 'success'
      ? 'Success.'
      : '');
