import Inventory from "../../models/Inventory.js";
import Device from "../../models/Device.js";
import Category from "../../models/Category.js";
import DeviceInstance from "../../models/DeviceInstance.js";

export const getLabDevices = async (req, res) => {
  try {
    const inventories = await Inventory.find({ location: "lab" })
      .populate({
        path: "device_id",
        match: { verify: true },
        populate: { path: "category_id" }
      })
      .lean();

    // Lọc bỏ các inventory không có device_id hợp lệ
    const validInventories = inventories.filter((i) => i.device_id && i.device_id._id);

    // Tính toán số liệu từ device instances thực tế ở lab
    const data = await Promise.all(
      validInventories.map(async (i) => {
        // Đếm device instances thực tế ở lab cho device này
        // CHỈ đếm các instances có location = "lab"
        const instances = await DeviceInstance.find({
          device_model_id: i.device_id._id.toString(),
          location: "lab"
        }).lean();

        const total = instances.length;
        const available = instances.filter(inst => inst.status === 'available').length;
        const broken = instances.filter(inst => inst.status === 'broken').length;
        const borrowed = instances.filter(inst => inst.status === 'borrowed').length;

        return {
          _id: i._id,
          total: total,
          available: available,
          broken: broken,
          borrowed: borrowed,
          device: {
            _id: i.device_id?._id || null,
            name: i.device_id?.name || "N/A",
            image: i.device_id?.image || "",
            category: i.device_id?.category_id?.name || "Không rõ"
          }
        };
      })
    );

    res.json({ data });
  } catch (err) {
    console.error("getLabDevices error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
// API mới: filter đa điều kiện
export const filterInventory = async (req, res) => {
  try {
    const {
      search,
      category = "all",
      status = "all",
      area = "lab",    // mặc định lọc trong Lab
      minTotal,
      maxTotal,
    } = req.query;

    // filter cơ bản trên Inventory
    const mongoFilter = {};
    if (area && area !== "all") {
      mongoFilter.location = area;
    } else {
      mongoFilter.location = "lab"; // đảm bảo Lab Manager chỉ xem Lab
    }

    if (minTotal || maxTotal) {
      mongoFilter.total = {};
      if (minTotal) mongoFilter.total.$gte = Number(minTotal);
      if (maxTotal) mongoFilter.total.$lte = Number(maxTotal);
    }

    const inventories = await Inventory.find(mongoFilter)
      .populate({
        path: "device_id",
        match: { verify: true },
        model: Device,
        populate: { path: "category_id" }
      })
      .lean();

    // Lọc bỏ các inventory không có device_id hợp lệ
    const validInventories = inventories.filter((inv) => inv.device_id && inv.device_id._id);

    // Map về cùng format với API /lab
    let data = validInventories.map((inv) => {
      const borrowed =
        (inv.total || 0) - (inv.available || 0) - (inv.broken || 0);

      return {
        _id: inv._id,
        device: {
          _id: inv.device_id?._id || null,
          name: inv.device_id?.name || "",
          category: inv.device_id?.category_id?.name || inv.device_id?.category || "",
        },
        total: inv.total || 0,
        available: inv.available || 0,
        broken: inv.broken || 0,
        borrowed: borrowed > 0 ? borrowed : 0,
      };
    });

    // Lọc thêm theo search / category / status trên JS
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((item) =>
        item.device.name.toLowerCase().includes(q)
      );
    }

    if (category && category !== "all") {
      data = data.filter((item) => item.device.category === category);
    }

    if (status && status !== "all") {
      if (status === "available") {
        data = data.filter((item) => item.available > 0);
      }
      if (status === "borrowed") {
        data = data.filter((item) => item.borrowed > 0);
      }
      if (status === "broken") {
        data = data.filter((item) => item.broken > 0);
      }
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error("filterInventory error", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};