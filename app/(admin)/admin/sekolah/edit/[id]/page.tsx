// app/(admin)/admin/sekolah/edit/[id]/page.tsx
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import EditSekolahForm from "@/components/admin/EditSekolahForm";

export default async function EditSekolahPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const school = await db.school.findUnique({
    where: { id },
  });
  
  if (!school) {
    notFound();
  }
  
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Edit Sekolah
        </h1>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">
          Ubah informasi sekolah
        </p>
      </div>
      
      <EditSekolahForm school={school} />
    </div>
  );
}