import ShowCard from "@/components/ShowCard";

export default async function ShowPage({ params }: PageProps<"/show/[token]">) {
  const { token } = await params;
  return (
    <main className="min-h-screen flex-1 bg-white">
      <ShowCard token={token} />
    </main>
  );
}
