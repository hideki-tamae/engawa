import WindowView from "@/components/WindowView";

export default async function WindowPage({ params }: PageProps<"/window/[token]">) {
  const { token } = await params;
  return (
    <main className="flex-1 bg-[#fbf6ec]">
      <WindowView token={token} />
    </main>
  );
}
