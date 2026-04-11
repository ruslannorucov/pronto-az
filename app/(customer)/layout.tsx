import AppTopBar from "@/components/AppTopBar";
import BottomNav from "@/components/BottomNav";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--gray-50)]">
      <AppTopBar userRole="customer" />
      {children}
      <BottomNav variant="customer" />
    </div>
  );
}
