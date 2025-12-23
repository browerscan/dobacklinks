import { constructMetadata } from "@/lib/metadata";
import { Metadata } from "next";
import LoginPage from "./LoginPage";

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadata({
    page: "Login",
    title: "Login",
    description: "Login to your account",
    path: `/login`,
  });
}

export default function Login() {
  return <LoginPage />;
}
