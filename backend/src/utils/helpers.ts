/**
 * Calcula la paginación basada en page y limit
 */
export const calculatePagination = (page: number, limit: number, total: number) => {
  const currentPage = Math.max(1, page);
  const itemsPerPage = Math.max(1, Math.min(100, limit));
  const totalPages = Math.ceil(total / itemsPerPage);
  const offset = (currentPage - 1) * itemsPerPage;

  return {
    total,
    page: currentPage,
    limit: itemsPerPage,
    totalPages,
    offset,
  };
};

/**
 * Capitaliza la primera letra de un string
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Genera un código aleatorio de la longitud dada
 */
export const generateCode = (length = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};
