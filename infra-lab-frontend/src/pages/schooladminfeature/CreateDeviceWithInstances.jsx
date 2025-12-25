import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout, Card, Form, Input, InputNumber, DatePicker, Select, Button, message, Row, Col, Typography, AutoComplete, Modal } from "antd";
import { UploadOutlined, PlusOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../services/api";
import SchoolAdminSidebar from "../../components/Sidebar/SchoolAdminSidebar";

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

const CreateDeviceWithInstances = () => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(""); // URL dùng để hiển thị ảnh
  const [categories, setCategories] = useState([]); // Danh sách categories
  const [categoryOptions, setCategoryOptions] = useState([]); // Options cho AutoComplete
  const [categorySearchValue, setCategorySearchValue] = useState(""); // Giá trị đang search
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [duplicateModalVisible, setDuplicateModalVisible] = useState(false);
  const [duplicateDeviceInfo, setDuplicateDeviceInfo] = useState(null);
  const [duplicateType, setDuplicateType] = useState(null); // same_category | other_category
  const [pendingPayload, setPendingPayload] = useState(null);
  const navigate = useNavigate();

  // Load danh sách categories khi component mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const res = await api.get("/categories");
      if (res.success && res.data) {
        setCategories(res.data);
        // Tạo options từ danh sách categories
        setCategoryOptions(
          res.data.map((cat) => ({
            value: cat.name,
            label: cat.name,
          }))
        );
      }
    } catch (error) {
      console.error("Load categories error:", error);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Xử lý khi search category
  const handleCategorySearch = (value) => {
    setCategorySearchValue(value);
    
    if (!value) {
      // Nếu không có giá trị, hiển thị tất cả categories
      setCategoryOptions(
        categories.map((cat) => ({
          value: cat.name,
          label: cat.name,
        }))
      );
      return;
    }

    // Filter categories theo text search
    const filtered = categories.filter((cat) =>
      cat.name.toLowerCase().includes(value.toLowerCase())
    );

    const options = filtered.map((cat) => ({
      value: cat.name,
      label: cat.name,
    }));

    // Nếu không tìm thấy category nào → thêm option "Tạo mới"
    if (filtered.length === 0) {
      options.push({
        value: `__CREATE__${value}`,
        label: (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <PlusOutlined style={{ color: "#1890ff" }} />
            <span>Tạo mới: "{value}"</span>
          </div>
        ),
        isCreate: true,
        createName: value,
      });
    }

    setCategoryOptions(options);
  };

  // Xử lý khi chọn category
  const handleCategorySelect = async (value, option) => {
    // Nếu là option "Tạo mới"
    if (option.isCreate) {
      try {
        const newCategoryName = option.createName;
        const res = await api.post("/categories", {
          name: newCategoryName,
          description: "",
        });

        if (res.success && res.data) {
          // Thêm category mới vào danh sách
          setCategories([...categories, res.data]);
          // Set giá trị cho form
          form.setFieldsValue({ category_id: res.data.name });
          setCategorySearchValue(res.data.name);
          message.success(`Đã tạo danh mục "${newCategoryName}"`);
        }
      } catch (error) {
        console.error("Create category error:", error);
        message.error(error.message || "Không thể tạo danh mục mới");
      }
    } else {
      // Chọn category có sẵn
      form.setFieldsValue({ category_id: value });
      setCategorySearchValue(value);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);

      const payload = {
        name: values.name.trim(),
        category_id: values.category_id,
        description: values.description?.trim() || "",
        image: values.image?.trim() || "",
        quantity: values.quantity,
        purchase_date: values.purchase_date.format("YYYY-MM-DD"),
        supplier: values.supplier?.trim() || "",
        invoice_number: values.invoice_number?.trim() || "",
        warranty_months: values.warranty_months || 12,
        initial_location: values.initial_location || "warehouse",
        storage_position: values.storage_position?.trim() || "",
      };

      const res = await api.post("/school-admin/devices/create-with-instances", payload);

      if (res.success) {
        message.success(res.message || "Tạo thiết bị và sinh mã thành công");
        form.resetFields();
        setDuplicateModalVisible(false);
        setDuplicateDeviceInfo(null);
        setPendingPayload(null);
        // Điều hướng về dashboard hoặc trang thiết bị
        navigate("/school/dashboard");
      } else {
        // Kiểm tra nếu là lỗi duplicate
        if (res.duplicate && res.existingDevice) {
          setDuplicateDeviceInfo(res.existingDevice);
          setDuplicateType(res.duplicateType || "same_category");
          setDuplicateModalVisible(true);
        } else {
          message.error(res.message || "Không thể tạo thiết bị");
        }
      }
    } catch (error) {
      console.error("Create device error:", error);
      
      // Kiểm tra nếu là lỗi duplicate
      if (error.duplicate && error.existingDevice) {
        setDuplicateDeviceInfo(error.existingDevice);
        setDuplicateType(error.duplicateType || "same_category");
        setDuplicateModalVisible(true);
      } else {
        message.error(error.message || "Có lỗi xảy ra khi tạo thiết bị");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Xử lý khi user xác nhận tạo thiết bị trùng
  const handleConfirmDuplicate = () => {
    if (!duplicateDeviceInfo) return;

    // Cả hai trường hợp trùng (same_category / other_category)
    // đều chuyển sang trang chi tiết để thêm sản phẩm, KHÔNG tạo thiết bị mới
    navigate(`/school/device/${duplicateDeviceInfo._id}`);
    setDuplicateModalVisible(false);
    setDuplicateDeviceInfo(null);
    setDuplicateType(null);
    setPendingPayload(null);
  };

  // Xử lý khi user hủy
  const handleCancelDuplicate = () => {
    setDuplicateModalVisible(false);
    setDuplicateDeviceInfo(null);
    setDuplicateType(null);
    setPendingPayload(null);
  };

  // Handler đơn giản: input type=\"file\" + gọi API upload ảnh
  const handleUploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);

      // Preview tạm bằng file local
      const localUrl = URL.createObjectURL(file);
      setImagePreview(localUrl);

      const formData = new FormData();
      formData.append("image", file);

      const res = await api.post("/upload/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Upload image response:", res);

      if (res.success && res.imageUrl) {
        form.setFieldsValue({ image: res.imageUrl });
        // Cập nhật preview sang URL Cloudinary (ổn định hơn)
        setImagePreview(res.imageUrl);
        message.success("Upload ảnh thành công");
      } else {
        message.error(res.message || "Upload ảnh thất bại");
      }
    } catch (error) {
      console.error("Upload image error:", error);
      message.error(error.message || "Có lỗi khi upload ảnh");
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <SchoolAdminSidebar />
      <Layout style={{ marginLeft: 260 }}>
        <Content style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
        <Card>
          <Title level={3} style={{ marginBottom: 8 }}>
            Thêm thiết bị mới & sinh mã từng sản phẩm
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 24 }}>
            School Admin tạo thiết bị mới, hệ thống sẽ tự động sinh mã cho từng sản phẩm (instance) theo số lượng nhập.
          </Paragraph>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              quantity: 1,
              warranty_months: 12,
              initial_location: "warehouse", // Mặc định là kho tổng
              purchase_date: dayjs(),
            }}
          >
            <Row gutter={16}>
              <Col span={16}>
                <Form.Item
                  label="Tên thiết bị"
                  name="name"
                  rules={[{ required: true, message: "Vui lòng nhập tên thiết bị" }]}
                >
                  <Input placeholder="VD: Chuột Logitech G102" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Danh mục"
                  name="category_id"
                  rules={[{ required: true, message: "Vui lòng chọn hoặc tạo danh mục" }]}
                >
                  <AutoComplete
                    value={categorySearchValue}
                    options={categoryOptions}
                    onSearch={handleCategorySearch}
                    onSelect={handleCategorySelect}
                    onChange={(value) => {
                      setCategorySearchValue(value);
                      form.setFieldsValue({ category_id: value });
                    }}
                    placeholder="Chọn hoặc nhập tên danh mục"
                    loading={loadingCategories}
                    allowClear
                    style={{ width: "100%" }}
                    filterOption={false} // Tắt filter mặc định vì đã tự filter
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Ảnh thiết bị">
                  {/* Hidden field để lưu URL ảnh Cloudinary */}
                  <Form.Item name="image" noStyle>
                    <Input type="hidden" />
                  </Form.Item>

                  <Button
                    icon={<UploadOutlined />}
                    loading={uploadingImage}
                    onClick={() => document.getElementById("device-image-input")?.click()}
                  >
                    Chọn file ảnh từ máy & upload
                  </Button>
                  <input
                    id="device-image-input"
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleUploadImage}
                  />
                  {imagePreview && (
                    <div style={{ marginTop: 12 }}>
                      <Typography.Text type="secondary" style={{ display: "block", marginBottom: 4 }}>
                        Xem nhanh ảnh đã upload:
                      </Typography.Text>
                      <img
                        src={imagePreview}
                        alt="preview"
                        style={{
                          maxWidth: "100%",
                          maxHeight: 160,
                          borderRadius: 8,
                          border: "1px solid #f0f0f0",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  )}
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Mô tả" name="description">
                  <Input.TextArea rows={2} placeholder="Mô tả ngắn gọn" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label="Số lượng"
                  name="quantity"
                  rules={[{ required: true, message: "Vui lòng nhập số lượng" }]}
                >
                  <InputNumber min={1} max={1000} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Thời gian bảo hành (tháng)"
                  name="warranty_months"
                >
                  <InputNumber min={0} max={60} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label="Ngày mua"
                  name="purchase_date"
                  rules={[{ required: true, message: "Vui lòng chọn ngày mua" }]}
                >
                  <DatePicker format="YYYY-MM-DD" style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Nhà cung cấp" name="supplier">
                  <Input placeholder="VD: Công ty ABC" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Số hóa đơn" name="invoice_number">
                  <Input placeholder="VD: HD-2024-001" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label="Vị trí ban đầu"
                  name="initial_location"
                  rules={[{ required: true, message: "Vui lòng chọn vị trí" }]}
                >
                  <Select>
                    <Option value="warehouse">Kho tổng (Warehouse)</Option>
                    <Option value="lab">Phòng Lab</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={16}>
                <Form.Item label="Vị trí lưu trữ" name="storage_position">
                  <Input placeholder="VD: Tủ A - Ngăn 2 - Ô 5" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item style={{ marginTop: 16 }}>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Tạo thiết bị & sinh mã
              </Button>
              <Button
                style={{ marginLeft: 8 }}
                onClick={() => navigate("/reports")}
                disabled={submitting}
              >
                Hủy
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* Modal xác nhận khi thiết bị trùng */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ExclamationCircleOutlined style={{ color: "#faad14", fontSize: 20 }} />
              <span>
                {duplicateType === "other_category"
                  ? "Thiết bị đã tồn tại ở danh mục khác"
                  : "Thiết bị đã tồn tại trong danh mục này"}
              </span>
            </div>
          }
          open={duplicateModalVisible}
          onOk={handleConfirmDuplicate}
          onCancel={handleCancelDuplicate}
          okText={
            duplicateType === "other_category"
              ? "Xem chi tiết thiết bị"
              : "Thêm vào thiết bị này"
          }
          cancelText="Hủy"
          okButtonProps={{ type: "primary" }}
          width={600}
        >
          {duplicateDeviceInfo && (
            <div>
              <Paragraph>
                <Text strong>
                  {duplicateType === "other_category"
                    ? "Thiết bị này đã tồn tại trong một danh mục khác:"
                    : "Đã có thiết bị trùng tên trong danh mục này:"}
                </Text>
              </Paragraph>
              
              <Card size="small" style={{ marginTop: 16, background: "#fafafa" }}>
                <Row gutter={[16, 8]}>
                  <Col span={12}>
                    <Text type="secondary">Tên thiết bị:</Text>
                    <div style={{ marginTop: 4 }}>
                      <Text strong>{duplicateDeviceInfo.name}</Text>
                    </div>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary">Danh mục:</Text>
                    <div style={{ marginTop: 4 }}>
                      <Text strong>{duplicateDeviceInfo.category?.name || "N/A"}</Text>
                    </div>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary">Tổng số lượng:</Text>
                    <div style={{ marginTop: 4 }}>
                      <Text strong>{duplicateDeviceInfo.totalInstances} chiếc</Text>
                    </div>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary">Phân bổ theo vị trí:</Text>
                    <div style={{ marginTop: 4 }}>
                      {Object.entries(duplicateDeviceInfo.instancesByLocation || {}).map(([loc, count]) => (
                        <div key={loc}>
                          <Text>
                            {loc === "warehouse" ? "Kho tổng" : loc === "lab" ? "Phòng Lab" : loc}:{" "}
                            <Text strong>{count} chiếc</Text>
                          </Text>
                        </div>
                      ))}
                    </div>
                  </Col>
                </Row>
              </Card>

              <Paragraph style={{ marginTop: 16, marginBottom: 0 }}>
                {duplicateType === "other_category" ? (
                  <Text type="warning">
                    Thiết bị này đã tồn tại trong một danh mục khác. Vui lòng chuyển
                    sang trang chi tiết để thêm/bổ sung thiết bị trong danh mục đã có.
                  </Text>
                ) : (
                  <Text type="warning">
                    Thiết bị này đã tồn tại trong danh mục này. Bạn có muốn thêm số lượng vào thiết bị đã có không?
                  </Text>
                )}
              </Paragraph>
            </div>
          )}
        </Modal>
        </Content>
      </Layout>
    </Layout>
  );
};

export default CreateDeviceWithInstances;


