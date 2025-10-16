import { BloodPressureReading } from '@/types/blood-pressure';
import { WeightReading } from '@/types/weight';

export function exportBloodPressureToCSV(readings: BloodPressureReading[]): void {
  if (readings.length === 0) {
    alert('No data to export');
    return;
  }

  // Separate readings by type
  const normalReadings = readings.filter(r => r.readingType === 'normal');
  const afterActivityReadings = readings.filter(r => r.readingType === 'after_activity');

  // Create CSV content with multiple sections
  let csvContent = '';

  // Add header
  csvContent += 'BLOOD PRESSURE DATA EXPORT\n';
  csvContent += `Export Date: ${new Date().toLocaleDateString('en-US')}\n`;
  csvContent += `Total Readings: ${readings.length}\n`;
  csvContent += `Normal Readings: ${normalReadings.length}\n`;
  csvContent += `After Activity Readings: ${afterActivityReadings.length}\n\n`;

  // Normal Readings Table
  if (normalReadings.length > 0) {
    csvContent += 'NORMAL READINGS\n';
    csvContent += 'Date,Time,Systolic,Diastolic,Notes,Created At\n';
    
    const normalRows = normalReadings
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .map(reading => {
        const date = new Date(reading.timestamp);
        const dateStr = date.toLocaleDateString('en-US');
        const timeStr = date.toLocaleTimeString('en-US', { 
          hour12: false,
          hour: '2-digit',
          minute: '2-digit'
        });
        
        return [
          dateStr,
          timeStr,
          reading.systolic.toString(),
          reading.diastolic.toString(),
          reading.notes || '',
          new Date(reading.createdAt).toLocaleString('en-US')
        ].map(field => `"${field}"`).join(',');
      });
    
    csvContent += normalRows.join('\n') + '\n\n';
  }

  // After Activity Readings Table
  if (afterActivityReadings.length > 0) {
    csvContent += 'AFTER ACTIVITY READINGS\n';
    csvContent += 'Date,Time,Systolic,Diastolic,Notes,Created At\n';
    
    const afterActivityRows = afterActivityReadings
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .map(reading => {
        const date = new Date(reading.timestamp);
        const dateStr = date.toLocaleDateString('en-US');
        const timeStr = date.toLocaleTimeString('en-US', { 
          hour12: false,
          hour: '2-digit',
          minute: '2-digit'
        });
        
        return [
          dateStr,
          timeStr,
          reading.systolic.toString(),
          reading.diastolic.toString(),
          reading.notes || '',
          new Date(reading.createdAt).toLocaleString('en-US')
        ].map(field => `"${field}"`).join(',');
      });
    
    csvContent += afterActivityRows.join('\n') + '\n\n';
  }

  // Chart Data Section
  csvContent += 'CHART DATA (Last 30 Days)\n';
  csvContent += 'Date,Normal Systolic,Normal Diastolic,After Activity Systolic,After Activity Diastolic\n';
  
  // Group readings by date for chart data
  const groupedByDate: { [key: string]: { normal: BloodPressureReading[], afterActivity: BloodPressureReading[] } } = {};
  
  readings.forEach(reading => {
    // Use local date to match the display format
    const readingDate = new Date(reading.timestamp);
    const dateKey = readingDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format
    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = { normal: [], afterActivity: [] };
    }
    if (reading.readingType === 'normal') {
      groupedByDate[dateKey].normal.push(reading);
    } else {
      groupedByDate[dateKey].afterActivity.push(reading);
    }
  });

  // Calculate daily averages and create chart data
  const chartRows = Object.entries(groupedByDate)
    .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()) // Most recent first, same as tables
    .map(([date, data]) => {
      const normalAvg = data.normal.length > 0 ? {
        systolic: Math.round(data.normal.reduce((sum, r) => sum + r.systolic, 0) / data.normal.length),
        diastolic: Math.round(data.normal.reduce((sum, r) => sum + r.diastolic, 0) / data.normal.length)
      } : { systolic: '', diastolic: '' };

      const afterActivityAvg = data.afterActivity.length > 0 ? {
        systolic: Math.round(data.afterActivity.reduce((sum, r) => sum + r.systolic, 0) / data.afterActivity.length),
        diastolic: Math.round(data.afterActivity.reduce((sum, r) => sum + r.diastolic, 0) / data.afterActivity.length)
      } : { systolic: '', diastolic: '' };

      return [
        new Date(date).toLocaleDateString('en-US'),
        normalAvg.systolic.toString(),
        normalAvg.diastolic.toString(),
        afterActivityAvg.systolic.toString(),
        afterActivityAvg.diastolic.toString()
      ].map(field => `"${field}"`).join(',');
    });

  csvContent += chartRows.join('\n') + '\n';

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `blood-pressure-data-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

export function exportWeightToCSV(readings: WeightReading[]): void {
  if (readings.length === 0) {
    alert('No data to export');
    return;
  }

  // Create CSV headers
  const headers = [
    'Date',
    'Time',
    'Weight (kg)',
    'Notes',
    'Created At'
  ];

  // Convert readings to CSV rows
  const csvRows = readings.map(reading => {
    const date = new Date(reading.timestamp);
    const dateStr = date.toLocaleDateString('en-US');
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return [
      dateStr,
      timeStr,
      reading.weight.toString(),
      reading.notes || '',
      new Date(reading.createdAt).toLocaleString('en-US')
    ];
  });

  // Combine headers and rows
  const csvContent = [headers, ...csvRows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `weight-data-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
