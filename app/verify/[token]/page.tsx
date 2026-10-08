import PaperVerify from "@/components/PaperVerify";

export default async function VerifyPage({ params, searchParams }: PageProps<"/verify/[token]">) {
  const { token } = await params;
  const sp = await searchParams;
  const code = typeof sp.code === "string" ? sp.code : "";
  return (
    <main id="main" className="flex-1">
      <PaperVerify token={token} code={code} />
    </main>
  );
}
