import MyCard from "@/components/MyCard";

export default async function CardPage({ params }: PageProps<"/card/[token]">) {
  const { token } = await params;
  return (
    <main className="flex-1 bg-[#fbf6ec]">
      <MyCard token={token} />
    </main>
  );
}
