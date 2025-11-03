import express from 'express';
import ExcelJS from 'exceljs';
import Order from '../models/Order.js';
import Customer from '../models/Customer.js';

const router = express.Router();

// Helper function to format Arabic date
function formatArabicDate(date) {
  return new Date(date).toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Helper function to format Arabic time
function formatArabicTime(date) {
  return new Date(date).toLocaleTimeString('ar-SA');
}

// Helper function to get status text in Arabic
function getStatusText(status) {
  const statusMap = {
    'pending': 'قيد الانتظار',
    'confirmed': 'مؤكد',
    'processing': 'قيد التجهيز',
    'shipped': 'تم الشحن',
    'delivered': 'تم التسليم',
    'cancelled': 'ملغي'
  };
  return statusMap[status] || status;
}

// Helper function to generate invoice content for a worksheet
async function generateInvoiceContent(worksheet, order) {
  // Set RTL direction
  worksheet.views = [{ rightToLeft: true }];

  // Premium styling with black, white, and gray theme
  const headerStyle = {
    font: { name: 'Calibri', size: 20, bold: true, color: { argb: 'FFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '000000' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
    border: {
      top: { style: 'thick', color: { argb: '000000' } },
      left: { style: 'thick', color: { argb: '000000' } },
      bottom: { style: 'thick', color: { argb: '000000' } },
      right: { style: 'thick', color: { argb: '000000' } }
    }
  };

  const subHeaderStyle = {
    font: { name: 'Calibri', size: 14, bold: true, color: { argb: '000000' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F5F5F5' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
    border: {
      top: { style: 'medium', color: { argb: '808080' } },
      left: { style: 'medium', color: { argb: '808080' } },
      bottom: { style: 'medium', color: { argb: '808080' } },
      right: { style: 'medium', color: { argb: '808080' } }
    }
  };

  const cellStyle = {
    font: { name: 'Calibri', size: 11, color: { argb: '000000' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
    border: {
      top: { style: 'thin', color: { argb: 'C0C0C0' } },
      left: { style: 'thin', color: { argb: 'C0C0C0' } },
      bottom: { style: 'thin', color: { argb: 'C0C0C0' } },
      right: { style: 'thin', color: { argb: 'C0C0C0' } }
    },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } }
  };

  const infoLabelStyle = {
    font: { name: 'Calibri', size: 12, bold: true, color: { argb: '000000' } },
    alignment: { horizontal: 'right', vertical: 'middle' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8F8F8' } },
    border: {
      top: { style: 'thin', color: { argb: 'C0C0C0' } },
      left: { style: 'thin', color: { argb: 'C0C0C0' } },
      bottom: { style: 'thin', color: { argb: 'C0C0C0' } },
      right: { style: 'thin', color: { argb: 'C0C0C0' } }
    }
  };

  const infoValueStyle = {
    font: { name: 'Calibri', size: 12, color: { argb: '000000' } },
    alignment: { horizontal: 'left', vertical: 'middle' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } },
    border: {
      top: { style: 'thin', color: { argb: 'C0C0C0' } },
      left: { style: 'thin', color: { argb: 'C0C0C0' } },
      bottom: { style: 'thin', color: { argb: 'C0C0C0' } },
      right: { style: 'thin', color: { argb: 'C0C0C0' } }
    }
  };

  // Company Header
  worksheet.mergeCells('A1:F1');
  worksheet.getCell('A1').value = 'فاتورة طلب -    After Ads';
  worksheet.getCell('A1').style = headerStyle;
  worksheet.getRow(1).height = 30;

  // Order Information
  worksheet.mergeCells('A3:B3');
  worksheet.getCell('A3').value = 'معلومات الطلب';
  worksheet.getCell('A3').style = subHeaderStyle;

  worksheet.getCell('A4').value = 'رقم الطلب:';
  worksheet.getCell('A4').style = infoLabelStyle;
  worksheet.getCell('B4').value = order._id || order.id;
  worksheet.getCell('B4').style = infoValueStyle;
  
  worksheet.getCell('A5').value = 'تاريخ الطلب:';
  worksheet.getCell('A5').style = infoLabelStyle;
  worksheet.getCell('B5').value = formatArabicDate(order.createdAt || order.orderDate);
  worksheet.getCell('B5').style = infoValueStyle;
  
  worksheet.getCell('A6').value = 'وقت الطلب:';
  worksheet.getCell('A6').style = infoLabelStyle;
  worksheet.getCell('B6').value = formatArabicTime(order.createdAt || order.orderDate);
  worksheet.getCell('B6').style = infoValueStyle;
  
  worksheet.getCell('A7').value = 'حالة الطلب:';
  worksheet.getCell('A7').style = infoLabelStyle;
  worksheet.getCell('B7').value = getStatusText(order.status);
  worksheet.getCell('B7').style = infoValueStyle;

  // Customer Information
  worksheet.mergeCells('D3:F3');
  worksheet.getCell('D3').value = 'معلومات العميل';
  worksheet.getCell('D3').style = subHeaderStyle;

  worksheet.getCell('D4').value = 'اسم العميل:';
  worksheet.getCell('D4').style = infoLabelStyle;
  worksheet.getCell('E4').value = order.customerInfo?.name || order.customerName || 'غير محدد';
  worksheet.getCell('E4').style = infoValueStyle;
  
  worksheet.getCell('D5').value = 'رقم الهاتف:';
  worksheet.getCell('D5').style = infoLabelStyle;
  worksheet.getCell('E5').value = order.customerInfo?.phone || order.customerPhone || 'غير محدد';
  worksheet.getCell('E5').style = infoValueStyle;
  
  worksheet.getCell('D6').value = 'البريد الإلكتروني:';
  worksheet.getCell('D6').style = infoLabelStyle;
  worksheet.getCell('E6').value = order.customerInfo?.email || order.customerEmail || 'غير محدد';
  worksheet.getCell('E6').style = infoValueStyle;
  


  // Products Header
  worksheet.mergeCells('A9:F9');
  worksheet.getCell('A9').value = 'تفاصيل المنتجات';
  worksheet.getCell('A9').style = subHeaderStyle;

  // Products Table Headers
  const headers = ['المنتج', 'الكمية', 'السعر الواحد', 'الخيارات', 'المجموع'];
  headers.forEach((header, index) => {
    const cell = worksheet.getCell(10, index + 1);
    cell.value = header;
    cell.style = subHeaderStyle;
  });

  // Products Data
  let currentRow = 11;
  let totalAmount = 0;

  if (order.items && Array.isArray(order.items)) {
    for (const item of order.items) {
      const productName = item.productName || item.name || 'منتج غير محدد';
      const quantity = item.quantity || 1;
      const price = item.price || 0;
      const options = item.selectedOptions ? 
        Object.entries(item.selectedOptions)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ') : 'لا توجد خيارات';
      const itemTotal = quantity * price;
      totalAmount += itemTotal;

      worksheet.getCell(currentRow, 1).value = productName;
      worksheet.getCell(currentRow, 2).value = quantity;
      worksheet.getCell(currentRow, 3).value = `${price} ج.م`;
      worksheet.getCell(currentRow, 4).value = options;
      worksheet.getCell(currentRow, 5).value = `${itemTotal} ج.م`;

      // Apply cell styling
      for (let col = 1; col <= 5; col++) {
        worksheet.getCell(currentRow, col).style = cellStyle;
      }

      currentRow++;
    }
  }

  // Total Section with breakdown
  currentRow += 1;
  
  // Subtotal
  worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
  worksheet.getCell(`A${currentRow}`).value = 'المجموع الفرعي:';
  worksheet.getCell(`A${currentRow}`).style = {
    ...subHeaderStyle,
    alignment: { horizontal: 'right', vertical: 'middle' }
  };
  worksheet.getCell(`E${currentRow}`).value = `${order.subtotal || totalAmount} ج.م`;
  worksheet.getCell(`E${currentRow}`).style = {
    font: { name: 'Arial', size: 12, bold: false, color: { argb: '000000' } },
    alignment: { horizontal: 'right', vertical: 'middle' }
  };
  

  
  // Coupon Discount
  if (order.couponDiscount && order.couponDiscount > 0) {
    currentRow++;
    worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = 'خصم الكوبون:';
    worksheet.getCell(`A${currentRow}`).style = {
      ...subHeaderStyle,
      alignment: { horizontal: 'right', vertical: 'middle' }
    };
    worksheet.getCell(`E${currentRow}`).value = `-${order.couponDiscount} ج.م`;
    worksheet.getCell(`E${currentRow}`).style = {
      font: { name: 'Arial', size: 12, bold: false, color: { argb: 'FF0000' } },
      alignment: { horizontal: 'right', vertical: 'middle' }
    };
  }
  
  // Regular Discount
  if (order.discount && order.discount > 0) {
    currentRow++;
    worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = 'الخصم:';
    worksheet.getCell(`A${currentRow}`).style = {
      ...subHeaderStyle,
      alignment: { horizontal: 'right', vertical: 'middle' }
    };
    worksheet.getCell(`E${currentRow}`).value = `-${order.discount} ج.م`;
    worksheet.getCell(`E${currentRow}`).style = {
      font: { name: 'Arial', size: 12, bold: false, color: { argb: 'FF0000' } },
      alignment: { horizontal: 'right', vertical: 'middle' }
    };
  }
  
  // Final Total
  currentRow++;
  worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
  worksheet.getCell(`A${currentRow}`).value = 'المجموع النهائي:';
  worksheet.getCell(`A${currentRow}`).style = {
    ...subHeaderStyle,
    alignment: { horizontal: 'right', vertical: 'middle' },
    font: { name: 'Arial', size: 14, bold: true, color: { argb: '000000' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F5F5F5' } }
  };
  worksheet.getCell(`E${currentRow}`).value = `${order.total || order.totalAmount || (totalAmount - (order.couponDiscount || 0) - (order.discount || 0))} ج.م`;
  worksheet.getCell(`E${currentRow}`).style = {
    font: { name: 'Arial', size: 14, bold: true, color: { argb: '000000' } },
    alignment: { horizontal: 'right', vertical: 'middle' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F5F5F5' } }
  };

  // Payment Information
  if (order.paymentMethod) {
    currentRow += 2;
    worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = 'معلومات الدفع';
    worksheet.getCell(`A${currentRow}`).style = subHeaderStyle;

    currentRow++;
    worksheet.getCell(`A${currentRow}`).value = 'طريقة الدفع:';
    worksheet.getCell(`A${currentRow}`).style = infoLabelStyle;
    worksheet.getCell(`B${currentRow}`).value = order.paymentMethod === 'cash' ? 'الدفع عند الاستلام' : order.paymentMethod;
    worksheet.getCell(`B${currentRow}`).style = infoValueStyle;
  }

  // Footer
  currentRow += 3;
  worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
  worksheet.getCell(`A${currentRow}`).value = 'شكراً لتسوقكم معنا -    After Ads';
  worksheet.getCell(`A${currentRow}`).style = {
    font: { name: 'Calibri', size: 16, bold: true, color: { argb: '000000' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F0F0F0' } },
    border: {
      top: { style: 'medium', color: { argb: '808080' } },
      left: { style: 'medium', color: { argb: '808080' } },
      bottom: { style: 'medium', color: { argb: '808080' } },
      right: { style: 'medium', color: { argb: '808080' } }
    }
  };

  // Set column widths
  worksheet.getColumn(1).width = 25;
  worksheet.getColumn(2).width = 10;
  worksheet.getColumn(3).width = 15;
  worksheet.getColumn(4).width = 30;
  worksheet.getColumn(5).width = 15;
  worksheet.getColumn(6).width = 15;

}

// Generate Excel Invoice for Single Order
async function generateExcelInvoice(order) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('فاتورة الطلب');
  
  await generateInvoiceContent(worksheet, order);
  
  return workbook;
}

// Generate Monthly Statistics Excel
async function generateMonthlyStatsExcel(year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  // Get orders for the month
  const orders = await Order.find({
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ createdAt: -1 });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(`إحصائيات ${month}-${year}`.replace(/\//g, '-'));

  // Set RTL direction
  worksheet.views = [{ rightToLeft: true }];

  // Premium styling for reports
  const headerStyle = {
    font: { name: 'Calibri', size: 20, bold: true, color: { argb: 'FFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '000000' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
    border: {
      top: { style: 'thick', color: { argb: '000000' } },
      left: { style: 'thick', color: { argb: '000000' } },
      bottom: { style: 'thick', color: { argb: '000000' } },
      right: { style: 'thick', color: { argb: '000000' } }
    }
  };

  const subHeaderStyle = {
    font: { name: 'Calibri', size: 14, bold: true, color: { argb: '000000' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F5F5F5' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
    border: {
      top: { style: 'medium', color: { argb: '808080' } },
      left: { style: 'medium', color: { argb: '808080' } },
      bottom: { style: 'medium', color: { argb: '808080' } },
      right: { style: 'medium', color: { argb: '808080' } }
    }
  };

  const cellStyle = {
    font: { name: 'Calibri', size: 11, color: { argb: '000000' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
    border: {
      top: { style: 'thin', color: { argb: 'C0C0C0' } },
      left: { style: 'thin', color: { argb: 'C0C0C0' } },
      bottom: { style: 'thin', color: { argb: 'C0C0C0' } },
      right: { style: 'thin', color: { argb: 'C0C0C0' } }
    },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } }
  };

  const summaryStyle = {
    font: { name: 'Calibri', size: 12, bold: true, color: { argb: '000000' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8F8F8' } },
    alignment: { horizontal: 'right', vertical: 'middle' },
    border: {
      top: { style: 'thin', color: { argb: 'C0C0C0' } },
      left: { style: 'thin', color: { argb: 'C0C0C0' } },
      bottom: { style: 'thin', color: { argb: 'C0C0C0' } },
      right: { style: 'thin', color: { argb: 'C0C0C0' } }
    }
  };

  const summaryValueStyle = {
    font: { name: 'Calibri', size: 12, color: { argb: '000000' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } },
    alignment: { horizontal: 'left', vertical: 'middle' },
    border: {
      top: { style: 'thin', color: { argb: 'C0C0C0' } },
      left: { style: 'thin', color: { argb: 'C0C0C0' } },
      bottom: { style: 'thin', color: { argb: 'C0C0C0' } },
      right: { style: 'thin', color: { argb: 'C0C0C0' } }
    }
  };

  // Title
  worksheet.mergeCells('A1:G1');
  worksheet.getCell('A1').value = `إحصائيات شهر ${month}-${year} -    After Ads`;
  worksheet.getCell('A1').style = headerStyle;
  worksheet.getRow(1).height = 30;

  // Summary Statistics
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total || order.totalAmount || 0), 0);
  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  worksheet.getCell('A3').value = 'إجمالي الطلبات:';
  worksheet.getCell('A3').style = summaryStyle;
  worksheet.getCell('B3').value = totalOrders;
  worksheet.getCell('B3').style = summaryValueStyle;
  worksheet.getCell('A4').value = 'إجمالي الإيرادات:';
  worksheet.getCell('A4').style = summaryStyle;
  worksheet.getCell('B4').value = `${totalRevenue} ج.م`;
  worksheet.getCell('B4').style = summaryValueStyle;

  // Status breakdown
  let row = 6;
  worksheet.getCell(`A${row}`).value = 'توزيع الطلبات حسب الحالة:';
  worksheet.getCell(`A${row}`).style = subHeaderStyle;
  row++;

  Object.entries(statusCounts).forEach(([status, count]) => {
    worksheet.getCell(`A${row}`).value = getStatusText(status);
    worksheet.getCell(`A${row}`).style = summaryStyle;
    worksheet.getCell(`B${row}`).value = count;
    worksheet.getCell(`B${row}`).style = summaryValueStyle;
    row++;
  });

  // Orders Table
  row += 2;
  worksheet.mergeCells(`A${row}:G${row}`);
  worksheet.getCell(`A${row}`).value = 'تفاصيل الطلبات';
  worksheet.getCell(`A${row}`).style = subHeaderStyle;
  row++;

  // Table Headers
  const headers = ['رقم الطلب', 'اسم العميل', 'التاريخ', 'المبلغ', 'الحالة', 'طريقة الدفع', 'عدد المنتجات'];
  headers.forEach((header, index) => {
    worksheet.getCell(row, index + 1).value = header;
    worksheet.getCell(row, index + 1).style = subHeaderStyle;
  });
  row++;

  // Orders Data
  orders.forEach(order => {
    worksheet.getCell(row, 1).value = order._id.toString();
    worksheet.getCell(row, 1).style = cellStyle;
    worksheet.getCell(row, 2).value = order.customerInfo?.name || order.customerName || 'غير محدد';
    worksheet.getCell(row, 2).style = cellStyle;
    worksheet.getCell(row, 3).value = formatArabicDate(order.createdAt);
    worksheet.getCell(row, 3).style = cellStyle;
    worksheet.getCell(row, 4).value = `${order.total || order.totalAmount || 0} ج.م`;
    worksheet.getCell(row, 4).style = cellStyle;
    worksheet.getCell(row, 5).value = getStatusText(order.status);
    worksheet.getCell(row, 5).style = cellStyle;
    worksheet.getCell(row, 6).value = order.paymentMethod === 'cash' ? 'الدفع عند الاستلام' : order.paymentMethod;
    worksheet.getCell(row, 6).style = cellStyle;
    worksheet.getCell(row, 7).value = order.items ? order.items.length : 0;
    worksheet.getCell(row, 7).style = cellStyle;
    row++;
  });

  // Set column widths
  worksheet.getColumn(1).width = 25;
  worksheet.getColumn(2).width = 20;
  worksheet.getColumn(3).width = 20;
  worksheet.getColumn(4).width = 15;
  worksheet.getColumn(5).width = 15;
  worksheet.getColumn(6).width = 20;
  worksheet.getColumn(7).width = 15;

  return workbook;
}

// Generate Daily Statistics Excel
async function generateDailyStatsExcel(year, month, day) {
  const startDate = new Date(year, month - 1, day, 0, 0, 0);
  const endDate = new Date(year, month - 1, day, 23, 59, 59);

  // Get orders for the day
  const orders = await Order.find({
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ createdAt: -1 });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(`إحصائيات ${day}-${month}-${year}`.replace(/\//g, '-'));

  // Set RTL direction
  worksheet.views = [{ rightToLeft: true }];

  // Similar structure to monthly stats but for daily data
  const headerStyle = {
    font: { name: 'Calibri', size: 18, bold: true, color: { argb: 'FFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '2C2C2C' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
    border: {
      top: { style: 'thick', color: { argb: '000000' } },
      left: { style: 'thick', color: { argb: '000000' } },
      bottom: { style: 'thick', color: { argb: '000000' } },
      right: { style: 'thick', color: { argb: '000000' } }
    }
  };

  const subHeaderStyle = {
    font: { name: 'Calibri', size: 14, bold: true, color: { argb: '000000' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D3D3D3' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
    border: {
      top: { style: 'thin', color: { argb: '808080' } },
      left: { style: 'thin', color: { argb: '808080' } },
      bottom: { style: 'thin', color: { argb: '808080' } },
      right: { style: 'thin', color: { argb: '808080' } }
    }
  };

  const cellStyle = {
    font: { name: 'Calibri', size: 11, color: { argb: '000000' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
    border: {
      top: { style: 'thin', color: { argb: 'C0C0C0' } },
      left: { style: 'thin', color: { argb: 'C0C0C0' } },
      bottom: { style: 'thin', color: { argb: 'C0C0C0' } },
      right: { style: 'thin', color: { argb: 'C0C0C0' } }
    }
  };

  const summaryStyle = {
    font: { name: 'Calibri', size: 12, bold: true, color: { argb: '000000' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8F8F8' } },
    alignment: { horizontal: 'right', vertical: 'middle' },
    border: {
      top: { style: 'thin', color: { argb: 'C0C0C0' } },
      left: { style: 'thin', color: { argb: 'C0C0C0' } },
      bottom: { style: 'thin', color: { argb: 'C0C0C0' } },
      right: { style: 'thin', color: { argb: 'C0C0C0' } }
    }
  };

  const summaryValueStyle = {
    font: { name: 'Calibri', size: 12, color: { argb: '000000' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } },
    alignment: { horizontal: 'left', vertical: 'middle' },
    border: {
      top: { style: 'thin', color: { argb: 'C0C0C0' } },
      left: { style: 'thin', color: { argb: 'C0C0C0' } },
      bottom: { style: 'thin', color: { argb: 'C0C0C0' } },
      right: { style: 'thin', color: { argb: 'C0C0C0' } }
    }
  };

  // Title
  worksheet.mergeCells('A1:G1');
  worksheet.getCell('A1').value = `إحصائيات يوم ${day}-${month}-${year} -    After Ads`;
  worksheet.getCell('A1').style = headerStyle;
  worksheet.getRow(1).height = 30;

  // Summary Statistics
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total || order.totalAmount || 0), 0);
  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  worksheet.getCell('A3').value = 'إجمالي الطلبات:';
  worksheet.getCell('A3').style = summaryStyle;
  worksheet.getCell('B3').value = totalOrders;
  worksheet.getCell('B3').style = summaryValueStyle;
  worksheet.getCell('A4').value = 'إجمالي الإيرادات:';
  worksheet.getCell('A4').style = summaryStyle;
  worksheet.getCell('B4').value = `${totalRevenue} ج.م`;
  worksheet.getCell('B4').style = summaryValueStyle;

  // Status breakdown
  let row = 6;
  worksheet.getCell(`A${row}`).value = 'توزيع الطلبات حسب الحالة:';
  worksheet.getCell(`A${row}`).style = subHeaderStyle;
  row++;

  Object.entries(statusCounts).forEach(([status, count]) => {
    worksheet.getCell(`A${row}`).value = getStatusText(status);
    worksheet.getCell(`A${row}`).style = summaryStyle;
    worksheet.getCell(`B${row}`).value = count;
    worksheet.getCell(`B${row}`).style = summaryValueStyle;
    row++;
  });

  // Orders Table
  row += 2;
  worksheet.mergeCells(`A${row}:G${row}`);
  worksheet.getCell(`A${row}`).value = 'تفاصيل الطلبات';
  worksheet.getCell(`A${row}`).style = subHeaderStyle;
  row++;

  // Table Headers
  const headers = ['رقم الطلب', 'اسم العميل', 'الوقت', 'المبلغ', 'الحالة', 'طريقة الدفع', 'عدد المنتجات'];
  headers.forEach((header, index) => {
    worksheet.getCell(row, index + 1).value = header;
    worksheet.getCell(row, index + 1).style = subHeaderStyle;
  });
  row++;

  // Orders Data
  orders.forEach(order => {
    worksheet.getCell(row, 1).value = order._id.toString();
    worksheet.getCell(row, 1).style = cellStyle;
    worksheet.getCell(row, 2).value = order.customerInfo?.name || order.customerName || 'غير محدد';
    worksheet.getCell(row, 2).style = cellStyle;
    worksheet.getCell(row, 3).value = formatArabicTime(order.createdAt);
    worksheet.getCell(row, 3).style = cellStyle;
    worksheet.getCell(row, 4).value = `${order.total || order.totalAmount || 0} ج.م`;
    worksheet.getCell(row, 4).style = cellStyle;
    worksheet.getCell(row, 5).value = getStatusText(order.status);
    worksheet.getCell(row, 5).style = cellStyle;
    worksheet.getCell(row, 6).value = order.paymentMethod === 'cash' ? 'الدفع عند الاستلام' : order.paymentMethod;
    worksheet.getCell(row, 6).style = cellStyle;
    worksheet.getCell(row, 7).value = order.items ? order.items.length : 0;
    worksheet.getCell(row, 7).style = cellStyle;
    row++;
  });

  // Set column widths
  worksheet.getColumn(1).width = 25;
  worksheet.getColumn(2).width = 20;
  worksheet.getColumn(3).width = 15;
  worksheet.getColumn(4).width = 15;
  worksheet.getColumn(5).width = 15;
  worksheet.getColumn(6).width = 20;
  worksheet.getColumn(7).width = 15;

  return workbook;
}

// Routes

// Generate single order invoice
router.post('/single', async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Get order from database using id field
    const orderIdNum = parseInt(orderId);
    const orders = await Order.find({}, null, { lean: true });
    const order = orders.find(o => o.id === orderIdNum);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Generate Excel invoice
    try {
      const workbook = await generateExcelInvoice(order);
      const buffer = await workbook.xlsx.writeBuffer();
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${orderId}.xlsx"`);
      res.send(buffer);
    } catch (error) {
      console.error('Error in generateExcelInvoice:', error);
      return res.status(500).json({ error: 'Failed to generate invoice', details: error.message });
    }

  } catch (error) {
    console.error('Invoice generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate invoice',
      details: error.message 
    });
  }
});

// Generate monthly statistics
router.post('/monthly-stats', async (req, res) => {
  try {
    const { year, month } = req.body;

    if (!year || !month) {
      return res.status(400).json({ error: 'Year and month are required' });
    }

    const workbook = await generateMonthlyStatsExcel(parseInt(year), parseInt(month));
    const buffer = await workbook.xlsx.writeBuffer();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="monthly-stats-${year}-${month}.xlsx"`);
    res.send(buffer);

  } catch (error) {
    console.error('Monthly stats generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate monthly statistics',
      details: error.message 
    });
  }
});

// Generate daily statistics
router.post('/daily-stats', async (req, res) => {
  try {
    const { year, month, day } = req.body;

    if (!year || !month || !day) {
      return res.status(400).json({ error: 'Year, month, and day are required' });
    }

    const workbook = await generateDailyStatsExcel(parseInt(year), parseInt(month), parseInt(day));
    const buffer = await workbook.xlsx.writeBuffer();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="daily-stats-${year}-${month}-${day}.xlsx"`);
    res.send(buffer);

  } catch (error) {
    console.error('Daily stats generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate daily statistics',
      details: error.message 
    });
  }
});

// Generate Excel Invoice for Multiple Orders
router.post('/multiple', async (req, res) => {
  try {
    const { orderIds } = req.body;
    
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ error: 'يجب تقديم مصفوفة من معرفات الطلبات' });
    }

    const workbook = new ExcelJS.Workbook();
    
    for (const orderId of orderIds) {
      const orderIdNum = parseInt(orderId);
      if (isNaN(orderIdNum)) {
        continue; // Skip invalid order IDs
      }
      
      // Find order using the same method as single invoice
      const orders = await Order.find({}, null, { lean: true });
      const order = orders.find(o => o.id === orderIdNum);
      
      if (!order) {
        continue; // Skip orders that don't exist
      }
      
      // Get customer data
      const customer = await Customer.findById(order.customerId).lean();
      if (!customer) {
        continue; // Skip orders without customer data
      }
      
      // Add order data to the order object
      order.customer = customer;
      
      // Create worksheet for this order
      const worksheet = workbook.addWorksheet(`فاتورة الطلب ${order.id}`);
      
      // Set RTL direction
      worksheet.views = [{ rightToLeft: true }];
      
      // Generate invoice content (reuse the same logic as single invoice)
      await generateInvoiceContent(worksheet, order);
    }
    
    if (workbook.worksheets.length === 0) {
      return res.status(404).json({ error: 'لم يتم العثور على أي طلبات صالحة' });
    }
    
    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="فواتير-متعددة-${new Date().toISOString().split('T')[0]}.xlsx"`);
    res.send(buffer);
    
  } catch (error) {
    console.error('Error generating multiple invoices:', error);
    res.status(500).json({ error: 'خطأ في إنشاء الفواتير المتعددة' });
  }
});

export default router;