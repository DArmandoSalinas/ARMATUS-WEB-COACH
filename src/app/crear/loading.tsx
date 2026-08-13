import { SiteTopbar } from "@/components/SiteTopbar";

export default function CrearLoading() {
  return (
    <div className="relative z-10 flex min-h-dvh flex-col">
      <SiteTopbar />
      <div className="flex flex-1 items-center justify-center">
        <div className="loading-core" />
      </div>
    </div>
  );
}
