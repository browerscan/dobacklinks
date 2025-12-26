"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import LoginForm from "./LoginForm";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader className="sm:text-center">
          <DialogTitle>Welcome back</DialogTitle>
          <DialogDescription>Sign in with the following methods</DialogDescription>
        </DialogHeader>

        <LoginForm />
      </DialogContent>
    </Dialog>
  );
}
