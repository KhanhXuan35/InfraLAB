import User from "../../models/User.js";

export const getChatableUsers = async (req, res) => {
  try {
    const currentUser = req.user;
    const currentUserId = currentUser._id;
    const currentUserRole = currentUser.role;

    // Lấy danh sách users có thể chat dựa trên role
    let allowedRoles = [];
    
    switch (currentUserRole) {
      case "student":
        // Student có thể chat với lab_manager và student khác (không chat với school_admin)
        allowedRoles = ["lab_manager", "student"];
        break;
      case "lab_manager":
        // Lab manager có thể chat với student và school_admin
        allowedRoles = ["student", "school_admin"];
        break;
      case "school_admin":
        // School admin chỉ có thể chat với lab_manager
        allowedRoles = ["lab_manager"];
        break;
      default:
        allowedRoles = [];
    }

    const users = await User.find({
      _id: { $ne: currentUserId }, // Loại bỏ user hiện tại
      role: { $in: allowedRoles },
      isActive: true, // Chỉ lấy users đã active
    })
      .select("name email role avatar")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Error fetching chatable users:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

