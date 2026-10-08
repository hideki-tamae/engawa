import MyCard from "@/components/MyCard";

export default async function CardPage({ params }: PageProps<"/card/[token]">) {
  const { token } = await params;
  return (
    <main id="main" className="flex-1">
      <MyCard token={token} />
    </main>
  );
}
