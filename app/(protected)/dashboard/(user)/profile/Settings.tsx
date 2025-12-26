"use client";

import { updateUserSettingsAction } from "@/actions/users/settings";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/auth-client";
import { user as userSchema } from "@/lib/db/schema";
import {
  AVATAR_ACCEPT_ATTRIBUTE,
  AVATAR_ALLOWED_EXTENSIONS,
  AVATAR_ALLOWED_FILE_TYPES,
  AVATAR_MAX_FILE_SIZE,
  FULL_NAME_MAX_LENGTH,
  isValidFullName,
} from "@/lib/validations";
import { Edit, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type User = typeof userSchema.$inferSelect;

export default function Settings({ user }: { user: User }) {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [fullNameError, setFullNameError] = useState<string>("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    setFullName(user?.name ?? "");
  }, [user]);

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFullName(value);

    if (value.length > FULL_NAME_MAX_LENGTH) {
      setFullNameError(`Full name cannot exceed ${FULL_NAME_MAX_LENGTH} characters.`);
    } else if (value && !isValidFullName(value)) {
      setFullNameError("Full name can only contain letters, numbers, and spaces.");
    } else {
      setFullNameError("");
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!AVATAR_ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error("Invalid file type", {
        description: `Please upload a ${AVATAR_ALLOWED_EXTENSIONS.join(", ").toUpperCase()} file.`,
      });
      e.target.value = "";
      return;
    }

    if (file.size > AVATAR_MAX_FILE_SIZE) {
      toast.error("File size exceeded", {
        description: `Please upload a file smaller than ${AVATAR_MAX_FILE_SIZE / 1024 / 1024}MB.`,
      });
      e.target.value = "";
      return;
    }

    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (fullNameError || !fullName.trim()) {
      toast.error("Invalid full name", {
        description: fullNameError || "Full name is required.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("fullName", fullName.trim());
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const result = await updateUserSettingsAction({
        formData,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success("Settings updated successfully!", {
        description: "Your changes have been saved.",
      });

      await authClient.getSession({
        query: {
          disableCookieCache: true,
        },
      });
      router.refresh();

      setAvatarFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error("Failed to update settings", {
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    };
  }, [previewUrl]);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user?.image || undefined} alt={user?.name || "User avatar"} />
              <AvatarFallback>{user?.name?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">{user?.name || "Name not set"}</h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Update Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Update Profile</DialogTitle>
                <DialogDescription>Update your personal information here.</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input defaultValue={user?.email} disabled className="bg-muted" />
                  </div>

                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      value={fullName}
                      onChange={handleFullNameChange}
                      placeholder="Enter your full name"
                      maxLength={FULL_NAME_MAX_LENGTH}
                    />
                    {fullNameError && <p className="text-sm text-red-500 mt-1">{fullNameError}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Avatar</Label>
                    <div className="flex flex-col items-center gap-4">
                      <Avatar className="w-20 h-20">
                        <AvatarImage
                          src={previewUrl || user?.image || undefined}
                          alt={user?.name || "User avatar"}
                        />
                        <AvatarFallback>{user?.name?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="w-full space-y-1">
                        <Input
                          type="file"
                          accept={AVATAR_ACCEPT_ATTRIBUTE}
                          onChange={handleAvatarChange}
                          className="w-full hover:cursor-pointer"
                          lang="en"
                        />
                        <p className="text-xs text-muted-foreground">
                          Max file size: {AVATAR_MAX_FILE_SIZE / 1024 / 1024}MB
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading || !!fullNameError}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Updating...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
