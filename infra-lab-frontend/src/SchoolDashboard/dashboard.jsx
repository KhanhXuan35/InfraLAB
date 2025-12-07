import React from 'react';

const REQUESTS = [
  { id: 'REQ-245', teacher: 'Thay Minh', device: 'May quang pho UV-Vis', department: 'Hoa phan tich', dueDate: 'Truoc 10/12', status: 'Cho duyet', badge: 'status-pending' },
  { id: 'REQ-231', teacher: 'Co Lan', device: 'Bo cam bien sinh hoc', department: 'Cong nghe sinh hoc', dueDate: 'Truoc 08/12', status: 'Uu tien cao', badge: 'status-urgent' },
  { id: 'REQ-227', teacher: 'Thay Huy', device: 'Kinh hien vi dien tu', department: 'Vat lieu', dueDate: 'Truoc 15/12', status: 'San sang xuat', badge: 'status-ready' },
  { id: 'REQ-225', teacher: 'Co Tram', device: 'May PCR Real-Time', department: 'Sinh hoc phan tu', dueDate: 'Truoc 12/12', status: 'Cho duyet', badge: 'status-pending' },
];

const HIGHLIGHTS = [
  { label: 'Yeu cau cho duyet', value: '08', trend: '+2 yeu cau moi hom nay', color: '#fbbf24' },
  { label: 'Thiet bi san sang xuat', value: '320', trend: 'Tang 12 thiet bi', color: '#34d399' },
  { label: 'Lo hang dang giao', value: '03', trend: 'Cap nhat 2 gio truoc', color: '#38bdf8' },
];

function DashboardOverview() {
  return (
    <>
      <section className="supplier-highlight">
        {HIGHLIGHTS.map((item) => (
          <div className="highlight-card" key={item.label}>
            <div className="highlight-label">
              <span>{item.label}</span>
              <span role="img" aria-label="icon">
                *
              </span>
            </div>
            <div className="highlight-value" style={{ color: item.color }}>
              {item.value}
            </div>
            <div className="highlight-trend">{item.trend}</div>
          </div>
        ))}
      </section>

      <section className="supplier-panels">
        <div className="panel-card">
          <div className="panel-title">Yeu cau moi tu giao vien</div>
          <div className="panel-subtitle">Uu tien xu ly trong 24 gio</div>

          <div className="panel-list">
            {REQUESTS.map((req) => (
              <div className="request-item" key={req.id}>
                <div className="request-details">
                  <div className="request-name">
                    {req.id} - {req.teacher}
                  </div>
                  <div className="request-meta">
                    {req.device} - {req.department}
                  </div>
                  <div className="request-date">{req.dueDate}</div>
                </div>
                <div className={`status-pill ${req.badge}`}>{req.status}</div>
              </div>
            ))}
          </div>

          <div className="supplier-actions">
            <button className="button-primary green">Duyet nhanh</button>
            <button className="button-secondary">Xem tat ca</button>
          </div>
        </div>
      </section>
    </>
  );
}

export default DashboardOverview;
