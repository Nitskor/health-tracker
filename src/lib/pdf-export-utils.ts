import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { BloodPressureReading } from '@/types/blood-pressure';
import { WeightReading } from '@/types/weight';

// Helper function to create a simple chart using HTML canvas
async function createSimpleChart(
  title: string, 
  data: { label: string; value: number; color: string }[], 
  width: number = 800, 
  height: number = 400
): Promise<string> {
  // Create a temporary canvas element
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';

  // Clear canvas
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Add title
  ctx.fillStyle = '#1f2937';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(title, width / 2, 30);

  // Calculate chart dimensions
  const chartWidth = width - 100;
  const chartHeight = height - 100;
  const chartX = 50;
  const chartY = 60;

  // Draw chart background
  ctx.fillStyle = '#f9fafb';
  ctx.fillRect(chartX, chartY, chartWidth, chartHeight);

  // Draw border
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.strokeRect(chartX, chartY, chartWidth, chartHeight);

  // Find max value for scaling
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const valueRange = maxValue - minValue;
  const padding = valueRange * 0.1;
  const scaledMin = minValue - padding;
  const scaledMax = maxValue + padding;
  const scaledRange = scaledMax - scaledMin;

  // Draw data points and lines
  const pointSpacing = chartWidth / (data.length - 1);
  
  ctx.strokeStyle = '#3B82F6';
  ctx.lineWidth = 3;
  ctx.beginPath();
  
  data.forEach((point, index) => {
    const x = chartX + (index * pointSpacing);
    const y = chartY + chartHeight - ((point.value - scaledMin) / scaledRange) * chartHeight;
    
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  // Draw data points
  data.forEach((point, index) => {
    const x = chartX + (index * pointSpacing);
    const y = chartY + chartHeight - ((point.value - scaledMin) / scaledRange) * chartHeight;
    
    ctx.fillStyle = point.color;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw value labels
    ctx.fillStyle = '#374151';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(point.value.toString(), x, y - 15);
  });

  // Draw Y-axis labels
  ctx.fillStyle = '#6b7280';
  ctx.font = '12px Arial';
  ctx.textAlign = 'right';
  for (let i = 0; i <= 5; i++) {
    const value = scaledMin + (scaledRange * i / 5);
    const y = chartY + chartHeight - (i / 5) * chartHeight;
    ctx.fillText(Math.round(value).toString(), chartX - 10, y + 4);
  }

  // Draw X-axis labels
  ctx.textAlign = 'center';
  data.forEach((point, index) => {
    const x = chartX + (index * pointSpacing);
    ctx.fillText(point.label, x, chartY + chartHeight + 20);
  });

  return canvas.toDataURL('image/png');
}

// Helper function to create blood pressure trend chart data
async function createBloodPressureTrendChart(readings: BloodPressureReading[]): Promise<string> {
  // Group readings by date
  const groupedByDate: { [key: string]: { normal: BloodPressureReading[], afterActivity: BloodPressureReading[] } } = {};
  
  readings.forEach(reading => {
    const readingDate = new Date(reading.timestamp);
    const dateKey = readingDate.toLocaleDateString('en-CA');
    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = { normal: [], afterActivity: [] };
    }
    if (reading.readingType === 'normal') {
      groupedByDate[dateKey].normal.push(reading);
    } else {
      groupedByDate[dateKey].afterActivity.push(reading);
    }
  });

  // Prepare chart data - use normal systolic for trend
  const chartData = Object.entries(groupedByDate)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([date, data]) => {
      const normalAvg = data.normal.length > 0 ? 
        Math.round(data.normal.reduce((sum, r) => sum + r.systolic, 0) / data.normal.length) : 0;
      
      return {
        label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: normalAvg,
        color: '#3B82F6'
      };
    });

  return await createSimpleChart('Blood Pressure Trends Over Time', chartData);
}

// Helper function to create blood pressure comparison chart
async function createBloodPressureComparisonChart(readings: BloodPressureReading[]): Promise<string> {
  const normalReadings = readings.filter(r => r.readingType === 'normal');
  const afterActivityReadings = readings.filter(r => r.readingType === 'after_activity');

  const normalAvg = normalReadings.length > 0 ? 
    Math.round(normalReadings.reduce((sum, r) => sum + r.systolic, 0) / normalReadings.length) : 0;
  const afterActivityAvg = afterActivityReadings.length > 0 ? 
    Math.round(afterActivityReadings.reduce((sum, r) => sum + r.systolic, 0) / afterActivityReadings.length) : 0;

  const chartData = [
    { label: 'Normal', value: normalAvg, color: '#3B82F6' },
    { label: 'After Activity', value: afterActivityAvg, color: '#8B5CF6' }
  ];

  return await createSimpleChart('Average Blood Pressure by Reading Type', chartData);
}

