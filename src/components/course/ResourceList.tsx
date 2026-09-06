import type { Resource } from "@prisma/client";
import { FileText } from "lucide-react";

export function ResourceList({ resources }: { resources: Resource[] }) {
  if (resources.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="mb-2 font-bold text-white">الملفات المرفقة</h3>
      <ul className="space-y-2">
        {resources.map((resource) => (
          <li key={resource.id}>
            <a
              href={resource.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-gold-400 hover:underline"
            >
              <FileText size={16} />
              {resource.label} ({resource.fileType})
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
