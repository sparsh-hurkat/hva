import { Alert } from "@mantine/core";
import { TriangleAlert } from "lucide-react";

export function ErrorState({ message }: { message: string }) {
  return (
    <Alert icon={<TriangleAlert size={18} />} color="red" title="Something went wrong" radius="md">
      {message}
    </Alert>
  );
}
