import RateForm from "@/components/RateForm";

export const metadata = { title: "採点の1枚｜Engawa" };

export default function RatePage() {
  return (
    <main id="main" className="flex-1">
      <RateForm />
    </main>
  );
}
