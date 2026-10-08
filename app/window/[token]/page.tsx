import WindowView from "@/components/WindowView";

export default async function WindowPage({ params }: PageProps<"/window/[token]">) {
  const { token } = await params;
  return (
    <main id="main" className="flex-1">
      <WindowView token={token} />
    </main>
  );
}
