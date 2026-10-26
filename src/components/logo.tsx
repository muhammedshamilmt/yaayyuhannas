import Image from "next/image";

export function Logo() {
  return (
    <div className="flex items-center space-x-2">
      <Image
        src="/images/festival-logo.png"
        alt="AYYUHANNAAS 2K26"
        width={32}
        height={32}
        className="rounded-full"
      />
      <span className="font-bold text-lg text-gray-900 dark:text-white">AYYUHANNAAS 2K26</span>
    </div>
  );
}
