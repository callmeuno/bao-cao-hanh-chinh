import './globals.css';
import type { ReactNode } from 'react';
export const metadata={title:'Hệ thống quản lý báo cáo',description:'MVP quản lý, phân tích và sinh báo cáo'};
export default function RootLayout({children}:{children:ReactNode}){return <html lang="vi"><body>{children}</body></html>}
