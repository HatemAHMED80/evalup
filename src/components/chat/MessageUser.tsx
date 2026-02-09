interface MessageUserProps {
  content: string
  className?: string
}

export function MessageUser({ content, className = '' }: MessageUserProps) {
  return (
    <div className={`flex justify-end animate-fade-up ${className}`}>
      <div className="
        max-w-[75%]
        bg-[var(--accent)]
        text-white
        px-5 py-3
        rounded-[var(--radius-lg)]
        rounded-br-[var(--radius-sm)]
        text-[14.5px]
        leading-[1.5]
      ">
        {content}
      </div>
    </div>
  )
}

export default MessageUser
