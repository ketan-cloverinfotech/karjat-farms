import { FarmhouseForm } from "@/components/FarmhouseForm";

export default function NewFarmhousePage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-stone-900">Add a Farmhouse</h2>
      <FarmhouseForm mode="create" />
    </div>
  );
}
