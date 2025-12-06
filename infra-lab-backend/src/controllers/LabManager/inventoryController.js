import Inventory from "../../models/Inventory.js";
import Device from "../../models/Device.js";
import Category from "../../models/Category.js";
export const getLabDevices = async (req, res) => {
  try {
    const inventories = await Inventory.find({ location: "lab" })
      .populate({
        path: "device_id",
        populate: { path: "category_id" }
      })
      .lean();

    const data = inventories.map((i) => {
      const borrowed = (i.total || 0) - (i.available || 0) - (i.broken || 0);

      return {
        _id: i._id,
        total: i.total || 0,
        available: i.available || 0,
        broken: i.broken || 0,
        borrowed: borrowed < 0 ? 0 : borrowed,
        device: {
          name: i.device_id?.name || "N/A",
          image: i.device_id?.image || "",
          category: i.device_id?.category_id?.name || "Không rõ"
        }
      };
    });

    res.json({ data });
  } catch (err) {
    console.error("getLabDevices error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
