import { ThreePanelLayout } from "@/components/layout/three-panel-layout";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function Home() {
  return (
    <AuthGuard>
      <ThreePanelLayout />
    </AuthGuard>
  );
}