// Helper function to create normal readings chart
async function createNormalReadingsChart(readings: BloodPressureReading[]): Promise<string> {
  if (readings.length === 0) return '';

  const chartData = readings
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((reading, index) => ({
      label: new Date(reading.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: reading.systolic,
      color: '#3B82F6'
    }));

  return await createSimpleChart('Normal Blood Pressure Readings', chartData);
}

// Helper function to create after activity readings chart
async function createAfterActivityReadingsChart(readings: BloodPressureReading[]): Promise<string> {
  if (readings.length === 0) return '';

  const chartData = readings
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((reading, index) => ({
      label: new Date(reading.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: reading.systolic,
      color: '#8B5CF6'
    }));

  return await createSimpleChart('After Activity Blood Pressure Readings', chartData);
}

// Helper function to create weight trend chart
async function createWeightTrendChart(readings: WeightReading[]): Promise<string> {
  // Group readings by date
  const groupedByDate: { [key: string]: WeightReading[] } = {};
  
  readings.forEach(reading => {
    const readingDate = new Date(reading.timestamp);
    const dateKey = readingDate.toLocaleDateString('en-CA');
    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = [];
    }
    groupedByDate[dateKey].push(reading);
  });

  // Prepare chart data
  const chartData = Object.entries(groupedByDate)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([date, data]) => {
      const avgWeight = data.length > 0 ? 
        Math.round(data.reduce((sum, r) => sum + r.weight, 0) / data.length) : 0;

      return {
        label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: avgWeight,
        color: '#8B5CF6'
      };
    });

  return await createSimpleChart('Weight Trends Over Time', chartData);
}

