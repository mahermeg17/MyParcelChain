export const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp * 1000); // Convert from seconds to milliseconds
  return date.toLocaleString();
}; 