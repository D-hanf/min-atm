const SearchField = ({ type, placeholder, value, ...props}) => {
  return (
    <div className="mb-4">
        <input
          type={type }
          placeholder={placeholder}
          value={value}
        onChange={props.onChange}
          className="border border-gray-300 rounded px-4 py-2 w-full md:w-1/3"
        />
      </div>
  )
};
export default SearchField;