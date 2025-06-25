import { AnimatedSpan, Terminal, TypingAnimation } from "./terminal"
import { useEffect, useState, memo, useRef } from "react"

export default memo(function TerminalDemo() {
  const [key, setKey] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setKey(prev => prev + 1)
    }, 8000) // Reset every 8 seconds

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return (
    <div className="w-full">
      <Terminal className="h-[240px] w-full">
        <div key={key}>
          <TypingAnimation className="text-gray-400">&gt; export BLOOM_API_KEY</TypingAnimation>

          <AnimatedSpan delay={1500} className="text-green-400">
            <span>✓ API key set successfully</span>
          </AnimatedSpan>

          <TypingAnimation delay={2000} className="text-gray-400">&gt; npm install @bloom-ai/sdk</TypingAnimation>

          <AnimatedSpan delay={4000} className="text-gray-500">
            <span>+ @bloom-ai/sdk@2.1.0</span>
          </AnimatedSpan>

          <TypingAnimation delay={4500} className="text-gray-400">&gt; bloom init</TypingAnimation>

          <AnimatedSpan delay={5500} className="text-green-400">
            <span>✓ Connected to Bloom servers</span>
          </AnimatedSpan>

          <AnimatedSpan delay={6000} className="text-emerald-400">
            <span>✓ Ready for action!</span>
          </AnimatedSpan>
        </div>
      </Terminal>
    </div>
  )
})