import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 font-sans ">
      <div className="sticky" id="mkt-sticky">
        <div>
          <div className="sticky-text">AORTrack   Free PR Tracker</div>
          <div className="sticky-sub">Open source · Community powered · No signup</div>
        </div>
      </div>
    </div>
  );
}
