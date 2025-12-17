import mongoose from "mongoose";

const deviceInstanceSchema = new mongoose.Schema({
    // ===== LIÊN KẾT VỚI DEVICE MODEL =====
    device_model_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Device", 
        required: true 
    },
    
    // ===== MÃ ĐỊNH DANH =====
    serial_number: { 
        type: String, 
        required: true, 
        unique: true,
        index: true
    },
    manufacturer_serial: { 
        type: String, 
        default: null 
    },
    
    // ===== THÔNG TIN MUA HÀNG =====
    purchase_date: { 
        type: Date, 
        required: true 
    },
    // Ở môi trường trường học, không quản lý giá bán nên để tuỳ chọn, mặc định = 0
    purchase_price: { 
        type: Number, 
        default: 0, 
        min: 0 
    },
    supplier: { 
        type: String, 
        default: null 
    },
    invoice_number: { 
        type: String, 
        default: null 
    },
    warranty_until: { 
        type: Date, 
        default: null 
    },
    
    // ===== TRẠNG THÁI =====
    status: { 
        type: String, 
        enum: ["available", "borrowed", "repairing", "broken", "retired", "maintenance"],
        default: "available",
        required: true,
        index: true
    },
    condition: { 
        type: String, 
        enum: ["new", "good", "fair", "poor"],
        default: "new",
        required: true
    },
    
    // ===== VỊ TRÍ =====
    location: { 
        type: String, 
        enum: ["warehouse", "lab", "borrowed", "repair_shop"],
        default: "warehouse",
        required: true,
        index: true
    },
    storage_position: { 
        type: String, 
        default: null 
    },
    
    // ===== THỐNG KÊ SỬ DỤNG =====
    usage_stats: {
        total_borrows: { 
            type: Number, 
            default: 0, 
            min: 0 
        },
        total_repair_times: { 
            type: Number, 
            default: 0, 
            min: 0 
        },
        total_repair_cost: { 
            type: Number, 
            default: 0, 
            min: 0 
        },
        last_borrowed_at: { 
            type: Date, 
            default: null 
        },
        last_borrowed_by: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "User", 
            default: null 
        }
    },
    
    // ===== NGƯỜI ĐANG CẦM =====
    current_holder: {
        user_id: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "User", 
            default: null 
        },
        borrow_id: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "BorrowLab", 
            default: null 
        },
        since: { 
            type: Date, 
            default: null 
        }
    },
    
    // ===== GHI CHÚ =====
    notes: { 
        type: String, 
        default: null 
    },
    images: [{ 
        type: String 
    }],
    
    // ===== NGƯỜI TẠO =====
    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    }
}, { 
    timestamps: true 
});

// ===== INDEXES =====
deviceInstanceSchema.index({ device_model_id: 1, status: 1 });
deviceInstanceSchema.index({ device_model_id: 1, location: 1, status: 1 });
deviceInstanceSchema.index({ "current_holder.borrow_id": 1 });

// ===== METHODS =====
deviceInstanceSchema.methods.isWarrantyValid = function() {
    if (!this.warranty_until) return false;
    return new Date() < this.warranty_until;
};

deviceInstanceSchema.methods.calculateScore = function() {
    let score = 100;
    
    // Ưu tiên theo condition
    const conditionScores = { new: 30, good: 20, fair: 10, poor: 0 };
    score += conditionScores[this.condition] || 0;
    
    // Phạt thiết bị đã mượn nhiều
    score -= (this.usage_stats?.total_borrows || 0) * 2;
    
    // Phạt thiết bị hay sửa
    score -= (this.usage_stats?.total_repair_times || 0) * 10;
    
    // Ưu tiên thiết bị lâu chưa dùng
    if (this.usage_stats?.last_borrowed_at) {
        const daysSince = (Date.now() - new Date(this.usage_stats.last_borrowed_at)) / (1000 * 60 * 60 * 24);
        if (daysSince > 30) score += 15;
        if (daysSince > 60) score += 25;
    } else {
        score += 10;
    }
    
    // Ưu tiên thiết bị sắp hết bảo hành
    if (this.warranty_until) {
        const daysUntilExpiry = (new Date(this.warranty_until) - Date.now()) / (1000 * 60 * 60 * 24);
        if (daysUntilExpiry > 0 && daysUntilExpiry < 90) {
            score += 10;
        }
    }
    
    return Math.max(0, Math.min(100, score));
};

export default mongoose.model("DeviceInstance", deviceInstanceSchema);

