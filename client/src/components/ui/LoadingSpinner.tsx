export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="w-[32px] h-[32px] border-[3px] border-border border-t-primary rounded-full animate-spin duration-[0.6s]" />
    </div>
  )
}
