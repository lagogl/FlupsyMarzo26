import ExcelJS from 'exceljs';

export interface ExcelFormatterOptions {
  headerBgColor?: string;
  headerFontColor?: string;
  alternateRowColor?: string;
  totalRowBgColor?: string;
}

const DEFAULT_OPTIONS: ExcelFormatterOptions = {
  headerBgColor: '1F4E79',
  headerFontColor: 'FFFFFF',
  alternateRowColor: 'F2F2F2',
  totalRowBgColor: 'D9E2F3'
};

export function applyHeaderStyle(row: ExcelJS.Row, options: ExcelFormatterOptions = DEFAULT_OPTIONS) {
  row.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: options.headerBgColor || DEFAULT_OPTIONS.headerBgColor }
    };
    cell.font = {
      bold: true,
      color: { argb: options.headerFontColor || DEFAULT_OPTIONS.headerFontColor }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  row.height = 25;
}

export function applyDataRowStyle(row: ExcelJS.Row, isAlternate: boolean, options: ExcelFormatterOptions = DEFAULT_OPTIONS) {
  row.eachCell((cell) => {
    if (isAlternate) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: options.alternateRowColor || DEFAULT_OPTIONS.alternateRowColor }
      };
    }
    cell.border = {
      top: { style: 'thin', color: { argb: 'D0D0D0' } },
      left: { style: 'thin', color: { argb: 'D0D0D0' } },
      bottom: { style: 'thin', color: { argb: 'D0D0D0' } },
      right: { style: 'thin', color: { argb: 'D0D0D0' } }
    };
    cell.alignment = { vertical: 'middle' };
  });
}

export function applyTotalRowStyle(row: ExcelJS.Row, options: ExcelFormatterOptions = DEFAULT_OPTIONS) {
  row.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: options.totalRowBgColor || DEFAULT_OPTIONS.totalRowBgColor }
    };
    cell.font = { bold: true };
    cell.border = {
      top: { style: 'medium' },
      left: { style: 'thin' },
      bottom: { style: 'medium' },
      right: { style: 'thin' }
    };
    cell.alignment = { vertical: 'middle' };
  });
}

export function applyTitleStyle(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, size: 14, color: { argb: '1F4E79' } };
  });
  row.height = 25;
}

export function applySectionTitleStyle(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, size: 11, color: { argb: '2E75B6' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'DEEAF6' }
    };
  });
}

export function applyStatusStyle(cell: ExcelJS.Cell, status: string) {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('coperto') || statusLower === 'in linea') {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'C6EFCE' }
    };
    cell.font = { color: { argb: '006100' }, bold: true };
  } else if (statusLower.includes('budget') && statusLower.includes('ordini')) {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFC7CE' }
    };
    cell.font = { color: { argb: '9C0006' }, bold: true };
  } else if (statusLower.includes('budget')) {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEB9C' }
    };
    cell.font = { color: { argb: '9C5700' }, bold: true };
  } else if (statusLower.includes('ordini')) {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEB9C' }
    };
    cell.font = { color: { argb: '9C5700' }, bold: true };
  }
}

export function setColumnWidths(worksheet: ExcelJS.Worksheet, widths: number[]) {
  widths.forEach((width, index) => {
    worksheet.getColumn(index + 1).width = width;
  });
}

export function applyNumberFormat(cell: ExcelJS.Cell, format: string = '#,##0') {
  cell.numFmt = format;
}

export function createFormattedWorkbook(): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'FLUPSY Management System';
  workbook.created = new Date();
  return workbook;
}

export function addFormattedSheet(
  workbook: ExcelJS.Workbook, 
  name: string, 
  headers: string[], 
  data: any[][],
  options?: {
    columnWidths?: number[];
    statusColumnIndex?: number;
    hasTotalRow?: boolean;
  }
): ExcelJS.Worksheet {
  const worksheet = workbook.addWorksheet(name);
  
  const headerRow = worksheet.addRow(headers);
  applyHeaderStyle(headerRow);
  
  data.forEach((rowData, index) => {
    const row = worksheet.addRow(rowData);
    const isLastRow = index === data.length - 1;
    const isTotalRow = options?.hasTotalRow && isLastRow;
    
    if (isTotalRow) {
      applyTotalRowStyle(row);
    } else {
      applyDataRowStyle(row, index % 2 === 1);
    }
    
    if (options?.statusColumnIndex !== undefined && !isTotalRow) {
      const statusCell = row.getCell(options.statusColumnIndex + 1);
      const statusValue = String(rowData[options.statusColumnIndex] || '');
      applyStatusStyle(statusCell, statusValue);
    }
    
    rowData.forEach((value, colIndex) => {
      if (typeof value === 'number') {
        applyNumberFormat(row.getCell(colIndex + 1));
      }
    });
  });
  
  if (options?.columnWidths) {
    setColumnWidths(worksheet, options.columnWidths);
  } else {
    headers.forEach((_, index) => {
      worksheet.getColumn(index + 1).width = 15;
    });
  }
  
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: headers.length }
  };
  
  return worksheet;
}

export function addFormattedSheetWithTitle(
  workbook: ExcelJS.Workbook,
  name: string,
  title: string,
  headers: string[],
  data: any[][],
  options?: {
    columnWidths?: number[];
    statusColumnIndex?: number;
    hasTotalRow?: boolean;
    subtitle?: string;
  }
): ExcelJS.Worksheet {
  const worksheet = workbook.addWorksheet(name);
  
  const titleRow = worksheet.addRow([title]);
  applyTitleStyle(titleRow);
  worksheet.mergeCells(1, 1, 1, headers.length);
  
  if (options?.subtitle) {
    const subtitleRow = worksheet.addRow([options.subtitle]);
    subtitleRow.getCell(1).font = { italic: true, color: { argb: '666666' } };
    worksheet.mergeCells(worksheet.rowCount, 1, worksheet.rowCount, headers.length);
  }
  
  worksheet.addRow([]);
  
  const headerRow = worksheet.addRow(headers);
  applyHeaderStyle(headerRow);
  
  const headerRowNumber = worksheet.rowCount;
  
  data.forEach((rowData, index) => {
    const row = worksheet.addRow(rowData);
    const isLastRow = index === data.length - 1;
    const isTotalRow = options?.hasTotalRow && isLastRow;
    
    if (isTotalRow) {
      applyTotalRowStyle(row);
    } else {
      applyDataRowStyle(row, index % 2 === 1);
    }
    
    if (options?.statusColumnIndex !== undefined && !isTotalRow) {
      const statusCell = row.getCell(options.statusColumnIndex + 1);
      const statusValue = String(rowData[options.statusColumnIndex] || '');
      applyStatusStyle(statusCell, statusValue);
    }
    
    rowData.forEach((value, colIndex) => {
      if (typeof value === 'number') {
        applyNumberFormat(row.getCell(colIndex + 1));
      }
    });
  });
  
  if (options?.columnWidths) {
    setColumnWidths(worksheet, options.columnWidths);
  } else {
    headers.forEach((_, index) => {
      worksheet.getColumn(index + 1).width = 15;
    });
  }
  
  worksheet.autoFilter = {
    from: { row: headerRowNumber, column: 1 },
    to: { row: headerRowNumber, column: headers.length }
  };
  
  return worksheet;
}
