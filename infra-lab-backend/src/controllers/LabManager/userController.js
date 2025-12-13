import * as UserService from "../../services/LabManager/userService.js";

// [GET] /api/users/students (Lấy DS Active)
export const getActiveStudents = async (req, res) => {
    try {
        const students = await UserService.getActiveStudentsService();
        res.status(200).json({ success: true, data: students });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// [GET] /api/users/students/pending (Lấy DS Chờ duyệt)
export const getPendingStudents = async (req, res) => {
    try {
        const students = await UserService.getPendingStudentsService();
        res.status(200).json({ success: true, data: students });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// [GET] /api/users/:id (Xem chi tiết)
export const getStudentDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const student = await UserService.getStudentDetailService(id);
        res.status(200).json({ success: true, data: student });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};

// [PUT] /api/users/:id (Cập nhật)
export const updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedStudent = await UserService.updateStudentService(id, req.body);
        res.status(200).json({ success: true, message: "Cập nhật thành công", data: updatedStudent });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// [PATCH] /api/users/:id/soft-delete (Xóa mềm)
export const softDeleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await UserService.softDeleteStudentService(id);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// [POST] /api/users/approve (Duyệt nhiều user)
export const approveStudents = async (req, res) => {
    try {
        const { userIds } = req.body; // Expect: { userIds: ["id1", "id2"] }

        // Validate đầu vào
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ success: false, message: "Vui lòng chọn ít nhất một sinh viên để duyệt." });
        }

        const result = await UserService.approveStudentsService(userIds);
        res.status(200).json({ success: true, ...result });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};