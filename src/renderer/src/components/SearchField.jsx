const SearchField = ({ type, placeholder, value, ...props}) => {
  return (
    <div >
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={props.onChange}
          className="border border-gray-300 rounded px-4 py-2 w-full "
        />
      </div>
  )
};
export default SearchField;