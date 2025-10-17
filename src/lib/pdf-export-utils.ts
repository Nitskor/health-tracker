import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { BloodPressureReading } from '@/types/blood-pressure';
import { WeightReading } from '@/types/weight';
import { BloodSugarReading, ReadingType } from '@/types/blood-sugar';
import { getReadingTypeLabel, getReadingTypeColor } from '@/lib/blood-sugar-utils';

// Helper function to create a simple chart using HTML canvas with BP-specific styling
async function createSimpleChart(
  title: string, 
  data: { label: string; value: number; color: string }[], 
  width: number = 800, 
  height: number = 400,
  yAxisConfig?: { min: number; max: number; zones?: { min: number; max: number; color: string; label: string }[] }
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
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(title, width / 2, 35);

  // Calculate chart dimensions
  const chartWidth = width - 120;
  const chartHeight = height - 120;
  const chartX = 70;
  const chartY = 70;

  // Draw chart background
  ctx.fillStyle = '#f9fafb';
  ctx.fillRect(chartX, chartY, chartWidth, chartHeight);

  // Determine Y-axis range
  let scaledMin, scaledMax, scaledRange;
  
  if (yAxisConfig) {
    // Use provided Y-axis configuration (for BP charts)
    scaledMin = yAxisConfig.min;
    scaledMax = yAxisConfig.max;
    scaledRange = scaledMax - scaledMin;
    
    // Draw reference zones if provided
    if (yAxisConfig.zones) {
      yAxisConfig.zones.forEach(zone => {
        const zoneYStart = chartY + chartHeight - ((zone.max - scaledMin) / scaledRange) * chartHeight;
        const zoneHeight = ((zone.max - zone.min) / scaledRange) * chartHeight;
        
        ctx.fillStyle = zone.color;
        ctx.globalAlpha = 0.15;
        ctx.fillRect(chartX, zoneYStart, chartWidth, zoneHeight);
        ctx.globalAlpha = 1.0;
        
        // Add zone label
        ctx.fillStyle = zone.color.replace('0.15', '1');
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(zone.label, chartX + chartWidth - 5, zoneYStart + 15);
      });
    }
  } else {
    // Auto-scale based on data
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const valueRange = maxValue - minValue;
    
    if (data.length === 1 || valueRange === 0) {
      const value = data[0].value;
      scaledMin = value - 20;
      scaledMax = value + 20;
      scaledRange = 40;
    } else {
      const padding = valueRange * 0.2;
      scaledMin = minValue - padding;
      scaledMax = maxValue + padding;
      scaledRange = scaledMax - scaledMin;
    }
  }

  // Draw data points and lines
  const pointSpacing = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth / 2;
  
  // Only draw lines if there's more than one point
  if (data.length > 1) {
    ctx.strokeStyle = data[0].color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    data.forEach((point, index) => {
      const x = chartX + (data.length === 1 ? chartWidth / 2 : index * pointSpacing);
      const y = chartY + chartHeight - ((point.value - scaledMin) / scaledRange) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
  }

  // Draw data points
  data.forEach((point, index) => {
    const x = chartX + (data.length === 1 ? chartWidth / 2 : index * pointSpacing);
    const y = chartY + chartHeight - ((point.value - scaledMin) / scaledRange) * chartHeight;
    
    ctx.fillStyle = point.color;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw value labels
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 14px Arial';
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
    const x = chartX + (data.length === 1 ? chartWidth / 2 : index * pointSpacing);
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

// Helper function to create Normal BP chart (matching page design)
async function createNormalBPChart(readings: BloodPressureReading[]): Promise<string> {
  if (readings.length === 0) return '';

  // Group by date and calculate daily averages
  const groupedByDate: { [key: string]: BloodPressureReading[] } = {};
  readings.forEach(reading => {
    const date = new Date(reading.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!groupedByDate[date]) groupedByDate[date] = [];
    groupedByDate[date].push(reading);
  });

  const chartData = Object.entries(groupedByDate)
    .sort((a, b) => {
      // Parse dates for proper sorting
      const dateA = new Date(groupedByDate[a[0]][0].timestamp);
      const dateB = new Date(groupedByDate[b[0]][0].timestamp);
      return dateA.getTime() - dateB.getTime();
    })
    .map(([date, readings]) => ({
      label: date,
      value: Math.round(readings.reduce((sum, r) => sum + r.systolic, 0) / readings.length),
      color: '#3B82F6'
    }));

  // BP-specific Y-axis with reference zones
  const yAxisConfig = {
    min: 60,
    max: 180,
    zones: [
      { min: 60, max: 120, color: '#10B981', label: 'Normal' },
      { min: 120, max: 130, color: '#F59E0B', label: 'Elevated' },
      { min: 130, max: 180, color: '#EF4444', label: 'High' }
    ]
  };

  return await createSimpleChart('Normal Readings - Blood Pressure', chartData, 800, 400, yAxisConfig);
}

// Helper function to create Normal BPM chart
async function createNormalBPMChart(readings: BloodPressureReading[]): Promise<string> {
  if (readings.length === 0) return '';

  // Group by date and calculate daily averages
  const groupedByDate: { [key: string]: BloodPressureReading[] } = {};
  readings.forEach(reading => {
    const date = new Date(reading.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!groupedByDate[date]) groupedByDate[date] = [];
    groupedByDate[date].push(reading);
  });

  const chartData = Object.entries(groupedByDate)
    .sort((a, b) => {
      const dateA = new Date(groupedByDate[a[0]][0].timestamp);
      const dateB = new Date(groupedByDate[b[0]][0].timestamp);
      return dateA.getTime() - dateB.getTime();
    })
    .map(([date, readings]) => ({
      label: date,
      value: Math.round(readings.reduce((sum, r) => sum + r.bpm, 0) / readings.length),
      color: '#EF4444'
    }));

  // BPM-specific Y-axis
  const yAxisConfig = {
    min: 30,
    max: 120,
    zones: [
      { min: 60, max: 100, color: '#10B981', label: 'Normal HR' }
    ]
  };

  return await createSimpleChart('Normal Readings - Heart Rate', chartData, 800, 400, yAxisConfig);
}

// Helper function to create Activity BP chart
async function createActivityBPChart(readings: BloodPressureReading[]): Promise<string> {
  if (readings.length === 0) return '';

  // Group by date and calculate daily averages
  const groupedByDate: { [key: string]: BloodPressureReading[] } = {};
  readings.forEach(reading => {
    const date = new Date(reading.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!groupedByDate[date]) groupedByDate[date] = [];
    groupedByDate[date].push(reading);
  });

  const chartData = Object.entries(groupedByDate)
    .sort((a, b) => {
      const dateA = new Date(groupedByDate[a[0]][0].timestamp);
      const dateB = new Date(groupedByDate[b[0]][0].timestamp);
      return dateA.getTime() - dateB.getTime();
    })
    .map(([date, readings]) => ({
      label: date,
      value: Math.round(readings.reduce((sum, r) => sum + r.systolic, 0) / readings.length),
      color: '#A855F7'
    }));

  // BP-specific Y-axis with reference zones
  const yAxisConfig = {
    min: 60,
    max: 180,
    zones: [
      { min: 60, max: 120, color: '#10B981', label: 'Normal' },
      { min: 120, max: 130, color: '#F59E0B', label: 'Elevated' },
      { min: 130, max: 180, color: '#EF4444', label: 'High' }
    ]
  };

  return await createSimpleChart('After Activity Readings - Blood Pressure', chartData, 800, 400, yAxisConfig);
}

// Helper function to create Activity BPM chart
async function createActivityBPMChart(readings: BloodPressureReading[]): Promise<string> {
  if (readings.length === 0) return '';

  // Group by date and calculate daily averages
  const groupedByDate: { [key: string]: BloodPressureReading[] } = {};
  readings.forEach(reading => {
    const date = new Date(reading.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!groupedByDate[date]) groupedByDate[date] = [];
    groupedByDate[date].push(reading);
  });

  const chartData = Object.entries(groupedByDate)
    .sort((a, b) => {
      const dateA = new Date(groupedByDate[a[0]][0].timestamp);
      const dateB = new Date(groupedByDate[b[0]][0].timestamp);
      return dateA.getTime() - dateB.getTime();
    })
    .map(([date, readings]) => ({
      label: date,
      value: Math.round(readings.reduce((sum, r) => sum + r.bpm, 0) / readings.length),
      color: '#F97316'
    }));

  // BPM-specific Y-axis with elevated zone
  const yAxisConfig = {
    min: 30,
    max: 120,
    zones: [
      { min: 60, max: 100, color: '#10B981', label: 'Normal HR' },
      { min: 100, max: 120, color: '#F59E0B', label: 'Elevated HR' }
    ]
  };

  return await createSimpleChart('After Activity Readings - Heart Rate', chartData, 800, 400, yAxisConfig);
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

  // Generate 4 charts matching page layout: Normal BP, Normal BPM, Activity BP, Activity BPM
  const normalBPChart = await createNormalBPChart(normalReadings);
  const normalBPMChart = await createNormalBPMChart(normalReadings);
  const activityBPChart = await createActivityBPChart(afterActivityReadings);
  const activityBPMChart = await createActivityBPMChart(afterActivityReadings);

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
    pdf.text('NORMAL READINGS - BLOOD PRESSURE', 20, yPosition, { baseline: 'middle' });
    yPosition += 10;

    // Add BP chart
    if (normalBPChart) {
      pdf.addImage(normalBPChart, 'PNG', 15, yPosition, 180, 90);
      yPosition += 100;
    }

    checkNewPage(50);
    
    // BPM section header
    pdf.setFillColor(239, 68, 68); // Red
    pdf.rect(15, yPosition - 5, pageWidth - 30, 10, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(255, 255, 255); // White
    pdf.text('NORMAL READINGS - HEART RATE', 20, yPosition, { baseline: 'middle' });
    yPosition += 10;

    // Add BPM chart
    if (normalBPMChart) {
      pdf.addImage(normalBPMChart, 'PNG', 15, yPosition, 180, 90);
      yPosition += 100;
    }

    checkNewPage(30);
    yPosition += 5;

    // Table headers with BPM column
    const colWidths = [30, 20, 25, 25, 20, 70];
    const colX = [15, 45, 65, 90, 115, 135];
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(55, 65, 81); // Dark gray
    
    pdf.text('Date', colX[0], yPosition);
    pdf.text('Time', colX[1], yPosition);
    pdf.text('Systolic', colX[2], yPosition);
    pdf.text('Diastolic', colX[3], yPosition);
    pdf.text('BPM', colX[4], yPosition);
    pdf.text('Notes', colX[5], yPosition);
    yPosition += 7;

    // Draw header line
    addLine(15, yPosition, pageWidth - 15, yPosition, '#3B82F6');
    yPosition += 5;

    // Table rows with alternating colors (chronological order - oldest first)
    normalReadings
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .forEach((reading, index) => {
        if (checkNewPage(15)) {
          // Redraw headers on new page
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(10);
          pdf.setTextColor(55, 65, 81);
          
          pdf.text('Date', colX[0], yPosition);
          pdf.text('Time', colX[1], yPosition);
          pdf.text('Systolic', colX[2], yPosition);
          pdf.text('Diastolic', colX[3], yPosition);
          pdf.text('BPM', colX[4], yPosition);
          pdf.text('Notes', colX[5], yPosition);
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
        pdf.setFontSize(9);
        pdf.setTextColor(31, 41, 55); // Dark gray
        
        pdf.text(dateStr, colX[0], yPosition);
        pdf.text(timeStr, colX[1], yPosition);
        pdf.text(reading.systolic.toString(), colX[2], yPosition);
        pdf.text(reading.diastolic.toString(), colX[3], yPosition);
        pdf.text(reading.bpm.toString(), colX[4], yPosition);
        
        // Truncate notes if too long
        const notesText = reading.notes || '-';
        const truncatedNotes = notesText.length > 30 ? notesText.substring(0, 27) + '...' : notesText;
        pdf.text(truncatedNotes, colX[5], yPosition);
        yPosition += 9;
      });

    yPosition += 10;
  }

  // After Activity Readings Section
  if (afterActivityReadings.length > 0) {
    checkNewPage(50);
    
    // Section header with background - BP
    pdf.setFillColor(168, 85, 247); // Purple
    pdf.rect(15, yPosition - 5, pageWidth - 30, 10, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(255, 255, 255); // White
    pdf.text('AFTER ACTIVITY READINGS - BLOOD PRESSURE', 20, yPosition, { baseline: 'middle' });
    yPosition += 10;

    // Add BP chart
    if (activityBPChart) {
      pdf.addImage(activityBPChart, 'PNG', 15, yPosition, 180, 90);
      yPosition += 100;
    }

    checkNewPage(50);
    
    // Section header - BPM
    pdf.setFillColor(249, 115, 22); // Orange
    pdf.rect(15, yPosition - 5, pageWidth - 30, 10, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(255, 255, 255); // White
    pdf.text('AFTER ACTIVITY READINGS - HEART RATE', 20, yPosition, { baseline: 'middle' });
    yPosition += 10;

    // Add BPM chart
    if (activityBPMChart) {
      pdf.addImage(activityBPMChart, 'PNG', 15, yPosition, 180, 90);
      yPosition += 100;
    }

    checkNewPage(30);
    yPosition += 5;

    // Table headers with activity columns
    const colWidths = [25, 18, 22, 22, 18, 18, 18, 55];
    const colX = [15, 40, 58, 80, 102, 120, 138, 156];
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(55, 65, 81); // Dark gray
    
    pdf.text('Date', colX[0], yPosition);
    pdf.text('Time', colX[1], yPosition);
    pdf.text('Systolic', colX[2], yPosition);
    pdf.text('Diastolic', colX[3], yPosition);
    pdf.text('BPM', colX[4], yPosition);
    pdf.text('Walk', colX[5], yPosition);
    pdf.text('Peak', colX[6], yPosition);
    pdf.text('Notes', colX[7], yPosition);
    yPosition += 7;

    // Draw header line
    addLine(15, yPosition, pageWidth - 15, yPosition, '#8B5CF6');
    yPosition += 5;

    // Table rows with alternating colors (chronological order - oldest first)
    afterActivityReadings
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .forEach((reading, index) => {
        if (checkNewPage(15)) {
          // Redraw headers on new page
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(9);
          pdf.setTextColor(55, 65, 81);
          
          pdf.text('Date', colX[0], yPosition);
          pdf.text('Time', colX[1], yPosition);
          pdf.text('Systolic', colX[2], yPosition);
          pdf.text('Diastolic', colX[3], yPosition);
          pdf.text('BPM', colX[4], yPosition);
          pdf.text('Walk', colX[5], yPosition);
          pdf.text('Peak', colX[6], yPosition);
          pdf.text('Notes', colX[7], yPosition);
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
        pdf.setFontSize(8);
        pdf.setTextColor(31, 41, 55); // Dark gray
        
        pdf.text(dateStr, colX[0], yPosition);
        pdf.text(timeStr, colX[1], yPosition);
        pdf.text(reading.systolic.toString(), colX[2], yPosition);
        pdf.text(reading.diastolic.toString(), colX[3], yPosition);
        pdf.text(reading.bpm.toString(), colX[4], yPosition);
        pdf.text((reading.walkDuration || '-').toString() + 'm', colX[5], yPosition);
        pdf.text((reading.maxBpmDuringWalk || '-').toString(), colX[6], yPosition);
        
        // Truncate notes if too long
        const notesText = reading.notes || '-';
        const truncatedNotes = notesText.length > 20 ? notesText.substring(0, 17) + '...' : notesText;
        pdf.text(truncatedNotes, colX[7], yPosition);
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

  // Table rows with alternating colors (chronological order - oldest first)
  readings
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
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

// Helper functions to create blood sugar charts by reading type
async function createBloodSugarChartByType(readings: BloodSugarReading[], type: ReadingType): Promise<string> {
  if (readings.length === 0) return '';

  const chartData = readings
    .filter(r => r.readingType === type)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((reading) => ({
      label: new Date(reading.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: reading.glucose,
      color: getReadingTypeColor(type)
    }));

  if (chartData.length === 0) return '';

  return await createSimpleChart(`${getReadingTypeLabel(type)} Blood Sugar Readings`, chartData);
}

export async function exportBloodSugarToPDF(readings: BloodSugarReading[]): Promise<void> {
  if (readings.length === 0) {
    alert('No data to export');
    return;
  }

  // Separate readings by type
  const readingTypes: ReadingType[] = ['fasting', 'before_meal', 'after_meal', 'bedtime', 'random'];
  const readingsByType: { [key in ReadingType]: BloodSugarReading[] } = {
    fasting: readings.filter(r => r.readingType === 'fasting'),
    before_meal: readings.filter(r => r.readingType === 'before_meal'),
    after_meal: readings.filter(r => r.readingType === 'after_meal'),
    bedtime: readings.filter(r => r.readingType === 'bedtime'),
    random: readings.filter(r => r.readingType === 'random'),
  };

  // Generate charts for each reading type that has data
  const charts: { [key in ReadingType]?: string } = {};
  for (const type of readingTypes) {
    if (readingsByType[type].length > 0) {
      charts[type] = await createBloodSugarChartByType(readings, type);
    }
  }

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
  pdf.setTextColor(16, 185, 129); // Green color
  pdf.text('BLOOD SUGAR HEALTH REPORT', pageWidth / 2, yPosition, { align: 'center' });
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

  // Iterate through each reading type
  for (const type of readingTypes) {
    const typeReadings = readingsByType[type];
    if (typeReadings.length === 0) continue;

    checkNewPage(50);
    
    // Section header with background
    const typeColor = getReadingTypeColor(type);
    const rgbColor = parseInt(typeColor.slice(1), 16);
    const r = (rgbColor >> 16) & 255;
    const g = (rgbColor >> 8) & 255;
    const b = rgbColor & 255;
    
    pdf.setFillColor(r, g, b);
    pdf.rect(15, yPosition - 5, pageWidth - 30, 10, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(255, 255, 255); // White
    pdf.text(getReadingTypeLabel(type).toUpperCase() + ' READINGS', 20, yPosition, { baseline: 'middle' });
    yPosition += 10;

    // Add chart
    const chartBase64 = charts[type];
    if (chartBase64) {
      pdf.addImage(chartBase64, 'PNG', 15, yPosition, 180, 90);
      yPosition += 100;
    }

    // Table headers with better alignment
    const colWidths = [35, 25, 30, 70];
    const colX = [15, 50, 75, 105];
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(55, 65, 81); // Dark gray
    
    pdf.text('Date', colX[0], yPosition);
    pdf.text('Time', colX[1], yPosition);
    pdf.text('Glucose (mg/dL)', colX[2], yPosition, { align: 'center' });
    pdf.text('Notes', colX[3], yPosition);
    yPosition += 7;

    // Draw header line
    addLine(15, yPosition, pageWidth - 15, yPosition, typeColor);
    yPosition += 5;

    // Table rows with alternating colors (chronological order - oldest first)
    typeReadings
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .forEach((reading, index) => {
        if (checkNewPage(15)) {
          // Redraw headers on new page
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(10);
          pdf.setTextColor(55, 65, 81);
          
          pdf.text('Date', colX[0], yPosition);
          pdf.text('Time', colX[1], yPosition);
          pdf.text('Glucose (mg/dL)', colX[2], yPosition, { align: 'center' });
          pdf.text('Notes', colX[3], yPosition);
          yPosition += 7;
          
          addLine(15, yPosition, pageWidth - 15, yPosition, typeColor);
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
        pdf.text(reading.glucose.toString(), colX[2], yPosition, { align: 'center' });
        pdf.text(reading.notes || '-', colX[3], yPosition);
        yPosition += 9;
      });

    yPosition += 10;
  }

  // Footer
  yPosition = pageHeight - 20;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(107, 114, 128); // Gray color
  pdf.text('Generated by Health Tracker', pageWidth / 2, yPosition, { align: 'center' });

  // Save the PDF
  pdf.save(`blood-sugar-report-${new Date().toISOString().split('T')[0]}.pdf`);
}
