import api from './api';

/**
 * Service cho luồng yêu cầu thiết bị mới (Lab Manager → School Admin)
 */

/**
 * Lab Manager tạo yêu cầu thiết bị mới
 * @param {Object} deviceData - Thông tin thiết bị
 * @param {string} deviceData.name - Tên thiết bị
 * @param {string} deviceData.description - Mô tả
 * @param {string} deviceData.image - URL ảnh
 * @param {string} deviceData.category_id - ID danh mục
 * @param {number} deviceData.total - Số lượng
 * @param {string} userId - ID người tạo (Lab Manager)
 * @returns {Promise}
 */
export const createNewDeviceRequest = async (deviceData, userId) => {
  const payload = {
    ...deviceData,
    location: 'warehouse',
    userId
  };
  const response = await api.post('/devices', payload);
  return response;
};

/**
 * School Admin xem danh sách thiết bị chờ duyệt
 * @returns {Promise}
 */
export const listPendingDevices = async () => {
  const response = await api.get('/devices/pending');
  const list = Array.isArray(response) ? response : response?.data || [];
  return list;
};

/**
 * School Admin duyệt thiết bị mới
 * @param {string} id - ID thiết bị
 * @returns {Promise}
 */
export const approveNewDevice = async (id) => {
  const response = await api.patch(`/devices/${id}/approve`);
  return response;
};

/**
 * School Admin từ chối thiết bị mới
 * @param {string} id - ID thiết bị
 * @returns {Promise}
 */
export const rejectNewDevice = async (id) => {
  const response = await api.patch(`/devices/${id}/reject`);
  return response;
};

