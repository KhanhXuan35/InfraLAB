import api from './api';

/**
 * Service cho luồng mượn thiết bị (Lab Manager → School Admin)
 */

/**
 * Lab Manager tạo yêu cầu mượn thiết bị
 * @param {string} device_id - ID thiết bị
 * @param {number} qty - Số lượng
 * @param {string} user_id - ID người tạo (Lab Manager)
 * @returns {Promise}
 */
export const createBorrowRequest = async (device_id, qty, user_id) => {
  const response = await api.post('/request-lab', { device_id, qty, user_id });
  return response;
};

/**
 * School Admin xem danh sách yêu cầu mượn
 * @param {string} status - Trạng thái (WAITING, APPROVED, REJECTED, hoặc 'all')
 * @returns {Promise}
 */
export const listBorrowRequests = async (status = 'WAITING') => {
  const response = await api.get(`/request-lab?status=${status}`);
  const list = Array.isArray(response) ? response : response?.data || [];
  return list;
};

/**
 * School Admin duyệt yêu cầu mượn
 * @param {string} id - ID yêu cầu
 * @returns {Promise}
 */
export const approveBorrowRequest = async (id) => {
  const response = await api.patch(`/request-lab/${id}/approve`);
  return response;
};

/**
 * School Admin từ chối yêu cầu mượn
  @param {string} id - ID yêu cầu
  @returns {Promise}
 */
export const rejectBorrowRequest = async (id) => {
  const response = await api.patch(`/request-lab/${id}/reject`);
  return response;
};