export async function exportBloodPressureToPDF(readings: BloodPressureReading[]): Promise<void> {
  if (readings.length === 0) {
    alert('No data to export');
    return;
  }

  // Separate readings by type
  const normalReadings = readings.filter(r => r.readingType === 'normal');
  const afterActivityReadings = readings.filter(r => r.readingType === 'after_activity');

  // Generate charts for each reading type
  const normalChartBase64 = await createNormalReadingsChart(normalReadings);
  const afterActivityChartBase64 = await createAfterActivityReadingsChart(afterActivityReadings);

  // Create new PDF document
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = 20;

  // Helper function to add text with alignment
  const addText = (text: string, x: number, y: number, options: any = {}) => {
    pdf.setFontSize(options.fontSize || 11);
    pdf.setTextColor(options.color || '#000000');
    
    if (options.align === 'center') {
      pdf.text(text, x, y, { align: 'center' });
    } else if (options.align === 'right') {
      pdf.text(text, x, y, { align: 'right' });
    } else {
      pdf.text(text, x, y);
    }
    
    if (options.bold) {
      pdf.setFont('helvetica', 'bold');
    } else {
      pdf.setFont('helvetica', 'normal');
    }
  };

  // Helper function to add line
  const addLine = (x1: number, y1: number, x2: number, y2: number, color: string = '#e5e7eb') => {
    const rgbColor = parseInt(color.slice(1), 16);
    const r = (rgbColor >> 16) & 255;
    const g = (rgbColor >> 8) & 255;
    const b = rgbColor & 255;
    pdf.setDrawColor(r, g, b);
    pdf.setLineWidth(0.5);
    pdf.line(x1, y1, x2, y2);
  };

  // Helper function to check if we need a new page
  const checkNewPage = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - 20) {
      pdf.addPage();
      yPosition = 20;
      return true;
    }
    return false;
  };

  // Title with better formatting
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.setTextColor(37, 99, 235); // Blue color
  pdf.text('BLOOD PRESSURE HEALTH REPORT', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  // Report date
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(107, 114, 128); // Gray color
  pdf.text(`Generated on: ${new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Normal Readings Section
  if (normalReadings.length > 0) {
    checkNewPage(50);
    
    // Section header with background
    pdf.setFillColor(59, 130, 246); // Blue
    pdf.rect(15, yPosition - 5, pageWidth - 30, 10, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(255, 255, 255); // White
    pdf.text('NORMAL READINGS', 20, yPosition, { baseline: 'middle' });
    yPosition += 10;

    // Add normal readings chart
    if (normalChartBase64) {
      pdf.addImage(normalChartBase64, 'PNG', 15, yPosition, 180, 90);
      yPosition += 100;
    }

    // Table headers with better alignment
    const colWidths = [35, 25, 25, 25, 70];
    const colX = [15, 50, 75, 100, 125];
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(55, 65, 81); // Dark gray
    
    pdf.text('Date', colX[0], yPosition);
    pdf.text('Time', colX[1], yPosition);
    pdf.text('Systolic', colX[2], yPosition, { align: 'center' });
    pdf.text('Diastolic', colX[3], yPosition, { align: 'center' });
    pdf.text('Notes', colX[4], yPosition);
    yPosition += 7;

    // Draw header line
    addLine(15, yPosition, pageWidth - 15, yPosition, '#3B82F6');
    yPosition += 5;

    // Table rows with alternating colors
    normalReadings
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .forEach((reading, index) => {
        if (checkNewPage(15)) {
          // Redraw headers on new page
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(10);
          pdf.setTextColor(55, 65, 81);
          
          pdf.text('Date', colX[0], yPosition);
          pdf.text('Time', colX[1], yPosition);
          pdf.text('Systolic', colX[2], yPosition, { align: 'center' });
          pdf.text('Diastolic', colX[3], yPosition, { align: 'center' });
          pdf.text('Notes', colX[4], yPosition);
          yPosition += 7;
          
          addLine(15, yPosition, pageWidth - 15, yPosition, '#3B82F6');
          yPosition += 5;
        }

        // Alternating row background
        if (index % 2 === 0) {
          pdf.setFillColor(249, 250, 251); // Light gray
          pdf.rect(15, yPosition - 4, pageWidth - 30, 9, 'F');
        }

        const date = new Date(reading.timestamp);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(31, 41, 55); // Dark gray
        
        pdf.text(dateStr, colX[0], yPosition);
        pdf.text(timeStr, colX[1], yPosition);
        pdf.text(reading.systolic.toString(), colX[2], yPosition, { align: 'center' });
        pdf.text(reading.diastolic.toString(), colX[3], yPosition, { align: 'center' });
        pdf.text(reading.notes || '-', colX[4], yPosition);
        yPosition += 9;
      });

    yPosition += 10;
  }

  // After Activity Readings Section
  if (afterActivityReadings.length > 0) {
    checkNewPage(50);
    
    // Section header with background
    pdf.setFillColor(139, 92, 246); // Purple
    pdf.rect(15, yPosition - 5, pageWidth - 30, 10, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(255, 255, 255); // White
    pdf.text('AFTER ACTIVITY READINGS', 20, yPosition, { baseline: 'middle' });
    yPosition += 10;

    // Add after activity readings chart
    if (afterActivityChartBase64) {
      pdf.addImage(afterActivityChartBase64, 'PNG', 15, yPosition, 180, 90);
      yPosition += 100;
    }

    // Table headers with better alignment
    const colWidths = [35, 25, 25, 25, 70];
    const colX = [15, 50, 75, 100, 125];
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(55, 65, 81); // Dark gray
    
    pdf.text('Date', colX[0], yPosition);
    pdf.text('Time', colX[1], yPosition);
    pdf.text('Systolic', colX[2], yPosition, { align: 'center' });
    pdf.text('Diastolic', colX[3], yPosition, { align: 'center' });
    pdf.text('Notes', colX[4], yPosition);
    yPosition += 7;

    // Draw header line
    addLine(15, yPosition, pageWidth - 15, yPosition, '#8B5CF6');
    yPosition += 5;

    // Table rows with alternating colors
    afterActivityReadings
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .forEach((reading, index) => {
        if (checkNewPage(15)) {
          // Redraw headers on new page
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(10);
          pdf.setTextColor(55, 65, 81);
          
          pdf.text('Date', colX[0], yPosition);
          pdf.text('Time', colX[1], yPosition);
          pdf.text('Systolic', colX[2], yPosition, { align: 'center' });
          pdf.text('Diastolic', colX[3], yPosition, { align: 'center' });
          pdf.text('Notes', colX[4], yPosition);
          yPosition += 7;
          
          addLine(15, yPosition, pageWidth - 15, yPosition, '#8B5CF6');
          yPosition += 5;
        }

        // Alternating row background
        if (index % 2 === 0) {
          pdf.setFillColor(249, 250, 251); // Light gray
          pdf.rect(15, yPosition - 4, pageWidth - 30, 9, 'F');
        }

        const date = new Date(reading.timestamp);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(31, 41, 55); // Dark gray
        
        pdf.text(dateStr, colX[0], yPosition);
        pdf.text(timeStr, colX[1], yPosition);
        pdf.text(reading.systolic.toString(), colX[2], yPosition, { align: 'center' });
        pdf.text(reading.diastolic.toString(), colX[3], yPosition, { align: 'center' });
        pdf.text(reading.notes || '-', colX[4], yPosition);
        yPosition += 9;
      });

    yPosition += 10;
  }

  // Footer
  yPosition = pageHeight - 20;
  addText('Generated by Health Tracker', pageWidth / 2, yPosition, { 
    fontSize: 10, 
    color: '#6b7280',
    align: 'center' 
  });

  // Save the PDF
  pdf.save(`blood-pressure-report-${new Date().toISOString().split('T')[0]}.pdf`);
}

export async function exportWeightToPDF(readings: WeightReading[]): Promise<void> {
  if (readings.length === 0) {
    alert('No data to export');
    return;
  }

  // Generate chart
  const weightChartBase64 = await createWeightTrendChart(readings);

  // Create new PDF document
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = 20;

  // Helper function to add line
  const addLine = (x1: number, y1: number, x2: number, y2: number, color: string = '#e5e7eb') => {
    const rgbColor = parseInt(color.slice(1), 16);
    const r = (rgbColor >> 16) & 255;
    const g = (rgbColor >> 8) & 255;
    const b = rgbColor & 255;
    pdf.setDrawColor(r, g, b);
    pdf.setLineWidth(0.5);
    pdf.line(x1, y1, x2, y2);
  };

  // Helper function to check if we need a new page
  const checkNewPage = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - 20) {
      pdf.addPage();
      yPosition = 20;
      return true;
    }
    return false;
  };

  // Title with better formatting
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.setTextColor(139, 92, 246); // Purple color
  pdf.text('WEIGHT TRACKING REPORT', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  // Report date
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(107, 114, 128); // Gray color
  pdf.text(`Generated on: ${new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Weight Readings Section
  checkNewPage(50);
  
  // Section header with background
  pdf.setFillColor(139, 92, 246); // Purple
  pdf.rect(15, yPosition - 5, pageWidth - 30, 10, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(255, 255, 255); // White
  pdf.text('WEIGHT READINGS', 20, yPosition, { baseline: 'middle' });
  yPosition += 10;

  // Add weight chart
  if (weightChartBase64) {
    pdf.addImage(weightChartBase64, 'PNG', 15, yPosition, 180, 90);
    yPosition += 100;
  }

  // Table headers with better alignment
  const colWidths = [40, 30, 30, 80];
  const colX = [15, 55, 85, 115];
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(55, 65, 81); // Dark gray
  
  pdf.text('Date', colX[0], yPosition);
  pdf.text('Time', colX[1], yPosition);
  pdf.text('Weight (kg)', colX[2], yPosition, { align: 'center' });
  pdf.text('Notes', colX[3], yPosition);
  yPosition += 7;

  // Draw header line
  addLine(15, yPosition, pageWidth - 15, yPosition, '#8B5CF6');
  yPosition += 5;

  // Table rows with alternating colors
  readings
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .forEach((reading, index) => {
      if (checkNewPage(15)) {
        // Redraw headers on new page
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(55, 65, 81);
        
        pdf.text('Date', colX[0], yPosition);
        pdf.text('Time', colX[1], yPosition);
        pdf.text('Weight (kg)', colX[2], yPosition, { align: 'center' });
        pdf.text('Notes', colX[3], yPosition);
        yPosition += 7;
        
        addLine(15, yPosition, pageWidth - 15, yPosition, '#8B5CF6');
        yPosition += 5;
      }

      // Alternating row background
      if (index % 2 === 0) {
        pdf.setFillColor(249, 250, 251); // Light gray
        pdf.rect(15, yPosition - 4, pageWidth - 30, 9, 'F');
      }

      const date = new Date(reading.timestamp);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const timeStr = date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(31, 41, 55); // Dark gray
      
      pdf.text(dateStr, colX[0], yPosition);
      pdf.text(timeStr, colX[1], yPosition);
      pdf.text(reading.weight.toString(), colX[2], yPosition, { align: 'center' });
      pdf.text(reading.notes || '-', colX[3], yPosition);
      yPosition += 9;
    });

  // Footer
  yPosition = pageHeight - 20;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(107, 114, 128); // Gray color
  pdf.text('Generated by Health Tracker', pageWidth / 2, yPosition, { align: 'center' });

  // Save the PDF
  pdf.save(`weight-report-${new Date().toISOString().split('T')[0]}.pdf`);
}
