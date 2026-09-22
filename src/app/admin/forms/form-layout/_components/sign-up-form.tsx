import InputGroup from "@/components/FormElements/InputGroup";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";

export function SignUpForm() {
  return (
    <ShowcaseSection title="Sign Up Form" className="!p-6.5">
      <form action="#">
        <InputGroup
          label="Name"
          type="text"
          placeholder="Enter full name"
          className="mb-4.5"
        />

        <InputGroup
          label="Email"
          type="email"
          placeholder="Enter email address"
          className="mb-4.5"
        />

        <InputGroup
          label="Password"
          type="password"
          placeholder="Enter password"
          className="mb-4.5"
        />

        <InputGroup
          label="Re-type Password"
          type="password"
          placeholder="Re-type password"
          className="mb-5.5"
        />

        <button className="flex w-full justify-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 p-3 font-medium text-white transition-all duration-200 shadow-lg hover:shadow-xl">
          Sign Up
        </button>
      </form>
    </ShowcaseSection>
  );
}
