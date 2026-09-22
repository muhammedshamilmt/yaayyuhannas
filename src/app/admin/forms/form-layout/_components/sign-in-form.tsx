import { Checkbox } from "@/components/FormElements/checkbox";
import InputGroup from "@/components/FormElements/InputGroup";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import Link from "next/link";

export function SignInForm() {
  return (
    <ShowcaseSection title="Sign In Form" className="!p-6.5">
      <form action="#">
        <InputGroup
          label="Email"
          type="email"
          placeholder="Enter your email address"
          className="mb-4.5"
        />

        <InputGroup
          label="Password"
          type="password"
          placeholder="Enter your password"
        />

        <div className="mb-5.5 mt-5 flex items-center justify-between">
          <Checkbox label="Remember me" minimal withBg withIcon="check" />

          <Link href="#" className="text-sm text-gray-600 hover:text-gray-900 hover:underline transition-colors">
            Forgot password?
          </Link>
        </div>

        <button className="flex w-full justify-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 p-3 font-medium text-white transition-all duration-200 shadow-lg hover:shadow-xl">
          Sign In
        </button>
      </form>
    </ShowcaseSection>
  );
}
