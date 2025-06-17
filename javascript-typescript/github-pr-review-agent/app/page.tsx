import { ReviewForm } from "@/components/review-form";
import { GithubIcon } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 flex items-center justify-center gap-3">
            <GithubIcon className="h-8 w-8 text-gray-800 dark:text-white" />
            <h1 className="text-center text-3xl font-bold text-gray-800 dark:text-white">
              GitHub PR review agent
            </h1>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="mb-6 text-center text-gray-600 dark:text-gray-400">
              Enter your GitHub repository details to get an AI-powered code
              review for your pull request.
            </p>
            <ReviewForm />
          </div>
        </div>
      </div>
    </main>
  );
}
