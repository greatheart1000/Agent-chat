import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 日期格式化
export function format(date: Date, format: string): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  if (format === 'HH:mm') {
    return `${hours}:${minutes}`;
  }
  
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  if (format === 'yyyy-MM-dd') {
    return `${year}-${month}-${day}`;
  }
  
  if (format === 'yyyy-MM-dd HH:mm') {
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
  
  return date.toISOString();
}
