import { ListLoadingState } from "@/components/shared/list-state";

export default function HistoryLoading() {
  return <ListLoadingState rows={5} label="Loading collaboration history" />;
}
