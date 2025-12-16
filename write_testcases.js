const ExcelJS = require('exceljs');

(async () => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Test Cases');

  const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F497D' } };
  const labelFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCD12A' } };
  const passFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
  const highFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8CBAD' } };

  ws.mergeCells('A1:J1');
  const title = ws.getCell('A1');
  title.value = 'TEST CASE TEMPLATE';
  title.alignment = { horizontal: 'center', vertical: 'middle' };
  title.font = { bold: true, size: 14 };

  const metaLeft = [
    { label: 'Project Name', value: 'InfraLab Web & API' },
    { label: 'Priority', value: 'High' },
    { label: 'Description', value: 'Functional regression coverage for auth, devices, borrow, chat' },
    { label: 'Test Objective', value: 'Validate core user journeys work across roles' },
  ];
  const metaRight = [
    { label: 'Test Case Author', value: 'GPT Automation' },
    { label: 'Test Case Reviewer', value: '' },
    { label: 'Test Case Version', value: 'v1' },
    { label: 'Test Execution Date', value: '' },
  ];

  const startRow = 3;
  metaLeft.forEach((item, idx) => {
    const r = startRow + idx;
    const c1 = ws.getCell(`A${r}`);
    c1.value = item.label;
    c1.fill = labelFill;
    c1.font = { bold: true };
    c1.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };

    const c2 = ws.getCell(`B${r}`);
    c2.value = item.value;
    c2.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
  });

  metaRight.forEach((item, idx) => {
    const r = startRow + idx;
    const c1 = ws.getCell(`E${r}`);
    c1.value = item.label;
    c1.fill = labelFill;
    c1.font = { bold: true };
    c1.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };

    const c2 = ws.getCell(`F${r}`);
    c2.value = item.value;
    c2.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
  });

  const headers = [
    'Test Case ID',
    'Test Steps',
    'Input Data',
    'Expected Results',
    'Actual Results',
    'Test Environment',
    'Execution Status',
    'Bug Severity',
    'Bug Priority',
    'Notes',
  ];

  const headerRowNum = startRow + Math.max(metaLeft.length, metaRight.length) + 1;
  const hr = ws.getRow(headerRowNum);
  hr.values = headers;
  hr.height = 24;
  hr.eachCell((cell) => {
    cell.fill = headerFill;
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  });

  const cases = [
    { id: 'TC-001', steps: 'Open login page; enter valid email/password; click Login', input: 'email=user@example.com; password=Valid@123', expected: 'Login succeeds, JWT/refresh token set, redirected to role dashboard', env: 'Web - Chrome, staging API', status: 'Not Run' },
    { id: 'TC-002', steps: 'Open login page; enter valid email + wrong password; submit', input: 'email=user@example.com; password=WrongPass', expected: 'Error toast shown; stays on login; no tokens stored', env: 'Web - Chrome, staging API', status: 'Not Run' },
    { id: 'TC-003', steps: 'Navigate to Register; fill student info; submit; check email; hit verify link', input: 'name, student_code, email=new@ex.com, password=Strong@123', expected: 'Account created pending verification; verification link activates account and allows login', env: 'Web - Chrome, staging API (mail capture)', status: 'Not Run' },
    { id: 'TC-004', steps: 'Click Forgot Password; enter registered email; open reset link; set new password', input: 'email=user@example.com; newPassword=NewPass@123', expected: 'Reset email sent; link accepts new password; login works with new password only', env: 'Web - Chrome, staging API', status: 'Not Run' },
    { id: 'TC-005', steps: 'Login as student; navigate Profile > Change Password; submit with wrong old password', input: 'oldPassword=Wrong123; newPassword=Strong@456; confirm=Strong@456', expected: "API returns 400 'Mật khẩu cũ' message; password unchanged", env: 'Web - Chrome, staging API', status: 'Not Run' },
    { id: 'TC-006', steps: 'Login as student; go to Devices; filter by category with available inventory', input: 'category=Chemistry; location=lab', expected: 'Device list shows only verified devices with available>0 in lab; category info displayed', env: 'Web - Chrome, staging API', status: 'Not Run' },
    { id: 'TC-007', steps: 'Student selects device detail; submit borrow request with quantity within available; set return date & purpose', input: 'device_id=valid; quantity=1; return_due_date=+3d; purpose=Lab practice', expected: "Request created with status 'borrowed'; inventory.available decremented; entry visible in Borrowed list", env: 'Web - Chrome, staging API', status: 'Not Run' },
    { id: 'TC-008', steps: 'Student submits borrow request exceeding available quantity', input: 'device_id=valid; quantity=available+1', expected: 'API 400 with message about exceeding available; inventory unchanged', env: 'Web - Chrome, staging API', status: 'Not Run' },
    { id: 'TC-009', steps: 'Lab manager views Borrow/Return; marks borrowed item as returned', input: 'borrow_id=existing; items returned fully', expected: 'Status updated to returned; inventory.available increases accordingly; activity log updated', env: 'Web - Chrome, staging API', status: 'Not Run' },
    { id: 'TC-010', steps: 'Lab manager views Repairs list; open detail and update status to Completed', input: 'repair_id=existing; status=completed', expected: 'Repair detail shows new status; related device inventory reflects availability', env: 'Web - Chrome, staging API', status: 'Not Run' },
    { id: 'TC-011', steps: 'Student opens Conversation; send message to lab manager; receive response', input: "message='Need support'", expected: 'Message appears in thread; real-time push via socket to recipient; stored in history', env: 'Web - Chrome, staging API + socket', status: 'Not Run' },
    { id: 'TC-012', steps: 'User updates profile info (name/phone/avatar) and saves', input: 'name=New Name; phone=090xxx; avatar=png upload', expected: 'Profile updated and persists after reload; avatar served via /uploads path', env: 'Web - Chrome, staging API', status: 'Not Run' },
  ];

  let rowNum = headerRowNum + 1;
  cases.forEach((tc) => {
    const row = ws.getRow(rowNum);
    row.values = [
      tc.id,
      tc.steps,
      tc.input,
      tc.expected,
      '',
      tc.env,
      tc.status,
      '',
      '',
      tc.notes || '',
    ];
    row.eachCell((cell, colNumber) => {
      const align = [1,2,3,4,6,10].includes(colNumber)
        ? { horizontal: 'left', vertical: 'middle', wrapText: true }
        : { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.alignment = align;
    });
    rowNum += 1;
  });

  // Column widths
  const widths = [13, 40, 30, 40, 25, 25, 18, 14, 14, 20];
  widths.forEach((w, idx) => ws.getColumn(idx + 1).width = w);

  // Highlight priority cell and execution sample
  const priorityCell = ws.getCell('B4');
  priorityCell.fill = highFill;
  priorityCell.alignment = { horizontal: 'center', vertical: 'middle' };

  const execCell = ws.getCell(`G${headerRowNum + 1}`);
  execCell.fill = passFill;

  await wb.xlsx.writeFile('InfraLab_TestCases.xlsx');
  console.log('Created InfraLab_TestCases.xlsx');
})();
