import Image from "next/image"

import { PendulumText } from "@/components/pendulum-text"

export default function Page() {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-sky-400">
      <div className="p-6">
        <Image
          src="/images/idolrun-white-logo.png"
          alt="Idolrun"
          width={4320}
          height={4320}
          className="h-16 w-auto"
        />
        <div className="mt-14 flex flex-1 items-center justify-center">
          <Image
            src="/images/fox.png"
            alt="Fox"
            width={1200}
            height={1200}
            className="w-96 max-w-full"
          />
        </div>
        <PendulumText className="text-center text-white text-5xl font-black mt-16">
          <p className="uppercase">Under Maintenance</p>
          <p className="text-2xl font-bold mt-4">We'll be back soon!</p>
        </PendulumText>
      </div>
    </div>
  )
}
