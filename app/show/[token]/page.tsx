import ShowCard from "@/components/ShowCard";

export default async function ShowPage({ params }: PageProps<"/show/[token]">) {
  const { token } = await params;
  return (
    <main id="main" className="flex-1">
      <ShowCard token={token} />
    </main>
  );
}
