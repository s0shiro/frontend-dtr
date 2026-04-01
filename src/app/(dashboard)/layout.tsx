import { Shell } from '@/components/layout/Shell';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Shell breadcrumb={["Dashboard"]}>{children}</Shell>;
}
