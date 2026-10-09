import EmergencyList from "@/components/EmergencyList";
import { Notice } from "@/components/ui";
import { EMERGENCY_RESOURCES } from "@/lib/guardrails";

/** 「身の安全が心配」を選んだときに、すぐ出す。短く、押せば電話がかかる。 */
export default function SafetyPanel() {
  return (
    <div className="mt-5" role="region" aria-label="安全のための案内">
      <Notice tone="warn" role="alert">
        <p className="text-xl font-bold leading-8">あぶないときは、すぐ電話を</p>
        <EmergencyList items={EMERGENCY_RESOURCES} />
        <p className="mt-3 text-base leading-8">
          先に電話で相談しても、だいじょうぶです。
          <br />
          いっしょに住む人に画面を見られると、あぶないときは、手帳は、あとで作ってください。
        </p>
      </Notice>
    </div>
  );
}
