import Image from "next/image";

export function LogoMark() {
  return (
    <Image
      src="/Logo.png"
      alt="AORTrack"
      width={28}
      height={28}
      className="h-6 w-6 object-contain"
    />
  );
}
