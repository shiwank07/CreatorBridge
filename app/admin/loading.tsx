import { ListLoadingState } from "@/components/shared/list-state";

export default function AdminLoading() {
  return <ListLoadingState rows={8} label="Loading admin records" />;
}
