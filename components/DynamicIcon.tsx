import { kebabToPascalCase } from "@/lib/utils";
import { LucideProps, icons } from "lucide-react";

export const DynamicIcon = ({
  name,
  ...props
}: LucideProps & { name: string }) => {
  name = kebabToPascalCase(name);
  const Icon = icons[name as keyof typeof icons];
  return Icon ? <Icon {...props} /> : null;
};
