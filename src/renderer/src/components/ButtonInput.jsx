const ButtonInput = ({ children, type }) => {
  return (
    <button
      type={type}
      className="flex w-full justify-center rounded-md bg-sky-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-sky-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
    >
      {children}
    </button>
  )
}
export default ButtonInput
