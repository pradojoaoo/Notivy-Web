import { Suspense } from "react";
import PlanContent from "./plan-content";

export default function PlanPage() {
  return (
    <Suspense fallback={null}>
      <PlanContent />
    </Suspense>
  );
}
